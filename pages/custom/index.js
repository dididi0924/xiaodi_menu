const store = require('../../utils/store');
const layout = require('../../utils/layout');

Page({
  data: {
    navTop: 60,
    name: '',
    description: '',
    time: '25',
    categories: ['面饭', '下饭', '清淡', '汤羹', '西式', '甜点'],
    categoryIndex: 0,
    previewChar: '菜',
    saving: false
  },

  onLoad() {
    this.setData({ navTop: layout.navInset() });
  },

  onName(e) {
    const name = e.detail.value;
    this.setData({ name, previewChar: (name || '菜').trim().slice(0, 1) || '菜' });
  },

  onDescription(e) {
    this.setData({ description: e.detail.value });
  },

  onTime(e) {
    this.setData({ time: e.detail.value });
  },

  onCategory(e) {
    this.setData({ categoryIndex: Number(e.detail.value) });
  },

  submit() {
    if (this.data.saving) return;
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '先给它起个名字吧', icon: 'none' });
      return;
    }
    const time = Math.max(5, Math.min(180, Number(this.data.time) || 25));
    const category = this.data.categories[this.data.categoryIndex] || '下饭';
    this.setData({ saving: true });
    store.addCustomDish(name, (this.data.description || '').trim(), category, time);
    wx.showToast({ title: '已加入你们的菜单', icon: 'none' });
    setTimeout(() => wx.reLaunch({ url: '/pages/home/index?showAll=1' }), 500);
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  }
});
