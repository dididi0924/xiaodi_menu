const store = require('../../utils/store');
const layout = require('../../utils/layout');

Page({
  data: {
    navTop: 60,
    selected: '',
    fromJoin: false
  },

  onLoad(options) {
    const state = store.get();
    if (state.roleChosen) {
      wx.reLaunch({ url: state.loggedIn ? (state.onboarded ? '/pages/home/index' : '/pages/onboarding/index') : '/pages/auth/index' });
      return;
    }
    this.setData({
      navTop: layout.navInset(),
      selected: '',
      fromJoin: !!(options && options.from === 'join')
    });
  },

  select(e) {
    this.setData({ selected: e.currentTarget.dataset.role === 'cook' ? 'cook' : 'eater' });
  },

  preview() {
    wx.navigateTo({ url: '/pages/preview/index' });
  },

  next() {
    if (!this.data.selected) {
      wx.showToast({ title: '先选一个主视角', icon: 'none' });
      return;
    }
    store.chooseRole(this.data.selected);
    const state = store.get();
    if (state.loggedIn) {
      wx.reLaunch({ url: state.onboarded ? '/pages/home/index' : '/pages/onboarding/index' });
    } else {
      wx.reLaunch({ url: '/pages/auth/index' });
    }
  }
});
