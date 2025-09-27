return hs.window.filter.new { 'Finder' }:subscribe(
  hs.window.filter.windowCreated,
  function(window)
    window:setSize({ w = 1000, h = 700 })
  end
)
