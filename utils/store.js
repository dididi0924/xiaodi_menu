// Local-first data layer for the native page shell.
// Replace the methods here with BFF calls when the real backend is ready.
const D = require('./data');
const imageStore = require('./image');

const KEY = 'two.mini.v2';
const OLD_KEY = 'two.mini.v1';

let state = null;

function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function initialState() {
  return {
    version: 2,
    // Auth + onboarding. A fresh install must go through the login page.
    loggedIn: false,
    onboarded: false,
    partnerJoined: false,
    guideStep: 1,
    // The local prototype keeps the demo persona so all copy stays coherent.
    role: 'eater',
    group: Object.assign({}, D.GROUP, {
      name: '小满 的餐桌',
      code: 'TWO-8F2K',
      days: 0
    }),
    // Clean new-user data: no orders, favorites, notifications or test counts.
    favorites: [],
    customDishes: [],
    dishImages: {},
    cart: [],
    draftMessage: '',
    notify: true,
    orders: [],
    notifications: [],
    orderSeq: 1000,
    recommendSeed: 7,
    preferNotify: true,
    prefs: []
  };
}

function init() {
  if (state) return state;
  let saved = null;
  try {
    saved = wx.getStorageSync(KEY);
    // Drop the old seeded prototype state so existing testers see onboarding.
    if (wx.removeStorageSync) wx.removeStorageSync(OLD_KEY);
  } catch (e) {
    saved = null;
  }
  if (!saved || saved.version !== 2) {
    state = initialState();
    save();
    return state;
  }
  state = Object.assign({}, initialState(), saved, {
    group: Object.assign({}, initialState().group, saved.group || {}),
    favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
    customDishes: Array.isArray(saved.customDishes) ? saved.customDishes : [],
    dishImages: saved.dishImages && typeof saved.dishImages === 'object' ? saved.dishImages : {},
    cart: Array.isArray(saved.cart) ? saved.cart : [],
    orders: Array.isArray(saved.orders) ? saved.orders : [],
    notifications: Array.isArray(saved.notifications) ? saved.notifications : []
  });
  return state;
}

function save() {
  try {
    wx.setStorageSync(KEY, state);
  } catch (e) {
    // Prototype remains usable in memory if storage is full.
  }
}

function get() {
  return init();
}

function reset() {
  state = initialState();
  try {
    if (wx.removeStorageSync) wx.removeStorageSync(OLD_KEY);
  } catch (e) {}
  imageStore.clearSaved();
  save();
  return state;
}

function login() {
  get().loggedIn = true;
  get().onboarded = false;
  get().partnerJoined = false;
  get().guideStep = 1;
  get().group.name = '小满 的餐桌';
  get().group.days = 0;
  save();
  return get();
}

function guard() {
  const s = get();
  if (!s.loggedIn) return '/pages/auth/index';
  if (!s.onboarded) return '/pages/onboarding/index';
  return '';
}

function setGuideStep(step) {
  get().guideStep = Math.max(1, Math.min(3, Number(step) || 1));
  save();
}

function completeOnboarding() {
  get().partnerJoined = true;
  get().onboarded = true;
  get().guideStep = 3;
  get().group.name = D.GROUP.name;
  save();
  return get();
}

function getMember(id) {
  return D.MEMBERS[id] || D.MEMBERS.man;
}

function currentUserId() {
  return get().role === 'cook' ? 'lin' : 'man';
}

function currentUser() {
  return getMember(currentUserId());
}

function partner() {
  return getMember(currentUserId() === 'man' ? 'lin' : 'man');
}

function allDishes() {
  const overrides = get().dishImages || {};
  const presets = D.DISHES.map((dish) => overrides[dish.id] ? Object.assign({}, dish, { image: overrides[dish.id] }) : dish);
  const custom = (get().customDishes || []).map((dish) => overrides[dish.id] ? Object.assign({}, dish, { image: overrides[dish.id] }) : dish);
  return presets.concat(custom);
}

