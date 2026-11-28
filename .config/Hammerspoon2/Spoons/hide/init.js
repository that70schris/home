let hide = hs.hotkey.bind(['cmd'], 'escape', () => {
  let window = hs.window.focusedWindow()
  let application = window.application

  if (window?.isStandard) {
    application?.hide()
  } else {
    switch (application?.name) {

      case 'Siri':
        hs.eventtap.keyStroke([], 'escape')
        break

      default:
        hide.disable()
        hs.eventtap.keyStroke(['cmd'], 'escape')
        hide.enable()

    }
  }

})
