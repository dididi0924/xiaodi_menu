// Koodi·两人餐桌 native mini program data. All content is fictional prototype data.
const MEMBERS = {
  man: {
    id: 'man',
    name: '小满',
    roleLabel: '点菜人',
    avatar: '/assets/avatars/man.png',
    initial: '满',
    color: '#DCE4D2'
  },
  lin: {
    id: 'lin',
    name: '林深',
    roleLabel: '做饭人',
    avatar: '/assets/avatars/lin.png',
    initial: '林',
    color: '#F0D9C4'
  }
};

const GROUP = {
  id: 'table_two',
  name: '林深 & 小满',
  code: 'KOODI-8F2K',
  since: '',
  days: 0
};

const CATEGORIES = ['全部', '快手', '下饭', '清淡', '汤羹', '主食'];

const QUICK_NOTES = [
  '今天想早点吃',
  '少放一点辣',
  '辛苦啦，慢慢来',
  '今天有点累，想吃热乎的'
];

const DISHES = [
  {
    id: 'd01', name: '煎牛排', en: 'Pan-seared steak', category: '西式',
    collections: ['下饭', '硬菜'], tags: ['15 分钟', '高蛋白'], time: 15,
    description: '牛排煎到边缘焦香，切开还是粉嫩。',
    chefNote: '锅烧到冒烟再下牛排，出锅静置两分钟。',
    image: '/assets/menu/d01.jpg', tone: '#B9775C'
  },
  {
    id: 'd02', name: '番茄炒蛋', en: 'Tomato scrambled eggs', category: '家常',
    collections: ['快手', '下饭'], tags: ['10 分钟', '下饭'], time: 10,
    description: '番茄炒出汁，鸡蛋还是嫩的。',
    chefNote: '鸡蛋先盛出来，最后再回锅翻两下。',
    image: '/assets/menu/d02.jpg', tone: '#E09A72'
  },
  {
    id: 'd03', name: '娃娃菜豆腐汤', en: 'Napa cabbage tofu soup', category: '汤羹',
    collections: ['汤羹', '清淡'], tags: ['20 分钟', '暖胃'], time: 20,
    description: '娃娃菜和嫩豆腐煮一锅，汤清甜。',
    chefNote: '水开后转小火，豆腐才不容易碎。',
    image: '/assets/menu/d03.jpg', tone: '#D8C9A8'
  },
  {
    id: 'd04', name: '西兰花炒鸡胸肉', en: 'Broccoli chicken', category: '快手',
    collections: ['快手', '清淡'], tags: ['15 分钟', '高蛋白'], time: 15,
    description: '鸡胸肉切薄片，和西兰花一起快炒。',
    chefNote: '鸡胸肉抓一点淀粉，会更嫩。',
    image: '/assets/menu/d04.jpg', tone: '#9EAE7E'
  },
  {
    id: 'd05', name: '清蒸黄鱼', en: 'Steamed yellow croaker', category: '海鲜',
    collections: ['清淡', '海鲜'], tags: ['25 分钟', '清蒸'], time: 25,
    description: '黄鱼蒸到刚熟，淋一勺热油和蒸鱼豉油。',
    chefNote: '水开后再上锅，八分钟就够。',
    image: '/assets/menu/d05.jpg', tone: '#C7B18E'
  },
  {
    id: 'd06', name: '白灼鱿鱼', en: 'Poached squid', category: '海鲜',
    collections: ['快手', '海鲜'], tags: ['10 分钟', '鲜甜'], time: 10,
    description: '鱿鱼焯到卷起，蘸一点酱油和芥末。',
    chefNote: '水开后下锅，二十秒就捞。',
    image: '/assets/menu/d06.jpg', tone: '#BFA58C'
  },
  {
    id: 'd07', name: '烤鸡', en: 'Roast chicken', category: '烤箱',
    collections: ['下饭', '烤箱'], tags: ['50 分钟', '烤箱'], time: 50,
    description: '整鸡烤到皮脆肉嫩，两个人分一只。',
    chefNote: '提前一晚腌，皮朝上烤。',
    image: '/assets/menu/d07.jpg', tone: '#C08052'
  },
  {
    id: 'd08', name: '炒番薯叶', en: 'Stir-fried sweet potato leaves', category: '快手',
    collections: ['快手', '清淡'], tags: ['10 分钟', '清炒'], time: 10,
    description: '蒜末爆香，番薯叶大火快炒。',
    chefNote: '叶子塌下去就出锅，别炒太久。',
    image: '/assets/menu/d08.jpg', tone: '#6F7F4E'
  },
  {
    id: 'd09', name: '盐水牛肉', en: 'Salted beef', category: '凉菜',
    collections: ['下饭', '凉菜'], tags: ['40 分钟', '凉菜'], time: 40,
    description: '牛肉煮到入味，放凉切片。',
    chefNote: '煮好泡在汤里一夜，切的时候更紧实。',
    image: '/assets/menu/d09.jpg', tone: '#A56F5C'
  },
  {
    id: 'd10', name: '白斩鸡', en: 'White cut chicken', category: '凉菜',
    collections: ['下饭', '凉菜'], tags: ['35 分钟', '凉菜'], time: 35,
    description: '整鸡浸熟，皮黄肉白，蘸姜葱油。',
    chefNote: '关火后焖十分钟，肉才嫩。',
    image: '/assets/menu/d10.jpg', tone: '#D6B27A'
  },
  {
    id: 'd11', name: '筋头巴脑', en: 'Beef tendon stew', category: '炖煮',
    collections: ['下饭', '炖煮'], tags: ['90 分钟', '炖煮'], time: 90,
    description: '筋头巴脑炖到软糯，汤汁拌饭。',
    chefNote: '小火慢炖，别急着收汁。',
    image: '/assets/menu/d11.jpg', tone: '#8F6A4F'
  },
  {
    id: 'd12', name: '米糕', en: 'Rice cake', category: '主食',
    collections: ['主食', '甜口'], tags: ['30 分钟', '主食'], time: 30,
    description: '米香软糯，切片煎到两面金黄。',
    chefNote: '冷透了再切，不容易粘刀。',
    image: '/assets/menu/d12.jpg', tone: '#B99B76'
  },
  {
    id: 'd13', name: '海鲜面', en: 'Seafood noodles', category: '面饭',
    collections: ['主食', '面饭'], tags: ['20 分钟', '一锅出'], time: 20,
    description: '虾、鱿鱼和面条煮一锅，汤鲜。',
    chefNote: '海鲜最后放，煮久会老。',
    image: '/assets/menu/d13.jpg', tone: '#C98C68'
  }
];

const NOTIFICATION_ICONS = {
  chef: '/assets/icons/chef-ink.png',
  clock: '/assets/icons/clock-ink.png',
  heart: '/assets/icons/heart-tomato.png',
  bag: '/assets/icons/bag-ink.png',
  send: '/assets/icons/send-ink.png',
  flame: '/assets/icons/flame-tomato.png',
  utensils: '/assets/icons/utensils-ink.png',
  bell: '/assets/icons/bell-ink.png',
  x: '/assets/icons/x-ink.png'
};

module.exports = {
  MEMBERS,
  GROUP,
  CATEGORIES,
  QUICK_NOTES,
  DISHES,
  NOTIFICATION_ICONS
};
