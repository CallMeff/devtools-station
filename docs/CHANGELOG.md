# DevTools Station - 更新日志

## v1.1.0 (2026-06-28)

### 🌍 国际化 (i18n)
- 新增多语言支持：简体中文、English、日本語、한국어 四种语言
- 导航栏、首页、工具页、页脚等全部 UI 文案动态切换
- 工具名称、工具描述、分类名称随语言实时切换（无需刷新页面）
- 页面 `<title>` 和 `<meta>` 标签同步翻译
- 语言偏好持久化到 localStorage，刷新后保持

### 🎨 主题系统增强
- 新增「二次元 (Sakura)」粉系主题
- 认证弹窗左侧面板适配所有主题（暗黑/明亮/二次元）
- 主题/语言下拉菜单改为 `display:none!important` + `visibility` 双保险隐藏
- 修复下拉菜单在特定场景意外显示的 bug

### 🔐 安全增强
- Token AES 密钥改为从配置文件读取，支持 `APP_TOKEN_SECRET` 环境变量覆盖
- 密码最小长度从硬编码 6 位改为可配置（默认 8 位）
- 新增 `app.security.token-secret` / `app.security.password-min-length` 配置项
- AuthService 改为构造器注入，移除 Lombok `@RequiredArgsConstructor`

### 🗄️ 数据库变更
- 新增 `dt_feedback` 用户反馈表（支持建议/问题/体验/其他类型）
- 初始化 SQL 增加数据清除逻辑，确保每次重启正确重导数据
- MySQL 连接 URL 强制 UTF-8 字符集（`character_set_client/connection/results=utf8mb4`）
- SQL 初始化文件显式指定 UTF-8 编码

### 🐛 修复
- 修复 `http-status` 工具页语言切换时路由中连字符导致的翻译 key 不匹配问题
- 修复导航栏搜索框 `overflow` 导致的输入框被裁剪问题
- 修复 `text-color` CSS 变量引用错误（改为 `text-primary`）
- 修复语言切换器在明亮主题下的字体渲染问题
- 删除冗余的 `dark-theme.css` 文件（已统一到 `themes.css`）

### ⚙️ 其他
- 服务端口从 8089 改为 8088
- 服务端强制 UTF-8 字符编码
- 清理无用 import（`SecureUtil`、`StandardCharsets`、`Base64`）

---

## v1.0.0 (2024-06-16)

### 🎉 首次发布
- 完成项目基础架构搭建（Spring Boot 3.2 + MyBatis Plus + MySQL）
- 实现 8 大分类共 36 个实用工具
- 暗黑专业风 UI（参考 cursor.com）+ 亮色主题支持
- 全局搜索功能（支持名称和描述搜索）
- 键盘快捷键 ⌘K 快速搜索
- 响应式布局适配（桌面/平板/手机）
- Knife4j API 文档集成
- 统一 API 响应格式

### 📦 包含工具
**加解密**: MD5哈希、SHA哈希、AES加解密、Base64编解码、URL编解码、BCrypt密码
**格式化**: JSON格式化、SQL格式化、CSS格式化
**转换器**: 时间戳转换、进制转换、颜色转换、大小写转换
**生成器**: UUID生成、随机密码、随机数、Lorem Ipsum
**文本处理**: 文本对比、正则测试、字数统计、文本去重
**网络工具**: IP查询、UserAgent解析、HTTP状态码
**开发工具**: Cron表达式、Git备忘、MIME类型

### 🗄️ 数据库
- 4 张业务表（分类、工具、使用记录、收藏）
- 初始化 8 个分类 + 36 个工具数据

---

## 规划中

### v1.2.0
- [ ] 二维码生成与解析
- [ ] 图片压缩工具
- [ ] JSON 编辑器（树形视图）
- [ ] 用户收藏功能
- [ ] 工具使用统计
- [ ] 拼音搜索支持

### v1.3.0
- [ ] JWT 解析器
- [ ] RSA 密钥对生成
- [ ] Markdown 编辑器
- [ ] Docker 部署支持
