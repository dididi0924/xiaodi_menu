const D = require('./data');

const STATUS = {
  pending: { label: '等待接单', short: '等待接单', pill: 'pending', step: 0, title: '订单已送达', desc: '等对方接单就好' },
  accepted: { label: '已接单', short: '已接单', pill: 'accepted', step: 1, title: '接单了', desc: '今晚交给 TA' },
  cooking: { label: '正在做饭', short: '正在做饭', pill: 'cooking', step: 2, title: '厨房里正在忙', desc: '再等一会儿就开饭' },
  served: { label: '已上桌', short: '已上桌', pill: 'served', step: 3, title: '可以吃饭啦', desc: '今晚的饭已经上桌' },
  cancelled: { label: '已取消', short: '已取消', pill: 'cancelled', step: -1, title: '订单已取消', desc: '这单没有继续' }
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTime(ts) {
  const d = new Date(ts);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function formatDate(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function formatFullDate(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + ' 分钟前';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + ' 小时前';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + ' 天前';
  return formatDate(ts);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function dishSubTag(dish) {
  const tag = (dish.tags || []).find((t) => t.indexOf('分钟') < 0);
  return tag || dish.category;
}

function coverGradient(tone) {
  return 'linear-gradient(145deg, ' + (tone || '#B89070') + ' 0%, #6F5745 100%)';
}

function decorateDish(dish, favorites) {
  const liked = (favorites || []).indexOf(dish.id) >= 0;
  return Object.assign({}, dish, {
    liked,
    initial: (dish.name || '菜').trim().slice(0, 1),
    coverGradient: coverGradient(dish.tone),
    metaText: dish.time + ' 分钟 · ' + dishSubTag(dish),
    subTag: dishSubTag(dish),
    categoryText: dish.isCustom ? '自制 · ' + dish.category : dish.category,
    heartIcon: liked ? '/assets/icons/heart-tomato.png' : '/assets/icons/heart-white.png',
    heartClass: liked ? 'is-liked' : ''
  });
}

function statusMeta(status) {
  return STATUS[status] || STATUS.pending;
}

function orderActions(order, role) {
  const cook = role === 'cook';
  if (cook) {
    if (order.status === 'pending') return { primary: '接单，今晚我做', icon: '/assets/icons/chef-white.png', action: 'advance' };
    if (order.status === 'accepted') return { primary: '开始做饭', icon: '/assets/icons/flame-white.png', action: 'advance' };
    if (order.status === 'cooking') return { primary: '上菜，通知' + D.MEMBERS[order.eaterId].name, icon: '/assets/icons/utensils-white.png', action: 'advance' };
    return null;
  }
  if (order.status === 'pending') return { primary: '轻轻催一下', icon: '/assets/icons/bell-ink.png', action: 'nudge' };
  if (order.status === 'accepted') return { primary: '再加一道菜', icon: '/assets/icons/plus-ink.png', action: 'add' };
  if (order.status === 'cooking') return { primary: '说声辛苦啦', icon: '/assets/icons/heart-ink.png', action: 'nudge' };
  return null;
}

function decorateOrder(order, role) {
  const meta = statusMeta(order.status);
  const steps = ['已下单', '已接单', '烹饪中', '已上桌'].map((label, i) => ({
    label,
    className: i < meta.step ? 'is-done' : (i === meta.step ? 'is-current' : '')
  }));
  const items = order.items.map((item) => ({
    ...item,
    initial: (item.name || '菜').slice(0, 1),
    coverGradient: coverGradient(item.tone)
  }));
  const cook = role === 'cook';
  const action = orderActions(order, role);
  return {
    ...order,
    meta,
    statusLabel: meta.label,
    statusClass: meta.pill,
    steps,
    count: order.totalItems || order.items.reduce((s, i) => s + i.qty, 0),
    timeText: timeAgo(order.createdAt),
    fullTime: formatFullDate(order.createdAt),
    dateText: formatDate(order.createdAt),
    items,
    action,
    isCook: cook,
    personName: cook ? D.MEMBERS[order.eaterId].name : D.MEMBERS[order.cookId].name,
    personAvatar: cook ? D.MEMBERS[order.eaterId].avatar : D.MEMBERS[order.cookId].avatar,
    personLine: cook
      ? (order.status === 'pending' ? '接单后，' + D.MEMBERS[order.eaterId].name + '会收到通知' : order.status === 'accepted' ? '今晚轮到你开火' : order.status === 'cooking' ? '厨房里正在忙，再等一会儿' : '可以吃饭啦')
      : (order.status === 'pending' ? '已经通知 TA，等 TA 接单' : order.status === 'accepted' ? '今晚交给 TA' : order.status === 'cooking' ? '厨房里正在忙，再等一会儿' : '可以吃饭啦'),
    canCancel: !cook && order.status === 'pending'
  };
}

function decorateHistory(order) {
  const meta = statusMeta(order.status);
  const items = order.items.map((item) => ({
    ...item,
    initial: (item.name || '菜').slice(0, 1),
    coverGradient: coverGradient(item.tone)
  }));
  return {
    ...order,
    meta,
    count: order.totalItems || order.items.reduce((s, i) => s + i.qty, 0),
    dateText: formatDate(order.createdAt),
    statusLabel: meta.label,
    thumbs: items.slice(0, 3),
    moreCount: Math.max(0, items.length - 3),
    items
  };
}

function notificationView(n) {
  return Object.assign({}, n, {
    iconPath: D.NOTIFICATION_ICONS[n.icon] || D.NOTIFICATION_ICONS.bell,
    timeText: timeAgo(n.createdAt)
  });
}

module.exports = {
  STATUS,
  formatTime,
  formatDate,
  formatFullDate,
  timeAgo,
  greeting,
  dishSubTag,
  coverGradient,
  decorateDish,
  statusMeta,
  decorateOrder,
  decorateHistory,
  notificationView
};
