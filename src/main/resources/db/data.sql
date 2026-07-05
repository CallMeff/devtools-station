-- DevTools Station - 初始化数据（仅首次安装时使用）
-- 注意：此文件不应在每次启动时自动执行，请使用 sql.init.mode=never
-- 如确需重新导入数据，请手动删除 H2 数据库文件后重启

-- 分类数据
INSERT INTO dt_category (name, icon, sort_order, description) VALUES
('加密解密', '🔐', 1, 'MD5、SHA、AES、Bcrypt 等加解密工具'),
('格式化工具', '📝', 2, 'JSON、SQL、CSS、XML 等代码格式化'),
('转换工具', '🔄', 3, '时间戳、进制、颜色、大小写等转换'),
('生成器', '🎲', 4, 'UUID、密码、随机数等生成工具'),
('文本处理', '📄', 5, '文本对比、正则、统计、去重等'),
('网络工具', '🌐', 6, 'IP 查询、UA 解析、HTTP 状态码等'),
('开发者工具', '💻', 7, 'Cron 表达式、Git 命令、MIME 类型等'),
('编码解码', '📟', 8, 'Base64、URL、Unicode、HTML 实体编解码'),
('金融计算', '💰', 9, '贷款计算、投资回报、利率换算等金融工具'),
('图像处理', '🖼️', 10, '图片压缩、格式转换、配色方案、OCR 文字识别等图像工具'),
('本地工具', '💻', 11, '本地文档搜索、文件处理等纯本地工具，保障数据私密性'),
('AI 工具', '🤖', 12, 'AI 相关开发工具，热门开源项目发现、AI 辅助等'),
('图表工具', '📈', 13, '基于 Excalidraw (⭐90k+) 手绘风格画图工具，秒开零延迟，拖拽作图'),
('趣味休闲', '🎮', 14, '经典小游戏 + 趣味工具，工作之余摸鱼放松一下');

-- 工具数据
INSERT INTO dt_tool (category_id, name, description, icon, route, api_path, sort_order, is_hot, is_new) VALUES
-- 加密解密
(1, 'MD5 加密', '计算字符串的 MD5 哈希值', '🔑', '/tools/crypto/md5', '/api/tools/crypto/hash', 1, 1, 0),
(1, 'SHA 系列', 'SHA-1 / SHA-256 / SHA-512 哈希计算', '🔒', '/tools/crypto/sha', '/api/tools/crypto/hash', 2, 1, 0),
(1, 'AES 加解密', 'AES 对称加密/解密，支持 CBC/ECB 模式', '🛡️', '/tools/crypto/aes', '/api/tools/crypto/aes', 3, 0, 1),
(1, 'Bcrypt 密码', 'Bcrypt 密码哈希生成与验证', '🔐', '/tools/crypto/bcrypt', '/api/tools/crypto/bcrypt', 4, 0, 0),
(1, 'HMAC 签名', 'HMAC-SHA256 消息认证码生成', '✍️', '/tools/crypto/hmac', '/api/tools/crypto/hmac', 5, 0, 0),

-- 格式化工具
(2, 'JSON 格式化', 'JSON 美化/压缩/校验，支持树形视图折叠展开', '✨', '/tools/format/json', '/api/tools/format/json', 1, 1, 0),
(2, 'SQL 格式化', 'SQL 语句美化与压缩', '🗄️', '/tools/format/sql', '/api/tools/format/sql', 2, 1, 0),
(2, 'CSS 格式化', 'CSS 代码美化与压缩', '🎨', '/tools/format/css', '/api/tools/format/css', 3, 0, 0),
(2, 'HTML 格式化', 'HTML 代码美化与压缩', '📋', '/tools/format/html', '/api/tools/format/html', 4, 0, 0),
(2, 'XML 格式化', 'XML 代码美化与压缩', '📰', '/tools/format/xml', '/api/tools/format/xml', 5, 0, 0),
(2, 'Markdown 预览', 'Markdown 实时预览与编辑，支持 GFM 语法高亮', '📝', '/tools/format/markdown', '/api/tools/client/markdown', 6, 0, 1),
(2, 'JS 代码格式化', 'JavaScript 代码美化与压缩，支持缩进调整和单行压缩', '💛', '/tools/format/js', '/api/tools/client/js', 7, 0, 1),

