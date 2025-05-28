hs.pathwatcher.new('../.hammerspoon', hs.reload):start()
hs.allowAppleScript(true)
hs.execute(
  'open raycast://extensions/maxnyby/raycast-notification/index?arguments=%7B%22message%22%3A%22%22%2C%22title%22%3A%22reloading%22%2C%22type%22%3A%22%22%7D')

hs.loadSpoon('escape')
hs.loadSpoon('enter')
hs.loadSpoon('clear')
hs.loadSpoon('Hammerflow')
spoon.Hammerflow.loadFirstValidTomlFile({
  "flow.toml",
})

if spoon.Hammerflow.auto_reload then
  hs.loadSpoon("ReloadConfiguration")
  spoon.ReloadConfiguration:start()
end
