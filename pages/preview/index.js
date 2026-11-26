const D = require('../../utils/data');
const layout = require('../../utils/layout');
const store = require('../../utils/store');

Page({
  data: {
    navTop: 60,
    dishes: [],
    total: D.DISHES.length
  },

  onLoad() {
    const state = store.get();
    if (state.loggedIn) {
      wx.reLaunch({ url: state.onboarded ? '/pages/home/index' : '/pages/onboarding/index' });
      return;
    }
    this.setData({
      navTop: layout.navInset(),
      dishes: D.DISHES.slice(0, 6)
    });
  },

  start() {
    const state = store.get();
    if (state.loggedIn) {
      wx.reLaunch({ url: state.onboarded ? '/pages/home/index' : '/pages/onboarding/index' });
      return;
    }
    wx.reLaunch({ url: state.roleChosen ? '/pages/auth/index' : '/pages/role/index' });
  },

  onShareAppMessage() {
    return {
      title: '今晚吃什么？来 koodi98 看看菜单',
      path: '/pages/preview/index'
    };
  }
});
