// hs.spoons.load('finder')
// hs.spoons.load('enter')
hs.spoons.load('hide')

hs.clearConsole()
let clear = hs.hotkey.bind(['cmd'], 'k', () => {
  let application = hs.application.frontmost()
  clear.disable()

  switch (application?.bundleID) {

    case 'net.tenshu.Hammerspoon-2':
    case 'org.hammerspoon.Hammerspoon':
      hs.clearConsole()
      break

    default:
      hs.eventtap.keyStroke(['cmd'], 'k', application)

  }

  clear.enable()
})

hs.eventtap.addWatcher([
  // hs.eventtap.eventTypes.windowCreated,
  hs.eventtap.eventTypes.flagsChanged,
  hs.eventtap.eventTypes.keyDown,
  hs.eventtap.eventTypes.keyUp,
], (e) => {
  console.log(
    e.characters,
    e.flags,
  )
}).start()
