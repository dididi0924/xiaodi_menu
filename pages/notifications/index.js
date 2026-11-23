const store = require('../../utils/store');
const view = require('../../utils/view');
const layout = require('../../utils/layout');

Page({
  data: {
    navTop: 60,
    items: [],
    unread: 0
  },

  onLoad() {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.setData({ navTop: layout.navInset() });
    this.refresh();
    this.syncCloud();
  },

  onShow() {
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
    const items = store.notificationsForCurrent().map(view.notificationView);
    this.setData({ items, unread: store.unreadCount() });
  },

  async markAllRead() {
    await store.markAllRead();
    this.refresh();
    wx.showToast({ title: '全部已读', icon: 'none' });
  },

  async openItem(e) {
    const id = e.currentTarget.dataset.id;
    const orderId = e.currentTarget.dataset.order;
    await store.markRead(id);
    if (!orderId) {
      this.refresh();
      return;
    }
    const order = store.orderById(orderId);
    const tab = order && (order.status === 'served' || order.status === 'cancelled') ? 'history' : 'active';
    wx.reLaunch({ url: '/pages/orders/index?tab=' + tab });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  }
});
