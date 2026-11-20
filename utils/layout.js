// Layout helpers for a custom navigation bar on devices with a capsule.
function windowInfo() {
  try {
    if (wx.getWindowInfo) return wx.getWindowInfo();
    return wx.getSystemInfoSync();
  } catch (e) {
    return { statusBarHeight: 20, windowWidth: 375, windowHeight: 667 };
  }
}

function menuButton() {
  try {
    if (wx.getMenuButtonBoundingClientRect) return wx.getMenuButtonBoundingClientRect();
  } catch (e) {}
  return null;
}

function navInset() {
  const sys = windowInfo();
  const btn = menuButton();
  if (btn && btn.bottom) return btn.bottom + 8;
  return (sys.statusBarHeight || 20) + 44;
}

function statusBarHeight() {
  return windowInfo().statusBarHeight || 20;
}

function rpx(value) {
  const sys = windowInfo();
  return value * (sys.windowWidth || 375) / 750;
}

module.exports = { windowInfo, menuButton, navInset, statusBarHeight, rpx };
