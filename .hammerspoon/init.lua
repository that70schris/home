hs.allowAppleScript(true)
hs.loadSpoon('clear')
hs.loadSpoon('enter')
hs.loadSpoon('escape')
hs.loadSpoon('finder')
hs.console.clearConsole()

hs.eventtap.new({
    hs.eventtap.event.types.flagsChanged,
    hs.eventtap.event.types.keyDown,
    hs.eventtap.event.types.keyUp,
  },
  function(e)
    print(
      hs.eventtap.event.types[e:getType()],
      hs.keycodes.map[e:getKeyCode()],
      e:getFlags().cmd,
      e:getFlags().alt,
      e:getFlags().shift,
      hs.inspect(e:systemKey()),
      '')
  end
):start()

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
