# Dear Weather · Cloudflare Worker

给 Dear Weather 加一个云端定时任务：每天拉取她的城市天气，通过 Web Push 把系统通知推到已经订阅的手机上。

Worker 跑在 Cloudflare 上，**不依赖 App 是否打开**。她的手机锁屏、浏览器关掉，通知仍然会到。

## 它做什么

- Cloudflare Cron 每天定时触发
- Worker 请求和风天气：实时、3 天、24 小时、预警、空气
- 套用一套简化的关心规则：预警 / 雨雪 / 低温 / 高温 / 大风 / 空气 / 雾 / 降温
- 通过 Web Push 发送到所有已订阅设备
- 订阅信息存在 Cloudflare KV，只保存推送端点，不保存聊天内容

## 免费额度

- Cloudflare Workers：免费额度每天 10 万次请求，个人每天一次可以忽略
- Cloudflare KV：免费额度每天 10 万次读、1000 次写，个人使用足够
- Web Push：走浏览器厂商的推送服务，不额外收费
- 不需要域名，不需要邮件服务

## 部署

需要 Node 18+ 和 Cloudflare 账号。

```bash
cd worker
npm install
npx wrangler login
```

### 1. 创建 KV

```bash
npx wrangler kv namespace create SUBSCRIPTIONS
```

把输出里的 `id` 填到 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "SUBSCRIPTIONS"
id = "你的 namespace id"
```

### 2. 改城市和发送时间

`wrangler.toml`：

```toml
[vars]
HER_CITY_ID = "101020100"
HER_CITY_NAME = "上海"
HER_TZ = "Asia/Shanghai"

[triggers]
crons = ["30 23 * * *"]
```

`23:30 UTC` = 北京时间 `07:30`。Cron 用的是 UTC。

城市 ID 可以在和风天气的城市搜索里查，或者直接用现在 PWA 里设置的城市 ID。

### 3. 配置 Secrets

本地开发用的密钥已经在 `worker/.dev.vars` 里（这个文件不会提交）。线上需要把这些值写进 Cloudflare：

```bash
npx wrangler secret put QWEATHER_API_KEY
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT
npx wrangler secret put PUSH_TOKEN
```

值在 `worker/.dev.vars`：

```dotenv
QWEATHER_API_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:你的邮箱
PUSH_TOKEN=一串随机口令
```

`PUSH_TOKEN` 是订阅时用的访问口令，不需要高强度，但不要公开。

### 4. 部署

```bash
npx wrangler deploy
```

会得到一个地址，类似：

```text
https://dear-weather-push.<你的子域>.workers.dev
```

### 5. 在手机上开启

可以直接用一键配置链接，省得在手机上输入 Worker 地址和口令：

```text
https://yhx-yhx.github.io/dear-weather/?push=<URL编码后的Worker地址>&token=<PUSH_TOKEN>
```

打开后会自动填入配置并跳到「设置 → 通知」，点「开启通知」即可。

也可以手动：

1. 用她的手机打开 <https://yhx-yhx.github.io/dear-weather/>
2. 浏览器菜单 → 添加到主屏幕
3. 从主屏幕打开 Dear Weather
4. 设置 → 通知
5. 填 Worker 地址和 `PUSH_TOKEN`
6. 点「开启通知」，允许系统通知
7. 点「发送测试通知」，确认能收到

iPhone 需要 iOS 16.4+，并且必须从主屏幕打开，Safari 标签页里不能订阅 Web Push。

Android Chrome 直接安装/添加到主屏幕即可。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/config` | 返回 VAPID 公钥和城市名 |
| GET | `/health` | 检查 KV / VAPID 配置 |
| POST | `/subscribe` | 保存订阅，需要 `token` |
| POST | `/unsubscribe` | 删除订阅，需要 `token` |
| POST | `/test` | 给所有订阅设备发测试通知，需要 `token` |
| Cron | `scheduled` | 每天拉天气并推送 |

`/subscribe` 的请求体：

```json
{
  "token": "PUSH_TOKEN",
  "subscription": {
    "endpoint": "https://...",
    "expirationTime": null,
    "keys": { "auth": "...", "p256dh": "..." }
  }
}
```

## 本地调试

```bash
cd worker
npx wrangler dev
```

默认在 <http://localhost:8788>。可以先用 `curl` 检查：

```bash
curl http://localhost:8788/health
curl http://localhost:8788/config
```

本地调试不会触发 Cron。要测推送，先在有 HTTPS 的环境（线上 Pages）订阅，再调用 `/test`。

## 注意

- 不要提交 `worker/.dev.vars`
- `PUSH_TOKEN`、VAPID 私钥、和风 key 都放在 Cloudflare Secrets
- 设备取消订阅或推送服务返回 404/410 时，Worker 会自动删除对应 KV 记录
- 现在是单城市、单套阈值；如果要跟随 PWA 里的设置，需要再加一个 KV 配置同步接口
- 推送内容是文字，不是分享图