-- 转换工具
(3, '时间戳转换', 'Unix 时间戳与日期互转', '⏰', '/tools/converter/timestamp', '/api/tools/convert/timestamp', 1, 1, 0),
(3, '进制转换', '二进制/八进制/十进制/十六进制互转', '🔢', '/tools/converter/base', '/api/tools/convert/radix', 2, 0, 0),
(3, '颜色转换', 'HEX/RGB/HSL 颜色格式互转', '🎯', '/tools/converter/color', '/api/tools/convert/color', 3, 0, 0),
(3, '大小写转换', '大小写/驼峰/蛇形/常量命名转换', '🔤', '/tools/converter/case', '/api/tools/convert/case', 4, 0, 0),
(3, 'Unicode 转换', 'Unicode 与中文互转', '🌍', '/tools/converter/unicode', '/api/tools/convert/unicode', 5, 0, 0),
(3, 'Excel转JSON', 'Excel文件(.xlsx/.xls)转换为JSON格式', '📊', '/tools/converter/excel2json', '/api/tools/convert/excel2json', 6, 0, 1),
(3, 'JSON 转 YAML', 'JSON 与 YAML 格式互转', '🔄', '/tools/converter/json-yaml', '/api/tools/convert/json-yaml', 7, 0, 1),
(3, 'JSON ↔ CSV', 'JSON 数组与 CSV 表格格式互转', '📋', '/tools/converter/json-csv', '/api/tools/client/json-csv', 8, 0, 1),
(3, '图片转 Base64', '图片文件转 Base64 编码，支持预览和复制，适用于 CSS/HTML 内联图片', '🖼️', '/tools/converter/image-base64', '/api/tools/client/image-base64', 9, 0, 1),
(3, 'JSON ↔ XML', 'JSON 与 XML 格式互转，支持双向转换和格式化输出', '🔄', '/tools/converter/json-xml', '/api/tools/client/json-xml', 10, 0, 1),
(3, '数字转大写金额', '数字转中文大写金额（财务标准），支持整数和小数', '💰', '/tools/converter/rmb-upper', '/api/tools/convert/rmb-upper', 11, 0, 1),

-- 生成器
(4, 'UUID 生成', '批量生成 UUID/GUID', '🆔', '/tools/generator/uuid', '/api/tools/generate/uuid', 1, 1, 0),
(4, '密码生成', '高强度随机密码生成', '🔑', '/tools/generator/password', '/api/tools/generate/password', 2, 1, 0),
(4, '随机数生成', '指定范围随机数生成', '🎰', '/tools/generator/random', '/api/tools/generate/random', 3, 0, 0),
(4, 'Lorem Ipsum', '占位文本生成', '📝', '/tools/generator/lorem', '/api/tools/generate/lorem', 4, 0, 0),
(4, '二维码生成', '文本/链接转二维码图片', '📱', '/tools/generator/qrcode', '/api/tools/generate/qrcode', 5, 0, 1),
(4, 'Mock 数据生成器', '一键生成模拟数据：个人信息/公司/订单/商品模板，支持中英文、JSON/CSV 导出', '🎭', '/tools/generator/mock-data', '/api/tools/client/mock-data', 6, 0, 1),

