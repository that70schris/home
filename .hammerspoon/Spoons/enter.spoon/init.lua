enter = hs.hotkey.bind({ 'shift' }, 'return', function()
  local window = hs.window.frontmostWindow()
  local application = window:application()
  local id = application:bundleID()

  if not application then return end
  if not window then return end

  (({
    ['com.raycast.macos'] = function()
      hs.eventtap.keyStroke({}, 'return', nil,
        hs.application.find('com.raycast.macos'))
    end,

  })[id] or function()
    enter:disable()
    hs.eventtap.keyStroke({ 'shift' }, 'return')
    enter:enable()
  end)()
end)

return enter
