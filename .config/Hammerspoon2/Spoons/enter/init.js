/* global hs */

let enter = hs.hotkey.bind(['shift'], 'return', () => {
  let application = window.application()

  switch (application?.bundleID) {

    case 'com.raycast.macos':
      hs.eventtap.keyStroke([], 'return', application)
      break

    default:
      enter.disable()
      hs.eventtap.keyStroke(['shift'], 'return', application)
      enter.enable()

  }

})

return enter
