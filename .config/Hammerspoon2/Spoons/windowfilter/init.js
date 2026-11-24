// hs_windowfilter-gt — subscribe to window events, narrowed by rules.
//
// It provides what Hammerspoon 1's hs.window.filter provided, but it was written anew for
// Hammerspoon 2 rather than translated from the Lua.
//
//     const wf = hs.spoons.load("hs_windowfilter-gt")
//
//     const editors = wf.create({ allowApplications: ["Emacs"], visible: true })
//     editors.on("windowFocused", (event, window) => console.log(window.title))
//
//     wf.default.on(["windowCreated", "windowDestroyed"], (event, window) => { ... })
//
// Two design decisions shape the module:
//
//   * One tracker, many filters. A single set of accessibility watchers feeds every filter
//     instance. Watching per instance would mean N observers on the same window.
//
//   * Most events are derived, not received. Accessibility supplies a handful —
//     windowCreated, titleChanged, moved, resized, miniaturized, destroyed. The rest are
//     produced by recomputing a window's state after anything happens to it and comparing
//     against the state it had before. windowVisible, windowOnScreen, windowFocused and
//     their negatives all come from that comparison, not from a notification.
//
// Departures from the Hammerspoon 1 module, all deliberate:
//
//   * `currentSpace` is not implemented, and windowInCurrentSpace / windowNotInCurrentSpace
//     are not emitted, because Hammerspoon 2 has no spaces module. The Lua version treats
//     the rule as meaning "visible". A rule named currentSpace that tested visibility would
//     report the wrong windows, so it is left out instead.
//
//   * Subscription is on / off / once, as hs.application, hs.screen and hs.ax have it,
//     rather than subscribe / unsubscribe. `on` and `off` additionally accept an array of
//     event names, which the hs.* modules do not: a filter emits nineteen events, and
//     subscribing one handler to several of them at once is the common case.
//
//   * Titles and application names are matched with RegExp, exact strings, or a predicate,
//     rather than Lua patterns.
//
//   * Retries are kept to applications. An application that has just launched can refuse
//     watchers, so trackApplication() tries again a few times. Registering the windows of
//     an application that is already being watched works the first time, so windows are not
//     retried.

// MARK: - User-configurable settings

const config = {
  // Window moves and title changes arrive in bursts — a drag posts a notification per
  // frame. An event is held for this long, and a further notification for the same
  // window restarts the wait, so one event is emitted when the burst ends.
  moveDebounce: 0.1,
  titleDebounce: 0.1,
  // Minimizing, unminimizing, hiding and focus changes: how long to let a window's
  // accessibility properties settle before reading them. They do not all change at once,
  // so reading immediately can catch a window half way through a transition.
  stateDebounce: 0.08,
  // How long after a window is created to look at its application's windows a second
  // time, for a window that had no title yet at the first look.
  createdRescanDelay: 1.5,
  // When an application refuses accessibility watchers, which one that has just launched
  // can do, how long to wait before each further attempt, in seconds.
  applicationRetryDelays: [0.5, 1, 2, 4, 8],

  // Applications never tracked. They have no windows worth reporting, and watching each
  // one would cost an accessibility observer.
  skipApplications: [
    'universalaccessd',
    'sharingd',
    'Safari Networking',
    'Spotlight',
    'iTerm2 Shell Integration',
    'Safari Web Content',
    'SafariLauncher',
    'com.apple.WebKit.Networking',
    'com.apple.WebKit.WebContent',
  ],

  // Never track a window that has no title and is not a standard window. Such windows
  // are alerts, banners, menu bar popovers and the Finder's desktop, and none of them is
  // worth selecting. Most are Hammerspoon 2's own alerts, which last a few seconds.
  // Tracking each one would register six accessibility watchers for a window that closes
  // before anything could select it.
  untitledNonStandardSkip: true,

  // Applications whose windows are tracked but never reported by the default filter.
  // A filter can still ask for them by name.
  skipInDefault: ['Hammerspoon', 'Hammerspoon 2'],

  // Logged to the console when a watcher cannot be registered or a rule is malformed.
  // "none", "error" or "debug".
  logLevel: 'error',
}

// MARK: - Logging

function log(level, message) {
  if (config.logLevel === 'none') {
    return
  }
  if (level === 'debug' && config.logLevel !== 'debug') {
    return
  }
  if (level === 'error') {
    console.error(`[hs_windowfilter-gt] ${message}`)
  } else if (level === 'warning') {
    console.warn(`[hs_windowfilter-gt] ${message}`)
  } else {
    console.log(`[hs_windowfilter-gt] ${message}`)
  }
}

// MARK: - The events
//
// Every event a filter can be watched for. The pairs are emitted by comparing a window's
// state before and after something happened to it; the singletons come from a notification.

const EVENTS = [
  'windowCreated',
  'windowDestroyed',
  'windowMoved',
  'windowResized',
  'windowTitleChanged',
  'windowVisible',
  'windowNotVisible',
  'windowOnScreen',
  'windowNotOnScreen',
  'windowFocused',
  'windowUnfocused',
  'windowMinimized',
  'windowUnminimized',
  'windowFullscreened',
  'windowUnfullscreened',
  'windowHidden',
  'windowUnhidden',
  // Emitted when a window starts or stops satisfying a filter's rules, which can happen
  // without the window changing at all: a rule may be set, or the window may move to a
  // screen the filter does not accept.
  'windowAllowed',
  'windowRejected',
]

const EVENT_SET = new Set(EVENTS)