function getDish(id) {
  return allDishes().find((d) => d.id === id) || null;
}

function cartDetailed() {
  return get().cart.map((item) => {
    const dish = getDish(item.dishId);
    return dish ? Object.assign({}, item, { dish }) : null;
  }).filter(Boolean);
}

function cartCount() {
  return cartDetailed().reduce((sum, item) => sum + item.qty, 0);
}

function cartEta() {
  const items = cartDetailed();
  if (!items.length) return 0;
  return Math.max.apply(null, items.map((i) => i.dish.time || 15));
}

function activeOrders() {
  return get().orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled')
    .sort((a, b) => b.createdAt - a.createdAt);
}

function currentOrder() {
  return activeOrders()[0] || null;
}

function orderById(id) {
  return get().orders.find((o) => o.id === id) || null;
}

function isFavorite(id) {
  return get().favorites.indexOf(id) >= 0;
}

function toggleFavorite(id) {
  const index = get().favorites.indexOf(id);
  if (index >= 0) get().favorites.splice(index, 1);
  else get().favorites.push(id);
  save();
  return isFavorite(id);
}

function effectiveOrderCount(dish) {
  // Only real orders count. Never use seeded "点过 N 次" numbers.
  return get().orders.filter((o) =>
    o.status !== 'cancelled' && o.items.some((i) => i.dishId === dish.id)
  ).length;
}

function getFrequent(limit) {
  return allDishes()
    .filter((d) => effectiveOrderCount(d) > 0)
    .sort((a, b) => {
      const diff = effectiveOrderCount(b) - effectiveOrderCount(a);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    })
    .slice(0, limit || 4);
}

function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRecommendations(limit) {
  const frequentIds = getFrequent(4).map((d) => d.id);
  const favoriteDishes = allDishes().filter((d) => isFavorite(d.id));
  const favoriteCollections = new Set();
  favoriteDishes.forEach((d) => (d.collections || []).forEach((c) => favoriteCollections.add(c)));
  const orderedCollections = new Set();
  get().orders.forEach((o) => {
    o.items.forEach((i) => {
      const d = getDish(i.dishId);
      if (d) (d.collections || []).forEach((c) => orderedCollections.add(c));
    });
  });
  const random = seeded((get().recommendSeed || 1) * 7919 + favoriteDishes.length * 31 + get().orders.length);
  const pool = allDishes().filter((d) => frequentIds.indexOf(d.id) < 0);
  const ranked = pool.map((d) => {
    let score = random() * 2;
    score += (d.collections || []).filter((c) => favoriteCollections.has(c)).length * 3;
    score += (d.collections || []).filter((c) => orderedCollections.has(c)).length * 1.7;
    if (isFavorite(d.id)) score += 4;
    score += Math.min(effectiveOrderCount(d), 20) * 0.045;
    return { dish: d, score };
  }).sort((a, b) => b.score - a.score).map((x) => x.dish);
  const picked = ranked.slice(0, limit || 6);
  if (picked.length < (limit || 6)) {
    getFrequent(limit || 6).forEach((d) => {
      if (picked.length < (limit || 6) && picked.indexOf(d) < 0) picked.push(d);
    });
  }
  return picked;
}

function recommendReason() {
  const fav = allDishes().filter((d) => isFavorite(d.id));
  if (fav.length) return '根据你收藏的「' + fav[0].name + '」和最近的口味';
  if (get().orders.length) return '根据你们最近点过的菜';
  return '新餐桌的第一顿，先从这几道开始';
}

function filterDishes(category, query) {
  const q = (query || '').trim().toLowerCase();
  return allDishes().filter((d) => {
    const matchesCategory = !category || category === '全部' ||
      d.category === category || (d.collections || []).indexOf(category) >= 0;
    const haystack = (d.name + ' ' + (d.en || '') + ' ' + d.description + ' ' + (d.tags || []).join(' ') + ' ' + d.category).toLowerCase();
    return matchesCategory && (!q || haystack.indexOf(q) >= 0);
  });
}

