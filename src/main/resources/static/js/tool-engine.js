/**
 * DevTools Station - 工具页面交互引擎
 * 为所有工具提供统一的UI渲染、API调用、结果展示
 */
(function() {
    'use strict';

    var TOOL = window.__TOOL__;
    if (!TOOL || !TOOL.route) return;

    // i18n 辅助函数
    var __ = function(key, params) {
        if (window.__I18N__ && window.__I18N__.t) {
            return window.__I18N__.t(key, params);
        }
        return key;
    };

    // ============ 工具配置映射 ============
    var TOOL_CONFIGS = {
        // ── 加密解密 ──
        '/tools/crypto/md5': {
            type: 'text-transform',
            endpoint: '/api/tools/crypto/hash',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.md5' }
            ],
            staticParams: { algorithm: 'md5' },
            exampleInput: 'Hello World',
            formatOutput: function(data) { return data.hash || data.error || ''; },
            outputLabel: 'MD5 Hash'
        },
        '/tools/crypto/sha': {
            type: 'text-transform',
            endpoint: '/api/tools/crypto/hash',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.hash' }
            ],
            options: [
                { name: 'algorithm', i18n: 'tool_opt.algorithm', type: 'select', options: [
                    { value: 'sha1', label: 'SHA-1' },
                    { value: 'sha256', label: 'SHA-256' },
                    { value: 'sha512', label: 'SHA-512' }
                ], default: 'sha256' }
            ],
            exampleInput: 'Hello World',
            formatOutput: function(data) { return data.hash || data.error || ''; },
            outputLabel: __('tool_opt.hash')
        },
        '/tools/crypto/aes': {
            type: 'text-with-key',
            endpoint: '/api/tools/crypto/aes',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.aes' }
            ],
            extraInputs: [
                { name: 'key', i18n: 'tool_opt.key', type: 'text', required: true, ph_i18n: 'tool_opt.aes_key_ph' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encrypt', i18n: 'tool_optval.encrypt' },
                    { value: 'decrypt', i18n: 'tool_optval.decrypt' }
                ], default: 'encrypt' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/crypto/bcrypt': {
            type: 'text-with-key',
            endpoint: '/api/tools/crypto/bcrypt',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input', type: 'textarea', required: true, rows: 4, ph_i18n: 'tool_ph.bcrypt' }
            ],
            extraInputs: [
                { name: 'hash', i18n: 'tool_opt.bcrypt_hash', type: 'text', placeholder: '$2a$12$...' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'hash', i18n: 'tool_optval.hash' },
                    { value: 'verify', i18n: 'tool_optval.verify' }
                ], default: 'hash' }
            ],
            formatOutput: function(data) {
                if (data.match !== undefined) return data.match === 'true' ? __('bcrypt.match') : __('bcrypt.no_match');
                return data.output || data.error || '';
            }
        },
        '/tools/crypto/hmac': {
            type: 'text-with-key',
            endpoint: '/api/tools/crypto/hmac',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_msg', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.hmac' }
            ],
            extraInputs: [
                { name: 'key', i18n: 'tool_opt.hmac_key', type: 'text', required: true, ph_i18n: 'tool_opt.hmac_key_ph' }
            ],
            options: [
                { name: 'algorithm', i18n: 'tool_opt.algorithm', type: 'select', options: [
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
                { name: 'input', i18n: 'tool_label.json_text', type: 'textarea', required: true, rows: 10, ph_i18n: 'tool_ph.json' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'format', i18n: 'tool_optval.format' },
                    { value: 'minify', i18n: 'tool_optval.minify' },
                    { value: 'validate', i18n: 'tool_optval.validate' }
                ], default: 'format' }
            ],
            exampleInput: '{"name":"DevTools","version":"1.0","features":["crypto","format","convert"]}',
            formatOutput: function(data) {
                if (data.valid !== undefined && !data.error) {
                    return data.output || '✅ JSON OK';
                }
                return data.error || data.output || '';
            }
        },
        '/tools/format/sql': {
            type: 'text-transform',
            endpoint: '/api/tools/format/sql',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.sql_stmt', type: 'textarea', required: true, rows: 8, ph_i18n: 'tool_ph.sql' }
            ],
            exampleInput: 'SELECT id,name,email FROM users WHERE status=1 AND created_at > "2024-01-01" ORDER BY id DESC LIMIT 10',
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/format/css': {
            type: 'text-transform',
            endpoint: '/api/tools/format/css',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.css_code', type: 'textarea', required: true, rows: 8, ph_i18n: 'tool_ph.css' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'format', i18n: 'tool_optval.format' },
                    { value: 'minify', i18n: 'tool_optval.minify' }
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
                { name: 'input', i18n: 'tool_label.html_code', type: 'textarea', required: true, rows: 10, ph_i18n: 'tool_ph.html' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'format', i18n: 'tool_optval.format' },
                    { value: 'minify', i18n: 'tool_optval.minify' }
                ], default: 'format' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/format/xml': {
            type: 'text-transform',
            endpoint: '/api/tools/format/xml',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.xml_text', type: 'textarea', required: true, rows: 10, ph_i18n: 'tool_ph.xml' }
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
                { name: 'input', i18n: 'tool_label.input_content', type: 'text', ph_i18n: 'tool_ph.timestamp' }
            ],
            formatOutput: function(data) {
                if (data.error) return '<div class="ts-error">❌ ' + escapeHtml(data.error) + '</div>';

                if (data.timestamp_millis) {
                    tsSyncPicker(new Date(data.timestamp_millis));
                }

                var rows = [
                    { cat: 'ts.cat_timestamp', label: 'ts.second',       value: data.timestamp_second,  copy: data.timestamp_second },
                    { cat: 'ts.cat_timestamp', label: 'ts.millis',       value: data.timestamp_millis, copy: data.timestamp_millis },
                    { cat: 'ts.cat_timestamp', label: 'ts.nano',         value: data.timestamp_nano,   copy: data.timestamp_nano },
                    { cat: 'ts.cat_datetime',  label: 'ts.standard',     value: data.datetime,          copy: data.datetime },
                    { cat: 'ts.cat_datetime',  label: 'ts.slash',        value: data.datetime_slash,    copy: data.datetime_slash },
                    { cat: 'ts.cat_datetime',  label: 'ts.cn_format',    value: data.datetime_cn,       copy: data.datetime_cn },
                    { cat: 'ts.cat_datetime',  label: 'ts.iso8601',      value: data.iso8601,           copy: data.iso8601 },
                    { cat: 'ts.cat_datetime',  label: 'ts.iso8601_full', value: data.iso8601_full,      copy: data.iso8601_full },
                    { cat: 'ts.cat_datetime',  label: 'ts.rfc2822',      value: data.rfc2822,           copy: data.rfc2822 },
                    { cat: 'ts.cat_date',      label: 'ts.std_date',     value: data.date,              copy: data.date },
                    { cat: 'ts.cat_date',      label: 'ts.slash_date',   value: data.date_slash,        copy: data.date_slash },
                    { cat: 'ts.cat_date',      label: 'ts.compact_date', value: data.date_compact,      copy: data.date_compact },
                    { cat: 'ts.cat_date',      label: 'ts.month_day',    value: data.month_day,         copy: data.month_day },
                    { cat: 'ts.cat_date',      label: 'ts.weekday',      value: data.day_of_week + ' (' + data.day_of_week_short + ')', copy: data.day_of_week },
                    { cat: 'ts.cat_date',      label: 'ts.year',         value: data.year,              copy: data.year },
                    { cat: 'ts.cat_date',      label: 'ts.month',        value: data.month,             copy: data.month },
                    { cat: 'ts.cat_date',      label: 'ts.day',          value: data.day,               copy: data.day },
                    { cat: 'ts.cat_time',      label: 'ts.std_time',     value: data.time,              copy: data.time },
                    { cat: 'ts.cat_time',      label: 'ts.compact_time', value: data.time_compact,      copy: data.time_compact },
                    { cat: 'ts.cat_time',      label: 'ts.hour',         value: data.hour,              copy: data.hour },
                    { cat: 'ts.cat_time',      label: 'ts.minute',       value: data.minute,            copy: data.minute },
                    { cat: 'ts.cat_time',      label: 'ts.second',       value: data.second,            copy: data.second },
                    { cat: 'ts.cat_utc',       label: 'ts.utc_time',     value: data.utc,               copy: data.utc },
                    { cat: 'ts.cat_utc',       label: 'ts.utc_iso',      value: data.utc_iso,           copy: data.utc_iso },
                    { cat: 'ts.cat_utc',       label: 'ts.utc_offset',   value: data.utc_offset,        copy: data.utc_offset },
                    { cat: 'ts.cat_utc',       label: 'ts.timezone',     value: data.timezone,          copy: data.timezone }
                ];

                var html = '<div class="ts-result-box">';
                var lastCat = '';
                rows.forEach(function(row) {
                    if (row.value === undefined || row.value === null) return;
                    if (row.cat !== lastCat) {
                        html += '<div class="ts-row ts-row-cat">'
                            + '<span class="ts-row-label">' + __(row.cat) + '</span>'
                            + '<span class="ts-row-spacer"></span>'
                            + '<span class="ts-row-spacer"></span>'
                            + '</div>';
                        lastCat = row.cat;
                    }
                    html += '<div class="ts-row">'
                        + '<span class="ts-row-label">' + __(row.label) + '</span>'
                        + '<code class="ts-row-value">' + escapeHtml(String(row.value)) + '</code>'
                        + '<button type="button" class="ts-row-copy" data-copy="' + escapeHtml(String(row.copy)) + '">' + __('engine.copy') + '</button>'
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
                { name: 'input', i18n: 'tool_label.value', type: 'text', required: true, ph_i18n: 'tool_ph.radix' }
            ],
            extraInputs: [
                { name: 'fromRadix', i18n: 'tool_opt.from_radix', type: 'text', placeholder: '10' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return __('convert.decimal') + data.decimal + '\n' + __('convert.binary') + data.binary + '\n' + __('convert.octal') + data.octal + '\n' + __('convert.hex') + data.hex;
            }
        },
        '/tools/converter/color': {
            type: 'text-transform',
            endpoint: '/api/tools/convert/color',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.color_value', type: 'text', required: true, ph_i18n: 'tool_ph.color' }
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
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 4, ph_i18n: 'tool_ph.case' }
            ],
            options: [
                { name: 'style', i18n: 'tool_opt.style', type: 'select', options: [
                    { value: 'upper', i18n: 'tool_optval.upper' },
                    { value: 'lower', i18n: 'tool_optval.lower' },
                    { value: 'camel', i18n: 'tool_optval.camel' },
                    { value: 'pascal', i18n: 'tool_optval.pascal' },
                    { value: 'snake', i18n: 'tool_optval.snake' },
                    { value: 'kebab', i18n: 'tool_optval.kebab' },
                    { value: 'constant', i18n: 'tool_optval.constant' }
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
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.unicode' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encode', i18n: 'tool_optval.encode' },
                    { value: 'decode', i18n: 'tool_optval.decode' }
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
                { name: 'count', i18n: 'tool_opt.count', type: 'number', default: 5, min: 1, max: 100 },
                { name: 'upperCase', i18n: 'tool_opt.upper', type: 'checkbox' },
                { name: 'noDash', i18n: 'tool_opt.no_dash', type: 'checkbox' }
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
                { name: 'length', i18n: 'tool_opt.pwd_len', type: 'number', default: 16, min: 6, max: 64 },
                { name: 'hasUpper', i18n: 'tool_opt.has_upper', type: 'checkbox', default: true },
                { name: 'hasLower', i18n: 'tool_opt.has_lower', type: 'checkbox', default: true },
                { name: 'hasDigit', i18n: 'tool_opt.has_digit', type: 'checkbox', default: true },
                { name: 'hasSpecial', i18n: 'tool_opt.has_special', type: 'checkbox', default: true }
            ],
            formatOutput: function(data) {
                if (!data.password) return data.error || '';
                return __('gen.pwd_result') + '\n\n' + data.password + '\n\n' + __('gen.pwd_length') + ': ' + (data.length || 16) + __('gen.pwd_chars');
            }
        },
        '/tools/generator/random': {
            type: 'form-generator',
            endpoint: '/api/tools/generate/random',
            method: 'POST',
            inputs: [
                { name: 'type', i18n: 'tool_opt.type', type: 'select', options: [
                    { value: 'number', i18n: 'tool_optval.number' },
                    { value: 'string', i18n: 'tool_optval.string' }
                ], default: 'number' },
                { name: 'min', i18n: 'tool_opt.min', type: 'number', default: 1 },
                { name: 'max', i18n: 'tool_opt.max', type: 'number', default: 100 },
                { name: 'count', i18n: 'tool_opt.count', type: 'number', default: 10, min: 1, max: 100 },
                { name: 'length', i18n: 'tool_opt.str_len', type: 'number', default: 8 }
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
                { name: 'paragraphs', i18n: 'tool_opt.paragraphs', type: 'number', default: 3, min: 1, max: 20 },
                { name: 'sentencesPerParagraph', i18n: 'tool_opt.sentences', type: 'number', default: 5, min: 1, max: 20 }
            ],
            formatOutput: function(data) { return data.text || data.error || ''; }
        },
        '/tools/generator/qrcode': {
            type: 'text-transform',
            endpoint: '/api/tools/generate/qrcode',
            method: 'POST',
            inputs: [
                { name: 'text', i18n: 'tool_label.text_link', type: 'textarea', required: true, rows: 4, ph_i18n: 'tool_ph.qrcode' }
            ],
            options: [
                { name: 'size', i18n: 'tool_opt.size', type: 'select', options: [
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
                { name: 'text1', i18n: 'tool_label.original_text', ph_i18n: 'tool_ph.diff1' },
                { name: 'text2', i18n: 'tool_label.compare_text', ph_i18n: 'tool_ph.diff2' }
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
                { name: 'text', i18n: 'tool_label.test_text', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.regex' }
            ],
            extraInputs: [
                { name: 'pattern', i18n: 'tool_label.regex_pattern', type: 'text', required: true, ph_i18n: 'tool_ph.regex_pattern' }
            ],
            options: [
                { name: 'flags', i18n: 'tool_opt.flags', type: 'select', options: [
                    { value: '', i18n: 'tool_optval.none' },
                    { value: 'i', i18n: 'tool_optval.flags_i' },
                    { value: 'g', i18n: 'tool_optval.flags_g' },
                    { value: 'im', i18n: 'tool_optval.flags_im' },
                    { value: 'ims', i18n: 'tool_optval.flags_ims' }
                ], default: '' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                if (!data.is_match) return __('regex.no_match');
                var html = '<div style="margin-bottom:8px;">' + __('regex.match_count') + data.match_count + __('regex.match_units') + '</div>';
                if (data.matches) {
                    data.matches.forEach(function(m, i) {
                        html += '<div style="margin-bottom:4px;padding:4px 8px;background:rgba(99,102,241,0.1);border-radius:4px;">';
                        html += '[' + i + '] ' + __('regex.position') + m.index + __('regex.length') + m.length + ': <code style="color:#a5b4fc;">' + escapeHtml(m.match) + '</code>';
                        if (m.groups) html += __('regex.groups') + JSON.stringify(m.groups);
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
                { name: 'text', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 10, ph_i18n: 'tool_ph.count' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return __('text.char_with_space') + data.characters +
                    '\n' + __('text.char_no_space') + data.characters_no_space +
                    '\n' + __('text.words') + data.words +
                    '\n' + __('text.lines') + data.lines +
                    '\n' + __('text.bytes') + data.bytes;
            }
        },
        '/tools/text/dedup': {
            type: 'text-transform',
            endpoint: '/api/tools/text/unique',
            method: 'POST',
            inputs: [
                { name: 'text', i18n: 'tool_label.input_text_lines', type: 'textarea', required: true, rows: 10, ph_i18n: 'tool_ph.dedup' }
            ],
            options: [
                { name: 'sort', i18n: 'tool_opt.sort', type: 'select', options: [
                    { value: 'false', i18n: 'tool_optval.keep_order' },
                    { value: 'true', i18n: 'tool_optval.sorted' }
                ], default: 'false' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                return __('text.dedup_result') + data.unique_count + __('text.dedup_lines') + '\n\n' + (data.output || '');
            }
        },
        '/tools/text/base64': {
            type: 'text-transform',
            endpoint: '/api/tools/text/base64',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 8, ph_i18n: 'tool_ph.base64' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encode', i18n: 'tool_optval.base64_encode' },
                    { value: 'decode', i18n: 'tool_optval.base64_decode' }
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
                return __('ip.address') + data.ip +
                    '\n' + __('ip.version') + (data.ip_version || 'N/A') +
                    '\n' + __('ip.private') + (data.is_private ? __('ip.yes') : __('ip.no')) +
                    '\n' + __('ip.loopback') + (data.is_loopback ? __('ip.yes') : __('ip.no')) +
                    '\n\n' + __('ip.ua') + '\n' + (data.user_agent || 'N/A');
            }
        },
        '/tools/network/ua': {
            type: 'text-transform',
            endpoint: '/api/tools/network/ua',
            method: 'POST',
            inputs: [
                { name: 'ua', i18n: 'tool_label.ua_string', type: 'textarea', required: true, rows: 4, ph_i18n: 'tool_ph.ua' }
            ],
            formatOutput: function(data) {
                return __('ua.os') + (data.os || 'Unknown') +
                    '\n' + __('ua.browser') + (data.browser || 'Unknown') +
                    '\n' + __('ua.device') + (data.device || 'Unknown') +
                    '\n' + __('ua.engine') + (data.engine || 'Unknown');
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
                    html += '<table class="output-table"><thead><tr><th>' + __('http.code_col') + '</th><th>' + __('http.name_col') + '</th><th>' + __('http.desc_col') + '</th></tr></thead><tbody>';
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
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.url' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encode', i18n: 'tool_optval.url_encode' },
                    { value: 'decode', i18n: 'tool_optval.url_decode' }
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
                { name: 'expression', i18n: 'tool_label.cron_expr', type: 'text', required: true, ph_i18n: 'tool_ph.cron' }
            ],
            formatOutput: function(data) {
                if (data.error) return data.error;
                var out = __('cron.expr') + data.expression + '\n' + __('cron.desc') + data.description + '\n\n' + __('cron.field_parse') + '\n';
                if (data.fields) {
                    out += '  ' + __('cron.sec') + ': ' + data.fields.second + '\n';
                    out += '  ' + __('cron.min') + ': ' + data.fields.minute + '\n';
                    out += '  ' + __('cron.hour_field') + ': ' + data.fields.hour + '\n';
                    out += '  ' + __('cron.day') + ': ' + data.fields.day_of_month + '\n';
                    out += '  ' + __('cron.month_field') + ': ' + data.fields.month + '\n';
                    out += '  ' + __('cron.week') + ': ' + data.fields.day_of_week + '\n';
                }
                if (data.next_executions) {
                    out += '\n' + __('cron.next') + '\n';
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
                var html = '<table class="output-table"><thead><tr><th>' + __('git.cmd_col') + '</th><th>' + __('git.desc_col') + '</th></tr></thead><tbody>';
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
                var html = '<table class="output-table"><thead><tr><th>' + __('mime.ext_col') + '</th><th>' + __('mime.type_col') + '</th></tr></thead><tbody>';
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
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.url' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encode', i18n: 'tool_optval.url_encode' },
                    { value: 'decode', i18n: 'tool_optval.url_decode' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/encode/html': {
            type: 'text-transform',
            endpoint: '/api/tools/encode/html',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 8, ph_i18n: 'tool_ph.html_encode' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encode', i18n: 'tool_optval.html_encode' },
                    { value: 'decode', i18n: 'tool_optval.html_decode' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },
        '/tools/encode/morse': {
            type: 'text-transform',
            endpoint: '/api/tools/encode/morse',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text_short', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.morse' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'encode', i18n: 'tool_optval.morse_encode' },
                    { value: 'decode', i18n: 'tool_optval.morse_decode' }
                ], default: 'encode' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        }
    };

    var config = TOOL_CONFIGS[TOOL.route];
    if (!config) {
        document.getElementById('toolInputSection').innerHTML = '<div class="loading-placeholder">' + __('engine.config_not_found') + '</div>';
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
            html += '<div style="text-align:center;padding:20px;color:#9ca3af;" data-i18n="engine.loading_data">' + __('engine.loading_data') + '</div>';
        } else if (config.type === 'dual-input') {
            html += '<div class="input-row">';
            config.inputs.forEach(function(inp, i) {
                html += '<div class="input-group" style="flex:1;">';
                html += '<label data-i18n="' + inp.i18n + '">' + __(inp.i18n) + '</label>';
                html += '<textarea name="' + inp.name + '" rows="8" data-i18n-placeholder="' + inp.ph_i18n + '" placeholder="' + __(inp.ph_i18n) + '" required></textarea>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            // text-transform, text-with-key, form-generator
            config.inputs.forEach(function(inp) {
                html += '<div class="input-group">';
                html += '<label data-i18n="' + inp.i18n + '">' + __(inp.i18n) + '</label>';
                if (inp.type === 'textarea') {
                    html += '<textarea name="' + inp.name + '" rows="' + (inp.rows || 6) + '" data-i18n-placeholder="' + (inp.ph_i18n || '') + '" placeholder="' + __(inp.ph_i18n || '') + '"';
                    if (inp.required) html += ' required';
                    html += '></textarea>';
                } else if (inp.type === 'select') {
                    html += '<select name="' + inp.name + '">';
                    inp.options.forEach(function(opt) {
                        var optLabel = opt.i18n ? __(opt.i18n) : opt.label;
                        html += '<option value="' + opt.value + '" data-i18n="' + (opt.i18n || '') + '"' + (opt.value === inp.default ? ' selected' : '') + '>' + optLabel + '</option>';
                    });
                    html += '</select>';
                } else if (inp.type === 'checkbox') {
                    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:400;color:#d1d5db;">';
                    html += '<input type="checkbox" name="' + inp.name + '"' + (inp.default ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:#6366f1;">';
                    html += '<span data-i18n="' + inp.i18n + '">' + __(inp.i18n) + '</span></label>';
                } else if ((inp.type || 'text') === 'text' && config.showTimestampExtras) {
                    // 时间戳工具：输入框 + 日期选择器并排
                    html += '<div class="ts-input-row">';
                    html += '<input type="text" name="' + inp.name + '"';
                    if (inp.ph_i18n) html += ' data-i18n-placeholder="' + inp.ph_i18n + '" placeholder="' + __(inp.ph_i18n) + '"';
                    if (inp.default !== undefined) html += ' value="' + inp.default + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                    html += '<div class="ts-picker-wrap" id="tsPickerWrap">'
                        + '<div class="ts-picker-display" id="tsPickerDisplay" onclick="tsTogglePicker(event)">'
                        + '<span class="ts-picker-text" id="tsPickerText" data-i18n="ts.choose_date">' + __('ts.choose_date') + '</span>'
                        + '<span class="ts-picker-icon">📅</span>'
                        + '</div>'
                        + '<div class="ts-picker-panel" id="tsPickerPanel">'
                        + '<div class="ts-picker-header">'
                        + '<button type="button" class="ts-picker-nav" onclick="tsChangeMonth(-1)">◀</button>'
                        + '<span class="ts-picker-month" id="tsPickerMonth"></span>'
                        + '<button type="button" class="ts-picker-nav" onclick="tsChangeMonth(1)">▶</button>'
                        + '</div>'
                        + '<div class="ts-picker-weekdays"><span>' + __('ts.weekday_short_0') + '</span><span>' + __('ts.weekday_short_1') + '</span><span>' + __('ts.weekday_short_2') + '</span><span>' + __('ts.weekday_short_3') + '</span><span>' + __('ts.weekday_short_4') + '</span><span>' + __('ts.weekday_short_5') + '</span><span>' + __('ts.weekday_short_6') + '</span></div>'
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
                        + '<button type="button" class="ts-picker-today" onclick="tsPickToday()" data-i18n="ts.today">' + __('ts.today') + '</button>'
                        + '<button type="button" class="ts-picker-confirm" onclick="tsPickConfirm()" data-i18n="ts.confirm">' + __('ts.confirm') + '</button>'
                        + '</div>'
                        + '</div>'
                        + '</div>';
                    html += '</div>';
                    // 快捷按钮行
                    html += '<div class="ts-input-actions">'
                        + '<button type="button" class="ts-quick-btn" onclick="tsFillNowSec()" data-i18n="ts.now_sec">' + __('ts.now_sec') + '</button>'
                        + '<button type="button" class="ts-quick-btn" onclick="tsFillNowMs()" data-i18n="ts.now_ms">' + __('ts.now_ms') + '</button>'
                        + '<button type="button" class="ts-quick-btn" onclick="tsFillNowDate()" data-i18n="ts.now_date">' + __('ts.now_date') + '</button>'
                        + '</div>';
                } else {
                    html += '<input type="' + (inp.type || 'text') + '" name="' + inp.name + '"';
                    if (inp.ph_i18n) html += ' data-i18n-placeholder="' + inp.ph_i18n + '" placeholder="' + __(inp.ph_i18n) + '"';
                    if (inp.default !== undefined) html += ' value="' + inp.default + '"';
                    if (inp.min !== undefined) html += ' min="' + inp.min + '" max="' + (inp.max || '') + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                }
                html += '</div>';
            });
        }

        // 额外输入
        if (config.extraInputs) {
            config.extraInputs.forEach(function(inp) {
                html += '<div class="input-group">';
                html += '<label data-i18n="' + inp.i18n + '">' + __(inp.i18n) + '</label>';
                html += '<input type="' + (inp.type || 'text') + '" name="' + inp.name + '" data-i18n-placeholder="' + (inp.ph_i18n || '') + '" placeholder="' + __(inp.ph_i18n || inp.placeholder || '') + '"';
                if (inp.required) html += ' required';
                html += '>';
                html += '</div>';
            });
        }

        // 选项
        if (config.options) {
            html += '<div class="input-row" style="margin-top:12px;">';
            config.options.forEach(function(opt) {
                html += '<div class="input-group">';
                html += '<label data-i18n="' + opt.i18n + '">' + __(opt.i18n) + '</label>';
                if (opt.type === 'select') {
                    html += '<select name="' + opt.name + '">';
                    opt.options.forEach(function(o) {
                        var oLabel = o.i18n ? __(o.i18n) : o.label;
                        html += '<option value="' + o.value + '" data-i18n="' + (o.i18n || '') + '"' + (o.value === opt.default ? ' selected' : '') + '>' + oLabel + '</option>';
                    });
                    html += '</select>';
                }
                html += '</div>';
            });
            html += '</div>';
        }

        // 示例输入
        if (config.exampleInput) {
            html += '<div class="input-hint" style="margin-top:8px;" data-i18n="engine.example_hint">' + __('engine.example_hint') + '<code style="color:#a5b4fc;cursor:pointer;" onclick="document.querySelector(\'[name=input],[name=text]\').value=this.textContent">' + escapeHtml(config.exampleInput) + '</code></div>';
        }

        // 操作按钮
        if (config.type !== 'readonly') {
            html += '<div class="tool-actions" style="margin-top:16px;">';
            html += '<button class="btn-execute" onclick="executeTool()" id="btnExecute" data-i18n="engine.execute">' + __('engine.execute') + '</button>';
            html += '<button class="btn-outline" onclick="clearAll()" data-i18n="engine.clear_all">' + __('engine.clear_all') + '</button>';
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
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> ' + __('engine.executing'); }

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
            outputDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;"><span class="spinner"></span> ' + __('engine.loading') + '</div>';
        }

        fetch(url, options)
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
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
                    errorDiv.textContent = '❌ ' + (res.message || __('engine.unknown_error'));
                }
            })
            .catch(function(err) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                errorDiv.style.display = 'block';
                outputSection.style.display = 'block';
                errorDiv.textContent = __('engine.network_error') + err.message;
            });
    };

    // ============ 辅助函数 ============

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
            showToast(__('engine.copied') + val);
        }).catch(function() {
            showToast(__('engine.copy_failed'));
        });
    });

    // ============ 并排 Diff 视图构建器 ============
    function buildSplitDiffView(data) {
        var diffs = data.diffs;
        if (!diffs || !diffs.length) return '';

        var added = 0, removed = 0, changed = 0;
        diffs.forEach(function(d) {
            if (d.type === 'added') added++;
            else if (d.type === 'removed') removed++;
            else if (d.type === 'changed') changed++;
        });

        var summary = '<div class="diff-summary">'
            + '<span>' + __('diff.total') + '<b>' + data.total_lines + '</b>' + __('diff.lines') + '</span>'
            + (added   ? '<span class="added-count">+ ' + added + __('diff.added') + '</span>' : '')
            + (removed ? '<span class="removed-count">- ' + removed + __('diff.removed') + '</span>' : '')
            + (changed ? '<span class="changed-count">~ ' + changed + __('diff.changed') + '</span>' : '')
            + (added === 0 && removed === 0 && changed === 0 ? '<span style="color:#4ade80;">' + __('diff.same') + '</span>' : '')
            + '</div>';

        var html = summary + '<div class="diff-split-wrap"><table class="diff-split-table">';

        html += '<thead><tr>'
            + '<th class="diff-col-ln">#</th><th class="diff-col-txt">' + __('diff.original') + '</th>'
            + '<th class="diff-col-sep"></th>'
            + '<th class="diff-col-ln">#</th><th class="diff-col-txt">' + __('diff.compare') + '</th>'
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

        var oldParts = [], newParts = [];
        var i = m, j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
                var ch = escapeHtml(oldChars[i - 1]);
                oldParts.push('<span class="diff-char-same">' + ch + '</span>');
                newParts.push('<span class="diff-char-same">' + ch + '</span>');
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                newParts.push('<span class="diff-char-diff">' + escapeHtml(newChars[j - 1]) + '</span>');
                j--;
            } else {
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
            showToast('✅ ' + __('toast.copied') || '✅ Copied to clipboard');
        }).catch(function() {
            showToast('⚠️ ' + __('toast.copy_failed_manual') || '⚠️ Copy failed, please select manually');
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

    // ============ 语言切换时重建 UI ============
    document.addEventListener('i18n:refresh', function() {
        // 保存当前输入值
        var savedValues = {};
        inputSection.querySelectorAll('[name]').forEach(function(el) {
            if (el.type === 'checkbox') {
                savedValues[el.name] = el.checked;
            } else {
                savedValues[el.name] = el.value;
            }
        });

        // 重建 UI（buildUI 内部已用 __() 生成翻译文本，同时设置了 data-i18n 属性）
        buildUI();

        // 恢复输入值
        inputSection.querySelectorAll('[name]').forEach(function(el) {
            if (el.name in savedValues) {
                if (el.type === 'checkbox') {
                    el.checked = savedValues[el.name];
                } else {
                    el.value = savedValues[el.name];
                }
            }
        });
        // 注意：不在此处调用 refreshPage()，因为 buildUI() 已通过 data-i18n 属性标记元素，
        // refreshPage() 已在 i18n.js 的 setLanguage 中调用过，且会重新触发此事件造成无限递归
    });

    // ============ 初始化 ============
    buildUI();

    // 为只读工具类型预先设置 inputSection 提示
    if (config.type === 'readonly') {
        inputSection.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;" data-i18n="engine.loading_data">' + __('engine.loading_data') + '</div>';
    }
})();

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

function formatDateLocal(d) {
    var pad = function(n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
        + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

// ===== 自定义日期时间选择器 =====
var tsPickYear, tsPickMonth, tsPickDay, tsPickHour, tsPickMin, tsPickSec;
var tsPickOpen = false;

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

function tsUpdateDisplay() {
    var el = document.getElementById('tsPickerText');
    if (!el) return;
    el.textContent = tsPickYear + '-' + tsPad(tsPickMonth + 1) + '-' + tsPad(tsPickDay)
        + ' ' + tsPad(tsPickHour) + ':' + tsPad(tsPickMin) + ':' + tsPad(tsPickSec);
}

function tsRenderCalendar() {
    var monthEl = document.getElementById('tsPickerMonth');
    var daysEl = document.getElementById('tsPickerDays');
    var hourEl = document.getElementById('tsPickHour');
    var minEl = document.getElementById('tsPickMin');
    var secEl = document.getElementById('tsPickSec');
    if (!monthEl || !daysEl) return;
    monthEl.textContent = tsPickYear + '\u5E74 ' + (tsPickMonth + 1) + '\u6708';
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

window.tsSelectDay = function(d) {
    tsPickDay = d;
    tsRenderCalendar();
};

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

window.tsWheelTime = function(e, unit) {
    e.preventDefault();
    var delta = e.deltaY < 0 ? 1 : -1;
    window.tsSpinTime(unit, delta);
};

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

window.tsTogglePicker = function(e) {
    e.stopPropagation();
    var panel = document.getElementById('tsPickerPanel');
    if (!panel) return;
    tsPickOpen = !tsPickOpen;
    panel.style.display = tsPickOpen ? 'block' : 'none';
    if (tsPickOpen) tsRenderCalendar();
};

window.tsChangeMonth = function(delta) {
    tsPickMonth += delta;
    if (tsPickMonth < 0) { tsPickMonth = 11; tsPickYear--; }
    if (tsPickMonth > 11) { tsPickMonth = 0; tsPickYear++; }
    var daysInMonth = new Date(tsPickYear, tsPickMonth + 1, 0).getDate();
    if (tsPickDay > daysInMonth) tsPickDay = daysInMonth;
    tsRenderCalendar();
};

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

document.addEventListener('mousedown', function(e) {
    if (!tsPickOpen) return;
    var wrap = document.getElementById('tsPickerWrap');
    if (wrap && !wrap.contains(e.target)) {
        var panel = document.getElementById('tsPickerPanel');
        if (panel) panel.style.display = 'none';
        tsPickOpen = false;
    }
});
