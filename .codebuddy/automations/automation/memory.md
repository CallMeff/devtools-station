# DevTools Station 优化与测试记忆

## 最近执行 (2026-07-01 09:01) — 新增页面皮肤水印功能

### 🎨 页面皮肤水印系统

全站背景皮肤功能：上传图片作为半透明水印覆盖全页面。

| 功能 | 说明 |
|------|------|
| 图层 | 固定覆盖层 z-index: -1，不遮挡页面内容 |
| 上传 | 支持 JPG/PNG/WebP/GIF，自动压缩至 1920px |
| 透明度 | 滑块 5%-100%，快速预设 4 档 + 键盘左右键精调 |
| 触屏 | 双指左滑降低/右滑升高透明度 |
| 匿名 | localStorage 保存，不登录也能用 |
| 登录 | 同步到后端 dt_user_skin 表，跨设备同步 |

### 文件变更
| 文件 | 变更 |
|------|------|
| `entity/UserSkin.java` | ✨ 新建实体：skinImage(MEDIUMTEXT), opacity, fitMode |
| `mapper/UserSkinMapper.java` | ✨ 新建 Mapper |
| `service/UserSkinService.java` | ✨ 新建服务：getSkin/saveSkin/deleteSkin |
| `controller/SkinController.java` | ✨ 新建 API：GET/POST/DELETE /api/skin |
| `db/schema.sql` | + dt_user_skin 建表语句 |
| `js/page-skin.js` | ✨ 新建皮肤引擎：overlay + 控制面板 + 持久化 |
| `css/style.css` | + 皮肤 overlay/面板/滑块/Toast 样式 |
| `js/theme.js` | + 动态加载 page-skin.js（避免修改所有模板） |


### 🆕 新增 3 个实用图像工具 (分类: 图像处理 cat=10)

从 GitHub 开源社区精选，纯浏览器端运行，零 CDN 依赖，秒开零延迟：

| 工具 | 灵感来源 | 技术 | 路由 |
|------|---------|------|------|
| **图片压缩器** | Google Squoosh (⭐22k+) | Canvas API | `/tools/image/compress` |
| **配色方案生成** | Coolors.co 风格 | 纯 JS HSL 色彩算法 | `/tools/image/palette` |
| **图片格式转换** | 社区成熟方案 | Canvas toBlob | `/tools/image/convert` |

### 为什么选这些工具
- ✅ 浏览器 Canvas API 纯前端，无任何 CDN/服务器依赖
- ✅ 拖拽即用，零学习门槛
- ✅ 办公场景高频需求：压缩照片/PPT配色/格式互转
- ✅ 不限于程序员，设计师/运营/行政都能用

### 工具详情

**图片压缩器** - 发邮件/发朋友圈必备
- 拖拽图片 → 所见即所得对比
- 质量滑块实时调节 (10%-100%)
- 原图/压缩后大小百分比展示
- 支持 JPG/PNG/WebP/BMP
- Ctrl+S 快速下载

**配色方案生成器** - 做PPT不再为配色头疼
- 4种和谐算法：邻近色/互补色/三角色/单色系
- 空格键随机切换，🔒锁定喜欢的颜色
- 点击色块一键复制 Hex 色值
- 保存多个方案到 localStorage
- 内置 28 个中文颜色名（珊瑚红、蒂芙尼、樱花粉…）

**图片格式转换** - JPG/PNG/WebP 随意转
- 单张+批量模式，多文件一键转换
- 质量可调 (PNG 无损 / JPG+WebP 可调)
- 逐文件显示转换结果和体积变化
- 批量打包自动下载
- Ctrl+Enter 快捷键启动

### 🔄 Draw.io → Excalidraw 替换

Draw.io embed.diagrams.net 国外加载慢 → Excalidraw (⭐90k+) jsdelivr CDN 秒开

### 新增/保留的开源工具

| 工具 | 来源 | ⭐ | CDN | 路由 |
|------|------|----|-----|------|
| **在线画图工具** | excalidraw/excalidraw | 90k+ | jsdelivr (React+Excalidraw) | `/tools/chart/drawio` |
| **在线代码编辑器** | microsoft/monaco-editor | 40k+ | monaco-editor@0.52 | `/tools/editor/monaco` |
| **Markdown 编辑器** | markedjs/marked | 35k+ | marked@15 + highlight.js@11 | `/tools/editor/markdown` |

### 工具详情

