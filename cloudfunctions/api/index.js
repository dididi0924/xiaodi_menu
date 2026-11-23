const cloud = require('wx-server-sdk');
const presets = require('./presets');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTIONS = ['users', 'tables', 'members', 'invites', 'custom_dishes', 'dish_overrides', 'orders', 'notifications', 'subscription_grants'];
let collectionsReady = false;

class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const now = () => new Date();
const trim = (value, max) => String(value == null ? '' : value).trim().slice(0, max || 200);
const stamp = (value) => (value instanceof Date ? value.getTime() : value ? new Date(value).getTime() : null);

async function ensureCollections() {
  if (collectionsReady || typeof db.createCollection !== 'function') return;
  for (const name of COLLECTIONS) {
    try { await db.createCollection(name); } catch (e) { /* already exists */ }
  }
  collectionsReady = true;
}

async function first(collection, where) {
  const res = await db.collection(collection).where(where).limit(10).get();
  return (res.data || [])[0] || null;
}

async function userByOpenid(openid) {
  return first('users', { openid });
}

async function memberByOpenid(openid) {
  return first('members', { openid, status: 'active' });
}

async function membersOf(tableId) {
  const res = await db.collection('members').where({ tableId, status: 'active' }).limit(8).get();
  return res.data || [];
}

async function tableById(id) {
  try {
    const res = await db.collection('tables').doc(id).get();
    return res.data || null;
  } catch (e) {
    return null;
  }
}

function publicUser(user) {
  return {
    id: user._id,
    nickname: user.nickname || '微信用户',
    avatar: user.avatarFileId || '/assets/avatars/man.png',
    onboarded: !!user.onboarded
  };
}

function memberView(member, meOpenid) {
  return {
    id: member._id,
    name: member.nickname || '微信用户',
    avatar: member.avatarFileId || '/assets/avatars/man.png',
    role: member.role || 'either',
    isMe: member.openid === meOpenid,
    joinedAt: stamp(member.joinedAt)
  };
}

async function overrideMap(tableId) {
  const res = await db.collection('dish_overrides').where({ tableId }).limit(100).get();
  const map = {};
  for (const row of res.data || []) map[row.dishId] = row.imageFileId;
  return map;
}

async function customDishesOf(tableId) {
  const res = await db.collection('custom_dishes').where({ tableId, isActive: true }).limit(100).get();
  return (res.data || []).map((d) => ({
    id: d._id,
    name: d.name,
    en: 'House special',
    category: d.category || '下饭',
    collections: d.collections || [d.category || '下饭'],
    tags: d.tags || [String(d.prepMinutes || 20) + ' 分钟', '自制'],
    time: d.prepMinutes || 20,
    description: d.description || '你们自己的拿手菜，只有这张餐桌知道。',
    chefNote: '这道菜只属于你们的餐桌。',
    image: d.imageFileId || null,
    tone: d.tone || '#B89070',
    isCustom: true
  }));
}

function snapshotOrder(order, members, overrides, customDishes) {
  const byOpenid = {};
  for (const m of members) byOpenid[m.openid] = m;
  const customById = {};
  for (const d of customDishes) customById[d.id] = d;
  const items = (order.items || []).map((item) => {
    const preset = presets[item.dishId];
    const custom = customById[item.dishId];
    const image = overrides[item.dishId] || (preset ? preset.image : custom ? custom.image : null);
    return {
      dishId: item.dishId,
      name: item.name,
      image,
      tone: item.tone || (preset ? preset.tone : '#B89070'),
      time: item.time || (preset ? preset.time : 20),
      qty: item.qty,
      note: item.note || ''
    };
  });
  return {
    id: order._id,
    orderNo: order.orderNo,
    status: order.status,
    createdAt: stamp(order.createdAt),
    eaterId: 'man',
    cookId: 'lin',
    eaterName: (byOpenid[order.eaterOpenid] || {}).nickname || 'TA',
    cookName: (byOpenid[order.cookOpenid] || {}).nickname || 'TA',
    eaterAvatar: (byOpenid[order.eaterOpenid] || {}).avatarFileId || '/assets/avatars/man.png',
    cookAvatar: (byOpenid[order.cookOpenid] || {}).avatarFileId || '/assets/avatars/lin.png',
    message: order.message || '',
    notify: order.notify !== false,
    items,
    totalItems: items.reduce((sum, i) => sum + i.qty, 0),
    acceptedAt: stamp(order.acceptedAt),
    cookingAt: stamp(order.cookingAt),
    servedAt: stamp(order.servedAt),
    cancelledAt: stamp(order.cancelledAt)
  };
}

