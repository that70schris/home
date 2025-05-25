hs.pathwatcher.new('../.hammerspoon', hs.reload):start()
hs.allowAppleScript(true)
hs.loadSpoon('escape')
hs.loadSpoon('enter')
hs.loadSpoon('clear')

hs.loadSpoon('Hammerflow')
spoon.Hammerflow.loadFirstValidTomlFile({
  "flow.toml",
})
