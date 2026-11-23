# TWO. CloudBase backend

## Deploy

1. In WeChat DevTools, open this project and enable 云开发 with env `cloud1-d1g5c1dfgd99f3986`.
2. Right-click `cloudfunctions/api` → **上传并部署：云端安装依赖**.
3. In 云开发 → 数据库, create these collections (or let the first `api` call create them):

```text
users
tables
members
invites
custom_dishes
dish_overrides
orders
notifications
subscription_grants
```

4. Set every collection permission to **仅管理员可读写** (all access goes through the cloud function).
5. Set the `api` cloud function timeout to **20s**.
6. Create these indexes in the console:

```text
users:            openid (unique)
members:          openid + status, tableId + status
tables:           inviteCode
custom_dishes:    tableId + isActive
dish_overrides:   tableId + dishId
orders:           tableId + clientKey, tableId + createdAt
notifications:    recipientOpenid + read
```

## Client config

`miniprogram/utils/cloud.js` contains the environment ID. It should match the DevTools environment.

The mini program never receives `AppSecret`. The cloud function uses `cloud.getWXContext().OPENID`.

## Actions

```text
auth.bootstrap
profile.update
table.create
invite.create
invite.preview
invite.accept
home.get
custom_dish.create
dish.image.set
order.place
order.transition
notifications.read
subscription.register
```

The cloud function is the only writer. It validates membership, table capacity, order transitions and idempotency keys.
