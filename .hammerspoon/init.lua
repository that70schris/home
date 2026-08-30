hs.allowAppleScript(true)
hs.loadSpoon('finder')
hs.loadSpoon('enter')
hs.loadSpoon('hide')

hs.console.clearConsole()
clear = hs.hotkey.bind({ 'cmd' }, 'k', function()
  local window = hs.window.frontmostWindow()
  local application = window:application()
  local id = application:bundleID()

  if not application then return end
  if not window then return end

  (({
      ['org.hammerspoon.Hammerspoon'] = function()
        hs.console.clearConsole()
      end,

    })[id] or
    function()
      clear:disable()
      hs.eventtap.keyStroke({ 'cmd' }, 'k')
      clear:enable()
    end)()
end)

hs.eventtap.new({
  hs.eventtap.event.types.flagsChanged,
  hs.eventtap.event.types.keyDown,
  hs.eventtap.event.types.keyUp,
}, function(e)
  print(
    hs.eventtap.event.types[e:getType()],
    hs.keycodes.map[e:getKeyCode()],
    hs.inspect(e:systemKey()),
    e:getFlags().shift,
    e:getFlags().alt,
    e:getFlags().cmd,
    '')
end):start()
