hs.spoons.load('finder')
hs.spoons.load('hide')

hs.eventtap.addWatcher([
  hs.eventtap.eventTypes.flagsChanged,
  hs.eventtap.eventTypes.keyDown,
  hs.eventtap.eventTypes.keyUp,
], (e) => {
  console.log(
    e.characters,
    e.flags,
  )
}).start()
