let hide = hs.hotkey.bind(['cmd'], 'escape', () => {
  let application = hs.application.frontmost()
  let window = hs.window.focusedWindow()
  hide.disable()

  if (window?.isStandard) {
    application?.hide()
  } else {

    switch (application?.bundleID) {

      case 'com.apple.Spotlight':
        hs.eventtap.keyStroke([], 'escape', application)
        break

      case 'com.raycast.macos':
        hs.eventtap.keyStroke(['cmd'], 'escape', application)
        break

      default:
        application?.hide()
    }
  }

  hide.enable()
})

return hide
