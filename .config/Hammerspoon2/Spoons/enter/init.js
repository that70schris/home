let enter = hs.hotkey.bind(['shift'], 'return', () => {
  let application = window.application()
  enter.disable()

  switch (application?.bundleID) {

    case 'com.raycast.macos':
      hs.eventtap.keyStroke([], 'return', application)
      break

    default:
      hs.eventtap.keyStroke(['shift'], 'return', application)

  }

  enter.enable()
})

return enter
