const store = require('../../utils/store');
const layout = require('../../utils/layout');
const imagePicker = require('../../utils/image');

Page({
  data: {
    navTop: 60,
    name: '',
    description: '',
    time: '25',
    categories: ['快手', '下饭', '清淡', '汤羹', '主食'],
    categoryIndex: 0,
    image: '',
    uploading: false,
    saving: false
  },

  onLoad() {
    const guard = store.guard();
    if (guard) {
      wx.reLaunch({ url: guard });
      return;
    }
    this.setData({ navTop: layout.navInset() });
  },

  onName(e) {
    this.setData({ name: e.detail.value });
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

  async chooseImage() {
    if (this.data.uploading) return;
    this.setData({ uploading: true });
    try {
      const image = await imagePicker.chooseAndSave();
      const old = this.data.image;
      this.setData({ image });
      if (old) imagePicker.remove(old);
    } catch (e) {
      const message = (e && e.message) || '图片上传失败，请重试';
      if (message.indexOf('取消') < 0) wx.showToast({ title: message, icon: 'none' });
    } finally {
      this.setData({ uploading: false });
    }
  },

  removeImage() {
    imagePicker.remove(this.data.image);
    this.setData({ image: '' });
  },

  onUnload() {
    if (!this._used && this.data.image) imagePicker.remove(this.data.image);
  },

  async submit() {
    if (this.data.saving) return;
    if (this.data.uploading) {
      wx.showToast({ title: '图片正在处理，稍等一下', icon: 'none' });
      return;
    }
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '先给它起个名字吧', icon: 'none' });
      return;
    }
    const time = Math.max(5, Math.min(180, Number(this.data.time) || 25));
    const category = this.data.categories[this.data.categoryIndex] || '下饭';
    this.setData({ saving: true });
    try {
      if (store.isCloud()) {
        await store.cloudAddCustomDish(name, (this.data.description || '').trim(), category, time, this.data.image);
      } else {
        store.addCustomDish(name, (this.data.description || '').trim(), category, time, this.data.image);
      }
    } catch (err) {
      this.setData({ saving: false });
      wx.showToast({ title: (err && err.message) || '保存失败，请重试', icon: 'none' });
      return;
    }
    this._used = true;
    wx.showToast({ title: '已加入你们的菜单', icon: 'none' });
    setTimeout(() => wx.reLaunch({ url: '/pages/home/index?showAll=1' }), 500);
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.reLaunch({ url: '/pages/home/index' });
  }
});
