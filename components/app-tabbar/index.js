Component({
  properties: {
    active: { type: String, value: 'home' },
    role: { type: String, value: 'eater' },
    orderDot: { type: Boolean, value: false }
  },
  data: {
    items: []
  },
  observers: {
    'active, role, orderDot': function () {
      this.buildItems();
    }
  },
  lifetimes: {
    attached() {
      this.buildItems();
    }
  },
  methods: {
    buildItems() {
      const cook = this.data.role === 'cook';
      const items = [
        {
          id: 'home',
          label: cook ? '菜单' : '点菜',
          icon: cook ? '/assets/icons/utensils-muted.png' : '/assets/icons/home-muted.png',
          activeIcon: cook ? '/assets/icons/utensils-ink.png' : '/assets/icons/home-ink.png',
          url: '/pages/home/index'
        },
        {
          id: 'orders',
          label: cook ? '厨房' : '订单',
          icon: cook ? '/assets/icons/chef-muted.png' : '/assets/icons/receipt-muted.png',
          activeIcon: cook ? '/assets/icons/chef-ink.png' : '/assets/icons/receipt-ink.png',
          url: '/pages/orders/index'
        },
        {
          id: 'me',
          label: '我们',
          icon: '/assets/icons/users-muted.png',
          activeIcon: '/assets/icons/users-ink.png',
          url: '/pages/me/index'
        }
      ];
      this.setData({ items });
    },
    go(e) {
      const id = e.currentTarget.dataset.id;
      const item = this.data.items.find((x) => x.id === id);
      if (!item || item.id === this.data.active) return;
      wx.reLaunch({ url: item.url });
    }
  }
});