// Which state field each pair of events reports, and which way round. The state machine
// walks this rather than carrying a branch per event.
const STATE_EVENTS = [
  { field: 'visible', whenTrue: 'windowVisible', whenFalse: 'windowNotVisible' },
  { field: 'onScreen', whenTrue: 'windowOnScreen', whenFalse: 'windowNotOnScreen' },
  { field: 'focused', whenTrue: 'windowFocused', whenFalse: 'windowUnfocused' },
  { field: 'minimized', whenTrue: 'windowMinimized', whenFalse: 'windowUnminimized' },
  { field: 'fullscreen', whenTrue: 'windowFullscreened', whenFalse: 'windowUnfullscreened' },
  { field: 'hidden', whenTrue: 'windowHidden', whenFalse: 'windowUnhidden' },
]

// MARK: - Matching values
//
// A rule value is a RegExp, an exact string, an array of either, or a predicate. These
// take the place of the Lua patterns that Hammerspoon 1 used.

/**
 * Whether a value satisfies a rule.
 *
 * @param {*} rule A RegExp, string, array of those, or a function taking the value.
 * @param {string} value What to test.
 * @returns {boolean} Whether it matches. A rule of null or undefined matches everything.
 */
function matches(rule, value) {
  if (rule === undefined || rule === null) {
    return true
  }
  if (typeof rule === 'function') {
    try {
      return Boolean(rule(value))
    } catch (e) {
      log('error', `a rule predicate threw: ${e && e.message ? e.message : e}`)
      return false
    }
  }
  if (Array.isArray(rule)) {
    return rule.some(one => matches(one, value))
  }
  if (rule instanceof RegExp) {
    return rule.test(String(value === null ? '' : value))
  }
  return String(rule) === String(value === null ? '' : value)
}

/** Whether the centre of `frame` is inside `region`, both as {x, y, w, h}. */
function insideRegion(region, frame) {
  if (!region || !frame) {
    return false
  }
  const x = frame.x + frame.w / 2
  const y = frame.y + frame.h / 2
  return x >= region.x && x <= region.x + region.w
    && y >= region.y && y <= region.y + region.h
}

// MARK: - What a window looks like right now
//
// Read once per event and kept on the record, because every read is an accessibility round
// trip and several rules may need the same values.

/**
 * A window's state, as the rules and the derived events understand it.
 *
 * `hidden` is the application being hidden, which is not the same as the window being
 * minimized, and Hammerspoon 1 reported them separately.
 *
 * @param {object} window An HSWindow.
 * @returns {object} The state, or null if the window can no longer be read.
 */
function windowState(window) {
  try {
    const application = window.application
    const screen = window.screen
    const frame = window.frame
    return {
      id: window.id,
      title: window.title || '',
      application: application ? (application.name || '') : '',
      bundleID: application ? application.bundleID : null,
      pid: application ? application.pid : null,
      role: window.isStandard ? 'AXStandardWindow' : 'AXWindow',
      standard: Boolean(window.isStandard),
      visible: Boolean(window.isVisible),
      minimized: Boolean(window.isMinimized),
      fullscreen: Boolean(window.isFullscreen),
      hidden: application ? Boolean(application.isHidden) : false,
      focused: false,
      screenName: screen ? screen.name : null,
      screenID: screen ? screen.id : null,
      frame: frame ? { x: frame.x, y: frame.y, w: frame.w, h: frame.h } : null,
      // A window is on screen when it is visible, not minimized and its application
      // is not hidden. Distinct from `visible`, which asks only about the window.
      onScreen: Boolean(window.isVisible) && !window.isMinimized
        && (application ? !application.isHidden : true),
    }
  } catch (e) {
    // The window no longer exists: it was destroyed between the notification and this read.
    return null
  }
}

/**
 * windowState() as exported, for callers outside the tracker. It differs from windowState() in
 * two ways, so that it returns what the readme describes:
 *
 * 1. `focused` is read from hs.window.focusedWindow(). windowState() leaves it false, because the
 *    tracker sets it from the focus it follows.
 * 2. A window that has closed gives null. Hammerspoon 2 no longer throws when a closed window is
 *    read: its title is empty and its frame and screen are null, measured on 2026-11-23. The
 *    frame being null is taken as the window having closed. The tracker keeps windowState(),
 *    which returns a record for it, and learns of the closing from the notification.
 *
 * @param {object} window An HSWindow.
 * @returns {object} The state, or null.
 */
function windowStatePublic(window) {
  const state = windowState(window)
  if (!state || !state.frame) {
    return null
  }
  const focused = hs.window.focusedWindow()
  state.focused = Boolean(focused) && focused.id === state.id
  return state
}

/** Whether two states differ in any field the events or rules care about. */
function sameState(a, b) {
  if (!a || !b) {
    return false
  }
  if (a.title !== b.title || a.focused !== b.focused) {
    return false
  }
  for (const { field } of STATE_EVENTS) {
    if (a[field] !== b[field]) {
      return false
    }
  }
  const one = a.frame
  const two = b.frame
  if (Boolean(one) !== Boolean(two)) {
    return false
  }
  if (one && two && (one.x !== two.x || one.y !== two.y || one.w !== two.w || one.h !== two.h)) {
    return false
  }
  return a.screenID === b.screenID
}

// MARK: - Rules
//
// A rule set is an object. Every key is optional, and an absent key does not constrain.
//
//   visible            true or false
//   fullscreen         true or false
//   focused            true or false
//   hasTitlebar        true or false, meaning a standard window with a title bar
//   activeApplication  true to accept only windows of the frontmost application
//   allowTitles        RegExp, string, array or predicate the title must match
//   rejectTitles       the same, and a match rejects
//   allowRoles         accessibility roles to accept, or "*" for any
//   allowScreens       screen names or ids to accept
//   allowRegions       rectangles; a window whose centre is inside one is accepted
//   allowApplications  application names to accept
//   rejectApplications the same, and a match rejects
//
// Three layers decide whether a window is allowed, in this order, as in Hammerspoon 1:
//
//   1. the override filter, which wins outright when it answers
//   2. the filter for that window's application, when one is set
//   3. the default filter
//
// An application entry may also be `false` to reject the application entirely, or `true`
// to accept it whatever the default says.

