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
    isCloud: false,
    joined: false
  },

  onLoad(options) {
    const state = store.get();
    const mode = options && options.mode === 'join' ? 'join' : 'invite';
    const incomingCode = (options && options.code) || state.group.code || '';
    this._mode = mode;
    this._incomingCode = incomingCode;
    this.setData({
      navTop: layout.navInset(),
      mode,
      code: store.isCloud() ? incomingCode : (incomingCode || 'TWO-8F2K'),
      group: state.group,
      inviter: store.currentUser(),
      partner: store.partner(),
      isCloud: store.isCloud(),
      joined: !!state.onboarded
    });
    this.loadCloud();
  },

  async loadCloud() {
    if (!store.isCloud() || !store.get().loggedIn) return;
    try {
      if (this._mode === 'join' && this._incomingCode) {
        const preview = await store.cloudPreviewInvite(this._incomingCode);
        const members = preview.members || [];
        this.setData({
          code: this._incomingCode,
          group: Object.assign({}, this.data.group, { name: preview.tableName }),
          inviter: members[0] || this.data.inviter,
          partner: members[1] || this.data.partner,
          joined: store.get().onboarded
        });
      } else if (this._mode === 'invite' && !this.data.code) {
        const invite = await store.cloudCreateInvite();
        this.setData({ code: invite.code });
      }
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '邀请加载失败', icon: 'none' });
    }
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

  async joinTable() {
    const state = store.get();
    if (!state.loggedIn) {
      try { wx.setStorageSync('pendingInvite', this.data.code); } catch (e) {}
      wx.reLaunch({ url: '/pages/auth/index' });
      return;
    }
    try {
      if (store.isCloud()) {
        await store.cloudAcceptInvite(this.data.code);
      } else {
        store.completeOnboarding();
      }
      if (!store.get().roleChosen) {
        wx.reLaunch({ url: '/pages/role/index?from=join' });
        return;
      }
      wx.reLaunch({ url: '/pages/home/index' });
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '加入失败', icon: 'none' });
    }
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
