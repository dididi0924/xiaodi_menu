const store = require('../../utils/store');
const layout = require('../../utils/layout');

Page({
  data: {
    navTop: 60,
    loading: false
  },

  onLoad() {
    this.setData({ navTop: layout.navInset() });
  },

  onShow() {
    const state = store.get();
    if (state.loggedIn) {
      wx.reLaunch({ url: state.onboarded ? '/pages/home/index' : '/pages/onboarding/index' });
    }
  },

  login() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const finish = () => {
      store.login();
      wx.reLaunch({ url: '/pages/onboarding/index' });
    };
    // Real versions send this code to a BFF. The page shell only creates
    // a local session so the onboarding flow can be tested.
    if (wx.login) {
      wx.login({
        success: finish,
        fail: finish
      });
    } else {
      finish();
    }
  }
});
