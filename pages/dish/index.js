const store = require('../../utils/store');
const view = require('../../utils/view');
const layout = require('../../utils/layout');
const imagePicker = require('../../utils/image');

Page({
  data: {
    dish: null,
    liked: false,
    qty: 1,
    note: '',
    navTop: 60,
    isCustom: false,
    countText: '',
    chef: {},
    uploading: false
  },

  onLoad(options) {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.setData({ navTop: layout.navInset() });
    this.loadDish(options && options.id);
  },

  loadDish(id) {
    const raw = store.getDish(id);
    if (!raw) {
      wx.showToast({ title: '这道菜已经不在菜单里了', icon: 'none' });
      setTimeout(() => this.goBack(), 400);
      return;
    }
    const decorated = view.decorateDish(raw, store.get().favorites);
    this.setData({
      dish: decorated,
      liked: decorated.liked,
      isCustom: !!raw.isCustom,
      count: store.effectiveOrderCount(raw),
      countText: store.effectiveOrderCount(raw) + ' 次',
      chef: require('../../utils/data').MEMBERS.lin
    });
  },

  async changeImage() {
    if (this.data.uploading || !this.data.dish) return;
    this.setData({ uploading: true });
    try {
      const image = await imagePicker.chooseAndSave();
      store.setDishImage(this.data.dish.id, image);
      this.loadDish(this.data.dish.id);
      wx.showToast({ title: '照片已更新', icon: 'none' });
    } catch (e) {
      const message = (e && e.message) || '图片上传失败，请重试';
      if (message.indexOf('取消') < 0) wx.showToast({ title: message, icon: 'none' });
    } finally {
      this.setData({ uploading: false });
    }
  },

  toggleFavorite() {
    if (!this.data.dish) return;
    const liked = store.toggleFavorite(this.data.dish.id);
    this.setData({
      liked,
      'dish.liked': liked,
      'dish.heartIcon': liked ? '/assets/icons/heart-tomato.png' : '/assets/icons/heart-ink.png',
      'dish.heartClass': liked ? 'is-liked' : ''
    });
    wx.showToast({ title: liked ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  changeQty(e) {
    const delta = Number(e.currentTarget.dataset.delta || 0);
    this.setData({ qty: Math.max(1, Math.min(9, this.data.qty + delta)) });
  },

  onNote(e) {
    this.setData({ note: e.detail.value });
  },

  addToCart() {
    if (!this.data.dish) return;
    if (store.get().role === 'cook') {
      wx.showToast({ title: '切换到' + store.getMember('man').name + '视角才能点菜', icon: 'none' });
      return;
    }
    store.addToCart(this.data.dish.id, this.data.qty, (this.data.note || '').trim());
    wx.showToast({ title: '已加入今晚菜单', icon: 'none' });
    setTimeout(() => this.goBack(), 260);
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  },

  onShareAppMessage() {
    const dish = this.data.dish;
    return {
      title: dish ? '今晚想吃 ' + dish.name : '今晚吃什么？',
      path: '/pages/home/index'
    };
  }
});
