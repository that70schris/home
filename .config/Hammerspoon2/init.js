/* global hs */

// hs.spoons.load('finder')
// hs.spoons.load('enter')
hs.spoons.load('hide')

hs.clearConsole()
let clear = hs.hotkey.bind(['cmd'], 'k', () => {
  let application = hs.application.frontmost()

  switch (application?.bundleID) {
    case 'net.tenshu.Hammerspoon-2':
    case 'org.hammerspoon.Hammerspoon':
      hs.clearConsole()
      break

    default:
      clear.disable()
      // hs.eventtap.keyStroke(['cmd'], 'k')
      clear.enable()

  }

})

hs.eventtap.addWatcher([
  hs.eventtap.eventTypes.flagsChanged,
  hs.eventtap.eventTypes.keyDown,
  hs.eventtap.eventTypes.keyUp,
], (e) => {
  console.log(
    e.characters,
    e.flags,
  )
}).start()
