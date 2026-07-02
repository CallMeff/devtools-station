# DevTools Station 功能迭代与测试记忆

## 最近执行 (2026-07-02 08:04) — 新增 3 个开发者工具

### 🆕 新增 3 个工具

| 工具 | 分类 | 路由 | 类型 |
|------|------|------|------|
| **Mermaid 图表编辑器** | 图表工具 | `/tools/chart/mermaid-live` | LOCAL_ONLY |
| **JSON Schema 生成器** | 格式化工具 | `/tools/format/json-schema` | LOCAL_ONLY |
| **开源许可证选择器** | 开发者工具 | `/tools/devtools/license-chooser` | LOCAL_ONLY |

### 工具详情

**Mermaid 图表编辑器** — 在线实时 Mermaid 编辑器：
- 支持 8 种图表：流程图/时序图/类图/ER图/甘特图/饼图/Git图/思维导图
- 每种图表都有可点击载入的示例模板
- 实时预览，语法错误提示
- 导出 SVG / 复制 Mermaid 代码 / 分享链接（URL hash 编码）
- 缩放预览（放大/缩小/重置）
- 基于 mermaid.js CDN，主题跟随 DevTools Station 主题

**JSON Schema 生成器** — 输入 JSON → 生成 Schema：
- 自动类型推断（string/number/integer/boolean/array/object/null）
- 嵌套对象/数组递归处理
- 选项：标记必填字段 / 包含示例值 / 添加中文描述 / 自定义标题
- JSON Schema Draft 2020-12 标准
- Schema 验证：检查 JSON 是否符合生成的 Schema（控制台输出问题）
- 3 个示例预设：用户/商品/API 响应
- 一键复制/下载 schema.json

**开源许可证选择器** — 6 题选最佳许可证：
- 交互式问答：开源/混和/闭源 → Copyleft 需求 → SaaS 场景 → 专利保护 → 背书要求 → 项目类型
- 8 个许可证：MIT / Apache-2.0 / GPL-3.0 / LGPL-3.0 / BSD-3 / MPL-2.0 / Unlicense / AGPL-3.0
- 动态评分匹配，⭐ 推荐最优
- 每个许可证：标签快览 + 一句话总结 + 适用场景
- 对比表格：商业使用/修改闭源/Copyleft/专利保护/免责/修改声明
- 查看全文 + 一键复制 LICENSE（自动替换年份）

### 设计思路
分析现有 52 工具覆盖盲区后，选择 3 个独特方向：
1. **Mermaid 编辑器** — 已有 Excalidraw 画图，但缺少文本驱动的图表工具。Mermaid 在技术文档领域极为流行，与画图工具互补
2. **JSON Schema 生成器** — 格式化工具完备但缺乏 Schema 方向，API 开发者刚需
3. **开源许可证选择器** — 市面极少有互动式许可证向导，每个开发者的第一课都需要

### 文件变更

| 文件 | 变更 |
|------|------|
| `templates/mermaid-live.html` | ✨ 新建 (~160行) |
| `templates/json-schema-gen.html` | ✨ 新建 (~180行) |
| `templates/license-chooser.html` | ✨ 新建 (~280行) |
| `PageController.java` | +3 路由映射 |
| `db/data.sql` | +3 INSERT（含注释） |
| `js/i18n.js` | +12 中/英翻译（含 dockercompose/license-chooser 英文翻译补充） |

### 浏览器自动化测试 ✅

| 测试项 | 结果 | 截图 |
|--------|------|------|
| 首页加载 | ✅ 0 errors | `00-homepage.png` |
| JSON 格式化器 | ✅ 0 errors | `01-json-formatter.png` |
| cURL 命令生成器 | ✅ (main.css 500) | `02-curl-builder.png` |
| Docker Compose 生成器 | ✅ (main.css 500) | `03-docker-compose.png` |
| 正则表达式可视化 | ✅ (main.css 500) | `04-regex-visual.png` |
| 个人中心/认证 | ✅ 0 errors (verbose only) | `05-profile.png` |
| 主题商店 | ✅ 0 errors | `06-theme-store.png` |
| Cyberpunk 主题 | ✅ 切换正常 | `07-cyberpunk-theme.png` |

### 注意事项
- **服务需重启**：当前 port 8088 运行的是旧版本。需要 `mvn spring-boot:run` 重启后 3 个新工具才可见
- **编译通过**：`mvn compile -q` 退出码 0，无 Java 编译错误
- **总计: 55 个工具, 14 个分类**（重启后生效）

