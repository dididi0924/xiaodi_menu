// TWO. native mini program data. All content is fictional prototype data.
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
  code: 'TWO-8F2K',
  since: '',
  days: 0
};

const CATEGORIES = ['全部', '快手', '下饭', '清淡', '面饭', '甜点'];

const QUICK_NOTES = [
  '今天想早点吃',
  '少放一点辣',
  '辛苦啦，慢慢来',
  '今天有点累，想吃热乎的'
];

const DISHES = [
  {
    id: 'd01', name: '鲜虾溏心蛋拉面', en: 'Shrimp ramen', category: '汤面',
    collections: ['面饭', '暖胃'], tags: ['20 分钟', '一锅出'], time: 20,
    description: '昆布汤底、鲜虾和一颗流心蛋。加班回来，也能很快吃上。',
    chefNote: '他会多煮一颗蛋，因为你喜欢把蛋黄拌进汤里。',
    image: '/assets/menu/d01.jpg', tone: '#E6C6A8'
  },
  {
    id: 'd02', name: '香煎三文鱼', en: 'Pan-seared salmon', category: '西式',
    collections: ['西式', '清淡'], tags: ['25 分钟', '高蛋白'], time: 25,
    description: '外皮煎到微脆，配柠檬黄油汁和烤时蔬。',
    chefNote: '火别太大，皮朝下多等一会儿。',
    image: '/assets/menu/d02.jpg', tone: '#E5B7A7'
  },
  {
    id: 'd03', name: '蒜香黄油虾', en: 'Garlic butter shrimp', category: '下饭',
    collections: ['下饭', '快手'], tags: ['15 分钟', '下饭'], time: 15,
    description: '黄油、蒜末和白葡萄酒，剩下的汤汁要蘸面包。',
    chefNote: '最后挤一点柠檬，味道会更亮。',
    image: '/assets/menu/d03.jpg', tone: '#E9B5A0'
  },
  {
    id: 'd04', name: '香草番茄炖鸡', en: 'Herb tomato chicken', category: '炖煮',
    collections: ['下饭', '炖煮'], tags: ['35 分钟', '一锅出'], time: 35,
    description: '鸡腿炖到软烂，番茄的酸甜都留在汤里。',
    chefNote: '留一点汤汁拌饭，比鸡肉还香。',
    image: '/assets/menu/d04.jpg', tone: '#D9B08C'
  },
  {
    id: 'd05', name: '日式咖喱饭', en: 'Japanese curry', category: '一锅',
    collections: ['面饭', '一锅'], tags: ['30 分钟', '一锅出'], time: 30,
    description: '土豆和胡萝卜炖得糯糯的，配一颗温泉蛋。',
    chefNote: '咖喱块最后放，火关小一点。',
    image: '/assets/menu/d05.jpg', tone: '#D8A76B'
  },
  {
    id: 'd06', name: '烟肉番茄笔管面', en: 'Bacon penne', category: '西式',
    collections: ['西式', '快手'], tags: ['20 分钟', '一锅出'], time: 20,
    description: '烟肉的咸香和番茄的酸甜，一锅就能拌匀。',
    chefNote: '煮面的水别倒完，留一勺收汁。',
    image: '/assets/menu/d06.jpg', tone: '#D88B72'
  },
  {
    id: 'd07', name: '牛油果藜麦沙拉', en: 'Avocado quinoa bowl', category: '轻食',
    collections: ['轻食', '清淡'], tags: ['10 分钟', '无负担'], time: 10,
    description: '牛油果、藜麦和烤南瓜，淋上柠檬油醋汁。',
    chefNote: '牛油果要挑熟一点的，口感才绵。',
    image: '/assets/menu/d07.jpg', tone: '#B8C59D'
  },
  {
    id: 'd08', name: '番茄蔬菜浓汤', en: 'Tomato vegetable soup', category: '汤羹',
    collections: ['汤羹', '清淡'], tags: ['25 分钟', '暖胃'], time: 25,
    description: '番茄先烤再煮，汤会更甜。配一片吐司刚好。',
    chefNote: '下雨天喝这个，整个人都暖了。',
    image: '/assets/menu/d08.jpg', tone: '#D97E5F'
  },
  {
    id: 'd09', name: '抱蛋煎饺', en: 'Egg-wrapped dumplings', category: '面饭',
    collections: ['面饭', '快手'], tags: ['18 分钟', '一锅出'], time: 18,
    description: '底部煎得金黄焦脆，倒入蛋液，撒一把黑芝麻。',
    chefNote: '冷冻饺子不用解冻，直接下锅。',
    image: '/assets/menu/d09.jpg', tone: '#D5B47E'
  },
  {
    id: 'd10', name: '蜂蜜烤鸡翅', en: 'Honey roast wings', category: '烤箱',
    collections: ['下饭', '烤箱'], tags: ['35 分钟', '提前腌'], time: 35,
    description: '蜂蜜和酱油腌一夜，烤到边缘微焦。',
    chefNote: '记得垫烘焙纸，不然刷锅很痛苦。',
    image: '/assets/menu/d10.jpg', tone: '#C78C5E'
  },
  {
    id: 'd11', name: '蓝莓法式吐司', en: 'Blueberry french toast', category: '甜点',
    collections: ['甜点', '早午餐'], tags: ['15 分钟', '甜口'], time: 15,
    description: '吐司吸饱蛋奶液，煎到金黄，配蓝莓和枫糖。',
    chefNote: '周末睡到自然醒，就吃这个。',
    image: '/assets/menu/d11.jpg', tone: '#B99A88'
  },
  {
    id: 'd12', name: '烤时蔬谷物碗', en: 'Roasted veggie bowl', category: '轻食',
    collections: ['轻食', '清淡'], tags: ['20 分钟', '无负担'], time: 20,
    description: '南瓜、甜椒和西兰花，拌上芝麻酱。',
    chefNote: '蔬菜切小块一点，烤得更快。',
    image: '/assets/menu/d12.jpg', tone: '#B9B78F'
  },
  {
    id: 'd13', name: '韩式石锅拌饭', en: 'Bibimbap', category: '面饭',
    collections: ['面饭', '下饭'], tags: ['25 分钟', '一锅出'], time: 25,
    description: '脆脆的锅巴、溏心蛋和一大勺辣酱。',
    chefNote: '石锅要烧到很热，锅巴才会脆。',
    image: '/assets/menu/d13.jpg', tone: '#C9A16E'
  },
  {
    id: 'd14', name: '巧克力熔岩蛋糕', en: 'Chocolate lava cake', category: '甜点',
    collections: ['甜点'], tags: ['25 分钟', '甜的'], time: 25,
    description: '切开有热巧克力流出来。适合两个人分。',
    chefNote: '烤到边缘凝固、中间还晃就可以了。',
    image: '/assets/menu/d14.jpg', tone: '#8F6C5B'
  },
  {
    id: 'd15', name: '鲜虾炒河粉', en: 'Shrimp pad thai', category: '面饭',
    collections: ['面饭', '快手'], tags: ['18 分钟', '锅气'], time: 18,
    description: '大火快炒，河粉带一点焦香，虾仁弹牙。',
    chefNote: '锅一定要够热，动作要快。',
    image: '/assets/menu/d15.jpg', tone: '#D6A06D'
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
