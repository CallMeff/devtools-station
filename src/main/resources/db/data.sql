-- DevTools Station - 初始化数据
-- 先清除旧数据，确保每次重启都用正确编码重新导入
DELETE FROM dt_tool;
DELETE FROM dt_category;
ALTER TABLE dt_tool AUTO_INCREMENT = 1;
ALTER TABLE dt_category AUTO_INCREMENT = 1;

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
(2, 'JSON Schema 生成器', '输入 JSON 数据自动生成 JSON Schema (Draft 2020-12)，支持类型推断/必填标记/示例/描述/Schema 验证，一键复制下载', '🧬', '/tools/format/json-schema', 'LOCAL_ONLY', 9, 0, 1);