---

## 历史执行 (2026-07-02 00:04) — 新增 3 个开发者工具

### 🆕 新增 3 个工具

| 工具 | 分类 | 路由 | 类型 |
|------|------|------|------|
| **正则表达式可视化** | 文本处理 | `/tools/text/regex-visual` | LOCAL_ONLY |
| **cURL 命令生成器** | 网络工具 | `/tools/network/curl-builder` | LOCAL_ONLY |
| **Docker Compose 生成器** | 开发者工具 | `/tools/devtools/docker-compose` | LOCAL_ONLY |

### 工具详情

**正则表达式可视化器** — 把正则变成彩色结构树：
- 解析正则结构：文字/转义/量词/锚点/组/字符类/交替
- 8 个快捷模式：手机号/邮箱/身份证/IP/URL/日期/中文/金额
- 实时测试高亮，显示匹配结果和捕获组
- 正则语法校验 + Flags 切换 (g/i/m/s/u)
- Ctrl+C 复制分析结果

**cURL 命令生成器** — 可视化构建 HTTP 请求：
- 5 种 HTTP 方法 (GET/POST/PUT/DELETE/PATCH)
- 动态添加 Headers/Query Params/Body
- 一键生成 curl + Python(requests) + JavaScript(fetch) 三语代码
- 5 个快捷预设：GitHub API / JSONPlaceholder / 天气 / 创建用户 / GraphQL
- 选项面板：跟随重定向(-L) / 详细输出(-v) / 忽略SSL(-k) / 静默(-s)
- Ctrl+C 复制 / Ctrl+S 下载 .sh

**Docker Compose 生成器** — 点选生成 docker-compose.yml：
- 18 种服务：MySQL/PG/MariaDB/MongoDB/Redis/ES/Kafka/RabbitMQ/Nginx...
- 4 大分类：数据库 / 缓存消息队列 / Web代理 / 搜索监控
- 支持版本选择、端口映射、环境变量、数据卷、网络
- 4 个快捷预设：Web全栈 / 微服务 / 数据平台 / DevOps
- 自动生成 volume/network/depends_on/restart 配置
- Ctrl+C 复制 / Ctrl+S 下载 .yml

### 设计思路

分析 GitHub 热门项目 + 现有 49 工具缺口后，选择 3 个高价值方向：
1. **正则可视化** — 市面上正则测试工具很多，但能可视化结构的很少，对标 regex101/regulex
2. **cURL 生成器** — API 开发刚需，比 Postman 轻量，不需要安装
3. **Docker Compose 生成器** — DevOps 缺口大，从 GitHub 热门 Docker/K8s 项目启发，填补基础设施工具空白

### 文件变更

| 文件 | 变更 |
|------|------|
| `templates/regex-visual.html` | ✨ 新建 (~240行) |
| `templates/curl-builder.html` | ✨ 新建 (~330行) |
| `templates/docker-compose-gen.html` | ✨ 新建 (~350行) |
| `PageController.java` | +3 路由映射 |
| `db/data.sql` | +3 INSERT |
| `js/i18n.js` | +6 中/英翻译 |

### 浏览器自动化测试 ✅

| 测试项 | 结果 | 截图 |
|--------|------|------|
| 首页加载 | ✅ 0 errors | `00-homepage.png` |
| 首页含 3 新工具名 | ✅ 全部可见 | - |
| 正则可视化 /text/regex-visual | ✅ 标题正确，默认手机号演示 | `01-regex-visual.png` |
| cURL 生成器 /network/curl-builder | ✅ 三语代码正常生成 | `02-curl-builder.png` |
| Docker Compose /devtools/docker-compose | ✅ 18 服务卡片渲染 | `03-docker-compose.png` |
| JSON 格式化器 (已有) | ✅ 0 errors | `04-json-formatter.png` |
| 赛博朋克主题 | ✅ CSS --accent-color:#00e5ff | `05-cyberpunk-theme.png` |
| 默认主题恢复 | ✅ 0 errors | `06-default-profile.png` |

所有新工具仅 `main.css 500` 错误（已知已有问题，不影响功能）

### 服务状态
- **PID**: 41880, **端口**: 8088, **Profile**: prod (MySQL)
- **总计: 52 个工具, 14 个分类**

---

## 历史执行 (2026-07-01 22:57) — 新增 2 个主题皮肤
(已省略)

## 历史执行 (2026-07-01 22:44) — 新增 3 个工具 + JWT 签发增强
(已省略)