**在线画图工具 (Excalidraw)** — 手绘风格秒开画布：
- 基于 Excalidraw (⭐90k+), jsdelivr CDN 秒开
- 手绘风格：矩形/圆形/菱形/箭头/自由画笔/文字
- 导出 PNG/SVG, Ctrl+S 快速导出
- 每 10 秒自动保存 localStorage，刷新不丢失
- 15 秒 CDN 超时检测 + 友好错误提示
- 清空画布需确认，防误操作

**在线代码编辑器 (Monaco)** — VS Code 同款引擎：
- 20+ 编程语言语法高亮和智能补全
- 代码对比 (Diff) 模式，并排查看差异
- 打开/保存本地文件、格式化代码、一键复制
- 自动跟随暗色/亮色主题切换

**Markdown 实时编辑器** — 基于 Marked.js：
- 分屏编辑/仅编辑/仅预览三种模式
- 工具栏：粗体、斜体、代码、链接、图片、引用、列表、表格、代码块
- 代码高亮 (highlight.js)、导出 HTML/MD
- Ctrl+B 加粗、Ctrl+I 斜体 快捷键

### 新增分类
**图表工具** (id=13, 📈) — 第 13 个分类，现为 Excalidraw 手绘画图

### 文件变更清单 (本次)
| 文件 | 变更 |
|------|------|
| `templates/game-2048.html` | ✨ 新建 — 2048 数字滑动游戏 |
| `templates/game-snake.html` | ✨ 新建 — 贪吃蛇 Canvas 街机 |
| `templates/wheel-spinner.html` | ✨ 新建 — 抽签转盘决策器 |
| `templates/emoji-picker.html` | ✨ 新建 — 表情包搜索复制 |
| `PageController.java` | +4 LOCAL_ONLY 模板路由 |
| `db/data.sql` | 新增分类 14 趣味休闲 + 4 工具 |
| `i18n.js` | +4 组中/英翻译 + 分类+引导文案 |

### 其他可集成开源工具（已调研，待后续集成）
| 项目 | ⭐ | 集成价值 |
|------|-----|----------|
| Hoppscotch | 78k | API 测试平台 (iframe/自部署) |
| Excalidraw | 90k+ | 在线白板绘图 (iframe 嵌入) |
| CyberChef | 29k | 数据转换瑞士军刀 |
| Draw.io | 50k+ | 专业绘图工具 (iframe) |
| QR Code Styling | 5k | 二维码美化（目前只有基础二维码） |

### 服务状态
- PID: 33788, 端口: 8088, Profile: prod (MySQL)
- **总计: 58 个工具, 14 个分类**

---

## 历史执行 (2026-07-01 08:00) — 新增 GitHub AI 热门项目工具
(省略，详见上一版本)

### 新增分类
**AI 工具** (id=12, 🤖) — 排序第 12 位

### 文件变更清单
| 文件 | 变更 |
|------|------|
| `templates/github-trending.html` | 新建，完整独立工具页面（557行） |
| `PageController.java` | 添加 github-trending 路由映射 |
| `data.sql` | +1 分类(AI 工具), +1 工具(GitHub AI 热门项目) |
| `i18n.js` | +cat_name.ai, +tool_name/tool_desc, +github.* 键 (中/英) |

### 服务状态
- PID: 17176, 端口: 8088, Profile: prod (MySQL)
- **新增后总计: 45 个工具, 12 个分类**

