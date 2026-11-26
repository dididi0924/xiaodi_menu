const store = require('../../utils/store');
const layout = require('../../utils/layout');
const imagePicker = require('../../utils/image');
const D = require('../../utils/data');

Page({
  data: {
    navTop: 60,
    step: 1,
    code: 'K98-8F2K',
    group: D.GROUP,
    partner: D.MEMBERS.lin,
    categories: ['快手', '下饭', '清淡', '汤羹', '主食'],
    categoryIndex: 0,
    name: '',
    time: '20',
    image: '',
    uploading: false,
    saving: false,
    addedDishName: '',
    baseCount: D.DISHES.length,
    dishCount: D.DISHES.length,
    isCloud: false,
    partnerJoined: false
  },

  onLoad() {
    const state = store.get();
    if (!state.loggedIn) {
      wx.reLaunch({ url: '/pages/auth/index' });
      return;
    }
    if (state.onboarded) {
      wx.reLaunch({ url: '/pages/home/index' });
      return;
    }
    this.setData({
      navTop: layout.navInset(),
      step: state.guideStep || 1,
      code: state.group.code,
      group: state.group,
      partner: D.MEMBERS.lin,
      isCloud: store.isCloud()
    });
    this.refresh();
    this.prepareCloud().catch(() => {});
  },

  onShow() {
    const state = store.get();
    if (!state.loggedIn) {
      wx.reLaunch({ url: '/pages/auth/index' });
      return;
    }
    if (state.onboarded) {
      wx.reLaunch({ url: '/pages/home/index' });
      return;
    }
    this.refresh();
  },

  async prepareCloud() {
    if (!store.isCloud()) return;
    await store.cloudEnsureSession();
    this.refresh();
    await this.ensureTable();
  },

  async ensureTable() {
    if (!store.isCloud() || store.get().group.id) return store.get();
    try {
      await store.cloudEnsureSession();
      await store.cloudCreateTable();
      this.refresh();
      return store.get();
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '创建餐桌失败', icon: 'none' });
      throw err;
    }
  },

  async ensureInvite() {
    if (!store.isCloud() || store.get().group.code) return;
    try {
      await this.ensureTable();
      const invite = await store.cloudCreateInvite();
      this.setData({ code: invite.code });
      this.refresh();
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '生成邀请失败', icon: 'none' });
    }
  },

  refresh() {
    const state = store.get();
    const custom = state.customDishes || [];
    this.setData({
      code: state.group.code,
      group: state.group,
      partner: store.getMember('lin'),
      partnerJoined: !!state.partnerJoined,
      dishCount: D.DISHES.length + custom.length,
      addedDishName: custom.length ? custom[custom.length - 1].name : ''
    });
  },

  setStep(step) {
    store.setGuideStep(step);
    this.setData({ step });
    if (step === 2) this.ensureInvite();
    wx.pageScrollTo({ scrollTop: 0, duration: 180 });
  },

  onName(e) {
    this.setData({ name: e.detail.value });
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

  async addDish() {
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
    const time = Math.max(5, Math.min(180, Number(this.data.time) || 20));
    const category = this.data.categories[this.data.categoryIndex] || '下饭';
    this.setData({ saving: true });
    try {
      if (store.isCloud()) {
        await this.ensureTable();
        await store.cloudAddCustomDish(name, '第一道属于你们的菜。', category, time, this.data.image);
      } else {
        store.addCustomDish(name, '第一道属于你们的菜。', category, time, this.data.image);
      }
      this._used = true;
      this.refresh();
      wx.showToast({ title: '已加入你们的菜单', icon: 'none' });
      this.setData({ saving: false });
      this.setStep(2);
    } catch (err) {
      this.setData({ saving: false });
      wx.showToast({ title: (err && err.message) || '加菜失败，请重试', icon: 'none' });
    }
  },

  skipAdd() {
    imagePicker.remove(this.data.image);
    this.setData({ image: '' });
    this.setStep(2);
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.code,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'none' })
    });
  },

  copyLink() {
    wx.setClipboardData({
      data: 'https://koodi98.example/i/' + this.data.code,
      success: () => wx.showToast({ title: '邀请链接已复制', icon: 'none' })
    });
  },

  async simulateJoin() {
    if (store.isCloud()) {
      try {
        await store.cloudCompleteOnboarding();
        this.refresh();
        this.setData({ step: 3 });
      } catch (err) {
        wx.showToast({ title: (err && err.message) || '进入失败', icon: 'none' });
      }
      return;
    }
    store.completeOnboarding();
    this.refresh();
    this.setData({ step: 3 });
    wx.showToast({ title: '对方已加入（演示）', icon: 'none' });
  },

  async finish() {
    if (store.isCloud()) {
      try {
        await store.cloudCompleteOnboarding();
      } catch (err) {
        wx.showToast({ title: (err && err.message) || '进入失败', icon: 'none' });
        return;
      }
    }
    wx.reLaunch({ url: '/pages/home/index' });
  },

  onShareAppMessage() {
    return {
      title: '邀请你加入今晚的餐桌',
      path: '/pages/invite/index?mode=join&code=' + this.data.code,
      imageUrl: '/assets/hero-table.jpg'
    };
  }
});
