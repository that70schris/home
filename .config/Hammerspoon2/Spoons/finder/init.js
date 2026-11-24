hs.spoons.load('windowfilter')
hs.spoons.windowfilter.default.on([
  'windowCreated',
], (event, window, state) => {
  switch (window?.application?.bundleID) {

    case 'com.apple.finder':
      window.moveAndResize(new HSRect(
        window.position.x,
        window.position.y,
        1000,
        700,
      ))
      break

  }
})
