/* global hs */

let hide = hs.hotkey.bind(['cmd'], 'escape', () => {
  let application = hs.application.frontmost()

  switch (application?.bundleID) {

    case 'com.apple.Spotlight':
      hs.eventtap.keyStroke([], 'escape')
      break

    case 'com.raycast.macos':
      hide.disable()
      hs.eventtap.keyStroke(['cmd'], 'escape', application)
      hide.enable()
      break

    default:
      application?.hide()
  }

})

return hide