-- 文本处理
(5, '文本对比', '两段文本差异对比（Diff）', '🔍', '/tools/text/diff', '/api/tools/text/diff', 1, 0, 1),
(5, '正则测试', '正则表达式在线测试', '🧪', '/tools/text/regex', '/api/tools/text/regex', 2, 0, 0),
(5, '字数统计', '字符/单词/行数统计', '📊', '/tools/text/count', '/api/tools/text/count', 3, 0, 0),
(5, '文本去重', '文本行去重排序', '🔄', '/tools/text/dedup', '/api/tools/text/unique', 4, 0, 0),
(5, 'Base64 编解码', 'Base64 编码与解码', '📟', '/tools/text/base64', '/api/tools/text/base64', 5, 1, 0),

-- 网络工具
(6, 'IP 信息查询', 'IP 地址归属地查询', '🌍', '/tools/network/ip', '/api/tools/network/ip', 1, 0, 0),
(6, 'User-Agent 解析', '浏览器 UA 字符串解析', '🔍', '/tools/network/ua', '/api/tools/network/ua', 2, 0, 0),
(6, 'HTTP 状态码', 'HTTP 状态码参考大全', '📡', '/tools/network/http-status', '/api/tools/network/httpstatus', 3, 0, 0),
(6, 'URL 编解码', 'URL 编码与解码', '🔗', '/tools/network/url', '/api/tools/network/url', 4, 0, 0),
(6, '批量发送 HTTP 请求', '上传 Excel 作为数据源，逐行或批量发送 HTTP 请求', '📬', '/tools/network/batch-http', '/api/tools/network/batch-http', 5, 1, 1),

-- 开发者工具
(7, 'Cron 表达式', 'Cron 表达式解析与生成', '⏱️', '/tools/devtools/cron', '/api/tools/dev/cron', 1, 1, 0),
(7, 'Git 命令速查', '常用 Git 命令速查表', '📚', '/tools/devtools/git', '/api/tools/dev/git', 2, 0, 0),
(7, 'MIME 类型', '文件扩展名与 MIME 类型对照', '📁', '/tools/devtools/mime', '/api/tools/dev/mime', 3, 0, 0),
(7, 'JWT 调试器', 'JWT Token 解析与签名签发（纯前端 HS256/384/512 签名，密钥不上传服务器）', '🎫', '/tools/devtools/jwt', '/api/tools/dev/jwt', 4, 0, 1),

