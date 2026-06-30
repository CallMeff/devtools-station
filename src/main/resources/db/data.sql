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
('图像处理', '🖼️', 10, 'OCR 文字识别、图片处理等图像工具'),
('本地工具', '💻', 11, '本地文档搜索、文件处理等纯本地工具，保障数据私密性');

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

-- 转换工具
(3, '时间戳转换', 'Unix 时间戳与日期互转', '⏰', '/tools/converter/timestamp', '/api/tools/convert/timestamp', 1, 1, 0),
(3, '进制转换', '二进制/八进制/十进制/十六进制互转', '🔢', '/tools/converter/base', '/api/tools/convert/radix', 2, 0, 0),
(3, '颜色转换', 'HEX/RGB/HSL 颜色格式互转', '🎯', '/tools/converter/color', '/api/tools/convert/color', 3, 0, 0),
(3, '大小写转换', '大小写/驼峰/蛇形/常量命名转换', '🔤', '/tools/converter/case', '/api/tools/convert/case', 4, 0, 0),
(3, 'Unicode 转换', 'Unicode 与中文互转', '🌍', '/tools/converter/unicode', '/api/tools/convert/unicode', 5, 0, 0),
(3, 'Excel转JSON', 'Excel文件(.xlsx/.xls)转换为JSON格式', '📊', '/tools/converter/excel2json', '/api/tools/convert/excel2json', 6, 0, 1),
(3, 'JSON 转 YAML', 'JSON 与 YAML 格式互转', '🔄', '/tools/converter/json-yaml', '/api/tools/convert/json-yaml', 7, 0, 1),
(3, 'JSON ↔ CSV', 'JSON 数组与 CSV 表格格式互转', '📋', '/tools/converter/json-csv', '/api/tools/client/json-csv', 8, 0, 1),

-- 生成器
(4, 'UUID 生成', '批量生成 UUID/GUID', '🆔', '/tools/generator/uuid', '/api/tools/generate/uuid', 1, 1, 0),
(4, '密码生成', '高强度随机密码生成', '🔑', '/tools/generator/password', '/api/tools/generate/password', 2, 1, 0),
(4, '随机数生成', '指定范围随机数生成', '🎰', '/tools/generator/random', '/api/tools/generate/random', 3, 0, 0),
(4, 'Lorem Ipsum', '占位文本生成', '📝', '/tools/generator/lorem', '/api/tools/generate/lorem', 4, 0, 0),
(4, '二维码生成', '文本/链接转二维码图片', '📱', '/tools/generator/qrcode', '/api/tools/generate/qrcode', 5, 0, 1),

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
(7, 'JWT 调试器', 'JWT Token 解析与字段分析（不验证签名）', '🎫', '/tools/devtools/jwt', '/api/tools/dev/jwt', 4, 0, 1),

-- 编码解码
(8, 'URL 编解码', 'URL Encode / Decode', '🔗', '/tools/encode/url', '/api/tools/encode/url', 1, 0, 0),
(8, 'HTML 实体', 'HTML 实体编码与解码', '📄', '/tools/encode/html', '/api/tools/encode/html', 2, 0, 0),
(8, '摩尔斯电码', '摩尔斯电码编解码', '📻', '/tools/encode/morse', '/api/tools/encode/morse', 3, 0, 1),
-- 金融计算
(9, '贷款计算器', '等额本息与等额本金对比计算，支持提前还款模拟和还款明细表导出', '🏦', '/tools/finance/loan-calculator', '', 1, 1, 1),
-- 图像处理
(10, 'OCR 文字识别', '图片文字识别，支持中文/英文/混合语言，支持单张和批量识别', '📸', '/tools/image/ocr', '/api/tools/ocr/single', 1, 1, 1),
-- 本地工具
(11, '本地文档瞬搜', '选择本地文件夹，纯浏览器端全文检索 Word/PDF/TXT 等文档，文件不上传，保障数据绝对私密', '🔍', '/tools/local-search/doc-search', 'LOCAL_ONLY', 1, 1, 1);
