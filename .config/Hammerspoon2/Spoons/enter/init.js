/* global hs */

let enter = hs.hotkey.bind(['shift'], 'return', () => {
  let window = hs.window.frontmostWindow()
  let application = window.application()
  let id = application.bundleID()

  if (!application) {
    return
  }

  if (!window) {
    return
  }

  ({
    'com.raycast.macos': () => {
      hs.eventtap.keyStroke({}, 'return', application)
    },

  }[id]
  ?? (() => {
    enter.disable()
    hs.eventtap.keyStroke(['shift'], 'return')
    enter.enable()
  }))()
})

return enter
