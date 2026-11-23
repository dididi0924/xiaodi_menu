const store = require('../../utils/store');
const layout = require('../../utils/layout');
const D = require('../../utils/data');

Page({
  data: {
    navTop: 60,
    step: 1,
    code: 'TWO-8F2K',
    group: D.GROUP,
    partner: D.MEMBERS.lin,
    categories: ['面饭', '下饭', '清淡', '汤羹', '西式', '甜点'],
    categoryIndex: 0,
    name: '',
    time: '20',
    saving: false,
    addedDishName: '',
    dishCount: 15
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
      partner: D.MEMBERS.lin
    });
    this.refresh();
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

  refresh() {
    const state = store.get();
    const custom = state.customDishes || [];
    this.setData({
      code: state.group.code,
      group: state.group,
      partner: D.MEMBERS.lin,
      dishCount: 15 + custom.length,
      addedDishName: custom.length ? custom[custom.length - 1].name : ''
    });
  },

  setStep(step) {
    store.setGuideStep(step);
    this.setData({ step });
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

  addDish() {
    if (this.data.saving) return;
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '先给它起个名字吧', icon: 'none' });
      return;
    }
    const time = Math.max(5, Math.min(180, Number(this.data.time) || 20));
    const category = this.data.categories[this.data.categoryIndex] || '下饭';
    this.setData({ saving: true });
    store.addCustomDish(name, '第一道属于你们的菜。', category, time);
    this.refresh();
    wx.showToast({ title: '已加入你们的菜单', icon: 'none' });
    setTimeout(() => {
      this.setData({ saving: false });
      this.setStep(2);
    }, 280);
  },

  skipAdd() {
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
      data: 'https://two.example/i/' + this.data.code,
      success: () => wx.showToast({ title: '邀请链接已复制', icon: 'none' })
    });
  },

  simulateJoin() {
    store.completeOnboarding();
    this.refresh();
    this.setData({ step: 3 });
    wx.showToast({ title: '对方已加入（演示）', icon: 'none' });
  },

  finish() {
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
