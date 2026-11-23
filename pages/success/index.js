const store = require('../../utils/store');
const view = require('../../utils/view');
const layout = require('../../utils/layout');

Page({
  data: {
    navTop: 60,
    order: null,
    count: 0,
    timeText: '',
    dateText: '',
    notify: true,
    confetti: []
  },

  onLoad(options) {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    const navTop = layout.navInset();
    const order = store.orderById(options && options.orderId);
    if (!order) {
      wx.showToast({ title: '订单已经失效', icon: 'none' });
      setTimeout(() => wx.reLaunch({ url: '/pages/home/index' }), 400);
      return;
    }
    const decorated = view.decorateOrder(order, store.get().role);
    const colors = ['#E4553D', '#EED9A8', '#68745C', '#D8A76B', '#F7D9D0'];
    const confetti = [];
    for (let i = 0; i < 15; i++) {
      confetti.push({
        left: 7 + (i * 6.2) % 88,
        color: colors[i % colors.length],
        delay: (0.1 + (i % 5) * 0.09).toFixed(2),
        duration: (1.5 + (i % 4) * 0.25).toFixed(2)
      });
    }
    this.setData({
      navTop,
      order: decorated,
      count: decorated.count,
      timeText: view.formatTime(order.createdAt),
      dateText: view.formatDate(order.createdAt),
      notify: order.notify !== false,
      confetti
    });
  },

  viewCook() {
    store.setRole('cook');
    wx.reLaunch({ url: '/pages/orders/index' });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/index' });
  },

  onShareAppMessage() {
    return {
      title: '今晚有人给我点菜了',
      path: '/pages/home/index'
    };
  }
});
