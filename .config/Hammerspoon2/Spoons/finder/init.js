hs.windowfilter.create(['Finder']).on([
  'windowCreated',
], (window, app) => {
  window.moveAndResize(new HSRect(
    window.position.x,
    window.position.y,
    1000,
    700,
  ))
})
