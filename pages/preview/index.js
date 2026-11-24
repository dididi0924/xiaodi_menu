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
    this.setData({
      navTop: layout.navInset(),
      dishes: D.DISHES.slice(0, 6)
    });
  },

  start() {
    wx.reLaunch({ url: store.get().roleChosen ? '/pages/auth/index' : '/pages/role/index' });
  },

  onShareAppMessage() {
    return {
      title: '今晚吃什么？来 didi 和 33 看看菜单',
      path: '/pages/preview/index'
    };
  }
});