function shuffle() {
  get().recommendSeed = (get().recommendSeed || 1) + 1;
  save();
}

function addToCart(id, qty, note) {
  const dish = getDish(id);
  if (!dish) return false;
  const existing = get().cart.find((i) => i.dishId === id);
  if (existing) {
    existing.qty = Math.min(20, existing.qty + (qty || 1));
    if (note) existing.note = note;
  } else {
    get().cart.push({ dishId: id, qty: Math.min(20, qty || 1), note: note || '' });
  }
  save();
  return true;
}

function changeCartQty(id, delta) {
  const item = get().cart.find((i) => i.dishId === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) get().cart = get().cart.filter((i) => i.dishId !== id);
  save();
}

function removeFromCart(id) {
  get().cart = get().cart.filter((i) => i.dishId !== id);
  save();
}

function clearCart() {
  get().cart = [];
  save();
}

function setDraftMessage(message) {
  get().draftMessage = message || '';
  save();
}

function setNotify(value) {
  get().notify = !!value;
  save();
}

function addNotification(n) {
  get().notifications.unshift(Object.assign({
    id: uid('n'),
    userId: 'man',
    type: 'system',
    title: '',
    body: '',
    createdAt: Date.now(),
    read: false,
    icon: 'bell',
    orderId: null
  }, n));
}

function placeOrder(message, notify) {
  const items = cartDetailed();
  if (!items.length) return null;
  const seq = get().orderSeq + 1;
  get().orderSeq = seq;
  const now = Date.now();
  const order = {
    id: 'D-' + seq,
    createdAt: now,
    status: 'pending',
    eaterId: 'man',
    cookId: 'lin',
    message: (message || '').trim(),
    notify: notify !== false,
    items: items.map((item) => ({
      dishId: item.dish.id,
      name: item.dish.name,
      image: item.dish.image,
      tone: item.dish.tone,
      time: item.dish.time,
      qty: item.qty,
      note: item.note || ''
    })),
    totalItems: items.reduce((s, i) => s + i.qty, 0),
    acceptedAt: null,
    cookingAt: null,
    servedAt: null,
    cancelledAt: null
  };
  get().orders.unshift(order);
  addNotification({
    userId: 'lin',
    type: 'order_created',
    title: '小满 发来晚餐订单',
    body: order.totalItems + ' 道菜 · ' + (order.message ? '“' + order.message.slice(0, 28) + (order.message.length > 28 ? '…' : '') + '”' : '没有留言，但应该很期待。'),
    icon: 'bag',
    orderId: order.id
  });
  addNotification({
    userId: 'man',
    type: 'order_created',
    title: '订单已送达',
    body: '已通知林深，等接单就好。',
    icon: 'send',
    orderId: order.id
  });
  get().cart = [];
  get().draftMessage = '';
  save();
  return order;
}

function advanceOrder(id) {
  const order = orderById(id);
  if (!order) return null;
  const now = Date.now();
  let next = null;
  if (order.status === 'pending') { next = 'accepted'; order.acceptedAt = now; }
  else if (order.status === 'accepted') { next = 'cooking'; order.cookingAt = now; }
  else if (order.status === 'cooking') { next = 'served'; order.servedAt = now; }
  if (!next) return null;
  order.status = next;
  if (next === 'accepted') addNotification({ userId: 'man', type: 'order_accepted', title: '林深 接单了', body: '今晚的饭交给他，等他开火。', icon: 'chef', orderId: id });
  if (next === 'cooking') addNotification({ userId: 'man', type: 'order_cooking', title: '厨房里开始忙了', body: '林深 开始做饭了，再等一会儿。', icon: 'flame', orderId: id });
  if (next === 'served') addNotification({ userId: 'man', type: 'order_served', title: '可以吃饭啦', body: '林深 把菜端上桌了。', icon: 'utensils', orderId: id });
  save();
  return order;
}

