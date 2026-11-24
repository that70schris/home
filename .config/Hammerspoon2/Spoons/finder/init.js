return hs.windowsForApp(['Finder']).subscribe(
  hs.window.filter.windowCreated,
  (window) => {
    window.setSize({
      w: 1000,
      h: 700,
    })
  },

)
