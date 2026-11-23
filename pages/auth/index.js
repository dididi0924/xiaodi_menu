const store = require('../../utils/store');
const layout = require('../../utils/layout');
const D = require('../../utils/data');
const imagePicker = require('../../utils/image');

Page({
  data: {
    navTop: 60,
    loading: false,
    nickname: '',
    avatar: '/assets/avatars/man.png',
    avatarLoading: false,
    dishCount: D.DISHES.length
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

  onNickname(e) {
    this.setData({ nickname: e.detail.value });
  },

  async onChooseAvatar(e) {
    const temp = e.detail && e.detail.avatarUrl;
    if (!temp || this.data.avatarLoading) return;
    this.setData({ avatarLoading: true });
    try {
      const avatar = await imagePicker.persist(temp);
      this.setData({ avatar });
    } catch (err) {
      wx.showToast({ title: '头像保存失败，请重试', icon: 'none' });
    } finally {
      this.setData({ avatarLoading: false });
    }
  },

  login() {
    if (this.data.loading) return;
    const nickname = (this.data.nickname || '').trim().slice(0, 12);
    if (!nickname) {
      wx.showToast({ title: '先点一下昵称，填入微信名字', icon: 'none' });
      return;
    }
    if (this.data.avatarLoading) {
      wx.showToast({ title: '头像正在保存，稍等一下', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    const finish = () => {
      store.login({ nickname, avatar: this.data.avatar });
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
