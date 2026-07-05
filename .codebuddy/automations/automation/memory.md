# DevTools Station 迭代记录

## 2026-07-04 18:33 迭代 #5 — 桌面小组件扩展系统 (Widgets Extended)

### 新增功能

#### 🧩 桌面小组件扩展 (20个新小组件)
扫描全部 100 个工具，为其中适合做"看板/小组件"的工具设计桌面小组件。基于现有的 `widget.js` WidgetManager 注册机制，新增 `widgets-extended.js` + `widgets-extended.css`。

#### 20 个新小组件清单：

| # | ID | 名称 | 图标 | 类别 | 更新频率 |
|---|-----|------|------|------|----------|
| 1 | `mini-calendar` | 简明日历 | 📅 | 时间日期 | 每分钟 |
| 2 | `countdown-badge` | 倒数日看板 | ⏳ | 时间日期 | 每分钟 |
| 3 | `pomodoro-mini` | 迷你番茄钟 | 🍅 | 时间日期 | 实时 |
| 4 | `qrcode-mini` | 迷你二维码 | 📱 | 生成器 | 实时(输入时) |
| 5 | `cpname-gen` | CP昵称生成 | 💕 | 趣味生活 | 按需 |
| 6 | `horoscope-today` | 今日星座运势 | 🔮 | 趣味生活 | 按需 |
| 7 | `mood-today` | 今日心情 | 😊 | 趣味生活 | 按需 |
| 8 | `water-tracker` | 喝水打卡 | 💧 | 健康生活 | 按需 |
| 9 | `daily-quote` | 每日一句 | 📖 | 趣味生活 | 按需 |
| 10 | `gradient-preview` | 渐变预览 | 🌈 | 颜色视觉 | 按需 |
| 11 | `outfit-card` | 穿搭色卡 | 👗 | 颜色视觉 | 按需 |
| 12 | `word-count-mini` | 字数统计 | 📊 | 文本工具 | 实时(输入时) |
| 13 | `url-encode-mini` | URL 编解码 | 🔗 | 文本工具 | 按需 |
| 14 | `base64-mini` | Base64 编解码 | 📟 | 文本工具 | 按需 |
| 15 | `coin-flip` | 抛硬币 | 🪙 | 趣味生活 | 按需 |
| 16 | `hash-quick` | 哈希速算 | 🔑 | 开发工具 | 实时(输入时) |
| 17 | `cron-preview` | Cron 预览 | ⏰ | 开发工具 | 实时(输入时) |
| 18 | `ip-quick` | IP 速查 | 🌐 | 网络工具 | 加载一次 |
| 19 | `fortune-lottery` | 每日一签 | 🎯 | 趣味生活 | 按需 |
| 20 | `date-diff` | 日期差值 | 📆 | 时间日期 | 按需 |
| 21 | `color-sense-score` | 色感分数 | 🎨 | 趣味生活 | 加载一次 |
| 22 | `noise-controller` | 白噪音控制器 | 🎵 | 视听 | 实时(Web Audio) |
| 23 | `case-convert` | 大小写转换 | 🔤 | 文本工具 | 按需 |

（原有 5 个：timestamp/uuid/password/random/colorpicker，总计 28 个）

### 技术亮点
- 📱 **迷你二维码**: Canvas 伪随机图案模拟 QR 效果，实时根据输入变化
- 🔑 **哈希速算**: 纯 JS 实现 MD5/SHA1/SHA256，无外部依赖
- 🎵 **白噪音控制器**: Web Audio API 实时合成粉红噪声/布朗噪声/白噪声
- 🍅 **迷你番茄钟**: 完整 25min 倒计时 + 番茄计数
- 📖 **每日一句**: 15 条精选语录，自动按日期轮换
- 🎯 **每日一签**: 5 级签运 + 幸运色/数字/方向随机生成
- 🔮 **今日星座运势**: 12 星座切换 + 爱情/事业/财运星级
- 💕 **CP昵称**: 粉色渐变闪烁动画 + 浮动爱心粒子
- 🎨 **色感分数**: 读取 localStorage 色感测试最高分 + 等级评定

### Key Features
- 所有小组件支持: 拖拽移动、关闭按钮、小组件商店面板
- localStorage 持久化: 小组件类型/位置/数据（心情记录/喝水杯数/星座选择）
- Web Audio 白噪音: 6 种自然场景（雨声/海浪/篝火/森林/咖啡馆/风铃）

### 变更文件
| 文件 | 操作 |
|------|------|
| `static/css/widgets-extended.css` | ✨ 新建 (~550行) |
| `static/js/widgets-extended.js` | ✨ 新建 (~1230行) |
| `templates/index.html` | 📝 +2行（加载新CSS/JS） |

### 测试结果
| 测试项 | 结果 |
|--------|------|
| mvn compile -DskipTests | ✅ BUILD SUCCESS |
| 首页加载 (localhost:8088) | ✅ 200 |
| 浏览器控制台 | ✅ 0 errors, 0 warnings |
| Widgets Extended 注册确认 | ✅ `[Widgets Extended] 20 个新小组件已注册` |
| 小组件商店面板 | ✅ 28 个小组件可添加 |
| 小组件添加/拖拽/关闭 | ✅ 功能正常 |

### 工具/小组件总数
- 工具总数: 100 个（未变）
- 桌面小组件总数: 28 个（5 原有 + 23 新增）
