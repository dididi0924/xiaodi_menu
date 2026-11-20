const store = require('../../utils/store');
const view = require('../../utils/view');
const D = require('../../utils/data');

Page({
  data: {
    role: 'eater',
    isCook: false,
    greeting: '晚上好',
    currentUser: {},
    group: D.GROUP,
    headline: '今晚，想吃点什么？',
    subline: '',
    searchOpen: false,
    searchQuery: '',
    searchFocus: false,
    categories: D.CATEGORIES,
    category: '全部',
    showAll: false,
    showFrequent: true,
    frequent: [],
    dishes: [],
    sectionKicker: 'PICKED FOR YOU',
    sectionTitle: '猜你喜欢',
    sectionReason: '',
    sectionCount: 0,
    showCustomTile: false,
    showAllButton: true,
    showCustomLink: true,
    empty: false,
    allCount: 15,
    activeOrder: null,
    heroKicker: 'TONIGHT’S TABLE',
    heroTitle: '',
    heroSub: '',
    heroAvatars: [],
    heroClass: '',
    cartCount: 0,
    cartEta: 0,
    cartVisible: false,
    unread: 0,
    orderDot: false
  },

  onLoad(options) {
    if (options && options.search === '1') {
      this.setData({ searchOpen: true, searchFocus: true });
    }
    if (options && options.showAll === '1') {
      this.setData({ showAll: true });
    }
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = store.get();
    const role = state.role;
    const isCook = role === 'cook';
    const currentUser = store.currentUser();
    const active = store.currentOrder();
    const activeView = active ? view.decorateOrder(active, role) : null;
    const cartCount = store.cartCount();
    const cartEta = store.cartEta();
    const unread = store.unreadCount();

    let heroAvatars = [D.MEMBERS.lin, D.MEMBERS.man];
    let heroKicker = 'TONIGHT’S TABLE';
    let heroTitle;
    let heroSub;
    if (active) {
      heroAvatars = [D.MEMBERS[active.eaterId], D.MEMBERS[active.cookId]];
      heroKicker = isCook ? 'NEW ORDER' : 'TONIGHT’S TABLE';
      if (isCook) {
        heroTitle = D.MEMBERS[active.eaterId].name + ' 发来晚餐订单';
        heroSub = active.totalItems + ' 道菜 · ' + activeView.meta.label + (active.message ? ' · “' + active.message.slice(0, 16) + (active.message.length > 16 ? '…' : '') + '”' : '');
      } else {
        heroTitle = active.status === 'pending' ? '订单已送达' : active.status === 'accepted' ? '林深接单了' : '厨房里正在忙';
        heroSub = active.totalItems + ' 道菜 · ' + activeView.meta.label + (active.message ? ' · “' + active.message.slice(0, 16) + (active.message.length > 16 ? '…' : '') + '”' : '');
      }
    } else if (isCook) {
      heroTitle = '小满 还没有点菜';
      heroSub = '去菜单看看，或者等她发来今晚的订单。';
    } else {
      heroTitle = '林深 18:30 后在家';
      heroSub = '已经连续下厨 3 天 · 点好菜，他会收到通知。';
    }

    const category = this.data.category;
    const searching = this.data.searchOpen;
    const query = (this.data.searchQuery || '').trim();
    const showAll = this.data.showAll;
    let dishes;
    let sectionKicker = 'PICKED FOR YOU';
    let sectionTitle = '猜你喜欢';
    let sectionReason = store.recommendReason();
    let showFrequent = !searching && category === '全部' && !showAll;
    let showCustomTile = !searching && (showAll || category !== '全部');
    let showAllButton = !searching && category === '全部' && !showAll;
    let showCustomLink = !searching;

    if (searching) {
      dishes = query ? store.filterDishes('全部', query) : store.allDishes();
      sectionKicker = 'SEARCH';
      sectionTitle = query ? '“' + query + '”' : '搜索菜单';
      sectionReason = query ? '找到 ' + dishes.length + ' 道菜' : '输入菜名、口味或食材';
      showFrequent = false;
      showCustomTile = false;
      showAllButton = false;
      showCustomLink = false;
    } else if (category !== '全部') {
      dishes = store.filterDishes(category, '');
      sectionKicker = 'BROWSE';
      sectionTitle = category + '菜单';
      sectionReason = '共 ' + dishes.length + ' 道，挑一道今晚的';
      showFrequent = false;
      showCustomTile = true;
      showAllButton = false;
    } else if (showAll) {
      dishes = store.allDishes();
      sectionKicker = 'ALL DISHES';
      sectionTitle = '全部菜单';
      sectionReason = '15 道家常菜，加上你们自己的拿手菜';
      showFrequent = false;
      showCustomTile = true;
      showAllButton = false;
    } else {
      dishes = store.getRecommendations(6);
    }

    const decorated = dishes.map((dish) => view.decorateDish(dish, state.favorites));
    const frequent = store.getFrequent(4).map((dish) => {
      const d = view.decorateDish(dish, state.favorites);
      d.count = store.effectiveOrderCount(dish);
      return d;
    });

    this.setData({
      role,
      isCook,
      greeting: view.greeting(),
      currentUser,
      group: state.group,
      headline: isCook ? '今晚，想做点什么？' : '今晚，想吃点什么？',
      subline: isCook ? '小满点好菜，你回家做。订单会直接送到这里。' : '林深 18:30 后在家，点好菜，他会收到通知。',
      category,
      showAll,
      showFrequent,
      frequent,
      dishes: decorated,
      sectionKicker,
      sectionTitle,
      sectionReason,
      sectionCount: dishes.length,
      showCustomTile,
      showAllButton,
      showCustomLink,
      empty: decorated.length === 0,
      allCount: store.allDishes().length,
      activeOrder: activeView,
      heroKicker,
      heroTitle,
      heroSub,
      heroAvatars,
      heroClass: active ? 'hero-card--order' : '',
      cartCount,
      cartEta,
      cartVisible: !isCook && cartCount > 0,
      unread,
      orderDot: !!active
    });
  },

  onTopSearch() {
    const open = !this.data.searchOpen;
    this.setData({ searchOpen: open, searchFocus: open, searchQuery: open ? this.data.searchQuery : '' }, () => this.refresh());
    if (open) {
      wx.pageScrollTo({ scrollTop: 0, duration: 200 });
    }
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value }, () => this.refresh());
  },

  clearSearch() {
    this.setData({ searchQuery: '', searchFocus: true }, () => this.refresh());
  },

  closeSearch() {
    this.setData({ searchOpen: false, searchQuery: '', searchFocus: false }, () => this.refresh());
  },

  setCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ category, showAll: false }, () => this.refresh());
  },

  showAllDishes() {
    this.setData({ showAll: true, category: '全部', searchOpen: false, searchQuery: '' }, () => this.refresh());
    wx.pageScrollTo({ selector: '#menuSection', duration: 260 });
  },

  shuffleRecommendations() {
    store.shuffle();
    this.refresh();
    wx.showToast({ title: '换了一批今晚的建议', icon: 'none' });
  },

  openDish(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/dish/index?id=' + id });
  },

  quickAdd(e) {
    if (this.data.isCook) {
      wx.showToast({ title: '切回小满视角再加菜', icon: 'none' });
      return;
    }
    const id = e.currentTarget.dataset.id;
    store.addToCart(id, 1, '');
    this.refresh();
    wx.showToast({ title: '已加入今晚菜单', icon: 'none' });
  },

  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const liked = store.toggleFavorite(id);
    this.refresh();
    wx.showToast({ title: liked ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  onHeroTap() {
    if (this.data.activeOrder) {
      wx.reLaunch({ url: '/pages/orders/index' });
      return;
    }
    wx.pageScrollTo({ selector: '#menuSection', duration: 280 });
  },

  goMe() {
    wx.reLaunch({ url: '/pages/me/index' });
  },

  openCart() {
    if (this.data.isCook) {
      wx.showToast({ title: '切换到小满视角才能点菜', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/cart/index' });
  },

  openCustom() {
    wx.navigateTo({ url: '/pages/custom/index' });
  },

  openNotifications() {
    wx.navigateTo({ url: '/pages/notifications/index' });
  },

  onBell() {
    this.openNotifications();
  },

  onPullDownRefresh() {
    this.refresh();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage() {
    return {
      title: '今晚吃什么？来 TWO. 点菜',
      path: '/pages/home/index'
    };
  }
});