-- 编码解码
(8, 'URL 编解码', 'URL Encode / Decode', '🔗', '/tools/encode/url', '/api/tools/encode/url', 1, 0, 0),
(8, 'HTML 实体', 'HTML 实体编码与解码', '📄', '/tools/encode/html', '/api/tools/encode/html', 2, 0, 0),
(8, '摩尔斯电码', '摩尔斯电码编解码', '📻', '/tools/encode/morse', '/api/tools/encode/morse', 3, 0, 1),
-- 金融计算
(9, '贷款计算器', '等额本息与等额本金对比计算，支持提前还款模拟和还款明细表导出', '🏦', '/tools/finance/loan-calculator', '', 1, 1, 1),
-- 图像处理
(10, 'OCR 文字识别', '图片文字识别，支持中文/英文/混合语言，支持单张和批量识别', '📸', '/tools/image/ocr', '/api/tools/ocr/single', 1, 1, 1),
(10, '图片压缩器', '拖拽即可压缩图片，所见即所得。基于浏览器 Canvas 引擎，文件不上传服务器，安全私密', '🗜️', '/tools/image/compress', 'LOCAL_ONLY', 1, 1, 1),
(10, '配色方案生成', '按空格键随机生成和谐配色方案，支持锁定颜色、一键复制色值。做 PPT/海报/文档不再为配色头疼', '🎨', '/tools/image/palette', 'LOCAL_ONLY', 1, 1, 1),
(10, '图片格式转换', 'JPG / PNG / WebP 互转，支持批量处理，纯浏览器端运行。调整导出质量，即转即下载', '🔄', '/tools/image/convert', 'LOCAL_ONLY', 1, 1, 1),
-- 本地工具
(11, '本地文档瞬搜', '选择本地文件夹，纯浏览器端全文检索 Word/PDF/TXT 等文档，文件不上传，保障数据绝对私密', '🔍', '/tools/local-search/doc-search', 'LOCAL_ONLY', 1, 1, 1),
-- AI 工具
(12, 'GitHub AI 热门项目', '实时查看 GitHub 上最热门的 AI 开源项目，支持按日/周/月筛选和语言过滤，无需 Token，浏览器直连 GitHub API', '🤖', '/tools/github/trending', 'LOCAL_ONLY', 1, 1, 1),
-- 图表工具
(13, '在线画图工具', '基于 Excalidraw (⭐90k+) 手绘风格画图工具，秒开零延迟，支持流程图/草图/示意图，导出 PNG/SVG', '📈', '/tools/chart/drawio', 'LOCAL_ONLY', 1, 1, 1),
-- 趣味休闲
(14, '2048 经典游戏', '超上瘾的数字滑动游戏！方向键合并相同数字，挑战 2048。支持触屏滑动，记录最高分', '🔢', '/tools/fun/2048', 'LOCAL_ONLY', 1, 1, 1),
(14, '贪吃蛇', '经典街机游戏！控制小蛇吃食物变长，别撞到自己。三档速度，支持键盘+触屏+手机虚拟按键', '🐍', '/tools/fun/snake', 'LOCAL_ONLY', 1, 1, 1),
(14, '抽签转盘', '选择困难症救星！自定义选项转盘抽签，午餐吃什么/今天谁请客/周末去哪玩，一抽搞定', '🎯', '/tools/fun/spinner', 'LOCAL_ONLY', 1, 1, 1),
(14, '表情包搜索', '300+ emoji 表情库，按分类浏览/关键词搜索，点一下复制到剪贴板，聊天发帖随时用', '😎', '/tools/fun/emoji', 'LOCAL_ONLY', 1, 1, 1),
-- 开发者工具（追加 Monaco 编辑器）
(7, '在线代码编辑器', '基于 VS Code 同款 Monaco Editor (⭐40k+)，支持 20+ 编程语言语法高亮、代码补全、对比(Diff)、格式化，可导入导出文件', '💻', '/tools/editor/monaco', 'LOCAL_ONLY', 5, 1, 1),
-- 文本处理（追加）
(5, '文本行操作', '排序/去重/反转/编号/添加前后缀，一键处理多行文本，支持复制和下载', '📋', '/tools/text/line-ops', 'LOCAL_ONLY', 6, 0, 1),
(5, '命名风格转换', '一行输入，自动转换 camelCase/PascalCase/snake_case/kebab-case/CONSTANT_CASE 等 10 种命名风格，一键复制', '🔤', '/tools/text/naming-case', 'LOCAL_ONLY', 7, 0, 1),
-- 开发者工具（追加）
(7, '.gitignore 生成器', '按项目类型多选生成 .gitignore，覆盖 40+ 模板：Python/Node/Java/Go/Docker/IDE/OS 等，一键下载', '📁', '/tools/devtools/gitignore', 'LOCAL_ONLY', 6, 1, 1),
-- 格式化工具（追加 Markdown 编辑器）
(2, 'Markdown 编辑器', '基于 Marked.js (⭐35k+) 实时编辑器，支持分屏/仅编辑/仅预览模式，工具栏快速插入，代码高亮，导出 HTML/MD', '📝', '/tools/editor/markdown', 'LOCAL_ONLY', 8, 1, 1),
-- 文本处理（追加正则可视化）
(5, '正则表达式可视化', '把正则表达式变成彩色的结构树：量化符、字符类、捕获组一目了然，支持实时测试高亮匹配结果', '🧩', '/tools/text/regex-visual', 'LOCAL_ONLY', 8, 0, 1),
-- 网络工具（追加 curl 生成器）
(6, 'cURL 命令生成器', '可视化构建 HTTP 请求 - 选方法、填 URL、加请求头/参数/Body，一键生成 curl/Python/JavaScript 代码，支持快捷预设', '🐚', '/tools/network/curl-builder', 'LOCAL_ONLY', 6, 0, 1),
-- 开发者工具（追加 Docker Compose 生成器）
(7, 'Docker Compose 生成器', '点选 MySQL/Redis/Nginx/RabbitMQ/Kafka/ES 等服务，自动生成带端口/环境变量/数据卷/网络的 docker-compose.yml，一键复制下载', '🐳', '/tools/devtools/docker-compose', 'LOCAL_ONLY', 7, 0, 1),
-- 开源许可证选择器
(7, '开源许可证选择器', '6 道题帮你选出最适合项目的开源许可证 — MIT/Apache/GPL/BSD/AGPL…含对比表，一键复制 LICENSE 文件', '📜', '/tools/devtools/license-chooser', 'LOCAL_ONLY', 8, 0, 1),
-- 图表工具（追加 Mermaid 编辑器）
(13, 'Mermaid 图表编辑器', '在线 Mermaid 实时编辑器，支持流程图/时序图/类图/ER图/甘特图/饼图/Git图/思维导图，导出 SVG / 复制代码 / 分享链接', '📐', '/tools/chart/mermaid-live', 'LOCAL_ONLY', 2, 0, 1),
-- 格式化工具（追加 JSON Schema 生成器）
(2, 'JSON Schema 生成器', '输入 JSON 数据自动生成 JSON Schema (Draft 2020-12)，支持类型推断/必填标记/示例/描述/Schema 验证，一键复制下载', '🧬', '/tools/format/json-schema', 'LOCAL_ONLY', 9, 0, 1),
-- 图像处理（追加 CSS 渐变生成器）
(10, 'CSS 渐变生成器', '可视化设计 CSS 渐变背景，支持线性/径向/锥形三种类型，拖拽色标，实时预览 + 一键复制 CSS 代码 + 预设渐变方案', '🎨', '/tools/image/css-gradient', 'LOCAL_ONLY', 5, 1, 1),
-- 开发者工具（追加 Git 提交信息 + .env 生成器）
(7, 'Git 提交信息生成器', '按 Conventional Commits 规范可视化生成 Git 提交信息，选择类型/scope/描述/正文/脚注，支持 emoji + 破坏性变更标记，含历史记录', '📝', '/tools/devtools/git-commit', 'LOCAL_ONLY', 9, 0, 1),
(7, '.env 环境变量生成器', '按框架（Node/Python/Java/Go/Docker/React）生成 .env 环境变量模板，勾选/自定义变量，一键复制下载，适配 6 种技术栈', '🔧', '/tools/devtools/env-generator', 'LOCAL_ONLY', 10, 0, 1),
-- 格式化工具（追加 JSON → TS 接口生成器）
(2, 'JSON → TS 接口', '粘贴 JSON 自动生成 TypeScript interface/type 类型定义，支持嵌套对象/数组类型推断/可选属性/联合类型/readonly/export', '📋', '/tools/format/json-ts-interface', 'LOCAL_ONLY', 10, 0, 1),
-- 加密解密（追加 文件哈希校验器）
(1, '文件哈希校验', '拖拽文件即时计算 MD5/SHA-1/SHA-256/SHA-512/CRC32 哈希值，支持粘贴期望哈希值校验文件完整性，纯浏览器端运行', '🔐', '/tools/crypto/file-hash', 'LOCAL_ONLY', 6, 0, 1),
-- 开发者工具（追加 JSON → SQL DDL）
(7, 'JSON → SQL DDL', '粘贴 JSON 自动推断字段类型生成 CREATE TABLE 建表语句，支持 MySQL/PostgreSQL 双引擎、主键自增、NOT NULL、索引、注释', '🗄️', '/tools/devtools/json-sql-ddl', 'LOCAL_ONLY', 11, 0, 1),
-- 开发者工具（追加 SRI 哈希生成器）
(7, 'SRI 哈希生成器', '为 CDN 资源生成 Subresource Integrity 哈希值，支持 SHA-256/384/512，一键生成带 integrity 属性的 script/link 标签', '🔏', '/tools/devtools/sri-hash', 'LOCAL_ONLY', 12, 0, 1),
-- 网络工具（追加 CIDR 子网计算器）
(6, 'CIDR 子网计算器', '输入 IP/CIDR 地址（如 10.0.0.0/24），一键计算子网掩码、网络地址、广播地址、可用 IP 范围、主机数量', '🌐', '/tools/network/cidr-calc', 'LOCAL_ONLY', 7, 0, 1),
-- 转换工具（追加 日期计算器）
(3, '日期计算器', '日期差计算、日期加减天数/月数、计算年龄/星期几/闰年判断/工作日天数，支持多种日期格式输入', '📅', '/tools/converter/date-calc', 'LOCAL_ONLY', 12, 0, 1),
-- 趣味休闲（追加 颜文字生成器）
(14, '颜文字生成器', '1000+ 超可爱颜文字 (๑•̀ㅂ•́)و✧ 按心情分类浏览，点一下复制到剪贴板，收藏你最喜欢的，聊天卖萌必备', '🌸', '/tools/fun/kaomoji', 'LOCAL_ONLY', 5, 0, 1),
-- 趣味休闲（追加 工作日赚钱计时器）
(14, '工作日赚钱计时器', '设置月薪，实时看到搬砖每一秒赚了多少钱 💰 支持定时/打卡双模式 + 加班费率自定，双环形进度条区分基础/加班收入，里程碑提醒 + 金币雨动效，空格键快捷打卡', '💸', '/tools/fun/workday-money', 'LOCAL_ONLY', 6, 0, 1),
-- 趣味休闲（追加 日常记录器）
(14, '日常记录器', '每日习惯追踪小助手 📋 一键记录喝水/奶茶/运动等日常活动，日历查看历史，支持自定义类型、日记笔记、按时间段统计', '📋', '/tools/fun/daily-tracker', 'LOCAL_ONLY', 7, 0, 1),
-- 趣味休闲（追加 星座运势）
(14, '星座运势', '✨ 每日星座运势来啦！选星座看今日综合/爱情/事业/健康运势，附幸运色/幸运数字/幸运星座+贴心建议，每天都有好心情', '🔮', '/tools/fun/horoscope', 'LOCAL_ONLY', 8, 0, 1),
-- 趣味休闲（追加 像素画板）
(14, '像素画板', '🎨 可爱像素画画板！点击拖拽上色、右键擦除、填色功能，8种可爱模板(笑脸/爱心/猫咪/花朵)，调色盘随心选，导出PNG分享', '🎨', '/tools/fun/pixel-art', 'LOCAL_ONLY', 9, 0, 1),
-- 趣味休闲（追加 倒数日·纪念日）
(14, '倒数日 · 纪念日', '⏳ 重要日子不再忘记！记录生日/纪念日/考试/旅行倒计时，每年重复提醒，精美卡片展示距今天数，粉色/紫色/蓝色多主题配色', '⏳', '/tools/fun/countdown', 'LOCAL_ONLY', 10, 0, 1),
-- 趣味休闲（追加 CP 昵称生成器）
(14, 'CP 昵称生成器', '💕 输入两个人的名字和关系，一键生成超甜 CP 名！默契指数评分 + 进度环动画，情侣/闺蜜/暗恋/家人多种模式，支持换一批、随机试试、复制分享', '💕', '/tools/fun/cp-name', 'LOCAL_ONLY', 11, 0, 1),
-- 趣味休闲（追加 悄悄话加密卡）
(14, '悄悄话加密卡', '💌 把你的小秘密变成漂亮的加密卡片！可爱暗号加密 + 解密贺卡模式 + 多种配色主题，复制密文发给 TA，只有知道暗号的人才能解锁查看', '💌', '/tools/fun/secret-card', 'LOCAL_ONLY', 12, 0, 1),
-- 趣味休闲（追加 番茄专注钟）
(14, '番茄专注钟', '🍅 可爱粉嫩番茄钟，25分钟专注 + 5分钟休息 + 15分钟长休息，环形进度条 + 番茄完成标记 + 系统浏览器通知提醒，高效学习方法专注助手', '🍅', '/tools/fun/pomodoro', 'LOCAL_ONLY', 13, 0, 1),
-- 趣味休闲（追加 MBTI 趣味测试）
(14, 'MBTI 趣味测试', '🧩 12道题测出你的人格类型！16种超详细结果，维度分析进度条，适合职业推荐 + 恋爱匹配建议，可爱粉色马卡龙风格，支持结果复制分享', '🧩', '/tools/fun/mbti', 'LOCAL_ONLY', 14, 0, 1),
-- 趣味休闲（追加 白噪音播放器）
(14, '白噪音播放器', '🎧 Web Audio 实时合成自然音效：雨声🌧️/海浪🌊/篝火🔥/森林🍃，可混合播放 + 独立音量调节 + 自动定时停止，学习放松助眠好帮手', '🎧', '/tools/fun/white-noise', 'LOCAL_ONLY', 15, 0, 1),
-- 趣味休闲（追加 愿望清单）
(14, '愿望清单', '📔 写下你的小心愿一个一个去实现！支持6种分类标记、优先级⭐标星、完成进度条追踪、分类筛选、localStorage 本地持久化，可爱粉色少女心设计', '📔', '/tools/fun/wish-list', 'LOCAL_ONLY', 16, 0, 1),
-- 趣味休闲（追加 闺蜜默契大挑战）
(14, '闺蜜默契大挑战', '💞 10道题测出你们有多了解对方！输入两人名字，回答关于TA的趣味问题，生成默契指数评分环形图+关系等级评定+贴心建议，支持结果复制分享', '💞', '/tools/fun/bestie-quiz', 'LOCAL_ONLY', 17, 1, 1),
-- 趣味休闲（追加 追剧读书清单）
(14, '追剧读书清单', '📚 记录每一本书、每一部剧！支持看书/追剧/动漫/电影/播客5种分类，进度追踪+一键推进+完成标记，粉色书架可视化展示，localStorage本地持久化', '📚', '/tools/fun/bookshelf', 'LOCAL_ONLY', 18, 1, 1),
-- 趣味休闲（追加 轻断食规划工具）
(14, '轻断食规划工具', '⏳ 间歇性断食科学规划！14:10/16:8/20:4/5:2/OMAD多种方案可选，根据作息自动生成进食窗口，USDA营养数据食材推荐，7天周期计划+浏览器提醒+本地打卡进度', '⏳', '/tools/fun/intermittent-fasting', 'LOCAL_ONLY', 19, 1, 1),
-- 趣味休闲（追加 桌面宠物画廊）
(14, '桌面宠物画廊', '🐾 挑选一只可爱的小精灵陪你工作学习！8只精选宠物（猫咪/海豚/兔兔/狐狸/仓鼠/柴犬/小仙子），API密钥后端安全存储，一键复制 WorkBuddy Pet 安装命令，CodeBuddy 安全联动', '🐾', '/tools/fun/desktop-pet', 'LOCAL_ONLY', 20, 1, 1),
-- 趣味休闲（迭代#3 新增：色感测试、穿搭色卡、心情日记）
(14, '色感测试挑战', '🎨 你能分辨多少种颜色？3x3色块中找出不同颜色的那个，答对升级连击加分，答错扣命，难度随关卡递增，看看你是不是色感大师！', '🎨', '/tools/fun/color-sense', 'LOCAL_ONLY', 21, 0, 1),
(14, '穿搭色卡工坊', '👗 一键生成穿搭配色灵感！支持春日/夏日/秋日/冬日/甜系/酷系六种风格，随机生成4色搭配色卡，收藏喜欢的配色方案，复制色值分享给闺蜜', '👗', '/tools/fun/outfit-palette', 'LOCAL_ONLY', 22, 1, 1),
(14, '心情日记', '📔 记录每一天的小心情！日历视图可视化情绪轨迹，8种心情表情选择（开心/甜蜜/兴奋/平静/疲惫/难过/焦虑/生气），连续记录天数统计，localStorage本地持久化，粉色治愈风', '📔', '/tools/fun/mood-diary', 'LOCAL_ONLY', 23, 1, 1),
-- 趣味休闲（追加 喝水提醒器）
(14, '喝水提醒器', '💧 可爱喝水提醒小助手！定时提醒喝水、记录每日饮水杯数、SVG杯子水位动画、连续打卡天数统计、自定义每日目标&提醒间隔、浏览器通知提醒，健康生活好习惯', '💧', '/tools/fun/water-reminder', 'LOCAL_ONLY', 24, 0, 1),
-- 趣味休闲（追加 闺蜜默契测试）
(14, '闺蜜默契测试', '👯 测测你们有多了解彼此！8道趣味问题，你先答、好友再猜，匹配答案算出默契百分比，SVG环形分数动画+5级评定（一生挚友/超默契闺蜜等），闺蜜探店约会必备', '👯', '/tools/fun/bff-quiz', 'LOCAL_ONLY', 25, 0, 1),
-- 趣味休闲（追加 文字云生成器）
(14, '文字云生成器', '☁️ 把心情关键词变成漂亮文字云！5种预设主题（恋爱/心情/闺蜜/梦想/美食）、4种云图形状（圆形/爱心/星形/椭圆）、6套马卡龙配色方案、Canvas智能排版防碰撞算法、一键导出PNG图片', '☁️', '/tools/fun/word-cloud', 'LOCAL_ONLY', 26, 0, 1),
-- 趣味休闲（追加 可爱便签纸）
(14, '可爱便签纸', '🎀 粉嫩可爱的电子便签纸！6种马卡龙配色主题（粉/紫/蓝/薄荷/蜜桃/薰衣草），双击编辑内容，支持置顶/换色/Ctrl+N快捷新建，localStorage本地持久化，粉色少女心设计', '🎀', '/tools/fun/cute-notes', 'LOCAL_ONLY', 27, 1, 1),
-- 趣味休闲（追加 生日贺卡生成器）
(14, '生日贺卡生成器', '🎂 用 Canvas 绘制超美生日贺卡！6种主题风格（甜蜜粉/梦幻紫/橘子汽水/晴空蓝/薄荷绿/彩虹糖），自定义收卡人/署名/祝福语，一键下载PNG分享，生成时触发彩色纸屑动效', '🎂', '/tools/fun/birthday-card', 'LOCAL_ONLY', 28, 1, 1),
(14, '彩虹渐变文字', '🌈 输入文字一键生成超美渐变文字！12种马卡龙配色（彩虹/蜜桃/独角兽/海洋/薄荷…），实时预览+复制CSS/HTML，小红书朋友圈发帖必备', '🌈', '/tools/fun/gradient-text', 'LOCAL_ONLY', 29, 1, 1),
(14, '待办小清单', '📝 可爱粉嫩每日待办清单！添加/完成/删除事项，进度条追踪完成率，localStorage本地持久化，全部完成时触发彩屑庆祝动效，SPA 响应式设计', '📝', '/tools/fun/mini-checklist', 'LOCAL_ONLY', 30, 0, 1);

SET FOREIGN_KEY_CHECKS = 1;