/**
 * Whether a window's state satisfies one rule set.
 *
 * @param {object} rules The rule set. Null or undefined allows everything.
 * @param {object} state A state from windowState().
 * @returns {boolean} Whether the window is allowed.
 */
function satisfies(rules, state) {
  if (rules === undefined || rules === null) {
    return true
  }
  if (rules === true) {
    return true
  }
  if (rules === false) {
    return false
  }

  if (rules.visible !== undefined && Boolean(rules.visible) !== state.visible) {
    return false
  }
  if (rules.fullscreen !== undefined && Boolean(rules.fullscreen) !== state.fullscreen) {
    return false
  }
  if (rules.focused !== undefined && Boolean(rules.focused) !== state.focused) {
    return false
  }
  if (rules.hasTitlebar !== undefined && Boolean(rules.hasTitlebar) !== state.standard) {
    return false
  }

  if (rules.activeApplication) {
    const frontmost = hs.application.frontmost()
    if (!frontmost || frontmost.pid !== state.pid) {
      return false
    }
  }

  if (rules.allowTitles !== undefined && !matches(rules.allowTitles, state.title)) {
    return false
  }
  if (rules.rejectTitles !== undefined && matches(rules.rejectTitles, state.title)) {
    return false
  }

  if (rules.allowApplications !== undefined && !matches(rules.allowApplications, state.application)) {
    return false
  }
  if (rules.rejectApplications !== undefined && matches(rules.rejectApplications, state.application)) {
    return false
  }

  if (rules.allowRoles !== undefined && rules.allowRoles !== '*'
    && !matches(rules.allowRoles, state.role)) {
    return false
  }

  if (rules.allowScreens !== undefined) {
    const byName = matches(rules.allowScreens, state.screenName)
    const byID = state.screenID !== null && matches(rules.allowScreens, String(state.screenID))
    if (!byName && !byID) {
      return false
    }
  }

  if (rules.allowRegions !== undefined) {
    const regions = Array.isArray(rules.allowRegions) ? rules.allowRegions : [rules.allowRegions]
    if (!regions.some(region => insideRegion(region, state.frame))) {
      return false
    }
  }

  return true
}

// MARK: - A filter
//
// An instance holds its rules and its watchers. It is registered with the tracker for as
// long as it has a watcher, so a filter with no watchers costs nothing.

class WindowFilter {
  /**
     * @param {object} [rules] The default rule set. See above.
     */
  constructor(rules) {
    this.defaultRules = rules === undefined ? {} : rules
    this.applicationRules = new Map() // application name -> rules, true or false
    this.overrideRules = null
    // event -> Set of handlers
    this.watchers = new Map()
    // Window id -> whether this filter allowed it last time it was asked, so that
    // windowAllowed and windowRejected can be emitted when the answer changes.
    this.allowed = new Map()
  }

  /** Replace the default rule set. */
  setDefaultFilter(rules) {
    return this._rulesChange(() => {
      this.defaultRules = rules === undefined ? {} : rules
    })
  }

  /**
     * Set the rules for one application, by name.
     *
     * @param {string} application The application's name.
     * @param {object|boolean} rules Rules, `true` to always allow, `false` to always reject.
     */
  setApplicationFilter(application, rules) {
    return this._rulesChange(() => {
      if (rules === undefined || rules === null) {
        this.applicationRules.delete(application)
      } else {
        this.applicationRules.set(application, rules)
      }
    })
  }

  /** Rules consulted before everything else. Null removes them. */
  setOverrideFilter(rules) {
    return this._rulesChange(() => {
      this.overrideRules = rules === undefined ? null : rules
    })
  }

  /**
     * Change the rules with `apply`, then emit windowAllowed or windowRejected for every window
     * whose acceptance the change reversed. Called by the three functions that set rules.
     *
     * Without this, a rule change would be reported only at each window's next event. Whether a
     * window was accepted before is taken from this filter's own record when it has one, and
     * otherwise from the old rules, so that a window accepted both before and after emits
     * nothing. The tracker's stored states are used, so no application is queried. Nothing is
     * done while the filter has no handler or the tracker is not running: there is nobody to
     * tell, and the next event judges the window afresh.
     *
     * @param {function} apply Changes the rules.
     * @returns {WindowFilter} This filter.
     */
  _rulesChange(apply) {
    if (!tracking || !this.isWatched()) {
      apply()
      return this
    }
    const before = new Map()
    for (const [id, record] of tracked) {
      if (!record.state) {
        continue
      }
      before.set(id, this.allowed.has(id) ? this.allowed.get(id) === true : this.allows(record.state))
    }
    apply()
    for (const [id, was] of before) {
      const record = tracked.get(id)
      if (!record || !record.state) {
        continue
      }
      const now = this.allows(record.state)
      this.allowed.set(id, now)
      if (now !== was) {
        this._deliver(now ? 'windowAllowed' : 'windowRejected', record.window, record.state)
      }
    }
    return this
  }

  /**
     * Whether this filter accepts a window, by the three-layer order.
     *
     * @param {object} state A state from windowState().
     * @returns {boolean} Whether it is allowed.
     */
  allows(state) {
    if (!state) {
      return false
    }
    if (this.overrideRules !== null) {
      return satisfies(this.overrideRules, state)
    }

    if (this.applicationRules.has(state.application)) {
      return satisfies(this.applicationRules.get(state.application), state)
    }
    return satisfies(this.defaultRules, state)
  }

