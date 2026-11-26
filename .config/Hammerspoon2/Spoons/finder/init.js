hs.windowfilter.create(['Finder']).on([
  'windowCreated',
], (window, app) => {
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
