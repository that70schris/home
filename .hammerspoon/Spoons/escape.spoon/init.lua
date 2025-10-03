return hs.hotkey.bind({ 'cmd' }, 'escape', function()
  local window = hs.window.frontmostWindow()
  local application = window:application()
  local id = application:bundleID()

  if not application then return end
  if not window then return end
  if window:isStandard() then
    application:hide()
    return
  end

  (({
    ['com.apple.Spotlight'] = function()
      hs.eventtap.keyStroke({}, 'escape')
    end,

    ['com.raycast.macos'] = function()
      escape:disable()
      hs.eventtap.keyStroke({ 'cmd' }, 'escape')
      escape:enable()
    end,

  })[id] or function()
    application:hide()
  end)()
end)