function nudgeOrder(id) {
  const order = orderById(id);
  if (!order) return false;
  addNotification({
    userId: 'lin',
    type: 'nudge',
    title: order.status === 'cooking' ? '小满 说声辛苦啦' : '小满 轻轻催了一下',
    body: order.status === 'cooking' ? '“慢慢来，不着急。”' : '她说有点饿了。',
    icon: 'bell',
    orderId: id
  });
  save();
  return true;
}

function cancelOrder(id) {
  const order = orderById(id);
  if (!order) return false;
  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  addNotification({ userId: 'lin', type: 'order_cancelled', title: '小满 取消了订单', body: '这单不会继续了。', icon: 'x', orderId: id });
  save();
  return true;
}

function reorder(id) {
  const order = orderById(id);
  if (!order) return 0;
  let added = 0;
  order.items.forEach((item) => {
    if (!getDish(item.dishId)) return;
    addToCart(item.dishId, item.qty, item.note);
    added += item.qty;
  });
  save();
  return added;
}

function unreadCount(userId) {
  const uid = userId || currentUserId();
  return get().notifications.filter((n) => n.userId === uid && !n.read).length;
}

function notificationsForCurrent() {
  return get().notifications.filter((n) => n.userId === currentUserId())
    .sort((a, b) => b.createdAt - a.createdAt);
}

function markAllRead() {
  const uid = currentUserId();
  get().notifications.forEach((n) => { if (n.userId === uid) n.read = true; });
  save();
}

function markRead(id) {
  const n = get().notifications.find((x) => x.id === id);
  if (n) { n.read = true; save(); }
}

function addCustomDish(name, description, category, time, image) {
  const tones = ['#B89070', '#8C9A78', '#C58B76', '#8D7A66', '#B5A06F', '#8E7C91'];
  const dish = {
    id: 'c-' + Date.now().toString(36),
    name: name,
    en: 'House special',
    category: category,
    collections: [category],
    tags: [time + ' 分钟', '自制'],
    time: time,
    description: description || '你们自己的拿手菜，只有这张餐桌知道。',
    chefNote: '这道菜只属于你们的餐桌。',
    image: image || null,
    orderCount: 0,
    tone: tones[get().customDishes.length % tones.length],
    isCustom: true
  };
  get().customDishes.push(dish);
  if (image) get().dishImages[dish.id] = image;
  save();
  return dish;
}

function setDishImage(id, image) {
  const dish = getDish(id);
  if (!dish) return null;
  const oldImage = dish.image;
  if (oldImage && oldImage !== image) imageStore.remove(oldImage);
  if (image) get().dishImages[id] = image;
  else delete get().dishImages[id];
  save();
  return getDish(id);
}

function setRole(role) {
  get().role = role === 'cook' ? 'cook' : 'eater';
  save();
}

function setPrefNotify(value) {
  get().preferNotify = !!value;
  save();
}

function setJoined(value) {
  if (value === false) {
    get().partnerJoined = false;
    get().group.name = '小满 的餐桌';
    save();
    return;
  }
  completeOnboarding();
}

module.exports = {
  init,
  get,
  save,
  reset,
  login,
  guard,
  setGuideStep,
  completeOnboarding,
  getMember,
  currentUser,
  currentUserId,
  partner,
  allDishes,
  getDish,
  cartDetailed,
  cartCount,
  cartEta,
  activeOrders,
  currentOrder,
  orderById,
  isFavorite,
  toggleFavorite,
  effectiveOrderCount,
  getFrequent,
  getRecommendations,
  recommendReason,
  filterDishes,
  shuffle,
  addToCart,
  changeCartQty,
  removeFromCart,
  clearCart,
  setDraftMessage,
  setNotify,
  addNotification,
  placeOrder,
  advanceOrder,
  nudgeOrder,
  cancelOrder,
  reorder,
  unreadCount,
  notificationsForCurrent,
  markAllRead,
  markRead,
  addCustomDish,
  setDishImage,
  setRole,
  setPrefNotify,
  setJoined
};
