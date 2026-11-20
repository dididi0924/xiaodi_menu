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
    activeCount: 0
  },

  onLoad(options) {
    if (options && options.tab === 'history') this.setData({ tab: 'history' });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = store.get();
    const role = state.role;
    const isCook = role === 'cook';
    const active = store.currentOrder();
    const activeOrder = active ? view.decorateOrder(active, role) : null;
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
      orderDot: !!active
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

  advanceOrder(id) {
    if (!this.data.isCook) return;
    const order = store.advanceOrder(id);
    if (!order) return;
    this.refresh();
    if (order.status === 'served') {
      this.setData({ tab: 'history' });
      wx.showToast({ title: '上菜啦，小满会收到通知', icon: 'none' });
    } else if (order.status === 'accepted') {
      wx.showToast({ title: '已接单，小满会收到通知', icon: 'none' });
    } else {
      wx.showToast({ title: '开火了，小满会收到通知', icon: 'none' });
    }
  },

  nudgeOrder(id) {
    store.nudgeOrder(id);
    this.refresh();
    wx.showToast({ title: this.data.isCook ? '小满会看到你的留言' : '已经轻轻提醒林深', icon: 'none' });
  },

  cancelOrder(e) {
    store.cancelOrder(e.currentTarget.dataset.id);
    this.refresh();
    wx.showToast({ title: '订单已取消', icon: 'none' });
  },

  reorder(e) {
    if (this.data.isCook) {
      wx.showToast({ title: '切换回小满视角再点单', icon: 'none' });
      return;
    }
    const added = store.reorder(e.currentTarget.dataset.id);
    if (!added) {
      wx.showToast({ title: '这些菜暂时不在菜单里', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/cart/index' });
  },

  onPullDownRefresh() {
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
