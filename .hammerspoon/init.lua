hs.pathwatcher.new('./init.lua', hs.reload):start()
escape = hs.hotkey.bind({ 'cmd' }, 'escape', function()
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
