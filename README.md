# Dear Weather

> 把今天的天气，替我告诉你。

一个纯静态的双城天气页。先看她那边，再看你这边；她那边下雨、降温、低于 10℃、或者你们温差很大时，页面会替你说一句克制、不尴尬的关心。

- 线上地址：<https://yhx-yhx.github.io/dear-weather/>
- 技术栈：Vue 3 + Vite，没有后端，没有数据库
- 数据：和风天气（天气 / 预警 / 空气 / 生活指数）+ 天地图（双城地图）
- 所有城市、短句、信件只存在浏览器 `localStorage`，不会上传

---

## 它做什么

- **首次打开**：定位或手动搜索「我」和「她」的城市，不预置示例城市。
- **双城天气**：她的城市卡在上，你的在下；两座城市之间是一张低饱和天地图，标出光点、距离和温差。
- **关心引擎**：根据她那边的实时天气、今日/明日预报、预警、空气质量和两地温差，生成一张「今日关心」卡。
- **写给她的信**：提前写好信，设定触发条件（低于多少度、下雨、下雪、两地温差、某个日期），条件满足才拆得开。
- **关心卡分享**：把当前关心生成一张 1080 × 1440 的图片，带二维码，可保存或走系统分享。
- **可安装 PWA**：添加到主屏幕，断网也能打开（天气会显示上次缓存）。
- **可选系统通知**：部署 `worker/` 后，Cloudflare Worker 会在云端定时检查她的天气，通过 Web Push 发到她的手机；App 关着也能收到。需要她安装 PWA 并授权通知。
- **克制的外观**：浅紫 / 樱粉 / 雾蓝渐变、玻璃卡片、手绘 SVG 天气图标、轻动效。可在设置里切换主题或跟随天气。

## 本地运行

需要 Node 18+。

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

打开 <http://localhost:7275>。

### 配置 API Key

复制 `.env.example` 为 `.env.local`，填入：

```dotenv
VITE_QWEATHER_API_KEY=你的和风天气key
VITE_QWEATHER_API_HOST=devapi.qweather.com
VITE_TDT_MAP_KEY=你的天地图key
```

- 和风天气：<https://dev.qweather.com/>，免费订阅即可。老 key 一般用 `devapi.qweather.com`；新 key 请填控制台里的专属 API Host。
- 天地图：<https://console.tianditu.gov.cn/>，申请「浏览器端」key。
- `.env.local` 已在 `.gitignore` 里，不会被提交。
- 也可以在页面「设置 → 关于 → API 设置」里临时覆盖 key，只保存在本机。

没有天地图 key 时，地图会自动降级成一张手绘的双城连线卡，不影响天气功能。

## 部署到 GitHub Pages

仓库名按 `dear-weather` 处理，线上地址是 `https://<用户名>.github.io/dear-weather/`。

1. 在 GitHub 新建仓库 `dear-weather`（不要勾选初始化 README）。
2. 推送代码（见下方「首次推送」）。
3. 仓库 **Settings → Secrets and variables → Actions** 添加：
   - `QWEATHER_API_KEY`
   - `QWEATHER_API_HOST`（可留空，默认 `devapi.qweather.com`）
   - `TDT_MAP_KEY`
4. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
5. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布。

> Key 在构建时注入前端产物。纯静态页面无法真正隐藏 key，请使用免费额度、按域名限制，并定期轮换。

### 首次推送

```bash
git init
git add .
git commit -m "feat: Dear Weather · 双城天气与关心卡"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dear-weather.git
git push -u origin main
```

## 可选：关闭 App 后的系统通知

纯静态页面本身不能在关闭后运行定时器。要让她在 App 关着时收到系统通知，需要部署 `worker/`：

- Cloudflare Worker + Cron（免费额度够个人使用）
- Web Push（VAPID）
- Cloudflare KV 保存订阅

完整步骤见 [`worker/README.md`](worker/README.md)。

部署完成后，在她手机上：

1. 打开线上页面，添加到主屏幕
2. 从主屏幕打开，进入 **设置 → 通知**
3. 填 Worker 地址和 `PUSH_TOKEN`
4. 开启通知，发一条测试通知

