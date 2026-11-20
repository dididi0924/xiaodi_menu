# TWO. 原生微信小程序页面壳

这是把 H5 高保真原型迁移到 **原生 WXML / WXSS / JS** 的小程序页面壳。现在可以直接用微信开发者工具导入这个目录。

```text
miniprogram/
├─ app.json / app.js / app.wxss
├─ project.config.json
├─ components/
│  ├─ app-topbar/      # 品牌栏 + 搜索 / 通知
│  └─ app-tabbar/      # 点菜 / 订单 / 我们，支持做饭人角色
├─ pages/
│  ├─ home/            # 首页、常点、猜你喜欢、搜索、分类
│  ├─ dish/            # 菜品详情、份数、口味备注
│  ├─ cart/            # 今晚菜单、留言、通知开关、下单
│  ├─ success/         # 订单小票、送达状态、切换做饭人
│  ├─ orders/          # 订单 / 厨房、状态机、历史、再来一单
│  ├─ me/              # 双人资料、邀请、角色切换、通知设置
│  ├─ invite/          # 邀请卡、二维码、加入落地页
│  ├─ notifications/   # 应用内通知列表
│  └─ custom/          # 加一道自定义菜
└─ utils/
   ├─ data.js          # 15 道预设菜、成员、种子订单 / 通知
   ├─ store.js         # 本地数据层，可替换为 BFF
   ├─ view.js          # 展示层格式化
   └─ layout.js        # 自定义导航栏 / 胶囊避让
```

---

## 直接运行

1. 打开微信开发者工具。
2. 导入 `miniprogram/` 目录。
3. AppID 可以先用 `touristappid` 预览；要测试分享、真机和订阅消息，替换 `project.config.json` 里的 `appid`。
4. 不需要 npm 构建，原生页面直接编译。

> 当前数据存在 `wx.setStorageSync`，是本地原型数据；刷新/重开小程序后保留，点「我们 → 重置演示数据」可以清空。

---

## 已实现

- 自定义导航栏：品牌栏、搜索、通知都避开了微信右上角胶囊。
- 首页：常点横向卡片、分类筛选、猜你喜欢、搜索、查看全部。
- 15 道预设菜 + 自定义菜。
- 菜品详情：收藏、份数、口味备注、主厨备注。
- 购物袋：多菜、数量、移除、指定做饭人、120 字留言、快捷留言、通知开关。
- 下单成功页：订单小票、留言、通知状态、切换做饭人视角。
- 订单 / 厨房：待接单 → 已接单 → 烹饪中 → 已上桌；催一下、取消、历史订单、再来一单。
- 通知：下单、接单、开火、上菜、催一下；未读点、全部已读、跳转订单。
- 邀请码、二维码、复制链接、微信原生分享、邀请落地页。
- 双视角（小满 / 林深），正式版按微信登录身份固定。
- 本地演示数据重置。

---

## 与生产后端的接入点

现在页面只依赖 `utils/store.js`。接后端时，建议逐页替换：

| 页面 | 现在 | 上线后 |
| --- | --- | --- |
| 首页 | `store.getRecommendations` / `getFrequent` | `GET /tables/:id/home` |
| 菜详情 | `store.getDish` | `GET /dishes/:id` |
| 下单 | `store.placeOrder` | `POST /tables/:id/orders` + `Idempotency-Key` |
| 订单 | `store.advanceOrder` | `POST /orders/:id/transitions` |
| 通知 | `store.notificationsForCurrent` | `GET /notifications` |
| 邀请 | 静态 code / QR | `POST /tables/:id/invites` |
| 自定义菜 | `store.addCustomDish` | `POST /tables/:id/dishes` + COS 上传 |
| 登录 | 固定本地角色 | `wx.login` → BFF `code2Session` → JWT |

API 细节见 [../docs/api.md](../docs/api.md)，数据库见 [../db/README.md](../db/README.md)。

---

## 说明与边界

- 二维码是静态占位图，指向 `https://two.example/i/TWO-8F2K`；正式版由服务端生成邀请 token / 短链。
- 分享、订阅消息、真机通知需要真实 AppID 和合法域名。
- 页面中的「切换视角」是原型演示；正式版角色来自登录身份，不应该允许客户端任意切换。
- 没有接真实登录、数据库、微信支付或服务通知；这些在 `docs/` 里有完整设计。
- 自定义菜图片暂用文字封面，正式版接 COS 上传与内容审核。
- 组件、WXML、WXSS 已通过 `miniprogram-compiler` 编译；页面逻辑用 Node 模拟 `wx` / `Page` 跑通核心闭环。

## 本地验证

```bash
node scripts/test-mini.js        # 原生页面逻辑：首页 → 下单 → 接单 → 上菜 → 通知 → 邀请
node scripts/preview-mini.js     # 用真实 WXML/WXSS 渲染 430px 预览图到 shots/mini/
```

预览图在 [../shots/mini/](../shots/mini/)，其中 `home.png`、`cart.png`、`orders.png`、`invite.png`、`success.png` 最值得先看。
