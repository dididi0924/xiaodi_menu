const store = require('../../utils/store');
const layout = require('../../utils/layout');
const D = require('../../utils/data');

Page({
  data: {
    navTop: 60,
    mode: 'invite',
    code: 'TWO-8F2K',
    group: D.GROUP,
    inviter: D.MEMBERS.man,
    partner: D.MEMBERS.lin,
    qr: '/assets/qr-invite.png',
    joined: false
  },

  onLoad(options) {
    const state = store.get();
    const mode = options && options.mode === 'join' ? 'join' : 'invite';
    this.setData({
      navTop: layout.navInset(),
      mode,
      code: state.group.code || 'TWO-8F2K',
      group: state.group,
      inviter: store.currentUser(),
      partner: store.partner(),
      joined: !!state.onboarded
    });
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.code,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'none' })
    });
  },

  copyLink() {
    wx.setClipboardData({
      data: 'https://two.example/i/' + this.data.code,
      success: () => wx.showToast({ title: '邀请链接已复制', icon: 'none' })
    });
  },

  previewJoin() {
    wx.navigateTo({ url: '/pages/invite/index?mode=join&code=' + this.data.code });
  },

  joinTable() {
    const state = store.get();
    if (!state.loggedIn) {
      wx.reLaunch({ url: '/pages/auth/index' });
      return;
    }
    store.completeOnboarding();
    wx.reLaunch({ url: '/pages/home/index' });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  },

  onShareAppMessage() {
    return {
      title: this.data.inviter.name + '邀请你加入今晚的餐桌',
      path: '/pages/invite/index?mode=join&code=' + this.data.code,
      imageUrl: '/assets/hero-table.jpg'
    };
  }
});
