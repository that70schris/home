/* global hs */

let hide = hs.hotkey.bind(['cmd'], 'escape', () => {
  let application = hs.application.frontmost();

  ({
    'com.apple.Spotlight': () => {
      hs.eventtap.keyStroke([], 'escape')
    },

    'com.raycast.macos': () => {
      hide.disable()
      hs.eventtap.keyStroke(['cmd'], 'escape', application)
      hide.enable()
    },

  }[application?.bundleID]
  ?? (() => {
    application?.hide()
  }))()
})

return hide