  /**
     * Watch for one or more events.
     *
     * @param {string|Array} events An event name, or an array of them. See EVENTS.
     * @param {function} handler Called as `(event, window, state)`.
     * @returns {object} This filter.
     */
  on(events, handler) {
    if (typeof handler !== 'function') {
      log('error', 'on needs a function')
      return this
    }
    for (const event of [].concat(events)) {
      if (!EVENT_SET.has(event)) {
        log('error', `no such event: ${event}`)
        continue
      }
      if (!this.watchers.has(event)) {
        this.watchers.set(event, new Set())
      }
      this.watchers.get(event).add(handler)
    }
    const wasTracking = tracking
    trackerStart()
    if (wasTracking) {
      this._allowedRecord()
    }
    return this
  }

  /**
     * Record which of the windows already followed this filter's rules accept, without emitting
     * anything. Called when a handler is registered while windows are already being followed.
     *
     * A filter otherwise learns that it accepts a window only from an event about that window.
     * A filter watched after a window was already followed would then treat the window's first
     * change as concerning a window it never accepted, and emit nothing, although the readme says
     * the change is emitted to every filter that accepted the window before it. When the tracker
     * starts with this handler, its windowCreated events record the windows instead. The stored
     * states are used, so no application is queried.
     */
  _allowedRecord() {
    for (const [id, record] of tracked) {
      if (record.state && !this.allowed.has(id)) {
        this.allowed.set(id, this.allows(record.state))
      }
    }
  }

  /**
     * Watch for one or more events, until the first one of them arrives.
     *
     * Removed before the handler is called, so a handler that itself subscribes again is
     * registering afresh rather than racing its own removal. With an array of events the
     * whole subscription goes on the first event to arrive, not one event at a time: the
     * handler runs exactly once.
     *
     * @param {string|Array} events An event name, or an array of them. See EVENTS.
     * @param {function} handler Called as `(event, window, state)`, once.
     * @returns {object} This filter.
     */
  once(events, handler) {
    if (typeof handler !== 'function') {
      log('error', 'once needs a function')
      return this
    }
    const wrapped = (event, window, state) => {
      this.off(events, wrapped)
      handler(event, window, state)
    }
    return this.on(events, wrapped)
  }

  /**
     * Stop watching. Omit the handler to remove every handler for those events, and omit
     * both to remove everything.
     */
  off(events, handler) {
    if (events === undefined) {
      this.watchers.clear()
    } else {
      for (const event of [].concat(events)) {
        const set = this.watchers.get(event)
        if (!set) {
          continue
        }
        if (handler === undefined) {
          set.clear()
        } else {
          set.delete(handler)
        }
        if (!set.size) {
          this.watchers.delete(event)
        }
      }
    }
    trackerStopIfIdle()
    return this
  }

  /** Whether anything is listening to this filter. */
  isWatched() {
    for (const set of this.watchers.values()) {
      if (set.size) {
        return true
      }
    }
    return false
  }

  /**
     * The windows this filter accepts, with the state the tracker holds for each.
     *
     * While the tracker is running, this is answered from its records and makes no
     * accessibility calls. The windows and their titles, screens and flags are kept current
     * by the same notifications that produce the events.
     *
     * While nothing is being watched, the tracker holds nothing, so the windows are read
     * with hs.window.allWindows() instead, which costs about 0.1 s.
     *
     * @returns {Array} `{window, state}` objects.
     */
  records() {
    if (tracking) {
      return [...tracked.values()]
        .filter(record => record.state && this.allows(record.state))
        .map(record => ({ window: record.window, state: record.state }))
    }

    const found = []
    for (const window of applicationWindows()) {
      const state = windowState(window)
      if (state && this.allows(state)) {
        found.push({ window: window, state: state })
      }
    }
    return found
  }

  /** The windows this filter accepts, as HSWindow objects. */
  windows() {
    return this.records().map(record => record.window)
  }

  /** Whether a window is accepted right now. */
  isWindowAllowed(window) {
    const tracked_ = tracked.get(window ? window.id : null)
    const state = tracked_ && tracked_.state ? tracked_.state : windowState(window)
    return state ? this.allows(state) : false
  }

  /** Called by the tracker. Not part of the public API. */
  _deliver(event, window, state) {
    const set = this.watchers.get(event)
    if (!set || !set.size) {
      return
    }
    for (const handler of [...set]) {
      try {
        handler(event, window, state)
      } catch (e) {
        log('error', `a ${event} handler threw: ${e && e.message ? e.message : e}`)
      }
    }
  }

  /**
     * Emit windowAllowed or windowRejected when this filter's answer for a window changes.
     *
     * Separate from the state events: a window can start or stop being allowed without
     * changing at all, because the filter's own rules changed.
     */
  _reconsider(window, state) {
    const id = state ? state.id : (window ? window.id : null)
    if (id === null) {
      return
    }

    const now = state ? this.allows(state) : false
    const was = this.allowed.get(id)
    if (was === now) {
      return
    }

    this.allowed.set(id, now)
    // Nothing is emitted the first time a window is seen and rejected: it was never
    // allowed, so it has not become rejected.
    if (was === undefined && !now) {
      return
    }
    this._deliver(now ? 'windowAllowed' : 'windowRejected', window, state)
  }

  /** Called by the tracker when a window goes away. */
  _forget(id) {
    this.allowed.delete(id)
  }
}

