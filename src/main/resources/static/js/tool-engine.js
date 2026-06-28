/**
 * DevTools Station - 工具页面交互引擎
 * 为所有36个工具提供统一的UI渲染、API调用、结果展示
 */
(function() {
    'use strict';

    const TOOL = window.__TOOL__;
    if (!TOOL || !TOOL.route) return;

    // ============ 工具配置映射 ============
    const TOOL_CONFIGS = {
        // ── 加密解密 ──
        '/tools/crypto/md5': {
            type: 'text-transform',
            endpoint: '/api/tools/crypto/hash',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '请输入要计算 MD5 的文本...' }
            ],
            staticParams: { algorithm: 'md5' },
            exampleInput: 'Hello World',
            formatOutput: function(data) { return data.hash || data.error || ''; },
            outputLabel: 'MD5 哈希值'
        },
        '/tools/crypto/sha': {
            type: 'text-transform',
            endpoint: '/api/tools/crypto/hash',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '请输入要计算哈希的文本...' }
            ],
            options: [
                { name: 'algorithm', label: '算法', type: 'select', options: [
                    { value: 'sha1', label: 'SHA-1' },
                    { value: 'sha256', label: 'SHA-256' },
                    { value: 'sha512', label: 'SHA-512' }
                ], default: 'sha256' }
            ],
            exampleInput: 'Hello World',
            formatOutput: function(data) { return data.hash || data.error || ''; },
            outputLabel: '哈希值'
        },
        '/tools/crypto/aes': {
            type: 'text-with-key',
            endpoint: '/api/tools/crypto/aes',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '加密模式：输入明文 / 解密模式：输入 Base64 密文' }
            ],
            extraInputs: [
                { name: 'key', label: '密钥（至少16个字符）', type: 'text', required: true, placeholder: '请输入 AES 密钥' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encrypt', label: '🔒 加密' },
                    { value: 'decrypt', label: '🔓 解密' }
                ], default: 'encrypt' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/crypto/bcrypt': {
            type: 'text-with-key',
            endpoint: '/api/tools/crypto/bcrypt',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入', type: 'textarea', required: true, rows: 4, placeholder: '哈希模式：输入明文密码 / 验证模式：输入待验证密码' }
            ],
            extraInputs: [
                { name: 'hash', label: 'Bcrypt 哈希值（仅验证模式需要）', type: 'text', placeholder: '$2a$12$...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'hash', label: '🔒 生成哈希' },
                    { value: 'verify', label: '✅ 验证密码' }
                ], default: 'hash' }
            ],
            formatOutput: function(data) {
                if (data.match !== undefined) return data.match === 'true' ? '✅ 密码匹配！' : '❌ 密码不匹配！';
                return data.output || data.error || '';
            }
        },
        '/tools/crypto/hmac': {
            type: 'text-with-key',
            endpoint: '/api/tools/crypto/hmac',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入消息', type: 'textarea', required: true, rows: 6, placeholder: '请输入要签名的消息...' }
            ],
            extraInputs: [
                { name: 'key', label: '密钥', type: 'text', required: true, placeholder: '请输入 HMAC 密钥' }
            ],
            options: [
                { name: 'algorithm', label: '算法', type: 'select', options: [
                    { value: 'HmacSHA256', label: 'HmacSHA256' },
                    { value: 'HmacSHA1', label: 'HmacSHA1' },
                    { value: 'HmacSHA512', label: 'HmacSHA512' },
                    { value: 'HmacMD5', label: 'HmacMD5' }
                ], default: 'HmacSHA256' }
            ],
            formatOutput: function(data) { return data.hash || data.error || ''; }
        },

        // ── 格式化工具 ──
        '/tools/format/json': {
            type: 'text-transform',
            endpoint: '/api/tools/format/json',
            method: 'POST',
            inputs: [
                { name: 'input', label: 'JSON 文本', type: 'textarea', required: true, rows: 10, placeholder: '请输入 JSON 文本...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'format', label: '✨ 美化' },
                    { value: 'minify', label: '📦 压缩' },
                    { value: 'validate', label: '✅ 校验' }
                ], default: 'format' }
            ],
            exampleInput: '{"name":"DevTools","version":"1.0","features":["crypto","format","convert"]}',
            formatOutput: function(data) {
                if (data.valid !== undefined && !data.error) {
                    return data.output || '✅ JSON 格式正确';
                }
                return data.error || data.output || '';
            }
        },
        '/tools/format/sql': {
            type: 'text-transform',
            endpoint: '/api/tools/format/sql',
            method: 'POST',
            inputs: [
                { name: 'input', label: 'SQL 语句', type: 'textarea', required: true, rows: 8, placeholder: '请输入 SQL 语句...' }
            ],
            exampleInput: 'SELECT id,name,email FROM users WHERE status=1 AND created_at > "2024-01-01" ORDER BY id DESC LIMIT 10',
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/format/css': {
            type: 'text-transform',
            endpoint: '/api/tools/format/css',
            method: 'POST',
            inputs: [
                { name: 'input', label: 'CSS 代码', type: 'textarea', required: true, rows: 8, placeholder: '请输入 CSS 代码...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'format', label: '✨ 美化' },
                    { value: 'minify', label: '📦 压缩' }
                ], default: 'format' }
            ],
            exampleInput: 'body{margin:0;padding:0;font-family:sans-serif;background:#111;color:#eee}',
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/format/html': {
            type: 'text-transform',
            endpoint: '/api/tools/format/html',
            method: 'POST',
            inputs: [
                { name: 'input', label: 'HTML 代码', type: 'textarea', required: true, rows: 10, placeholder: '请输入 HTML 代码...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'format', label: '✨ 美化' },
                    { value: 'minify', label: '📦 压缩' }
                ], default: 'format' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/format/xml': {
            type: 'text-transform',
            endpoint: '/api/tools/format/xml',
            method: 'POST',
            inputs: [
                { name: 'input', label: 'XML 文本', type: 'textarea', required: true, rows: 10, placeholder: '请输入 XML 文本...' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },

        // ── 转换工具 ──
        '/tools/converter/timestamp': {
            type: 'text-transform',
            endpoint: '/api/tools/convert/timestamp',
            method: 'POST',
            outputAsHtml: true,
            showTimestampExtras: true,
            staticParams: { mode: 'auto' },
            inputs: [
                { name: 'input', label: '输入内容', type: 'text', placeholder: '输入时间戳（秒/毫秒）或日期时间，自动识别。如 1700000000 或 2024-01-01 12:00:00' }
            ],
            formatOutput: function(data) {
                if (data.error) return '<div class="ts-error">❌ ' + escapeHtml(data.error) + '</div>';

                // 结果出来后联动日期选择器
                if (data.timestamp_millis) {
                    tsSyncPicker(new Date(data.timestamp_millis));
                }

                // 行式展示：每种转换类型一行，按分类分组
                var rows = [
                    // 时间戳
                    { category: '时间戳',    label: '秒 (10位)',       value: data.timestamp_second,  copy: data.timestamp_second },
                    { category: '时间戳',    label: '毫秒 (13位)',     value: data.timestamp_millis, copy: data.timestamp_millis },
                    { category: '时间戳',    label: '纳秒',            value: data.timestamp_nano,   copy: data.timestamp_nano },
                    // 日期时间
                    { category: '日期时间',  label: '标准格式',        value: data.datetime,          copy: data.datetime },
                    { category: '日期时间',  label: '斜杠格式',        value: data.datetime_slash,    copy: data.datetime_slash },
                    { category: '日期时间',  label: '中文格式',        value: data.datetime_cn,       copy: data.datetime_cn },
                    { category: '日期时间',  label: 'ISO 8601',        value: data.iso8601,           copy: data.iso8601 },
                    { category: '日期时间',  label: 'ISO 8601 完整',   value: data.iso8601_full,      copy: data.iso8601_full },
                    { category: '日期时间',  label: 'RFC 2822',        value: data.rfc2822,           copy: data.rfc2822 },
                    // 日期
                    { category: '日期',      label: '标准日期',        value: data.date,              copy: data.date },
                    { category: '日期',      label: '斜杠日期',        value: data.date_slash,        copy: data.date_slash },
                    { category: '日期',      label: '紧凑日期',        value: data.date_compact,      copy: data.date_compact },
                    { category: '日期',      label: '月日',            value: data.month_day,         copy: data.month_day },
                    { category: '日期',      label: '星期',            value: data.day_of_week + ' (' + data.day_of_week_short + ')', copy: data.day_of_week },
                    { category: '日期',      label: '年份',            value: data.year,              copy: data.year },
                    { category: '日期',      label: '月份',            value: data.month,             copy: data.month },
                    { category: '日期',      label: '日',              value: data.day,               copy: data.day },
                    // 时间
                    { category: '时间',      label: '标准时间',        value: data.time,              copy: data.time },
                    { category: '时间',      label: '紧凑时间',        value: data.time_compact,      copy: data.time_compact },
                    { category: '时间',      label: '时',              value: data.hour,              copy: data.hour },
                    { category: '时间',      label: '分',              value: data.minute,            copy: data.minute },
                    { category: '时间',      label: '秒',              value: data.second,            copy: data.second },
                    // UTC
                    { category: 'UTC',       label: 'UTC 时间',        value: data.utc,               copy: data.utc },
                    { category: 'UTC',       label: 'UTC ISO',         value: data.utc_iso,           copy: data.utc_iso },
                    { category: 'UTC',       label: 'UTC 偏移',        value: data.utc_offset,        copy: data.utc_offset },
                    { category: 'UTC',       label: '时区',            value: data.timezone,          copy: data.timezone }
                ];

                var html = '<div class="ts-result-box">';
                var lastCat = '';
                rows.forEach(function(row) {
                    if (row.value === undefined || row.value === null) return;
                    // 新分类加标题行
                    if (row.category !== lastCat) {
                        html += '<div class="ts-row ts-row-cat">'
                            + '<span class="ts-row-label">' + row.category + '</span>'
                            + '<span class="ts-row-spacer"></span>'
                            + '<span class="ts-row-spacer"></span>'
                            + '</div>';
                        lastCat = row.category;
                    }
                    html += '<div class="ts-row">'
                        + '<span class="ts-row-label">' + row.label + '</span>'
                        + '<code class="ts-row-value">' + escapeHtml(String(row.value)) + '</code>'
                        + '<button type="button" class="ts-row-copy" data-copy="' + escapeHtml(String(row.copy)) + '">复制</button>'
                        + '</div>';
                });

                html += '</div>';

                return html;
            }
        },
        '/tools/converter/base': {
            type: 'text-with-key',
            endpoint: '/api/tools/convert/radix',
            method: 'POST',
            inputs: [
                { name: 'input', label: '数值', type: 'text', required: true, placeholder: '请输入数值...' }
            ],
            extraInputs: [
                { name: 'fromRadix', label: '源进制 (2-36)', type: 'text', placeholder: '10' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return '十进制: ' + data.decimal + '\n二进制: ' + data.binary + '\n八进制: ' + data.octal + '\n十六进制: ' + data.hex;
            }
        },
        '/tools/converter/color': {
            type: 'text-transform',
            endpoint: '/api/tools/convert/color',
            method: 'POST',
            inputs: [
                { name: 'input', label: '颜色值', type: 'text', required: true, placeholder: '#FF5733 或 rgb(255,87,51)' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                var parts = [];
                if (data.hex) parts.push('HEX: ' + data.hex);
                if (data.rgb) parts.push('RGB: ' + data.rgb);
                if (data.rgba) parts.push('RGBA: ' + data.rgba);
                return parts.join('\n');
            }
        },
        '/tools/converter/case': {
            type: 'text-transform',
            endpoint: '/api/tools/convert/case',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 4, placeholder: '请输入要转换的文本...' }
            ],
            options: [
                { name: 'style', label: '转换风格', type: 'select', options: [
                    { value: 'upper', label: 'UPPER_CASE 全大写' },
                    { value: 'lower', label: 'lower_case 全小写' },
                    { value: 'camel', label: 'camelCase 驼峰' },
                    { value: 'pascal', label: 'PascalCase 帕斯卡' },
                    { value: 'snake', label: 'snake_case 蛇形' },
                    { value: 'kebab', label: 'kebab-case 短横' },
                    { value: 'constant', label: 'CONSTANT_CASE 常量' }
                ], default: 'lower' }
            ],
            exampleInput: 'Hello World Example',
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/converter/unicode': {
            type: 'text-transform',
            endpoint: '/api/tools/convert/unicode',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '中文文本 或 \\uXXXX 格式的 Unicode 编码' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encode', label: '文本 → Unicode编码' },
                    { value: 'decode', label: 'Unicode编码 → 文本' }
                ], default: 'decode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },

        // ── 生成器 ──
        '/tools/generator/uuid': {
            type: 'form-generator',
            endpoint: '/api/tools/generate/uuid',
            method: 'POST',
            inputs: [
                { name: 'count', label: '生成数量', type: 'number', default: 5, min: 1, max: 100 },
                { name: 'upperCase', label: '大写', type: 'checkbox' },
                { name: 'noDash', label: '移除连字符', type: 'checkbox' }
            ],
            formatOutput: function(data) {
                if (!data.uuids) return data.error || '';
                return data.uuids.join('\n');
            }
        },
        '/tools/generator/password': {
            type: 'form-generator',
            endpoint: '/api/tools/generate/password',
            method: 'POST',
            inputs: [
                { name: 'length', label: '密码长度', type: 'number', default: 16, min: 6, max: 64 },
                { name: 'hasUpper', label: '包含大写字母', type: 'checkbox', default: true },
                { name: 'hasLower', label: '包含小写字母', type: 'checkbox', default: true },
                { name: 'hasDigit', label: '包含数字', type: 'checkbox', default: true },
                { name: 'hasSpecial', label: '包含特殊字符', type: 'checkbox', default: true }
            ],
            formatOutput: function(data) {
                if (!data.password) return data.error || '';
                return '🔑 生成的密码:\n\n' + data.password + '\n\n长度: ' + (data.length || 16) + ' 字符';
            }
        },
        '/tools/generator/random': {
            type: 'form-generator',
            endpoint: '/api/tools/generate/random',
            method: 'POST',
            inputs: [
                { name: 'type', label: '类型', type: 'select', options: [
                    { value: 'number', label: '随机整数' },
                    { value: 'string', label: '随机字符串' }
                ], default: 'number' },
                { name: 'min', label: '最小值', type: 'number', default: 1 },
                { name: 'max', label: '最大值', type: 'number', default: 100 },
                { name: 'count', label: '生成数量', type: 'number', default: 10, min: 1, max: 100 },
                { name: 'length', label: '字符串长度（仅字符串模式）', type: 'number', default: 8 }
            ],
            formatOutput: function(data) {
                if (data.numbers) return data.numbers.join('\n');
                if (data.strings) return data.strings.join('\n');
                return data.error || '';
            }
        },
        '/tools/generator/lorem': {
            type: 'form-generator',
            endpoint: '/api/tools/generate/lorem',
            method: 'POST',
            inputs: [
                { name: 'paragraphs', label: '段落数', type: 'number', default: 3, min: 1, max: 20 },
                { name: 'sentencesPerParagraph', label: '每段句子数', type: 'number', default: 5, min: 1, max: 20 }
            ],
            formatOutput: function(data) { return data.text || data.error || ''; }
        },
        '/tools/generator/qrcode': {
            type: 'text-transform',
            endpoint: '/api/tools/generate/qrcode',
            method: 'POST',
            inputs: [
                { name: 'text', label: '文本 / 链接', type: 'textarea', required: true, rows: 4, placeholder: '请输入要生成二维码的文本或链接...' }
            ],
            options: [
                { name: 'size', label: '尺寸', type: 'select', options: [
                    { value: '200', label: '200x200' },
                    { value: '300', label: '300x300' },
                    { value: '400', label: '400x400' }
                ], default: '300' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return '<div class="qrcode-container"><img src="' + data.qrcode + '" alt="QR Code" style="max-width:300px;"></div>';
            },
            outputAsHtml: true
        },

        // ── 文本处理 ──
        '/tools/text/diff': {
            type: 'dual-input',
            endpoint: '/api/tools/text/diff',
            method: 'POST',
            inputs: [
                { name: 'text1', label: '原始文本', placeholder: '请输入第一段文本...' },
                { name: 'text2', label: '对比文本', placeholder: '请输入第二段文本...' }
            ],
            formatOutput: function(data) {
                if (!data.diffs) return data.error || '';
                return buildSplitDiffView(data);
            },
            outputAsHtml: true
        },
        '/tools/text/regex': {
            type: 'text-with-key',
            endpoint: '/api/tools/text/regex',
            method: 'POST',
            inputs: [
                { name: 'text', label: '测试文本', type: 'textarea', required: true, rows: 6, placeholder: '请输入要测试的文本...' }
            ],
            extraInputs: [
                { name: 'pattern', label: '正则表达式', type: 'text', required: true, placeholder: '例如：\\d{3}-\\d{4}' }
            ],
            options: [
                { name: 'flags', label: '标志', type: 'select', options: [
                    { value: '', label: '无' },
                    { value: 'i', label: 'i (忽略大小写)' },
                    { value: 'g', label: 'g (全局)' },
                    { value: 'im', label: 'im' },
                    { value: 'ims', label: 'ims' }
                ], default: '' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                if (!data.is_match) return '❌ 无匹配';
                var html = '<div style="margin-bottom:8px;">✅ 匹配 ' + data.match_count + ' 处</div>';
                if (data.matches) {
                    data.matches.forEach(function(m, i) {
                        html += '<div style="margin-bottom:4px;padding:4px 8px;background:rgba(99,102,241,0.1);border-radius:4px;">';
                        html += '[' + i + '] 位置 ' + m.index + ', 长度 ' + m.length + ': <code style="color:#a5b4fc;">' + escapeHtml(m.match) + '</code>';
                        if (m.groups) html += ' 分组: ' + JSON.stringify(m.groups);
                        html += '</div>';
                    });
                }
                return html;
            },
            outputAsHtml: true
        },
        '/tools/text/count': {
            type: 'text-transform',
            endpoint: '/api/tools/text/count',
            method: 'POST',
            inputs: [
                { name: 'text', label: '输入文本', type: 'textarea', required: true, rows: 10, placeholder: '请输入文本...' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return '📝 字符数（含空格）: ' + data.characters +
                    '\n📝 字符数（不含空格）: ' + data.characters_no_space +
                    '\n📄 单词数: ' + data.words +
                    '\n📋 行数: ' + data.lines +
                    '\n💾 UTF-8 字节数: ' + data.bytes;
            }
        },
        '/tools/text/dedup': {
            type: 'text-transform',
            endpoint: '/api/tools/text/unique',
            method: 'POST',
            inputs: [
                { name: 'text', label: '输入文本（每行一项）', type: 'textarea', required: true, rows: 10, placeholder: '请输入文本，每行一项...' }
            ],
            options: [
                { name: 'sort', label: '排序', type: 'select', options: [
                    { value: 'false', label: '保持原序' },
                    { value: 'true', label: '排序输出' }
                ], default: 'false' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return '✅ 去重后共 ' + data.unique_count + ' 行\n\n' + (data.output || '');
            }
        },
        '/tools/text/base64': {
            type: 'text-transform',
            endpoint: '/api/tools/text/base64',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 8, placeholder: '请输入要编码/解码的文本...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encode', label: 'Base64 编码' },
                    { value: 'decode', label: 'Base64 解码' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },

        // ── 网络工具 ──
        '/tools/network/ip': {
            type: 'readonly',
            endpoint: '/api/tools/network/ip',
            method: 'GET',
            autoLoad: true,
            formatOutput: function(data) {
                return '🌐 IP 地址: ' + data.ip +
                    '\n📌 IP 版本: ' + (data.ip_version || 'N/A') +
                    '\n🏠 内网地址: ' + (data.is_private ? '是' : '否') +
                    '\n🔄 回环地址: ' + (data.is_loopback ? '是' : '否') +
                    '\n\n📱 User-Agent:\n' + (data.user_agent || 'N/A');
            }
        },
        '/tools/network/ua': {
            type: 'text-transform',
            endpoint: '/api/tools/network/ua',
            method: 'POST',
            inputs: [
                { name: 'ua', label: 'User-Agent 字符串', type: 'textarea', required: true, rows: 4, placeholder: '请输入 User-Agent 字符串...' }
            ],
            formatOutput: function(data) {
                return '🖥 操作系统: ' + (data.os || 'Unknown') +
                    '\n🌐 浏览器: ' + (data.browser || 'Unknown') +
                    '\n📱 设备类型: ' + (data.device || 'Unknown') +
                    '\n⚙ 引擎: ' + (data.engine || 'Unknown');
            }
        },
        '/tools/network/http-status': {
            type: 'readonly',
            endpoint: '/api/tools/network/httpstatus',
            method: 'GET',
            autoLoad: true,
            formatOutput: function(data) {
                if (!data.categories) return '';
                var html = '';
                data.categories.forEach(function(cat) {
                    html += '<h3 style="color:#a5b4fc;margin:16px 0 8px;">' + cat.name + '</h3>';
                    html += '<table class="output-table"><thead><tr><th>状态码</th><th>名称</th><th>说明</th></tr></thead><tbody>';
                    cat.codes.forEach(function(c) {
                        html += '<tr><td>' + c.code + '</td><td>' + c.name + '</td><td>' + (c.desc || '') + '</td></tr>';
                    });
                    html += '</tbody></table>';
                });
                return html;
            },
            outputAsHtml: true
        },
        '/tools/network/url': {
            type: 'text-transform',
            endpoint: '/api/tools/network/url',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '请输入要编码或解码的 URL / 文本...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encode', label: 'URL 编码 (Encode)' },
                    { value: 'decode', label: 'URL 解码 (Decode)' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },

        // ── 开发者工具 ──
        '/tools/devtools/cron': {
            type: 'text-transform',
            endpoint: '/api/tools/dev/cron',
            method: 'POST',
            inputs: [
                { name: 'expression', label: 'Cron 表达式', type: 'text', required: true, placeholder: '0 0 12 * * ? (6个字段：秒 分 时 日 月 周)' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                var out = '📝 表达式: ' + data.expression + '\n💬 描述: ' + data.description + '\n\n📋 字段解析:\n';
                if (data.fields) {
                    out += '  秒: ' + data.fields.second + '\n';
                    out += '  分: ' + data.fields.minute + '\n';
                    out += '  时: ' + data.fields.hour + '\n';
                    out += '  日: ' + data.fields.day_of_month + '\n';
                    out += '  月: ' + data.fields.month + '\n';
                    out += '  周: ' + data.fields.day_of_week + '\n';
                }
                if (data.next_executions) {
                    out += '\n📅 说明:\n';
                    data.next_executions.forEach(function(e) { out += '  • ' + e + '\n'; });
                }
                return out;
            }
        },
        '/tools/devtools/git': {
            type: 'readonly',
            endpoint: '/api/tools/dev/git',
            method: 'GET',
            autoLoad: true,
            formatOutput: function(data) {
                if (!data.commands) return '';
                var html = '<table class="output-table"><thead><tr><th>命令</th><th>说明</th></tr></thead><tbody>';
                data.commands.forEach(function(c) {
                    html += '<tr><td><code style="color:#86efac;">' + c.command + '</code></td><td>' + c.desc + '</td></tr>';
                });
                html += '</tbody></table>';
                return html;
            },
            outputAsHtml: true
        },
        '/tools/devtools/mime': {
            type: 'readonly',
            endpoint: '/api/tools/dev/mime',
            method: 'GET',
            autoLoad: true,
            formatOutput: function(data) {
                if (!data.mime_types) return '';
                var html = '<table class="output-table"><thead><tr><th>扩展名</th><th>MIME 类型</th></tr></thead><tbody>';
                Object.entries(data.mime_types).forEach(function(e) {
                    html += '<tr><td>' + e[0] + '</td><td>' + e[1] + '</td></tr>';
                });
                html += '</tbody></table>';
                return html;
            },
            outputAsHtml: true
        },

        // ── 编码解码 ──
        '/tools/encode/url': {
            type: 'text-transform',
            endpoint: '/api/tools/encode/url',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '请输入要编码或解码的文本...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encode', label: 'URL 编码 (Encode)' },
                    { value: 'decode', label: 'URL 解码 (Decode)' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/encode/html': {
            type: 'text-transform',
            endpoint: '/api/tools/encode/html',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 8, placeholder: '请输入要编码或解码的 HTML 文本...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encode', label: 'HTML 实体编码' },
                    { value: 'decode', label: 'HTML 实体解码' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/encode/morse': {
            type: 'text-transform',
            endpoint: '/api/tools/encode/morse',
            method: 'POST',
            inputs: [
                { name: 'input', label: '输入文本', type: 'textarea', required: true, rows: 6, placeholder: '请输入要编码/解码的文本或摩尔斯电码...' }
            ],
            options: [
                { name: 'mode', label: '模式', type: 'select', options: [
                    { value: 'encode', label: '文本 → 摩尔斯电码' },
                    { value: 'decode', label: '摩尔斯电码 → 文本' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        }
    };

    const config = TOOL_CONFIGS[TOOL.route];
    if (!config) {
        document.getElementById('toolInputSection').innerHTML = '<div class="loading-placeholder">⚠️ 工具配置未找到</div>';
        return;
    }

    // ============ UI 渲染 ============
    var inputSection = document.getElementById('toolInputSection');
    var outputSection = document.getElementById('toolOutputSection');
    var errorDiv = document.getElementById('toolError');
    var outputDiv = document.getElementById('toolOutput');

    function buildUI() {
        var html = '';

        // 生成输入表单
        if (config.type === 'readonly') {
            html += '<div style="text-align:center;padding:20px;color:#9ca3af;">数据加载中...</div>';
        } else if (config.type === 'dual-input') {
            html += '<div class="input-row">';
            config.inputs.forEach(function(inp, i) {
                html += '<div class="input-group" style="flex:1;">';
                html += '<label>' + inp.label + '</label>';
                html += '<textarea name="' + inp.name + '" rows="8" placeholder="' + (inp.placeholder || '') + '" required></textarea>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            // text-transform, text-with-key, form-generator
            config.inputs.forEach(function(inp) {
                html += '<div class="input-group">';
                html += '<label>' + inp.label + '</label>';
                if (inp.type === 'textarea') {
                    html += '<textarea name="' + inp.name + '" rows="' + (inp.rows || 6) + '" placeholder="' + (inp.placeholder || '') + '"';
                    if (inp.required) html += ' required';
                    html += '></textarea>';
                } else if (inp.type === 'select') {
                    html += '<select name="' + inp.name + '">';
                    inp.options.forEach(function(opt) {
                        html += '<option value="' + opt.value + '"' + (opt.value === inp.default ? ' selected' : '') + '>' + opt.label + '</option>';
                    });
                    html += '</select>';
                } else if (inp.type === 'checkbox') {
                    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:400;color:#d1d5db;">';
                    html += '<input type="checkbox" name="' + inp.name + '"' + (inp.default ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:#6366f1;">';
                    html += inp.label + '</label>';
                } else if ((inp.type || 'text') === 'text' && config.showTimestampExtras) {
                    // 时间戳工具：输入框 + 日期选择器并排
                    html += '<div class="ts-input-row">';
                    html += '<input type="text" name="' + inp.name + '"';
                    if (inp.placeholder) html += ' placeholder="' + inp.placeholder + '"';
                    if (inp.default !== undefined) html += ' value="' + inp.default + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                    html += '<div class="ts-picker-wrap" id="tsPickerWrap">'
                        + '<div class="ts-picker-display" id="tsPickerDisplay" onclick="tsTogglePicker(event)">'
                        + '<span class="ts-picker-text" id="tsPickerText">选择日期时间...</span>'
                        + '<span class="ts-picker-icon">📅</span>'
                        + '</div>'
                        + '<div class="ts-picker-panel" id="tsPickerPanel">'
                        + '<div class="ts-picker-header">'
                        + '<button type="button" class="ts-picker-nav" onclick="tsChangeMonth(-1)">◀</button>'
                        + '<span class="ts-picker-month" id="tsPickerMonth"></span>'
                        + '<button type="button" class="ts-picker-nav" onclick="tsChangeMonth(1)">▶</button>'
                        + '</div>'
                        + '<div class="ts-picker-weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>'
                        + '<div class="ts-picker-days" id="tsPickerDays"></div>'
                        + '<div class="ts-picker-time">'
                        + '<div class="ts-spin"><button type="button" class="ts-spin-up" onclick="tsSpinTime(\'hour\',1)">▲</button>'
                        + '<input type="text" id="tsPickHour" value="0" class="ts-time-input" onwheel="tsWheelTime(event,\'hour\')" onchange="tsTimeInput(\'hour\')" maxlength="2">'
                        + '<button type="button" class="ts-spin-dn" onclick="tsSpinTime(\'hour\',-1)">▼</button></div>'
                        + '<span class="ts-time-colon">:</span>'
                        + '<div class="ts-spin"><button type="button" class="ts-spin-up" onclick="tsSpinTime(\'min\',1)">▲</button>'
                        + '<input type="text" id="tsPickMin" value="0" class="ts-time-input" onwheel="tsWheelTime(event,\'min\')" onchange="tsTimeInput(\'min\')" maxlength="2">'
                        + '<button type="button" class="ts-spin-dn" onclick="tsSpinTime(\'min\',-1)">▼</button></div>'
                        + '<span class="ts-time-colon">:</span>'
                        + '<div class="ts-spin"><button type="button" class="ts-spin-up" onclick="tsSpinTime(\'sec\',1)">▲</button>'
                        + '<input type="text" id="tsPickSec" value="0" class="ts-time-input" onwheel="tsWheelTime(event,\'sec\')" onchange="tsTimeInput(\'sec\')" maxlength="2">'
                        + '<button type="button" class="ts-spin-dn" onclick="tsSpinTime(\'sec\',-1)">▼</button></div>'
                        + '</div>'
                        + '<div class="ts-picker-footer">'
                        + '<button type="button" class="ts-picker-today" onclick="tsPickToday()">今天</button>'
                        + '<button type="button" class="ts-picker-confirm" onclick="tsPickConfirm()">确认</button>'
                        + '</div>'
                        + '</div>'
                        + '</div>';
                    html += '</div>';
                    // 快捷按钮行
                    html += '<div class="ts-input-actions">'
                        + '<button type="button" class="ts-quick-btn" onclick="tsFillNowSec()">当前秒戳</button>'
                        + '<button type="button" class="ts-quick-btn" onclick="tsFillNowMs()">当前毫秒</button>'
                        + '<button type="button" class="ts-quick-btn" onclick="tsFillNowDate()">当前日期</button>'
                        + '</div>';
                } else {
                    html += '<input type="' + (inp.type || 'text') + '" name="' + inp.name + '"';
                    if (inp.placeholder) html += ' placeholder="' + inp.placeholder + '"';
                    if (inp.default !== undefined) html += ' value="' + inp.default + '"';
                    if (inp.min !== undefined) html += ' min="' + inp.min + '" max="' + (inp.max || '') + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                }
                html += '</div>';
            });

            // 时间戳工具：当前时间快捷参考栏（已被上方替代，此分支保留向后兼容）
            if (config.showCurrentRef) {
                var nowRef = new Date();
                var s = Math.floor(nowRef.getTime() / 1000);
                var ms = nowRef.getTime();
                var ds = formatDateLocal(nowRef);
                html += '<div class="ts-now-bar">'
                    + '<span class="ts-now-label">🕐 当前</span>'
                    + '<span class="ts-now-datetime">' + ds + '</span>'
                    + '<span class="ts-now-sep">|</span>'
                    + '<span class="ts-now-meta">秒戳 <code>' + s + '</code></span>'
                    + '<button type="button" class="ts-btn-copy-sm" data-copy="' + s + '" title="复制秒级时间戳">📋</button>'
                    + '<span class="ts-now-meta">毫秒 <code>' + ms + '</code></span>'
                    + '<button type="button" class="ts-btn-copy-sm" data-copy="' + ms + '" title="复制毫秒级时间戳">📋</button>'
                    + '</div>';
            }

            // 额外输入
            if (config.extraInputs) {
                config.extraInputs.forEach(function(inp) {
                    html += '<div class="input-group">';
                    html += '<label>' + inp.label + '</label>';
                    html += '<input type="' + (inp.type || 'text') + '" name="' + inp.name + '" placeholder="' + (inp.placeholder || '') + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                    html += '</div>';
                });
            }
        }

        // 选项
        if (config.options) {
            html += '<div class="input-row" style="margin-top:12px;">';
            config.options.forEach(function(opt) {
                html += '<div class="input-group">';
                html += '<label>' + opt.label + '</label>';
                if (opt.type === 'select') {
                    html += '<select name="' + opt.name + '">';
                    opt.options.forEach(function(o) {
                        html += '<option value="' + o.value + '"' + (o.value === opt.default ? ' selected' : '') + '>' + o.label + '</option>';
                    });
                    html += '</select>';
                }
                html += '</div>';
            });
            html += '</div>';
        }

        // 示例输入
        if (config.exampleInput) {
            html += '<div class="input-hint" style="margin-top:8px;">💡 示例: <code style="color:#a5b4fc;cursor:pointer;" onclick="document.querySelector(\'[name=input]\').value=this.textContent">' + escapeHtml(config.exampleInput) + '</code></div>';
        }

        // 操作按钮
        if (config.type !== 'readonly') {
            html += '<div class="tool-actions" style="margin-top:16px;">';
            html += '<button class="btn-execute" onclick="executeTool()" id="btnExecute">⚡ 执行</button>';
            html += '<button class="btn-outline" onclick="clearAll()">🗑 清空</button>';
            html += '</div>';
        }

        inputSection.innerHTML = html;

        // 只读类型自动加载
        if (config.type === 'readonly' && config.autoLoad) {
            executeTool();
        }
    }

    // ============ API 调用 ============
    window.executeTool = function() {
        var btn = document.getElementById('btnExecute');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 处理中...'; }

        errorDiv.style.display = 'none';
        outputSection.style.display = 'none';

        var params = {};

        // 收集所有输入
        inputSection.querySelectorAll('[name]').forEach(function(el) {
            if (el.type === 'checkbox') {
                params[el.name] = el.checked;
            } else {
                params[el.name] = el.value;
            }
        });

        // 静态参数
        if (config.staticParams) {
            Object.assign(params, config.staticParams);
        }

        var url = config.endpoint;
        var options = { method: config.method, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

        if (config.method === 'POST') {
            var formBody = Object.entries(params)
                .filter(function(e) { return e[1] !== '' && e[1] !== undefined && e[1] !== null; })
                .map(function(e) { return encodeURIComponent(e[0]) + '=' + encodeURIComponent(e[1]); })
                .join('&');
            options.body = formBody;
        } else {
            var qs = Object.entries(params)
                .filter(function(e) { return e[1] !== '' && e[1] !== undefined && e[1] !== null; })
                .map(function(e) { return encodeURIComponent(e[0]) + '=' + encodeURIComponent(e[1]); })
                .join('&');
            if (qs) url += '?' + qs;
        }

        // 只读类型的加载提示
        if (config.type === 'readonly' && !btn) {
            outputSection.style.display = 'block';
            outputDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;"><span class="spinner"></span> 加载中...</div>';
        }

        fetch(url, options)
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (btn) { btn.disabled = false; btn.innerHTML = '⚡ 执行'; }
                outputSection.style.display = 'block';

                if (res.code === 200) {
                    var output = config.formatOutput(res.data);
                    if (config.outputAsHtml) {
                        outputDiv.innerHTML = output;
                    } else {
                        outputDiv.innerHTML = '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;font-family:inherit;">' + escapeHtml(output) + '</pre>';
                    }
                } else {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = '❌ ' + (res.message || '未知错误');
                }
            })
            .catch(function(err) {
                if (btn) { btn.disabled = false; btn.innerHTML = '⚡ 执行'; }
                errorDiv.style.display = 'block';
                outputSection.style.display = 'block';
                errorDiv.textContent = '❌ 网络错误: ' + err.message;
            });
    };

    // ============ 辅助函数 ============

    // 格式化本地时间为 yyyy-MM-dd HH:mm:ss
    function formatDateLocal(d) {
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
            + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    // ============ 时间戳工具专用函数 ============

    // 填入当前秒级时间戳
    window.tsFillNowSec = function() {
        var input = document.querySelector('[name="input"]');
        var sec = Math.floor(Date.now() / 1000);
        if (input) input.value = sec;
        tsSyncPicker(new Date(sec * 1000));
    };
    // 填入当前毫秒级时间戳
    window.tsFillNowMs = function() {
        var input = document.querySelector('[name="input"]');
        var ms = Date.now();
        if (input) input.value = ms;
        tsSyncPicker(new Date(ms));
    };
    // 填入当前日期时间字符串
    window.tsFillNowDate = function() {
        var input = document.querySelector('[name="input"]');
        var now = new Date();
        if (input) input.value = formatDateLocal(now);
        tsSyncPicker(now);
    };
    // ===== 自定义日期时间选择器 =====
    var tsPickYear, tsPickMonth, tsPickDay, tsPickHour, tsPickMin, tsPickSec;
    var tsPickOpen = false;

    // 初始化选中值（默认当前时间）
    (function() {
        var now = new Date();
        tsPickYear = now.getFullYear();
        tsPickMonth = now.getMonth();
        tsPickDay = now.getDate();
        tsPickHour = now.getHours();
        tsPickMin = now.getMinutes();
        tsPickSec = now.getSeconds();
    })();

    function tsPad(n) { return (n < 10 ? '0' : '') + n; }

    // 更新显示文本
    function tsUpdateDisplay() {
        var el = document.getElementById('tsPickerText');
        if (!el) return;
        el.textContent = tsPickYear + '-' + tsPad(tsPickMonth + 1) + '-' + tsPad(tsPickDay)
            + ' ' + tsPad(tsPickHour) + ':' + tsPad(tsPickMin) + ':' + tsPad(tsPickSec);
    }

    // 渲染日历面板
    function tsRenderCalendar() {
        var monthEl = document.getElementById('tsPickerMonth');
        var daysEl = document.getElementById('tsPickerDays');
        var hourEl = document.getElementById('tsPickHour');
        var minEl = document.getElementById('tsPickMin');
        var secEl = document.getElementById('tsPickSec');
        if (!monthEl || !daysEl) return;
        monthEl.textContent = tsPickYear + '年 ' + (tsPickMonth + 1) + '月';
        if (hourEl) hourEl.value = tsPad(tsPickHour);
        if (minEl) minEl.value = tsPad(tsPickMin);
        if (secEl) secEl.value = tsPad(tsPickSec);

        var firstDay = new Date(tsPickYear, tsPickMonth, 1).getDay();
        var daysInMonth = new Date(tsPickYear, tsPickMonth + 1, 0).getDate();
        var html = '';
        for (var i = 0; i < firstDay; i++) {
            html += '<span class="ts-day ts-day-empty"></span>';
        }
        var today = new Date();
        for (var d = 1; d <= daysInMonth; d++) {
            var cls = 'ts-day';
            if (d === tsPickDay) cls += ' ts-day-active';
            if (tsPickYear === today.getFullYear() && tsPickMonth === today.getMonth() && d === today.getDate()) {
                cls += ' ts-day-today';
            }
            html += '<span class="' + cls + '" onclick="tsSelectDay(' + d + ')">' + d + '</span>';
        }
        daysEl.innerHTML = html;
        tsUpdateDisplay();
    }

    // 选中某一天
    window.tsSelectDay = function(d) {
        tsPickDay = d;
        tsRenderCalendar();
    };

    // 时间滚轮/按钮调整
    window.tsSpinTime = function(unit, delta) {
        if (unit === 'hour') {
            tsPickHour = (tsPickHour + delta + 24) % 24;
        } else if (unit === 'min') {
            tsPickMin = (tsPickMin + delta + 60) % 60;
        } else {
            tsPickSec = (tsPickSec + delta + 60) % 60;
        }
        var el = document.getElementById('tsPick' + (unit === 'hour' ? 'Hour' : (unit === 'min' ? 'Min' : 'Sec')));
        if (el) el.value = tsPad(unit === 'hour' ? tsPickHour : (unit === 'min' ? tsPickMin : tsPickSec));
        tsUpdateDisplay();
    };

    // 鼠标滚轮调整时间
    window.tsWheelTime = function(e, unit) {
        e.preventDefault();
        var delta = e.deltaY < 0 ? 1 : -1;
        window.tsSpinTime(unit, delta);
    };

    // 手动输入时间
    window.tsTimeInput = function(unit) {
        var el = document.getElementById('tsPick' + (unit === 'hour' ? 'Hour' : (unit === 'min' ? 'Min' : 'Sec')));
        if (!el) return;
        var val = parseInt(el.value) || 0;
        var max = (unit === 'hour') ? 23 : 59;
        if (val < 0) val = 0;
        if (val > max) val = max;
        if (unit === 'hour') tsPickHour = val;
        else if (unit === 'min') tsPickMin = val;
        else tsPickSec = val;
        el.value = tsPad(val);
        tsUpdateDisplay();
    };

    // 切换面板开关
    window.tsTogglePicker = function(e) {
        e.stopPropagation();
        var panel = document.getElementById('tsPickerPanel');
        if (!panel) return;
        tsPickOpen = !tsPickOpen;
        panel.style.display = tsPickOpen ? 'block' : 'none';
        if (tsPickOpen) tsRenderCalendar();
    };

    // 切换月份
    window.tsChangeMonth = function(delta) {
        tsPickMonth += delta;
        if (tsPickMonth < 0) { tsPickMonth = 11; tsPickYear--; }
        if (tsPickMonth > 11) { tsPickMonth = 0; tsPickYear++; }
        // 调整日期
        var daysInMonth = new Date(tsPickYear, tsPickMonth + 1, 0).getDate();
        if (tsPickDay > daysInMonth) tsPickDay = daysInMonth;
        tsRenderCalendar();
    };

    // 今天按钮
    window.tsPickToday = function() {
        var now = new Date();
        tsPickYear = now.getFullYear();
        tsPickMonth = now.getMonth();
        tsPickDay = now.getDate();
        tsPickHour = now.getHours();
        tsPickMin = now.getMinutes();
        tsPickSec = now.getSeconds();
        tsRenderCalendar();
    };

    // 确认按钮：关闭面板 → 填入输入框 → 触发转换
    window.tsPickConfirm = function() {
        var hourEl = document.getElementById('tsPickHour');
        var minEl = document.getElementById('tsPickMin');
        var secEl = document.getElementById('tsPickSec');
        if (hourEl) tsPickHour = parseInt(hourEl.value) || 0;
        if (minEl) tsPickMin = parseInt(minEl.value) || 0;
        if (secEl) tsPickSec = parseInt(secEl.value) || 0;

        var panel = document.getElementById('tsPickerPanel');
        if (panel) panel.style.display = 'none';
        tsPickOpen = false;
        tsUpdateDisplay();

        var input = document.querySelector('[name="input"]');
        if (!input) return;
        var val = tsPickYear + '-' + tsPad(tsPickMonth + 1) + '-' + tsPad(tsPickDay)
            + ' ' + tsPad(tsPickHour) + ':' + tsPad(tsPickMin) + ':' + tsPad(tsPickSec);
        input.value = val;

        var execBtn = document.querySelector('.btn-execute');
        if (execBtn) execBtn.click();
    };

    // 联动更新选择器
    function tsSyncPicker(d) {
        tsPickYear = d.getFullYear();
        tsPickMonth = d.getMonth();
        tsPickDay = d.getDate();
        tsPickHour = d.getHours();
        tsPickMin = d.getMinutes();
        tsPickSec = d.getSeconds();
        tsUpdateDisplay();
        if (tsPickOpen) tsRenderCalendar();
    }

    // 点击面板外关闭（用 mousedown 避免 innerHTML 重渲染导致 DOM 丢失）
    document.addEventListener('mousedown', function(e) {
        if (!tsPickOpen) return;
        var wrap = document.getElementById('tsPickerWrap');
        if (wrap && !wrap.contains(e.target)) {
            var panel = document.getElementById('tsPickerPanel');
            if (panel) panel.style.display = 'none';
            tsPickOpen = false;
        }
    });
    // ============ 通用辅助函数 ============

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // 事件委托：data-copy 按钮
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-copy]');
        if (!btn) return;
        var val = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(val).then(function() {
            showToast('✅ 已复制: ' + val);
        }).catch(function() {
            showToast('⚠️ 复制失败');
        });
    });

    // ============ 并排 Diff 视图构建器 ============
    function buildSplitDiffView(data) {
        var diffs = data.diffs;
        if (!diffs || !diffs.length) return '';

        // 统计
        var added = 0, removed = 0, changed = 0;
        diffs.forEach(function(d) {
            if (d.type === 'added') added++;
            else if (d.type === 'removed') removed++;
            else if (d.type === 'changed') changed++;
        });

        var summary = '<div class="diff-summary">'
            + '<span>共 <b>' + data.total_lines + '</b> 行</span>'
            + (added   ? '<span class="added-count">+ ' + added + ' 新增</span>' : '')
            + (removed ? '<span class="removed-count">- ' + removed + ' 删除</span>' : '')
            + (changed ? '<span class="changed-count">~ ' + changed + ' 修改</span>' : '')
            + (added === 0 && removed === 0 && changed === 0 ? '<span style="color:#4ade80;">✅ 文本相同</span>' : '')
            + '</div>';

        var html = summary + '<div class="diff-split-wrap"><table class="diff-split-table">';

        // 表头
        html += '<thead><tr>'
            + '<th class="diff-col-ln">#</th><th class="diff-col-txt">📄 原始文本</th>'
            + '<th class="diff-col-sep"></th>'
            + '<th class="diff-col-ln">#</th><th class="diff-col-txt">📝 对比文本</th>'
            + '</tr></thead><tbody>';

        var leftLn = 0, rightLn = 0;

        diffs.forEach(function(d) {
            var rowClass = 'diff-row-' + d.type;
            var leftContent = '', rightContent = '';
            var lNum = '', rNum = '';

            if (d.type === 'same') {
                leftLn++; rightLn++;
                lNum = leftLn; rNum = rightLn;
                leftContent = escapeHtml(d.content);
                rightContent = escapeHtml(d.content);
            } else if (d.type === 'removed') {
                leftLn++;
                lNum = leftLn; rNum = '';
                leftContent = escapeHtml(d.content);
                rightContent = '';
                rowClass = 'diff-row-removed';
            } else if (d.type === 'added') {
                rightLn++;
                lNum = ''; rNum = rightLn;
                leftContent = '';
                rightContent = escapeHtml(d.content);
                rowClass = 'diff-row-added';
            } else if (d.type === 'changed') {
                leftLn++; rightLn++;
                lNum = leftLn; rNum = rightLn;
                var charDiff = computeCharDiff(d.old || '', d.new || '');
                leftContent = charDiff.oldHtml;
                rightContent = charDiff.newHtml;
                rowClass = 'diff-row-changed';
            }

            html += '<tr class="' + rowClass + '">'
                + '<td class="diff-cell-ln">' + lNum + '</td>'
                + '<td class="diff-cell-txt" data-side="left">' + leftContent + '</td>'
                + '<td class="diff-col-sep"></td>'
                + '<td class="diff-cell-ln" data-side="right">' + rNum + '</td>'
                + '<td class="diff-cell-txt" data-side="right">' + rightContent + '</td>'
                + '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    // ============ 字符级差异算法 (LCS) ============
    function computeCharDiff(oldStr, newStr) {
        var oldChars = Array.from(oldStr);
        var newChars = Array.from(newStr);
        var m = oldChars.length, n = newChars.length;

        // LCS DP
        var dp = new Array(m + 1);
        for (var i = 0; i <= m; i++) {
            dp[i] = new Array(n + 1);
            dp[i][0] = 0;
        }
        for (var j = 0; j <= n; j++) dp[0][j] = 0;
        for (var i = 1; i <= m; i++) {
            for (var j = 1; j <= n; j++) {
                if (oldChars[i - 1] === newChars[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // 回溯构建 HTML：相同→绿色，差异→黄色
        var oldParts = [], newParts = [];
        var i = m, j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
                // 相同字符 → 绿色高亮
                var ch = escapeHtml(oldChars[i - 1]);
                oldParts.push('<span class="diff-char-same">' + ch + '</span>');
                newParts.push('<span class="diff-char-same">' + ch + '</span>');
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                // 新文本中新增的字符 → 黄色高亮
                newParts.push('<span class="diff-char-diff">' + escapeHtml(newChars[j - 1]) + '</span>');
                j--;
            } else {
                // 旧文本中被删除的字符 → 黄色高亮
                oldParts.push('<span class="diff-char-diff">' + escapeHtml(oldChars[i - 1]) + '</span>');
                i--;
            }
        }

        return {
            oldHtml: oldParts.reverse().join(''),
            newHtml: newParts.reverse().join('')
        };
    }

    window.copyResult = function() {
        var text = outputDiv.textContent || outputDiv.innerText;
        navigator.clipboard.writeText(text).then(function() {
            showToast('✅ 已复制到剪贴板');
        }).catch(function() {
            showToast('⚠️ 复制失败，请手动选择');
        });
    };

    window.clearResult = function() {
        outputSection.style.display = 'none';
        errorDiv.style.display = 'none';
        outputDiv.innerHTML = '';
    };

    window.clearAll = function() {
        inputSection.querySelectorAll('textarea, input[type="text"], input[type="number"]').forEach(function(el) {
            el.value = '';
        });
        clearResult();
    };

    function showToast(msg) {
        var toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 2000);
    }

    // 键盘快捷键 Ctrl+Enter 执行
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (config.type !== 'readonly') executeTool();
        }
    });

    // ============ 初始化 ============
    buildUI();

    // 为只读工具类型预先设置 inputSection 提示
    if (config.type === 'readonly') {
        inputSection.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;">数据加载中...</div>';
    }
})();