async function stateFor(user, meOpenid) {
  const member = await memberByOpenid(meOpenid);
  if (!member) {
    return { user: publicUser(user), table: null, customDishes: [], dishImages: {}, orders: [], notifications: [] };
  }
  const table = await tableById(member.tableId);
  if (!table) throw new AppError('TABLE_NOT_FOUND', '餐桌不存在');
  const members = await membersOf(table._id);
  const customDishes = await customDishesOf(table._id);
  const overrides = await overrideMap(table._id);
  const orderRes = await db.collection('orders').where({ tableId: table._id }).limit(50).get();
  const allOrders = (orderRes.data || []).sort((a, b) => stamp(b.createdAt) - stamp(a.createdAt));
  const orders = allOrders.map((o) => snapshotOrder(o, members, overrides, customDishes));
  const notifRes = await db.collection('notifications').where({ recipientOpenid: meOpenid }).limit(50).get();
  const notifications = (notifRes.data || []).sort((a, b) => stamp(b.createdAt) - stamp(a.createdAt)).map((n) => ({
    id: n._id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: !!n.read,
    createdAt: stamp(n.createdAt),
    orderId: n.orderId || null
  }));
  return {
    user: publicUser(user),
    table: {
      id: table._id,
      name: table.name,
      code: table.inviteCode || '',
      members: members.map((m) => memberView(m, meOpenid)),
      partnerJoined: members.length > 1
    },
    customDishes,
    dishImages: overrides,
    orders,
    notifications
  };
}

async function addNotification(tableId, recipientOpenid, type, title, body, orderId, icon) {
  await db.collection('notifications').add({
    data: {
      tableId,
      recipientOpenid,
      type,
      title,
      body: body || '',
      icon: icon || 'bell',
      orderId: orderId || null,
      read: false,
      createdAt: now()
    }
  });
}

async function bootstrap(openid, payload) {
  let user = await userByOpenid(openid);
  const nickname = trim(payload.nickname, 20) || '微信用户';
  const avatarFileId = trim(payload.avatarFileId, 500);
  if (!user) {
    const created = await db.collection('users').add({
      data: {
        openid,
        nickname,
        avatarFileId,
        onboarded: false,
        createdAt: now(),
        lastSeenAt: now(),
        status: 'active'
      }
    });
    user = await db.collection('users').doc(created._id).get().then((r) => r.data);
  } else {
    const patch = { lastSeenAt: now() };
    if (nickname) patch.nickname = nickname;
    if (avatarFileId) patch.avatarFileId = avatarFileId;
    await db.collection('users').doc(user._id).update({ data: patch });
    user = Object.assign({}, user, patch);
  }
  return stateFor(user, openid);
}

