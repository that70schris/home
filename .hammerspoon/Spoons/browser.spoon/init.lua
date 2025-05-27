hs.urlevent.httpCallback = function(scheme, host, params, url)
  local app = 'com.google.Chrome'
  if hs.eventtap.checkKeyboardModifiers().shift then
    app = 'com.apple.Safari'
  end

  hs.urlevent.openURLWithBundle(url, app)
end