// MARK: - The tracker
//
// One set of accessibility watchers, feeding every filter. It runs only while at least one
// filter is being watched, so loading this Spoon and never subscribing costs nothing.
//
// Two levels of watcher:
//
//   Per application — windowCreated, created and focusedWindowChanged. These are posted by
//   the application element, so one registration covers all of its windows, including
//   windows that do not exist yet.
//
//   Per window — uIElementDestroyed, windowMoved, windowResized, windowMiniaturized,
//   windowDeminiaturized and titleChanged. These are posted by the window element and are
//   not delivered to the application element. AXUIElementDestroyed in particular is
//   delivered only to the element that is being destroyed.

const filters = new Set() // every WindowFilter ever created
let tracking = false

const tracked = new Map() // window id -> {window, element, state, handler}
const trackedApps = new Map() // pid -> {application, element, handler}
// The applications that have turned the Accessibility API off: pid -> HSApplication. They are not
// tried again until they quit, and are reported once. applicationsAccessibilityDisabled() lists
// them, for a Spoon that wants to offer them although their windows cannot be read.
const axDisabledApplications = new Map()
// The hs.application listeners currently registered, as [event, listener] pairs, or null
// when the tracker is stopped. Held because off() matches on function identity.
let applicationListeners = null

// Debounce timers, by window id, kept so that a newer event can cancel an older one.
const pending = new Map()

// The focused window's id. See readFocusedId() for why this is cached rather than asked
// for each time.
let focusedId = null

const WINDOW_NOTIFICATIONS = () => [
  hs.ax.notificationTypes.uIElementDestroyed,
  hs.ax.notificationTypes.windowMoved,
  hs.ax.notificationTypes.windowResized,
  hs.ax.notificationTypes.windowMiniaturized,
  hs.ax.notificationTypes.windowDeminiaturized,
  hs.ax.notificationTypes.titleChanged,
]

const APPLICATION_NOTIFICATIONS = () => [
  hs.ax.notificationTypes.windowCreated,
  hs.ax.notificationTypes.focusedWindowChanged,
]

// Some applications post AXCreated for a new window and never AXWindowCreated. Zoom does:
// measured on 2026-10-21, opening its Settings window posted focusedWindowChanged and
// created, and nothing else. Registered on its own, after the notifications above, so that an
// application refusing it keeps the others: hs.ax.on with an array is all or nothing.
const CREATED_NOTIFICATION = () => hs.ax.notificationTypes.created

// hs.application events that change which windows are focused or on screen, without any
// window being created or destroyed. They are handled identically — see trackerStart.
const PRESENCE_EVENTS = ['didActivate', 'didDeactivate', 'didHide', 'didUnhide']

/**
 * Every window of every application worth tracking.
 *
 * hs.window.allWindows() measured 100 to 120 ms for 27 such windows on 2026-10-24. That was
 * faster than asking each application for its windows, which took about 200 ms.
 */
function applicationWindows() {
  return hs.window.allWindows().filter(window => worthTracking(window.application))
}

/** Whether an application is worth watching at all. */
function worthTracking(application) {
  if (!application) {
    return false
  }
  if (application.kind !== 'standard') {
    return false
  }
  const title = application.name || ''
  return !config.skipApplications.includes(title)
}

// MARK: Emitting

/**
 * Hand a batch of events, all describing one change, to every filter concerned.
 *
 * A filter is concerned when it allowed the window before the change or allows it after.
 * Testing only the state after the change would lose every event that makes a window stop
 * matching. For example, a filter of `visible: true` watching windowMinimized must receive
 * the minimize event, although the window is no longer visible once it is minimized.
 *
 * The events of one change are judged together, which is why this takes a batch. One
 * change often alters several fields: minimizing a window makes it not visible, not on
 * screen and minimized. If each event were judged on its own, the first would move the
 * filter from allowed to rejected, and the rest would then be discarded.
 *
 * windowAllowed or windowRejected is emitted first, so a handler watching both receives it
 * before the events describing the change.
 */
function deliver(window, state, events) {
  if (!events.length) {
    return
  }
  const id = state ? state.id : (window ? window.id : null)

  for (const filter of filters) {
    if (!filter.isWatched()) {
      continue
    }

    const was = id === null ? false : filter.allowed.get(id) === true
    filter._reconsider(window, state)
    const now = state ? filter.allows(state) : false
    if (!was && !now) {
      continue
    }

    for (const event of events) {
      filter._deliver(event, window, state)
    }
  }
}

/** One event on its own. */
function emit(event, window, state) {
  deliver(window, state, [event])
}

/** windowDestroyed is emitted to filters that were allowing the window when it went. */
function emitDestroyed(record) {
  for (const filter of filters) {
    if (filter.isWatched() && filter.allowed.get(record.state.id)) {
      filter._deliver('windowDestroyed', record.window, record.state)
    }
    filter._forget(record.state.id)
  }
}

/**
 * Keep a window standard once it has been reported as standard.
 *
 * macOS changes the subrole it reports for some windows when they leave the screen. A window
 * of a hidden application is reported as AXDialog instead of AXStandardWindow: Music's main
 * window did this on 2026-11-23, and was reported as AXStandardWindow again once the
 * application was shown. Some minimized windows do the same. The window has not changed kind,
 * so the earlier value is kept.
 *
 * It is kept whether or not the window is on screen. A window's properties do not change
 * together, as the comment in trackWindow()'s handler says, so a condition on being off screen
 * would depend on the order in which macOS changes them.
 *
 * A window first seen while off screen cannot be corrected, because there is no earlier value
 * to keep.
 *
 * @param {object} was The window's previous state, or null.
 * @param {object} state Its new state, changed in place.
 */
function standardKeep(was, state) {
  if (!was || !was.standard || state.standard) {
    return
  }
  state.standard = true
  state.role = 'AXStandardWindow'
}

