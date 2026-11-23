const store = require('../../utils/store');
const view = require('../../utils/view');
const layout = require('../../utils/layout');
const D = require('../../utils/data');

Page({
  data: {
    navTop: 60,
    items: [],
    count: 0,
    eta: 0,
    message: '',
    charCount: 0,
    notify: true,
    partner: D.MEMBERS.lin,
    isCook: false,
    empty: true,
    placing: false,
    quickNotes: D.QUICK_NOTES
  },

  onLoad() {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.setData({
      navTop: layout.navInset(),
      message: store.get().draftMessage || '',
      notify: store.get().notify,
      charCount: (store.get().draftMessage || '').length
    });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = store.get();
    const items = store.cartDetailed().map((item) => {
      const dish = view.decorateDish(item.dish, state.favorites);
      return {
        dishId: dish.id,
        name: dish.name,
        image: dish.image,
        coverGradient: dish.coverGradient,
        initial: dish.initial,
        category: dish.category,
        time: dish.time,
        qty: item.qty,
        note: item.note
      };
    });
    this.setData({
      items,
      count: store.cartCount(),
      eta: store.cartEta(),
      empty: items.length === 0,
      isCook: state.role === 'cook',
      partner: D.MEMBERS.lin,
      notify: state.notify
    });
  },

  onMessage(e) {
    const message = e.detail.value;
    this.setData({ message, charCount: message.length });
    store.setDraftMessage(message);
  },

  useQuickNote(e) {
    const note = e.currentTarget.dataset.note;
    this.setData({ message: note, charCount: note.length });
    store.setDraftMessage(note);
  },

  toggleNotify() {
    const notify = !this.data.notify;
    this.setData({ notify });
    store.setNotify(notify);
  },

  changeQty(e) {
    store.changeCartQty(e.currentTarget.dataset.id, Number(e.currentTarget.dataset.delta));
    this.refresh();
  },

  removeItem(e) {
    store.removeFromCart(e.currentTarget.dataset.id);
    this.refresh();
  },

  addMore() {
    this.goBack();
  },

  async placeOrder() {
    if (this.data.placing) return;
    if (this.data.isCook) {
      wx.showToast({ title: '切换到' + store.getMember('man').name + '视角才能下单', icon: 'none' });
      return;
    }
    if (!this.data.items.length) return;
    const state = store.get();
    if (store.isCloud() && !state.partnerJoined) {
      wx.showToast({ title: '等另一半加入餐桌后再下单', icon: 'none' });
      return;
    }
    this.setData({ placing: true });
    try {
      const order = store.isCloud()
        ? await store.cloudPlaceOrder(this.data.message, this.data.notify)
        : store.placeOrder(this.data.message, this.data.notify);
      if (!order) {
        wx.showToast({ title: '先选几道菜吧', icon: 'none' });
        this.setData({ placing: false });
        return;
      }
      wx.redirectTo({ url: '/pages/success/index?orderId=' + order.id });
    } catch (err) {
      this.setData({ placing: false });
      wx.showToast({ title: (err && err.message) || '下单失败，请重试', icon: 'none' });
    }
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  }
});
