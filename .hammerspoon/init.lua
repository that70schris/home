hs.allowAppleScript(true)
hs.loadSpoon('enter')
hs.loadSpoon('finder')
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

  })[id] or function()
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
    e:getFlags().cmd,
    e:getFlags().alt,
    e:getFlags().shift,
    hs.inspect(e:systemKey()),
    '')
end):start()

-- with Raycast Hyper key:
-- flagsChanged	cmd	true	true
-- flagsChanged	cmd	nil	nil
-- keyDown	escape	nil	nil
-- keyUp	escape	nil	nil

-- flagsChanged	cmd	true	nil
-- flagsChanged	cmd	true	true
-- flagsChanged	cmd	nil	nil
-- keyDown	escape	nil	nil
-- keyUp	escape	nil	nil
-- flagsChanged	cmd	nil	nil

-- without Raycast Hyper key:
-- flagsChanged	capslock	nil	nil	nil	{}

-- flagsChanged	rightcmd	nil	nil	nil	{}
-- flagsChanged	cmd	true	nil	nil	{}
-- flagsChanged	capslock	true	nil	nil	{}
-- flagsChanged	cmd	nil	nil	nil	{}
