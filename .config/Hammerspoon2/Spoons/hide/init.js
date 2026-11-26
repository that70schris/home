let hide = hs.hotkey.bind(['cmd'], 'escape', () => {
  let window = hs.window.focusedWindow()
  let application = window.application
  hide.disable()

  switch (application?.name) {

    case 'Siri':
      hs.eventtap.keyStroke([], 'escape', application)
      break

  }

  if (window?.isStandard) {
    application?.hide()
  }

  hide.enable()
})

return hide