/**
 * Recompute a window's state and emit whatever changed.
 *
 * Most events originate here. An accessibility notification reports only that a window
 * changed; comparing its new state against the previous one determines what changed.
 */
function refresh(id, alsoEmit) {
  const record = tracked.get(id)
  if (!record) {
    return
  }

  const state = windowState(record.window)
  if (!state) {
    forgetWindow(id)
    return
  }
  state.focused = isFocused(id)

  const was = record.state
  standardKeep(was, state)
  record.state = state

  // Collected rather than emitted one by one: they all describe the same change, and the
  // filter has to judge them together. See deliver().
  const events = []
  if (alsoEmit) {
    events.push(alsoEmit)
  }

  if (was) {
    for (const { field, whenTrue, whenFalse } of STATE_EVENTS) {
      if (was[field] === state[field]) {
        continue
      }
      events.push(state[field] ? whenTrue : whenFalse)
    }
    if (was.title !== state.title && alsoEmit !== 'windowTitleChanged') {
      events.push('windowTitleChanged')
    }
  }

  deliver(record.window, state, events)
}

/**
 * Which window has focus, read once per event rather than once per window.
 *
 * hs.window.focusedWindow() asks the frontmost application through accessibility, and a
 * busy application can take seconds to answer. The answer is the same for every window, so
 * it is read once when something happens that can change it, and each window is compared
 * against that cached id.
 */
function readFocusedId() {
  const focused = hs.window.focusedWindow()
  focusedId = focused ? focused.id : null
  return focusedId
}

function isFocused(id) {
  return focusedId === id
}

/** Hold an event until the burst it belongs to has finished. */
function debounce(id, key, seconds, action) {
  const existing = pending.get(key)
  if (existing) {
    existing.stop()
  }
  pending.set(key, hs.timer.doAfter(seconds, () => {
    pending.delete(key)
    action()
  }))
}

// MARK: Windows

/**
 * Whether a window is worth watching: see config.untitledNonStandardSkip.
 *
 * A rejected window is not remembered, so it is checked again on the next scan of its
 * application. A window whose title is set only after it opens is therefore tracked once
 * it has a title.
 */
function windowWorthTracking(state) {
  if (!config.untitledNonStandardSkip) {
    return true
  }
  return state.title !== '' || state.role === 'AXStandardWindow'
}

function trackWindow(window) {
  if (!window) {
    return
  }
  const id = window.id
  if (tracked.has(id)) {
    return
  }

  const state = windowState(window)
  if (!state) {
    return
  }
  if (!windowWorthTracking(state)) {
    return
  }
  state.focused = isFocused(id)

  const element = window.axElement()
  if (!element) {
    log('debug', `no accessibility element for window ${id}`)
    return
  }

  const handler = (notification) => {
    switch (notification) {
      case 'uIElementDestroyed':
        forgetWindow(id, true)
        break
      case 'windowMoved':
        debounce(id, `${id}:moved`, config.moveDebounce, () => refresh(id, 'windowMoved'))
        break
      case 'windowResized':
        debounce(id, `${id}:resized`, config.moveDebounce, () => refresh(id, 'windowResized'))
        break
      case 'titleChanged':
        debounce(id, `${id}:title`, config.titleDebounce, () => refresh(id, 'windowTitleChanged'))
        break
      default:
        // Miniaturized and deminiaturized are reported by the state comparison rather
        // than passed through, so that they cannot be emitted twice.
        //
        // The state is read after a short delay. A window's properties do not change
        // together: minimizing reports isVisible false before isMinimized becomes true.
        // Reading at once would emit windowNotVisible alone, and the rest of the change
        // would then be discarded because the window no longer matches the filter.
        debounce(id, `${id}:state`, config.stateDebounce, () => refresh(id))
    }
  }

  try {
    hs.ax.on(element, WINDOW_NOTIFICATIONS(), handler)
  } catch (e) {
    log('error', `could not watch window ${id}: ${e && e.message ? e.message : e}`)
    return
  }

  tracked.set(id, { window: window, element: element, state: state, handler: handler })
  emit('windowCreated', window, state)
}

function forgetWindow(id, destroyed) {
  const record = tracked.get(id)
  if (!record) {
    return
  }

  // The watchers are removed here only for a window that still exists. hs.ax removes a
  // destroyed window's watchers itself, in one of two ways:
  //
  //   1. After the uIElementDestroyed listeners have run, it drops every watcher on the
  //      element that was destroyed.
  //   2. When an application quits, it drops every watcher for that process.
  //
  // Calling off() for a destroyed window logs "Failed to remove notification:
  // AXError.InvalidUIElement" once for each notification after the first.
  if (!destroyed) {
    hs.ax.off(record.element, WINDOW_NOTIFICATIONS(), record.handler)
  }
  tracked.delete(id)

  for (const [key, timer] of [...pending]) {
    if (key.startsWith(`${id}:`)) {
      timer.stop()
      pending.delete(key)
    }
  }

  if (destroyed) {
    emitDestroyed(record)
  } else {
    for (const filter of filters) {
      filter._forget(id)
    }
  }
}

// MARK: Applications

/**
 * Start watching an application and scan its windows.
 *
 * An application that has only just launched can refuse accessibility watchers. Zoom did on
 * 2026-10-22: Hammerspoon 2 logged five errors 0.35 s after Zoom started, and the tracker
 * never watched it. A refused registration is therefore tried again after each of
 * config.applicationRetryDelays, and only the last failure is logged as an error.
 *
 * @param {object} application An HSApplication.
 * @param {number} [attempt] How many retries have already been made.
 */