iPhone 需要 iOS 16.4+，且必须在主屏幕的 PWA 里开启。

## 使用说明

| 想做的事 | 在哪 |
| --- | --- |
| 换城市 / 改称呼 | 设置 → 城市 |
| 调低温、温差、降温、高温、大风、空气阈值 | 设置 → 关心 |
| 改每个场景的关心短句 | 设置 → 关心 → 关心短句 |
| 写信、设触发条件 | 设置 → 信件，或首页「写一封」 |
| 换主题、关动效、关地图、改刷新频率 | 设置 → 外观 |
| 导出 / 导入设置、清空数据、安装 | 设置 → 关于 |

小技巧：

- 首页「换一句」会在当前场景的短句库里轮换。
- 关心卡上的「做成卡片」会生成分享图；微信里可以长按保存再发。
- 信件拆开后会在设置里标记「已拆」，可以再次编辑。
- 在网址后加 `?debug=1` 会出现一个演示面板，可以强制切换下雨、很冷、高温、温差、预警、空气等场景，方便检查样式。

## 隐私

- 不收集、不上传任何个人数据。
- 城市、称呼、阈值、短句、信件、天气缓存都在 `localStorage`。
- 定位只在点击「定位」时调用浏览器 Geolocation，坐标仅用于向和风天气的 GeoAPI 反查城市，不落盘。
- 天气请求直接发往和风天气，地图瓦片直接发往天地图，没有中间服务器。
- 分享图在本地 Canvas 生成。
- 如果启用可选的 Worker 推送，浏览器推送订阅端点会保存在 Cloudflare KV，仅用于发送通知；关闭通知时会删除。

## 项目结构

```
.
├─ public/
│  ├─ icon.svg / icon-*.png     # PWA 图标
│  ├─ manifest.webmanifest
│  └─ sw.js                     # 离线缓存 + Web Push 通知
├─ src/
│  ├─ App.vue                   # 状态串联、加载、弹窗、分享
│  ├─ main.js
│  ├─ style.css
│  ├─ components/               # 卡片、地图、信件、设置等
│  └─ lib/
│     ├─ qweather.js            # 和风天气 API 封装
│     ├─ rules.js               # 关心触发引擎
│     ├─ map.js                 # 天地图瓦片计算
│     ├─ poster.js              # Canvas 分享卡 + 二维码
│     ├─ push.js                # Web Push 订阅
│     ├─ phrases.js             # 预设短句库
│     ├─ storage.js             # 本地存储
│     └─ mock.js                # ?debug=1 演示数据
├─ worker/                      # 可选：Cloudflare Worker 定时推送
│  ├─ src/index.js              # /subscribe、/test、Cron
│  ├─ src/weather.js            # Worker 侧天气请求
│  ├─ src/message.js            # 推送文案
│  └─ wrangler.toml
└─ .github/workflows/deploy.yml
```

## 已知限制

- **纯静态本身不能后台推送**。关闭 App 后仍要通知，需要部署 `worker/`；Worker 用 Web Push 推送到已订阅设备。
- **系统通知按设备订阅**。只让她手机订阅，就只会推到她手机；如果多台设备都开启，则都会收到。
- **信不会寄出**。信只存在你的设备上，她无法远程拆开；想让她看到，需要你把关心图或信件截图发给她。
- **天气有缓存延迟**。默认 30 分钟刷新一次，可在设置里改。
- **和风免费额度有限**。每次刷新会请求她的城市 7 个接口、你的城市 3 个接口；频繁刷新会更快用完额度。
- **降温判断需要历史**。首次使用没有昨天的记录，要等到第二天才能判断「比昨天低多少」。
- **地图是静态瓦片**。没有缩放和拖动，只负责把两座城市放在同一张图上。
- **iOS 安装**需 Safari → 分享 → 添加到主屏幕；系统分享图片的行为因版本而异。

## 数据来源

- 天气、预警、空气质量、生活指数：[和风天气](https://www.qweather.com/)
- 地图瓦片：[天地图](https://www.tianditu.gov.cn/)

仅用于个人关心与查看，请遵守两家服务的条款与配额。

---

如果这个页面让你少说了一句「多穿点」，那它就派上用场了。
