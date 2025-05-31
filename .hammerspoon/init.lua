hs.console.clearConsole()
hs.allowAppleScript(true)
hs.loadSpoon('clear')
hs.loadSpoon('enter')
hs.loadSpoon('escape')
hs.pathwatcher.new('../.hammerspoon/init.lua', hs.reload):start()
hs.loadSpoon('Hammerflow')
-- spoon.Hammerflow.loadFirstValidTomlFile({
--   'flow.toml',
-- })

hs.notify.show(
  'Hammerspoon',
  'Reloading configuration',
  ''
)