async function createTable(openid, payload) {
  let user = await userByOpenid(openid);
  if (!user) throw new AppError('AUTH_REQUIRED', '请先登录');
  if (await memberByOpenid(openid)) return stateFor(user, openid);
  const name = trim(payload.name, 40) || ((user.nickname || '我') + ' 的餐桌');
  const created = await db.collection('tables').add({
    data: { name, ownerOpenid: openid, inviteCode: '', createdAt: now(), status: 'active' }
  });
  await db.collection('members').add({
    data: {
      tableId: created._id,
      openid,
      nickname: user.nickname || '微信用户',
      avatarFileId: user.avatarFileId || '',
      role: 'eater',
      status: 'active',
      joinedAt: now()
    }
  });
  return stateFor(user, openid);
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tail = '';
  for (let i = 0; i < 4; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return 'TWO-' + tail;
}

async function createInvite(openid) {
  const member = await memberByOpenid(openid);
  if (!member) throw new AppError('NO_TABLE', '还没有餐桌');
  const members = await membersOf(member.tableId);
  if (members.length >= 2) throw new AppError('TABLE_FULL', '这张餐桌已经有两个人了');
  const table = await tableById(member.tableId);
  const code = makeCode();
  await db.collection('tables').doc(table._id).update({ data: { inviteCode: code } });
  await db.collection('invites').add({
    data: { tableId: table._id, code, createdBy: openid, createdAt: now(), used: false }
  });
  return { code, tableName: table.name };
}

async function previewInvite(code) {
  const table = await first('tables', { inviteCode: trim(code, 20) });
  if (!table) throw new AppError('INVITE_NOT_FOUND', '邀请已失效');
  const members = await membersOf(table._id);
  return {
    tableName: table.name,
    members: members.map((m) => ({ name: m.nickname, avatar: m.avatarFileId || '/assets/avatars/man.png' })),
    full: members.length >= 2
  };
}

async function acceptInvite(openid, payload) {
  let user = await userByOpenid(openid);
  if (!user) throw new AppError('AUTH_REQUIRED', '请先登录');
  if (await memberByOpenid(openid)) return stateFor(user, openid);
  const code = trim(payload.code, 20);
  const table = await first('tables', { inviteCode: code });
  if (!table) throw new AppError('INVITE_NOT_FOUND', '邀请已失效');
  const members = await membersOf(table._id);
  if (members.length >= 2) throw new AppError('TABLE_FULL', '这张餐桌已经有两个人了');
  await db.collection('members').add({
    data: {
      tableId: table._id,
      openid,
      nickname: user.nickname || '微信用户',
      avatarFileId: user.avatarFileId || '',
      role: 'cook',
      status: 'active',
      joinedAt: now()
    }
  });
  await db.collection('tables').doc(table._id).update({ data: { inviteCode: '' } });
  await db.collection('users').doc(user._id).update({ data: { onboarded: true } });
  await addNotification(table._id, table.ownerOpenid, 'invite_accepted', 'TA 加入了餐桌', (user.nickname || '对方') + ' 已经加入，可以开始点菜了。', null, 'users');
  return stateFor(Object.assign({}, user, { onboarded: true }), openid);
}

async function createCustomDish(openid, payload) {
  const member = await memberByOpenid(openid);
  if (!member) throw new AppError('NO_TABLE', '还没有餐桌');
  const name = trim(payload.name, 40);
  const prep = Math.max(1, Math.min(240, Number(payload.prepMinutes) || 20));
  if (!name) throw new AppError('INVALID_DISH_NAME', '请填写菜名');
  await db.collection('custom_dishes').add({
    data: {
      tableId: member.tableId,
      createdBy: openid,
      name,
      description: trim(payload.description, 200),
      category: trim(payload.category, 20) || '下饭',
      collections: [trim(payload.category, 20) || '下饭'],
      tags: [prep + ' 分钟', '自制'],
      prepMinutes: prep,
      imageFileId: trim(payload.imageFileId, 500),
      isActive: true,
      createdAt: now()
    }
  });
  const user = await userByOpenid(openid);
  return stateFor(user, openid);
}

async function setDishImage(openid, payload) {
  const member = await memberByOpenid(openid);
  if (!member) throw new AppError('NO_TABLE', '还没有餐桌');
  const dishId = trim(payload.dishId, 80);
  const imageFileId = trim(payload.imageFileId, 500);
  if (!dishId || !imageFileId) throw new AppError('INVALID_IMAGE', '图片信息不完整');
  let custom = null;
  try {
    const doc = await db.collection('custom_dishes').doc(dishId).get();
    custom = doc.data && doc.data.tableId === member.tableId ? doc.data : null;
  } catch (e) { custom = null; }
  if (custom) {
    await db.collection('custom_dishes').doc(dishId).update({ data: { imageFileId } });
  } else {
    const existing = await first('dish_overrides', { tableId: member.tableId, dishId });
    if (existing) await db.collection('dish_overrides').doc(existing._id).update({ data: { imageFileId, updatedAt: now(), updatedBy: openid } });
    else await db.collection('dish_overrides').add({ data: { tableId: member.tableId, dishId, imageFileId, updatedBy: openid, updatedAt: now() } });
  }
  const user = await userByOpenid(openid);
  return stateFor(user, openid);
}

async function placeOrder(openid, payload) {
  const member = await memberByOpenid(openid);
  if (!member) throw new AppError('NO_TABLE', '还没有餐桌');
  if (member.role !== 'eater') throw new AppError('ONLY_EATER_CAN_ORDER', '这张餐桌由点菜的人下单');
  const members = await membersOf(member.tableId);
  const partner = members.find((m) => m.openid !== openid);
  if (!partner) throw new AppError('PARTNER_NOT_JOINED', '等另一半加入后才能下单');
  const clientKey = trim(payload.clientKey, 100);
  if (clientKey) {
    const existing = await first('orders', { tableId: member.tableId, clientKey });
    if (existing) return stateFor(await userByOpenid(openid), openid);
  }
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new AppError('EMPTY_ORDER', '菜单还是空的');
  const overrides = await overrideMap(member.tableId);
  const custom = await customDishesOf(member.tableId);
  const customById = {};
  for (const d of custom) customById[d.id] = d;
  const snapshots = [];
  for (const item of items) {
    const qty = Math.max(1, Math.min(20, Math.trunc(Number(item.qty) || 1)));
    const preset = presets[item.dishId];
    const customDish = customById[item.dishId];
    if (!preset && !customDish) throw new AppError('DISH_NOT_FOUND', '有一道菜已经不在菜单里了');
    const base = preset || customDish;
    snapshots.push({
      dishId: item.dishId,
      name: base.name,
      image: overrides[item.dishId] || base.image || null,
      tone: base.tone || '#B89070',
      time: base.time || base.prepMinutes || 20,
      qty,
      note: trim(item.note, 120)
    });
  }
  const orderNo = 'D-' + String(Date.now()).slice(-6);
  const order = {
    tableId: member.tableId,
    orderNo,
    eaterOpenid: openid,
    cookOpenid: partner.openid,
    items: snapshots,
    message: trim(payload.message, 120),
    notify: payload.notify !== false,
    status: 'pending',
    clientKey,
    createdAt: now(),
    acceptedAt: null,
    cookingAt: null,
    servedAt: null,
    cancelledAt: null
  };
  const created = await db.collection('orders').add({ data: order });
  await addNotification(member.tableId, partner.openid, 'order_created', (member.nickname || 'TA') + ' 发来晚餐订单',
    snapshots.reduce((s, i) => s + i.qty, 0) + ' 道菜' + (order.message ? ' · “' + order.message.slice(0, 28) + '”' : ''), created._id, 'bag');
  await addNotification(member.tableId, openid, 'order_created', '订单已送达', '已通知' + (partner.nickname || '对方') + '，等接单就好。', created._id, 'send');
  return stateFor(await userByOpenid(openid), openid);
}

async function transitionOrder(openid, payload) {
  const member = await memberByOpenid(openid);
  if (!member) throw new AppError('NO_TABLE', '还没有餐桌');
  const orderId = trim(payload.orderId, 80);
  const action = trim(payload.action, 20).toLowerCase();
  let order;
  try { order = (await db.collection('orders').doc(orderId).get()).data; } catch (e) { order = null; }
  if (!order || order.tableId !== member.tableId) throw new AppError('ORDER_NOT_FOUND', '订单不存在');
  const members = await membersOf(member.tableId);
  const other = members.find((m) => m.openid !== openid) || member;
  if (action === 'nudge') {
    if (order.eaterOpenid !== openid) throw new AppError('ONLY_EATER_CAN_NUDGE', '只有点菜的人可以催');
    await addNotification(member.tableId, order.cookOpenid, 'nudge', (member.nickname || 'TA') + ' 轻轻催了一下', 'TA 说有点饿了。', orderId, 'bell');
    return stateFor(await userByOpenid(openid), openid);
  }
  if (['accept', 'cook', 'serve'].includes(action)) {
    if (order.cookOpenid !== openid) throw new AppError('ONLY_COOK', '只有做饭的人可以操作');
    if (action === 'accept' && order.status !== 'pending') throw new AppError('INVALID_TRANSITION', '当前状态不能接单');
    if (action === 'cook' && order.status !== 'accepted') throw new AppError('INVALID_TRANSITION', '当前状态不能开火');
    if (action === 'serve' && order.status !== 'cooking') throw new AppError('INVALID_TRANSITION', '当前状态不能上菜');
    const next = action === 'accept' ? 'accepted' : action === 'cook' ? 'cooking' : 'served';
    const patch = { status: next };
    if (next === 'accepted') patch.acceptedAt = now();
    if (next === 'cooking') patch.cookingAt = now();
    if (next === 'served') patch.servedAt = now();
    await db.collection('orders').doc(orderId).update({ data: patch });
    if (next === 'accepted') await addNotification(member.tableId, order.eaterOpenid, 'order_accepted', (member.nickname || 'TA') + ' 接单了', '今晚的饭交给 TA。', orderId, 'chef');
    if (next === 'cooking') await addNotification(member.tableId, order.eaterOpenid, 'order_cooking', '厨房里开始忙了', (member.nickname || 'TA') + ' 开始做饭了。', orderId, 'flame');
    if (next === 'served') await addNotification(member.tableId, order.eaterOpenid, 'order_served', '可以吃饭啦', (member.nickname || 'TA') + ' 把菜端上桌了。', orderId, 'utensils');
    return stateFor(await userByOpenid(openid), openid);
  }
  if (action === 'cancel') {
    if (!['pending', 'accepted', 'cooking'].includes(order.status)) throw new AppError('INVALID_TRANSITION', '当前订单不能取消');
    await db.collection('orders').doc(orderId).update({ data: { status: 'cancelled', cancelledAt: now() } });
    await addNotification(member.tableId, other.openid, 'order_cancelled', (member.nickname || 'TA') + ' 取消了订单', '这单不会继续了。', orderId, 'x');
    return stateFor(await userByOpenid(openid), openid);
  }
  throw new AppError('INVALID_ACTION', '不支持的操作');
}

async function markRead(openid, payload) {
  const ids = Array.isArray(payload.ids) ? payload.ids : null;
  const collection = db.collection('notifications');
  const query = ids && ids.length ? { _id: db.command.in(ids), recipientOpenid: openid } : { recipientOpenid: openid, read: false };
  await collection.where(query).update({ data: { read: true } });
  return stateFor(await userByOpenid(openid), openid);
}

async function updateProfile(openid, payload) {
  const user = await userByOpenid(openid);
  if (!user) throw new AppError('AUTH_REQUIRED', '请先登录');
  const patch = {};
  if (payload.nickname) patch.nickname = trim(payload.nickname, 20);
  if (payload.avatarFileId) patch.avatarFileId = trim(payload.avatarFileId, 500);
  if (Object.keys(patch).length) await db.collection('users').doc(user._id).update({ data: patch });
  if (patch.nickname) {
    const member = await memberByOpenid(openid);
    if (member) await db.collection('members').doc(member._id).update({ data: { nickname: patch.nickname } });
  }
  return stateFor(await userByOpenid(openid), openid);
}

async function restoreSession(openid) {
  const user = await userByOpenid(openid);
  if (!user) throw new AppError('AUTH_REQUIRED', '请先登录');
  return stateFor(user, openid);
}

async function completeOnboarding(openid) {
  const user = await userByOpenid(openid);
  if (!user) throw new AppError('AUTH_REQUIRED', '请先登录');
  await db.collection('users').doc(user._id).update({ data: { onboarded: true } });
  return stateFor(Object.assign({}, user, { onboarded: true }), openid);
}

async function registerGrant(openid, payload) {
  const templateId = trim(payload.templateId, 100);
  if (!templateId) throw new AppError('INVALID_TEMPLATE', '模板 ID 不能为空');
  await db.collection('subscription_grants').add({
    data: { openid, templateId, status: 'available', createdAt: now(), expiresAt: new Date(Date.now() + 30 * 86400000) }
  });
  return { ok: true };
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const action = trim(event && event.action, 60);
  const payload = (event && event.payload) || {};
  try {
    if (!OPENID) throw new AppError('AUTH_REQUIRED', '无法识别微信用户');
    await ensureCollections();
    let data;
    if (action === 'auth.bootstrap') data = await bootstrap(OPENID, payload);
    else if (action === 'profile.update') data = await updateProfile(OPENID, payload);
    else if (action === 'auth.restore') data = await restoreSession(OPENID);
    else if (!(await userByOpenid(OPENID))) throw new AppError('AUTH_REQUIRED', '请先登录');
    else if (action === 'table.create') data = await createTable(OPENID, payload);
    else if (action === 'invite.create') data = await createInvite(OPENID);
    else if (action === 'invite.preview') data = await previewInvite(payload.code);
    else if (action === 'invite.accept') data = await acceptInvite(OPENID, payload);
    else if (action === 'home.get') data = await stateFor(await userByOpenid(OPENID), OPENID);
    else if (action === 'custom_dish.create') data = await createCustomDish(OPENID, payload);
    else if (action === 'dish.image.set') data = await setDishImage(OPENID, payload);
    else if (action === 'order.place') data = await placeOrder(OPENID, payload);
    else if (action === 'order.transition') data = await transitionOrder(OPENID, payload);
    else if (action === 'notifications.read') data = await markRead(OPENID, payload);
    else if (action === 'onboarding.complete') data = await completeOnboarding(OPENID);
    else if (action === 'subscription.register') data = await registerGrant(OPENID, payload);
    else throw new AppError('UNKNOWN_ACTION', '未知操作');
    return { ok: true, data };
  } catch (error) {
    console.error('[api]', action, error && error.code, error && error.message);
    return { ok: false, error: { code: (error && error.code) || 'INTERNAL', message: (error && error.message) || '服务暂时不可用' } };
  }
};