function trackApplication(application, attempt = 0) {
  if (!worthTracking(application)) {
    return
  }
  const pid = application.pid
  if (pid === null || pid === undefined || trackedApps.has(pid) || axDisabledApplications.has(pid)) {
    return
  }

  const element = application.axElement()
  if (!element) {
    return
  }

  // A new window is not always readable the moment its notification arrives, so the
  // application is scanned after a short delay. Every way of noticing a new window uses
  // the same debounce keys, so a window reported twice is scanned once.
  //
  // The second, later scan is for a window that gets its title after it is created.
  // windowWorthTracking() rejects an untitled window, and without this scan the window
  // would not be tracked until it was focused. Zoom's meeting window behaves this way. A
  // window that is still untitled by the second scan, such as an alert, is rejected again.
  const scanSoon = () => {
    debounce(pid, `app${pid}:created`, 0.05, () => scanApplication(application))
    debounce(pid, `app${pid}:createdLater`, config.createdRescanDelay, () => scanApplication(application))
  }

  const handler = (notification, created) => {
    if (notification === 'windowCreated') {
      scanSoon()
    } else if (notification === 'created') {
      // AXCreated is not specific to windows, so anything else is ignored before it
      // costs a scan.
      let role = null
      try {
        role = created ? created.role : null
      } catch (e) {
        // Already gone.
      }
      if (role === 'AXWindow') {
        scanSoon()
      }
    } else {
      // focusedWindowChanged: which window is focused has moved within this
      // application, so every window of it may have changed focus state. The focused
      // window is read once here, not once per window.
      readFocusedId()
      for (const [id, record] of tracked) {
        if (record.state && record.state.pid === pid) {
          refresh(id)
        }
      }
      // A focused window the tracker does not hold was either created without any
      // creation notification, or rejected by windowWorthTracking() when it was
      // scanned and has since changed. Scanning checks it again.
      if (focusedId !== null && !tracked.has(focusedId)) {
        scanSoon()
      }
    }
  }

  const notifications = APPLICATION_NOTIFICATIONS()
  try {
    hs.ax.on(element, notifications, handler)
  } catch (e) {
    const message = e && e.message ? e.message : e
    // An application can turn the Accessibility API off: on 2026-11-23, a Firefox started in
    // kiosk mode did. It answers nothing, so trying again cannot help. Hammerspoon 2 gives the
    // reason in err.code since upstream issue #437.
    if (e && e.code === 'kAXErrorAPIDisabled') {
      axDisabledApplications.set(pid, application)
      log('warning', `not watching ${application.name} (pid ${pid}), which has turned the Accessibility API off; its windows are not tracked`)
      return
    }
    if (attempt < config.applicationRetryDelays.length) {
      log('debug', `could not watch ${application.name} yet, trying again: ${message}`)
      debounce(pid, `app${pid}:retry`, config.applicationRetryDelays[attempt], () => trackApplication(application, attempt + 1))
    } else {
      log('error', `could not watch ${application.name}: ${message}`)
    }
    return
  }

  const record = { application: application, element: element, handler: handler, notifications: notifications }
  trackedApps.set(pid, record)
  createdWatch(record, 0)
  scanApplication(application)
}

/**
 * Register for `created` on an application already being watched, retrying as
 * trackApplication() does. Separate because the application is useful without it: only the
 * applications that never post windowCreated depend on it.
 */
function createdWatch(record, attempt) {
  const pid = record.application.pid
  if (trackedApps.get(pid) !== record) {
    return
  }
  try {
    hs.ax.on(record.element, CREATED_NOTIFICATION(), record.handler)
    record.notifications.push(CREATED_NOTIFICATION())
  } catch (e) {
    const message = e && e.message ? e.message : e
    if (attempt < config.applicationRetryDelays.length) {
      debounce(pid, `app${pid}:createdRetry`, config.applicationRetryDelays[attempt], () => createdWatch(record, attempt + 1))
    } else {
      log('debug', `could not watch ${record.application.name} for created: ${message}`)
    }
  }
}

function forgetApplication(pid) {
  axDisabledApplications.delete(pid)
  // Including a retry for an application that was never watched.
  for (const [key, timer] of [...pending]) {
    if (key.startsWith(`app${pid}:`)) {
      timer.stop()
      pending.delete(key)
    }
  }

  const record = trackedApps.get(pid)
  if (!record) {
    return
  }

  hs.ax.off(record.element, record.notifications, record.handler)
  trackedApps.delete(pid)

  for (const [id, window] of [...tracked]) {
    if (window.state && window.state.pid === pid) {
      forgetWindow(id, true)
    }
  }
}

function scanApplication(application) {
  let windows = []
  try {
    windows = application.allWindows || []
  } catch (e) {
    return
  }
  for (const window of windows) {
    trackWindow(window)
  }
}

// MARK: Starting and stopping

