hs.hotkey.bind(['cmd'], 'escape', () => {
  let window = hs.window.focusedWindow()
  let application = window.application

  switch (application?.name) {

    case 'Siri':
      hs.eventtap.keyStroke([], 'escape')
      break

  }

  if (window?.isStandard) {
    application?.hide()
  }

})
