const { statusBarHeight, windowInfo, menuButton } = require('../../utils/layout');

Component({
  properties: {
    unread: { type: Number, value: 0 },
    showSearch: { type: Boolean, value: true },
    showBell: { type: Boolean, value: true }
  },
  data: {
    topInset: 54,
    rightInset: 108
  },
  lifetimes: {
    attached() {
      const sys = windowInfo();
      const btn = menuButton();
      const topInset = statusBarHeight() + 10;
      const rightInset = btn && btn.left ? Math.max(90, sys.windowWidth - btn.left + 10) : 108;
      this.setData({ topInset, rightInset });
    }
  },
  methods: {
    onSearch() {
      this.triggerEvent('search');
    },
    onBell() {
      this.triggerEvent('bell');
    }
  }
});
