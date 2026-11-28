let hide = hs.hotkey.bind(['cmd'], 'escape', () => {
  let window = hs.window.focusedWindow()
  let application = window.application
  hide.disable()

  if (window?.isStandard) {
    application?.hide()
  } else {
    switch (application?.name) {

      case 'Siri':
        hs.eventtap.keyStroke([], 'escape')
        break

      default:
        hs.eventtap.keyStroke(['cmd'], 'escape')

    }
  }

  hide.enable()
})
