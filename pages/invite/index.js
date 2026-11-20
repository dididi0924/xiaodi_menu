const store = require('../../utils/store');
const layout = require('../../utils/layout');
const D = require('../../utils/data');

Page({
  data: {
    navTop: 60,
    mode: 'invite',
    code: D.GROUP.code,
    group: D.GROUP,
    lin: D.MEMBERS.lin,
    man: D.MEMBERS.man,
    qr: '/assets/qr-invite.png',
    joined: true
  },

  onLoad(options) {
    const mode = options && options.mode === 'join' ? 'join' : 'invite';
    this.setData({
      navTop: layout.navInset(),
      mode,
      joined: store.get().joined !== false
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
    wx.navigateTo({ url: '/pages/invite/index?mode=join' });
  },

  joinTable() {
    store.setJoined(true);
    wx.reLaunch({ url: '/pages/home/index' });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  },

  onShareAppMessage() {
    return {
      title: '林深邀请你加入今晚的餐桌',
      path: '/pages/invite/index?mode=join',
      imageUrl: '/assets/hero-table.jpg'
    };
  }
});
