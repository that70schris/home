return hs.hotkey.bind({ 'cmd' }, 'k', function()
  local window = hs.window.frontmostWindow()
  local application = window:application()
  local id = application:bundleID()

  if not application then return end
  if not window then return end

  (({
    ['org.hammerspoon.Hammerspoon'] = function()
      hs.console.clearConsole()
    end,

  })[id] or function()
    clear:disable()
    hs.eventtap.keyStroke({ 'cmd' }, 'k')
    clear:enable()
  end)()
end)