function trackerStart() {
  if (tracking) {
    return
  }
  tracking = true

  readFocusedId()
  for (const application of hs.application.runningApplications()) {
    trackApplication(application)
  }

  // hs.application.on() registers a listener for one event and passes it only the
  // application, not the event name, so each event gets its own listener.
  const onPresenceChange = (application) => {
    // Only the windows this event can change are refreshed: the windows of the
    // application the event is about, and the windows that had focus before or have it
    // now. Each refresh makes several accessibility calls into the window's
    // application. These events arrive while an application is activating, when it
    // can be slow to answer, so refreshing every tracked window could stall the main
    // thread for seconds. One such stall lasted nine seconds.
    const previouslyFocused = focusedId
    readFocusedId()
    const pid = application ? application.pid : null

    // An application that is not being watched is watched from now on. Its watchers may
    // have been refused at launch more times than trackApplication() retries, or it may
    // have become a standard application only after launching. trackApplication()
    // returns at once for an application already watched or not worth watching.
    if (pid !== null && !trackedApps.has(pid)) {
      trackApplication(application)
    }

    for (const [id, record] of tracked) {
      const state = record.state
      if (!state) {
        continue
      }
      const ofApplication = pid !== null && state.pid === pid
      const reachable = ofApplication
        || id === previouslyFocused || id === focusedId || state.focused
      if (reachable) {
        refresh(id)
      }
      // The application's windows are read again after stateDebounce. Its windows do not
      // all change at the moment its notification arrives: measured on 2026-11-23, a
      // window was still not visible 1 ms after its application was unhidden, and was by
      // 50 ms. A read in between reported the window unhidden but not on screen, and
      // windowOnScreen never came. The timer is keyed by the window, so forgetWindow()
      // and trackerStop() stop it.
      if (ofApplication) {
        debounce(id, `${id}:presence`, config.stateDebounce, () => refresh(id))
      }
    }
  }

  applicationListeners = [
    ['didLaunch', (application) => {
      trackApplication(application)
      // The windows an application opens as it starts are read once, by trackApplication().
      // A window that has no title then, and is not standard, is skipped, and no
      // windowCreated notification will come for it to be read again. So the application's
      // windows are read again after createdRescanDelay, as for a window it creates later.
      const pid = application ? application.pid : null
      if (pid !== null && trackedApps.has(pid)) {
        debounce(pid, `app${pid}:createdLater`, config.createdRescanDelay, () => scanApplication(application))
      }
    }],
    ['didTerminate', (application) => {
      if (application) {
        forgetApplication(application.pid)
      }
    }],
    ...PRESENCE_EVENTS.map(event => [event, onPresenceChange]),
  ]
  for (const [event, listener] of applicationListeners) {
    hs.application.on(event, listener)
  }
  log('debug', `tracking ${trackedApps.size} applications, ${tracked.size} windows`)
}

/** Stop when no filter is being watched, so an idle configuration holds no observers. */
function trackerStopIfIdle() {
  if (!tracking) {
    return
  }
  for (const filter of filters) {
    if (filter.isWatched()) {
      return
    }
  }
  trackerStop()
}

function trackerStop() {
  if (!tracking) {
    return
  }
  tracking = false

  if (applicationListeners) {
    for (const [event, listener] of applicationListeners) {
      hs.application.off(event, listener)
    }
    applicationListeners = null
  }
  for (const id of [...tracked.keys()]) {
    forgetWindow(id)
  }
  for (const pid of [...trackedApps.keys()]) {
    forgetApplication(pid)
  }
  // A tracker started again tries every application again, and reports again the ones that
  // have turned the Accessibility API off.
  axDisabledApplications.clear()
  for (const [key, timer] of [...pending]) {
    timer.stop()
    pending.delete(key)
  }
}

// MARK: - Public API

/**
 * A new filter.
 *
 * @param {object} [rules] Its default rule set.
 * @returns {object} A WindowFilter.
 */
function create(rules) {
  const filter = new WindowFilter(rules)
  filters.add(filter)
  return filter
}

/** Discard a filter and stop the tracker if it was the last one being watched. */
function destroy(filter) {
  if (!filter) {
    return false
  }
  filter.off()
  const had = filters.delete(filter)
  trackerStopIfIdle()
  return had
}

/** What the tracker is watching. Useful when an expected event is not arriving. */
function status() {
  return {
    tracking: tracking,
    focusedId: focusedId,
    applications: trackedApps.size,
    windows: tracked.size,
    filters: filters.size,
    watched: [...filters].filter(f => f.isWatched()).length,
  }
}

function start() {
  // stop() removes every filter, default included. default is put back, without handlers,
  // so that it receives events again once a handler is registered on it.
  filters.add(defaultFilter)
  return module.exports
}

function stop() {
  trackerStop()
  for (const filter of filters) {
    filter.off()
  }
  filters.clear()
  return module.exports
}

// Visible windows of ordinary applications, which is what most callers want. Hammerspoon's
// own windows are left out: a filter reporting Hammerspoon's menu windows is rarely useful.
// config.skipInDefault is read each time a window is judged, so that a new list assigned to it
// takes effect, as every other setting does.
const defaultFilter = create({
  visible: true,
  rejectApplications: name => config.skipInDefault.includes(name),
})

/**
 * The running applications that have turned the Accessibility API off, such as Firefox started in
 * kiosk mode. Their windows cannot be read, so no filter reports them, but the applications exist
 * and can be activated. The list is the one the Spoon already holds, so reading it costs nothing.
 * It is empty while the Spoon is not observing, and in a build of Hammerspoon 2 without its issue
 * #437, which cannot tell these applications apart.
 *
 * @returns {Array} HSApplication objects.
 */
function applicationsAccessibilityDisabled() {
  return [...axDisabledApplications.values()]
}

module.exports = {
  config,
  events: EVENTS,
  create,
  destroy,
  default: defaultFilter,
  status,
  // For callers that want the pieces without a filter.
  windowState: windowStatePublic,
  matches,
  applicationsAccessibilityDisabled,
  start,
  stop,
}

// hs.spoons.use()'s config option copies each of its properties onto this Spoon's object, as the
// Hammerspoon 2 Spoons guide describes. The settings live in config, so each one is also a
// property of the object that reads and writes config: both hs.spoons.use(name, { config: {...} })
// and spoon.config.name = value then set it. No setting has the name of an exported function.
for (const name of Object.keys(config)) {
  Object.defineProperty(module.exports, name, {
    get: () => config[name],
    set: (value) => {
      config[name] = value
    },
    enumerable: true,
    configurable: true,
  })
}
