hs.pathwatcher.new('../.hammerspoon', function()
  hs.execute(
    'open raycast://extensions/bjrmatos/hammerspoon/reload-configuration-file')
end):start()
hs.allowAppleScript(true)
hs.alert('loading')

hs.loadSpoon('escape')
hs.loadSpoon('enter')
hs.loadSpoon('clear')
-- hs.loadSpoon('Hammerflow')
-- spoon.Hammerflow.loadFirstValidTomlFile({
--   "flow.toml",
-- })

-- if spoon.Hammerflow.auto_reload then
--   hs.loadSpoon("ReloadConfiguration")
--   -- set any paths for auto reload
--   -- spoon.ReloadConfiguration.watch_paths = { '../.hammerspoon' }
--   spoon.ReloadConfiguration:start()
-- end
