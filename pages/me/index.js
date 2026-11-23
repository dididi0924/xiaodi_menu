const store = require('../../utils/store');
const view = require('../../utils/view');
const D = require('../../utils/data');

Page({
  data: {
    role: 'eater',
    isCook: false,
    group: D.GROUP,
    code: D.GROUP.code,
    customCount: 0,
    favCount: 0,
    prefs: [],
    preferNotify: true,
    amp: '&',
    unread: 0,
    orderDot: false,
    currentUser: D.MEMBERS.man,
    man: D.MEMBERS.man,
    lin: D.MEMBERS.lin
  },

  onLoad() {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.refresh();
  },

  onShow() {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.refresh();
  },

  refresh() {
    const state = store.get();
    const isCook = state.role === 'cook';
    this.setData({
      role: state.role,
      isCook,
      group: state.group,
      code: state.group.code,
      customCount: state.customDishes.length,
      favCount: state.favorites.length,
      prefs: state.prefs,
      preferNotify: state.preferNotify,
      unread: store.unreadCount(),
      orderDot: !!store.currentOrder(),
      currentUser: store.currentUser(),
      man: store.getMember('man'),
      lin: store.getMember('lin')
    });
  },

  onTopSearch() {
    wx.reLaunch({ url: '/pages/home/index?search=1' });
  },

  openNotifications() {
    wx.navigateTo({ url: '/pages/notifications/index' });
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.code,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'none' })
    });
  },

  openInvite() {
    wx.navigateTo({ url: '/pages/invite/index' });
  },

  openCustom() {
    wx.navigateTo({ url: '/pages/custom/index' });
  },

  openFavorites() {
    store.shuffle();
    wx.showToast({ title: '收藏会用来调整今晚推荐', icon: 'none' });
    setTimeout(() => wx.reLaunch({ url: '/pages/home/index' }), 450);
  },

  setRole(e) {
    const role = e.currentTarget.dataset.role === 'cook' ? 'cook' : 'eater';
    if (role === this.data.role) return;
    store.setRole(role);
    wx.reLaunch({ url: '/pages/home/index' });
  },

  togglePrefNotify() {
    const value = !this.data.preferNotify;
    this.setData({ preferNotify: value });
    store.setPrefNotify(value);
  },

  resetDemo() {
    wx.showModal({
      title: '重新开始演示？',
      content: '会清空本机的订单、留言和自定义菜单，回到最初的状态。',
      confirmText: '确认重置',
      confirmColor: '#E4553D',
      success: (res) => {
        if (!res.confirm) return;
        store.reset();
        wx.reLaunch({ url: '/pages/auth/index' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: (store.get().group.name || '我们的餐桌') + ' · 今晚吃什么',
      path: '/pages/invite/index?mode=join'
    };
  }
});
