const store = require('../../utils/store');
const view = require('../../utils/view');

Page({
  data: {
    role: 'eater',
    isCook: false,
    tab: 'active',
    activeOrder: null,
    history: [],
    unread: 0,
    orderDot: false,
    activeCount: 0,
    man: {},
    lin: {}
  },

  onLoad(options) {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    if (options && options.tab === 'history') this.setData({ tab: 'history' });
    this.refresh();
    this.syncCloud();
  },

  onShow() {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.refresh();
    this.syncCloud();
  },

  async syncCloud() {
    if (!store.isCloud()) return;
    try {
      await store.cloudSync();
      this.refresh();
    } catch (err) {
      if (err && err.code === 'AUTH_REQUIRED') wx.reLaunch({ url: '/pages/auth/index' });
    }
  },

  refresh() {
    const state = store.get();
    const role = state.role;
    const isCook = role === 'cook';
    const active = store.currentOrder();
    const activeRole = active ? (active.eaterId === store.currentUserId() ? 'eater' : 'cook') : role;
    const activeOrder = active ? view.decorateOrder(active, activeRole) : null;
    const history = state.orders
      .filter((o) => o.status === 'served' || o.status === 'cancelled')
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(view.decorateHistory);
    this.setData({
      role,
      isCook,
      activeOrder,
      history,
      activeCount: active ? 1 : 0,
      unread: store.unreadCount(),
      orderDot: !!active,
      man: store.getMember('man'),
      lin: store.getMember('lin'),
      partner: store.partner()
    });
  },

  onTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onTopSearch() {
    wx.reLaunch({ url: '/pages/home/index?search=1' });
  },

  openNotifications() {
    wx.navigateTo({ url: '/pages/notifications/index' });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' });
  },

  onPrimary() {
    const order = this.data.activeOrder;
    if (!order || !order.action) return;
    const action = order.action.action;
    if (action === 'advance') this.advanceOrder(order.id);
    else if (action === 'nudge') this.nudgeOrder(order.id);
    else if (action === 'add') this.goHome();
  },

  async advanceOrder(id) {
    const current = store.orderById(id);
    if (!current || current.eaterId === store.currentUserId()) return;
    const action = current.status === 'pending' ? 'accept' : current.status === 'accepted' ? 'cook' : 'serve';
    let order;
    try {
      order = store.isCloud() ? await store.cloudTransitionOrder(id, action) : store.advanceOrder(id);
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' });
      return;
    }
    if (!order) return;
    const eaterName = order.eaterName || store.getMember(order.eaterId || 'man').name;
    this.refresh();
    if (order.status === 'served') {
      this.setData({ tab: 'history' });
      wx.showToast({ title: '上菜啦，' + eaterName + '会收到通知', icon: 'none' });
    } else if (order.status === 'accepted') {
      wx.showToast({ title: '已接单，' + eaterName + '会收到通知', icon: 'none' });
    } else {
      wx.showToast({ title: '开火了，' + eaterName + '会收到通知', icon: 'none' });
    }
  },

  async nudgeOrder(id) {
    try {
      if (store.isCloud()) await store.cloudTransitionOrder(id, 'nudge');
      else store.nudgeOrder(id);
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' });
      return;
    }
    this.refresh();
    wx.showToast({ title: this.data.isCook ? store.getMember('man').name + '会看到你的留言' : '已经轻轻提醒' + store.getMember('lin').name, icon: 'none' });
  },

  async cancelOrder(e) {
    try {
      if (store.isCloud()) await store.cloudTransitionOrder(e.currentTarget.dataset.id, 'cancel');
      else store.cancelOrder(e.currentTarget.dataset.id);
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '取消失败', icon: 'none' });
      return;
    }
    this.refresh();
    wx.showToast({ title: '订单已取消', icon: 'none' });
  },

  reorder(e) {
    const added = store.reorder(e.currentTarget.dataset.id);
    if (!added) {
      wx.showToast({ title: '这些菜暂时不在菜单里', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/cart/index' });
  },

  async onPullDownRefresh() {
    if (store.isCloud()) {
      try { await store.cloudSync(); } catch (e) {}
    }
    this.refresh();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: this.data.isCook ? '今晚的厨房' : '今晚的订单',
      path: '/pages/home/index'
    };
  }
});