### 浏览器自动化测试 (playwright-cli) ✅
| 测试项 | 结果 |
|--------|------|
| 首页加载 (http://localhost:8088/) | ✅ 正常 |
| 新工具页面 /tools/github/trending | ✅ 页面正常渲染 |
| 首页 AI 工具 分类可见 | ✅ 正常 |
| 暗色主题兼容 | ✅ CSS 变量驱动 |

---

## 历史执行 (2026-06-29 00:16) — OCR 性能优化

### OCR 识别性能优化 (tool-engine.js)
**问题根因**：Tesseract.js（WASM 浏览器端 OCR）对高分辨率图片极慢，导致 180 秒超时

**优化措施**：
1. **新增 `compressImageForOcr()` 函数** — Canvas 自动压缩预处理
   - 超过 2000x2000 的图片自动缩小（等比缩放）
   - 输出 JPEG 格式（quality=0.85），体积更小
   - 小图跳过压缩避免无谓开销
2. **集成到 `processSingle()` / `processBatch()`** — 识别前先压缩
3. **Tesseract.js 参数优化**
   - 添加 `tessedit_pageseg_mode: Tesseract.PSM.AUTO` 自动页面分割
4. **降低超时时间**
   - 单张：180s → 90s（压缩后通常 10-30s 完成）
   - 批量：每张预估 30s → 20s，上限 300s → 180s
5. **UI 反馈增强** — 显示压缩尺寸信息 `(4000x3000 → 2000x1500)`

**预期提速效果**：5~10 倍（取决于原图大小）

### 文件变更清单
| 文件 | 变更 |
|------|------|
| `tool-engine.js` | +compressImageForOcr(), processSingle/processBatch 集成压缩, +PSM参数, 超时时间调优 |

---

## 历史执行 (2026-06-30 00:00) — 新增工具 + UI改进 + 浏览器测试

### 新增工具 (2 个，总计 44)
1. **Markdown 预览** (`/tools/format/markdown`) — client-calc 类型
   - 使用 marked.js CDN 渲染 Markdown (GFM + breaks)
   - 支持 GitHub 明亮/暗色双主题预览
   - 实时输入自动刷新 (400ms debounce)
   - 词数/字符/行数统计
2. **JSON ↔ CSV 转换器** (`/tools/converter/json-csv`) — client-calc 类型
   - JSON 数组 → CSV 表格（自动提取列头）
   - CSV → JSON 数组（支持引号包裹、类型推断）
   - 支持逗号/分号/Tab 分隔符
   - 一键复制结果

### 现有工具体验优化 (3 项)
1. **JSON 格式化**：新增树形视图渲染
   - 可折叠/展开节点（▶/▼）
   - 全部展开/全部折叠按钮
   - 一键复制结果
   - 颜色编码：紫色键名、绿色字符串、蓝色数字、红色null、橙色布尔
2. **二维码生成**：新增「📥 下载二维码」按钮，可直接保存 PNG 图片
3. **通用剪贴板功能**：新增 `window.copyToClipboard()` 全局函数，所有工具可复用

### 文件变更清单
| 文件 | 变更 |
|------|------|
| `data.sql` | +2 工具 INSERT, 更新 JSON 格式化描述 |
| `tool-engine.js` | +Markdown TOOL_CONFIGS, +JSON↔CSV TOOL_CONFIGS, +renderJsonNode() 树视图, +renderMarkdown(), +convertJsonCsv(), +downloadQRCode(), +copyToClipboard(), +实时预览监听 |
| `i18n.js` | +中英文 tool_name/tool_desc/md/jsoncsv i18n 键 |
| `tool.html` | +marked.js CDN 引入 |

### 数据库操作 (MySQL prod)
- INSERT INTO dt_tool: Markdown 预览, JSON ↔ CSV (is_new=1)
- UPDATE dt_tool: JSON 格式化描述更新

### 浏览器自动化测试 (playwright-cli) ✅
| 测试项 | 结果 |
|--------|------|
| 首页加载 (http://localhost:8088/) | ✅ 正常 |
| 新工具页面 /tools/format/markdown | ✅ 页面正常渲染 |
| 新工具页面 /tools/converter/json-csv | ✅ 页面正常渲染 |
| JSON 格式化页 /tools/format/json | ✅ 正常 |
| 二维码生成页 /tools/generator/qrcode | ✅ 正常 |
| 首页显示新工具名称 | ✅ Markdown 和 CSV 均可见 |

### 服务状态
- PID: 29868, 端口: 8088, Profile: prod (MySQL), **44 个工具**

---

## 历史执行 (2026-06-29 22:38) — 代码重构 + 浏览器全功能测试

### 代码优化
1. **GlobalModelAdvice.java**: 添加 `@ModelAttribute("categories")` 自动注入分类数据，消除 PageController 中 7 个方法的重复查询
2. **PageController.java**: 移除 7 处 `model.addAttribute("categories", ...)` 冗余代码，简化所有静态页面路由方法签名

### 浏览器自动化测试 (playwright-cli)
14 项全部通过 ✅

---

## 历史执行 (2026-06-29 21:28)

### 代码优化
1. **auth.js**: 修复登出 Toast 硬编码中文 → 使用 i18n `toast.logged_out` 键

### 浏览器自动化测试 (playwright-cli)
14 项全部通过 ✅

---

## 历史执行 (2026-06-29 20:53) — 收藏功能修复
- `FavoriteService.java` + `DatabaseMigration.java` 修复 user_key NOT NULL 问题

## 历史执行 (2026-06-29 20:21)
- AuthService: 移除冗余注解
- NetworkService: 手动 JSON → Gson
- 14 项测试全部通过 ✅
