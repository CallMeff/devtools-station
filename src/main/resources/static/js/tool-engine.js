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
                { name: 'hash', i18n: 'tool_opt.bcrypt_hash', type: 'text', placeholder: '$2a$12$...', showWhen: { name: 'mode', value: 'verify' } }
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
            outputAsHtml: true,
            formatOutput: function(data) {
                if (data.error) {
                    return data.error;
                }
                if (data.mode === 'validate') {
                    return data.valid ? (data.message || '✅ JSON OK') : (data.error || '❌ JSON Invalid');
                }

                var output = data.output || '';
                // 压缩模式：直接返回纯文本
                if (data.mode === 'minify') {
                    return '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">' +
                        '<button class="btn-sm" onclick="copyToClipboard(this)" data-copy="' + escapeHtml(output).replace(/"/g, '&quot;') + '">📋 复制</button>' +
                        '</div><pre style="margin:0;white-space:pre-wrap;word-break:break-all;font-family:inherit;">' + escapeHtml(output) + '</pre>';
                }

                // 格式化模式：尝试解析为树形视图
                try {
                    var parsed = JSON.parse(output);
                    var treeHtml = '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;gap:8px;">' +
                        '<button class="btn-sm" onclick="expandAllJsonNodes()">📂 全部展开</button>' +
                        '<button class="btn-sm" onclick="collapseAllJsonNodes()">📁 全部折叠</button>' +
                        '<button class="btn-sm" onclick="copyToClipboard(this)" data-copy="' + escapeHtml(output).replace(/"/g, '&quot;') + '">📋 复制</button>' +
                        '</div>';
                    treeHtml += '<div class="json-tree" style="font-family:monospace;font-size:13px;line-height:1.6;">';
                    treeHtml += renderJsonNode(parsed, '', true);
                    treeHtml += '</div>';

                    // 全局展开/折叠函数
                    window.expandAllJsonNodes = function() {
                        document.querySelectorAll('.json-toggle.collapsed').forEach(function(el) { el.click(); });
                    };
                    window.collapseAllJsonNodes = function() {
                        document.querySelectorAll('.json-toggle:not(.collapsed)').forEach(function(el) { el.click(); });
                    };

                    return treeHtml;
                } catch(e) {
                    return '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">' +
                        '<button class="btn-sm" onclick="copyToClipboard(this)" data-copy="' + escapeHtml(output).replace(/"/g, '&quot;') + '">📋 复制</button>' +
                        '</div><pre style="margin:0;white-space:pre-wrap;word-break:break-all;font-family:inherit;">' + escapeHtml(output) + '</pre>';
                }
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
            options: [
                { name: 'mode', i18n: 'tool_opt.mode', type: 'select', options: [
                    { value: 'format', i18n: 'tool_optval.format' },
                    { value: 'minify', i18n: 'tool_optval.minify' }
                ], default: 'format' }
            ],
            formatOutput: function(data) { return data.output || data.error || ''; }
        },

        // ── Markdown 预览 (client-calc) ──
        '/tools/format/markdown': {
            type: 'client-calc',
            inputs: [
                { name: 'markdown', i18n: 'md.input', type: 'textarea', required: true, rows: 16, ph_i18n: 'md.ph' }
            ],
            options: [
                { name: 'theme', i18n: 'md.theme', type: 'select', options: [
                    { value: 'github', i18n: 'md.theme_github' },
                    { value: 'dark', i18n: 'md.theme_dark' }
                ], default: 'github' }
            ],
            calc: function() { return true; }
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
                if (data.hsl) parts.push('HSL: ' + data.hsl);
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
        '/tools/converter/excel2json': {
            type: 'file-upload',
            endpoint: '/api/tools/convert/excel2json',
            method: 'POST',
            fileField: 'file',
            accept: '.xlsx,.xls',
            templateUrl: '/api/tools/convert/excel2json/template',
            showGuide: true,
            inputs: [
                { name: 'file', i18n: 'tool_label.excel_file', type: 'file', required: true, ph_i18n: 'tool_ph.excel2json' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.convert_mode', type: 'select', options: [
                    { value: 'array', i18n: 'tool_optval.excel_array' },
                    { value: 'objects', i18n: 'tool_optval.excel_objects' }
                ], default: 'array' }
            ],
            outputAsHtml: true,
            formatOutput: function(data) {
                if (data.error) {
                    return '<div class="excel-error">'
                        + '<div class="excel-error-icon">❌</div>'
                        + '<div class="excel-error-msg"><strong>' + __('engine.error_title') + '</strong><br>' + escapeHtml(data.error) + '</div>'
                        + '</div>';
                }

                var html = '';

                // 文件信息摘要卡片
                html += '<div class="excel-result-summary">';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('excel2json.file') + '</span><span class="excel-summary-value">' + escapeHtml(data.fileName || '-') + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('excel2json.sheet') + '</span><span class="excel-summary-value">' + escapeHtml(data.sheetName || 'Sheet1') + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('excel2json.rows') + '</span><span class="excel-summary-value">' + (data.rowCount || 0) + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('excel2json.columns') + '</span><span class="excel-summary-value">' + (data.columnCount || 0) + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('excel2json.mode') + '</span><span class="excel-summary-value">' + (data.mode === 'array' ? __('tool_optval.excel_array') : __('tool_optval.excel_objects')) + '</span></div>';
                if (data.skippedRows > 0) {
                    html += '<div class="excel-summary-item excel-summary-warn"><span class="excel-summary-label">' + __('excel2json.skipped') + '</span><span class="excel-summary-value">' + data.skippedRows + ' ' + __('excel2json.empty_rows') + '</span></div>';
                }
                html += '</div>';

                // 警告信息
                if (data.warning) {
                    html += '<div class="excel-warning">⚠️ ' + escapeHtml(data.warning) + '</div>';
                }
                if (data.warnings && data.warnings.length > 0) {
                    html += '<div class="excel-warnings-box">';
                    html += '<div class="excel-warnings-title">⚠️ ' + __('excel2json.parsing_warnings') + '</div>';
                    html += '<ul class="excel-warnings-list">';
                    data.warnings.forEach(function(w) {
                        html += '<li>' + escapeHtml(w) + '</li>';
                    });
                    html += '</ul></div>';
                }

                // Objects 模式：每行一个 JSON 对象，用数据网格表格展示
                if (data.mode === 'objects' && data.output && typeof data.output === 'object') {
                    // 后端返回 Map，转为数组便于操作
                    var rowsArr = Array.isArray(data.output) ? data.output : Object.values(data.output);
                    var rowKeys = Array.isArray(data.output) ? null : Object.keys(data.output);
                    var headers = data.headers || [];
                    var totalCols = headers.length;

                    window.__excelRowsData = rowsArr.slice();
                    window.__excelRowsFormatted = {};
                    window.__excelGridHeaders = headers;

                    html += '<div class="excel-grid-block">';
                    // 工具栏
                    html += '<div class="excel-grid-toolbar">';
                    html += '<span class="excel-grid-title">' + (data.rowCount || rowsArr.length) + ' ' + __('excel2json.rows') + ' / ' + totalCols + ' ' + __('excel2json.columns') + '</span>';
                    html += '<button class="excel-copy-btn" onclick="excelCopyAllJson()">📋 ' + __('excel2json.copy_all') + '</button>';
                    html += '</div>';

                    // 数据网格表格
                    html += '<div class="excel-grid-wrapper">';
                    html += '<table class="excel-grid-table">';
                    // 表头
                    html += '<thead><tr>';
                    html += '<th class="excel-grid-num">#</th>';
                    for (var hi = 0; hi < headers.length; hi++) {
                        html += '<th>' + escapeHtml(String(headers[hi])) + '</th>';
                    }
                    html += '<th class="excel-grid-actions-th">' + __('excel2json.actions') + '</th>';
                    html += '</tr></thead>';
                    // 数据行
                    html += '<tbody>';
                    for (var ri = 0; ri < rowsArr.length; ri++) {
                        var rowObj = rowsArr[ri];
                        var rowNum = ri + 1;
                        var rowIdx = ri;
                        html += '<tr class="excel-grid-row" data-row-idx="' + rowIdx + '" id="excelGridRow' + rowIdx + '">';
                        html += '<td class="excel-grid-num">' + rowNum + '</td>';
                        for (var ci = 0; ci < headers.length; ci++) {
                            var cellVal = rowObj[headers[ci]];
                            var displayVal = (cellVal === null || cellVal === undefined) ? '' : String(cellVal);
                            html += '<td>' + escapeHtml(displayVal) + '</td>';
                        }
                        html += '<td class="excel-grid-actions-cell">';
                        html += '<button class="excel-grid-btn" onclick="excelToggleGridRow(\'' + rowIdx + '\')" title="' + __('excel2json.format') + '">📐</button>';
                        html += '<button class="excel-grid-btn" onclick="excelCopyGridRow(\'' + rowIdx + '\')" title="' + __('tool.copy') + '">📋</button>';
                        html += '</td>';
                        html += '</tr>';
                    }
                    html += '</tbody></table>';
                    html += '</div>';
                    html += '</div>';

                    window.__excelAllJson = JSON.stringify(rowsArr);

                } else {
                    // Array 模式：整体 JSON 展示
                    var jsonStr = JSON.stringify(data.output, null, 2);
                    html += '<div class="excel-json-output">';
                    html += '<div class="excel-json-toolbar">';
                    html += '<span class="excel-json-label">JSON</span>';
                    html += '<button class="excel-copy-btn" onclick="excelCopyJson()" data-i18n="tool.copy">📋 ' + __('tool.copy') + '</button>';
                    html += '</div>';
                    html += '<pre class="excel-json-pre" id="excelJsonContent">' + escapeHtml(jsonStr) + '</pre>';
                    html += '</div>';
                    window.__excelJsonStr = jsonStr;
                }

                return html;
            }
        },

        '/tools/converter/json-yaml': {
            type: 'text-transform',
            endpoint: '/api/tools/convert/json-yaml',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text', type: 'textarea', required: true, rows: 10, ph_i18n: 'tool_ph.json_yaml' }
            ],
            options: [
                { name: 'mode', i18n: 'tool_opt.convert_direction', type: 'select', options: [
                    { value: 'json2yaml', i18n: 'tool_optval.json_to_yaml' },
                    { value: 'yaml2json', i18n: 'tool_optval.yaml_to_json' }
                ], default: 'json2yaml' }
            ],
            exampleInput: '{"name":"DevTools","version":"1.0","features":["crypto","format","convert"]}',
            formatOutput: function(data) {
                if (data.error) return data.error;
                return data.output || '';
            }
        },

        '/tools/converter/json-csv': {
            type: 'client-calc',
            inputs: [
                { name: 'input', i18n: 'tool_label.input_text', type: 'textarea', required: true, rows: 12, ph_i18n: 'jsoncsv.ph' }
            ],
            options: [
                { name: 'direction', i18n: 'jsoncsv.direction', type: 'select', options: [
                    { value: 'json2csv', i18n: 'jsoncsv.json_to_csv' },
                    { value: 'csv2json', i18n: 'jsoncsv.csv_to_json' }
                ], default: 'json2csv' },
                { name: 'delimiter', i18n: 'jsoncsv.delimiter', type: 'select', options: [
                    { value: ',', label: '逗号 (,)' },
                    { value: ';', label: '分号 (;)' },
                    { value: '\t', label: '制表符 (Tab)' }
                ], default: ',' }
            ],
            calc: function() { return true; }
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
                return '<div class="qrcode-container">' +
                    '<img src="' + data.qrcode + '" alt="QR Code" style="max-width:300px;display:block;margin:0 auto;">' +
                    '<div style="text-align:center;margin-top:12px;">' +
                    '<button class="btn-sm" onclick="downloadQRCode(\'' + data.qrcode + '\')">📥 下载二维码</button>' +
                    '</div></div>';
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
        '/tools/network/batch-http': {
            type: 'file-upload',
            endpoint: '/api/tools/network/batch-http',
            method: 'POST',
            fileField: 'file',
            accept: '.xlsx,.xls',
            templateUrl: '/api/tools/network/batch-http/template',
            showGuide: true,
            guideGroup: 'batch_http',
            inputs: [
                { name: 'file', i18n: 'tool_label.excel_file', type: 'file', required: true, ph_i18n: 'tool_ph.batch_http' }
            ],
            extraInputs: [
                { name: 'url', i18n: 'batch_http.url', type: 'text', required: true, ph_i18n: 'batch_http.url_ph', default: 'http://localhost:8088/api/tools/network/batch-http/test' },
                { name: 'headers', i18n: 'batch_http.headers', type: 'textarea', rows: 3, ph_i18n: 'batch_http.headers_ph' }
            ],
            options: [
                { name: 'method', i18n: 'batch_http.method', type: 'select', options: [
                    { value: 'GET', i18n: 'batch_http.method_get' },
                    { value: 'POST', i18n: 'batch_http.method_post' },
                    { value: 'PUT', i18n: 'batch_http.method_put' },
                    { value: 'PATCH', i18n: 'batch_http.method_patch' },
                    { value: 'DELETE', i18n: 'batch_http.method_delete' }
                ], default: 'POST' },
                { name: 'sendMode', i18n: 'batch_http.send_mode', type: 'select', options: [
                    { value: 'one_per_row', i18n: 'batch_http.one_per_row' },
                    { value: 'all_at_once', i18n: 'batch_http.all_at_once' }
                ], default: 'one_per_row' }
            ],
            outputAsHtml: true,
            formatOutput: function(data) {
                if (data.error) {
                    return '<div class="excel-error">'
                        + '<div class="excel-error-icon">❌</div>'
                        + '<div class="excel-error-msg"><strong>' + __('engine.error_title') + '</strong><br>' + escapeHtml(data.error) + '</div>'
                        + '</div>';
                }

                var html = '';

                // 请求摘要
                html += '<div class="excel-result-summary">';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">🔗 URL</span><span class="excel-summary-value" style="font-family:monospace;font-size:12px;">' + escapeHtml(data.url || '') + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('batch_http.method') + '</span><span class="excel-summary-value" style="font-weight:700;color:#6366f1;">' + escapeHtml(data.method || '') + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('batch_http.send_mode') + '</span><span class="excel-summary-value">' + (data.sendMode === 'all_at_once' ? __('batch_http.all_at_once') : __('batch_http.one_per_row')) + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">' + __('excel2json.rows') + '</span><span class="excel-summary-value">' + (data.rowCount || 0) + '</span></div>';
                html += '<div class="excel-summary-item"><span class="excel-summary-label">⏱ ' + __('batch_http.total_time') + '</span><span class="excel-summary-value">' + (data.totalTime || 0) + 'ms</span></div>';
                html += '</div>';

                // 统计条
                var successCount = data.successCount || 0;
                var failCount = data.failCount || 0;
                var totalCount = data.totalCount || 0;
                html += '<div class="batch-http-stats">';
                html += '<span class="batch-stat batch-stat-ok">✅ ' + successCount + ' ' + __('batch_http.success') + '</span>';
                html += '<span class="batch-stat batch-stat-fail">❌ ' + failCount + ' ' + __('batch_http.failed') + '</span>';
                html += '<span class="batch-stat batch-stat-total">📊 ' + totalCount + ' ' + __('batch_http.total') + '</span>';
                html += '</div>';

                // 结果列表
                if (data.results && data.results.length > 0) {
                    html += '<div class="batch-http-results">';
                    var results = data.results;
                    for (var i = 0; i < results.length; i++) {
                        var r = results[i];
                        var isOk = r.status >= 200 && r.status < 300;
                        var statusClass = isOk ? 'batch-status-ok' : 'batch-status-fail';
                        var statusText = r.status === 0 ? 'ERROR' : String(r.status);
                        var rowIdx = r.rowIndex;
                        var rowLabel = rowIdx > 0 ? '#' + rowIdx : '📦';

                        html += '<div class="batch-http-item ' + statusClass + '">';
                        html += '<div class="batch-item-header">';
                        html += '<span class="batch-item-num">' + rowLabel + '</span>';
                        html += '<span class="batch-item-status">' + statusText + '</span>';
                        html += '<span class="batch-item-time">' + (r.time || 0) + 'ms</span>';
                        html += '<div class="batch-item-actions">';
                        html += '<button class="batch-copy-btn" onclick="batchHttpCopyRow(' + i + ')" title="' + __('tool.copy') + '">📋</button>';
                        html += '</div>';
                        html += '</div>';

                        // 如果有错误
                        if (r.error) {
                            html += '<div class="batch-item-error">⚠️ ' + escapeHtml(r.error) + '</div>';
                        }

                        // 响应体（折叠）
                        if (r.body) {
                            var bodyId = 'batchHttpBody' + i;
                            var shortBody = r.body.length > 300 ? escapeHtml(r.body.substring(0, 300)) + '...' : escapeHtml(r.body);
                            html += '<div class="batch-item-body-wrapper">';
                            html += '<pre class="batch-item-body" id="' + bodyId + '">' + shortBody + '</pre>';
                            if (r.body && r.body.length > 300) {
                                html += '<button class="batch-expand-btn" onclick="batchHttpToggleBody(\'' + bodyId + '\')" data-full="">' + __('batch_http.expand') + '</button>';
                            }
                            html += '</div>';
                        }

                        // 请求数据（只有 one_per_row 模式显示）
                        if (r.rowData) {
                            var dataId = 'batchHttpData' + i;
                            html += '<div class="batch-item-data-wrapper" style="display:none;" id="' + dataId + '_wrapper">';
                            html += '<pre class="batch-item-data" id="' + dataId + '">' + escapeHtml(JSON.stringify(r.rowData, null, 2)) + '</pre>';
                            html += '</div>';
                        }

                        html += '</div>';
                    }
                    html += '</div>';

                    // 存储数据供复制
                    window.__batchHttpResults = results;
                }

                return html;
            }
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
        '/tools/devtools/jwt': {
            type: 'text-transform',
            endpoint: '/api/tools/dev/jwt',
            method: 'POST',
            inputs: [
                { name: 'input', i18n: 'tool_label.jwt_token', type: 'textarea', required: true, rows: 6, ph_i18n: 'tool_ph.jwt' }
            ],
            exampleInput: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            formatOutput: function(data) {
                if (data.error) return '<div class="ts-error">❌ ' + escapeHtml(data.error) + '</div>';
                if (data.payload_error) return '<div class="ts-error">⚠️ ' + escapeHtml(data.payload_error) + '</div>';

                var html = '';

                // 状态横幅
                var isExpired = data.is_expired;
                var statusColor = data.status.indexOf('过期') > -1 ? '#ef4444' : (data.status.indexOf('有效') > -1 ? '#4ade80' : '#f59e0b');
                html += '<div class="jwt-status-banner" style="padding:8px 16px;border-radius:8px;margin-bottom:16px;background:' + (isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)') + ';border:1px solid ' + statusColor + ';">';
                html += '<span style="color:' + statusColor + ';font-weight:600;">' + (isExpired ? '⏰ ' : '✅ ') + escapeHtml(data.status) + '</span>';
                if (data.algorithm) {
                    html += '<span style="margin-left:16px;color:#9ca3af;">' + escapeHtml(data.algorithm) + '</span>';
                }
                html += '</div>';

                // Header
                html += '<div class="jwt-section"><h4 style="color:#a5b4fc;margin:0 0 8px;">📋 Header</h4>';
                html += '<pre style="margin:0;background:rgba(0,0,0,0.2);padding:10px;border-radius:6px;font-size:13px;white-space:pre-wrap;">' + escapeHtml(data.header_raw || '{}') + '</pre></div>';

                // Payload
                html += '<div class="jwt-section"><h4 style="color:#6ee7b7;margin:16px 0 8px;">📦 Payload</h4>';
                html += '<pre style="margin:0;background:rgba(0,0,0,0.2);padding:10px;border-radius:6px;font-size:13px;white-space:pre-wrap;">' + escapeHtml(data.payload_raw || '{}') + '</pre></div>';

                // 时间字段
                if (data.time_fields && data.time_fields.length > 0) {
                    html += '<div class="jwt-section"><h4 style="color:#fbbf24;margin:16px 0 8px;">⏱️ 时间字段</h4>';
                    html += '<table class="output-table"><thead><tr><th>字段</th><th>日期时间</th><th>Unix 秒</th></tr></thead><tbody>';
                    data.time_fields.forEach(function(f) {
                        html += '<tr><td>' + escapeHtml(f.name) + '</td><td>' + escapeHtml(f.value) + '</td><td><code>' + escapeHtml(f.epoch_seconds) + '</code></td></tr>';
                    });
                    html += '</tbody></table></div>';
                }

                // 签名
                if (data.signature_present) {
                    html += '<div class="jwt-section"><h4 style="color:#f472b6;margin:16px 0 8px;">🔏 签名</h4>';
                    html += '<code style="word-break:break-all;color:#9ca3af;font-size:12px;">' + escapeHtml(data.signature_short || data.signature) + '</code></div>';
                }

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
        },
        // ── 金融计算 ──
        '/tools/finance/loan-calculator': {
            type: 'client-calc',
            inputs: [
                { name: 'amount', i18n: 'loan.amount', type: 'number', required: true, step: '0.01', min: '1', default: '1000000' },
                { name: 'rate', i18n: 'loan.rate', type: 'number', required: true, step: '0.01', min: '0.01', default: '4.9' },
                { name: 'years', i18n: 'loan.years', type: 'number', required: true, step: '1', min: '1', max: '50', default: '30' },
                { name: 'prepayAmount', i18n: 'loan.prepay_amount', type: 'number', step: '0.01', min: '0', default: '' },
                { name: 'prepayMonth', i18n: 'loan.prepay_month', type: 'number', step: '1', min: '1', default: '' }
            ],
            options: [
                { name: 'method', i18n: 'loan.method', type: 'select', options: [
                    { value: 'both', i18n: 'loan.method_both' },
                    { value: 'equal_installment', i18n: 'loan.method_ei' },
                    { value: 'equal_principal', i18n: 'loan.method_ep' }
                ], default: 'both' }
            ],
            calc: function() { return true; }  // 占位，实际计算见下方 loanCalc 函数
        },
        // ── 图像处理（纯浏览器端 OCR，无需安装任何软件）──
        '/tools/image/ocr': {
            type: 'ocr-client',
            inputs: [
                { name: 'file', i18n: 'ocr.file', type: 'file' }
            ],
            options: [
                { name: 'language', i18n: 'ocr.language', type: 'select', options: [
                    { value: 'chi_sim+eng', i18n: 'ocr.lang_chi_eng' },
                    { value: 'chi_sim', i18n: 'ocr.lang_chi' },
                    { value: 'eng', i18n: 'ocr.lang_eng' },
                    { value: 'chi_sim+eng+jpn', i18n: 'ocr.lang_multi' }
                ], default: 'chi_sim+eng' },
                { name: 'mode', i18n: 'ocr.mode', type: 'select', options: [
                    { value: 'single', i18n: 'ocr.mode_single' },
                    { value: 'batch', i18n: 'ocr.mode_batch' }
                ], default: 'single' }
            ],
            accept: '.png,.jpg,.jpeg,.gif,.bmp,.tiff,.tif,.webp',
            maxFileSize: 10 * 1024 * 1024,
            maxBatchFiles: 20,
            showGuide: true,
            guideGroup: 'ocr',
            ocrClient: true,
            formatOutput: function(data) {
                if (data.error) return '<div class="ocr-error">' + escapeHtml(data.error) + '</div>';
                if (data.text !== undefined) {
                    var bytes = new Blob([data.text]).size;
                    return '<div class="ocr-result-header">' +
                        '<span>📄 ' + data.fileName + '</span>' +
                        '<span class="ocr-meta">' + data.textLength + ' 字符 / ' + data.lineCount + ' 行 / ' + formatFileSize(bytes) + '</span>' +
                        '</div>' +
                        '<div class="ocr-text-wrap">' +
                        '<pre class="ocr-text">' + escapeHtml(data.text) + '</pre>' +
                        '</div>' +
                        '<button class="btn-sm" style="margin-top:8px;" onclick="copyOcrResult(this)" data-text="' + escapeHtml(data.text).replace(/"/g, '&quot;') + '">📋 复制文字</button>';
                }
                // batch result
                if (data.items) {
                    return renderOcrBatchResult(data);
                }
                return '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            },
            outputAsHtml: true
        }
    };

    var config = TOOL_CONFIGS[TOOL.route];
    if (!config) {
        // LOCAL_ONLY: 纯前端工具，不需要工具引擎渲染
        if (TOOL.apiPath === 'LOCAL_ONLY') {
            document.getElementById('toolInputSection').innerHTML = '';
            document.getElementById('toolOutputSection').style.display = 'block';
            document.getElementById('toolOutput').innerHTML = '<div class="loading-placeholder" style="text-align:center;padding:40px;">🔧 ' + __('tool.loading') + '</div>';
            return;
        }
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
        } else if (config.type === 'file-upload') {
            // 功能引导说明
            if (config.showGuide) {
                var guideG = config.guideGroup || 'excel2json';
                html += '<div class="excel-guide-panel">';
                html += '<div class="excel-guide-title">📖 ' + __(guideG + '.guide_title') + '</div>';
                html += '<div class="excel-guide-steps">';
                html += '<div class="excel-guide-step">';
                html += '<span class="excel-step-num">1</span>';
                html += '<span class="excel-step-text">' + __(guideG + '.guide_step1') + '</span>';
                html += '</div>';
                html += '<div class="excel-guide-step">';
                html += '<span class="excel-step-num">2</span>';
                html += '<span class="excel-step-text">' + __(guideG + '.guide_step2') + '</span>';
                html += '</div>';
                html += '<div class="excel-guide-step">';
                html += '<span class="excel-step-num">3</span>';
                html += '<span class="excel-step-text">' + __(guideG + '.guide_step3') + '</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }

            // 模板下载按钮（支持按 guideGroup 区分不同工具的模板提示文字）
            if (config.templateUrl) {
                var tplPrefix = config.guideGroup || 'excel2json';
                var templateTip = __(tplPrefix + '.template_tip') !== (tplPrefix + '.template_tip') ? __(tplPrefix + '.template_tip') : __('excel2json.template_tip');
                var downloadLabel = __(tplPrefix + '.download_template') !== (tplPrefix + '.download_template') ? __(tplPrefix + '.download_template') : __('excel2json.download_template');
                html += '<div class="excel-template-bar">';
                html += '<span class="excel-template-tip">💡 ' + templateTip + '</span>';
                html += '<a href="' + config.templateUrl + '" class="excel-template-btn">📥 ' + downloadLabel + '</a>';
                html += '</div>';
            }

            // 文件上传类型
            config.inputs.forEach(function(inp) {
                html += '<div class="input-group">';
                html += '<label data-i18n="' + inp.i18n + '">' + __(inp.i18n) + '</label>';
                html += '<div class="file-upload-area" id="fileUploadArea">';
                html += '<input type="file" name="' + inp.name + '" id="fileInput"';
                if (config.accept) html += ' accept="' + config.accept + '"';
                html += ' style="display:none;" onchange="onFileSelected(this)">';
                html += '<div class="file-upload-label" onclick="document.getElementById(\'fileInput\').click()">';
                html += '<span class="file-upload-icon">📁</span>';
                html += '<span class="file-upload-text" data-i18n="excel2json.select_file">' + __('excel2json.select_file') + '</span>';
                html += '<span class="file-upload-hint" data-i18n="excel2json.supported_formats">' + __('excel2json.supported_formats') + '</span>';
                html += '</div>';
                html += '<div class="file-selected-info" id="fileSelectedInfo" style="display:none;">';
                html += '<span class="file-name" id="selectedFileName"></span>';
                html += '<button type="button" class="file-clear-btn" onclick="clearFileSelection()">✕</button>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            });
        } else if (config.type === 'ocr-upload' || config.type === 'ocr-client') {
            // OCR 功能引导
            if (config.showGuide) {
                var guideG = config.guideGroup || 'ocr';
                html += '<div class="excel-guide-panel">';
                html += '<div class="excel-guide-title">📖 ' + __(guideG + '.guide_title') + '</div>';
                html += '<div class="excel-guide-steps">';
                html += '<div class="excel-guide-step">';
                html += '<span class="excel-step-num">1</span>';
                html += '<span class="excel-step-text">' + __(guideG + '.guide_step1') + '</span>';
                html += '</div>';
                html += '<div class="excel-guide-step">';
                html += '<span class="excel-step-num">2</span>';
                html += '<span class="excel-step-text">' + __(guideG + '.guide_step2') + '</span>';
                html += '</div>';
                html += '<div class="excel-guide-step">';
                html += '<span class="excel-step-num">3</span>';
                html += '<span class="excel-step-text">' + __(guideG + '.guide_step3') + '</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }

            // OCR 上传区域 — 单张模式
            html += '<div id="ocrSingleArea">';
            html += '<div class="input-group">';
            html += '<label data-i18n="ocr.file">' + __('ocr.file') + '</label>';
            html += '<div class="file-upload-area" id="fileUploadArea">';
            html += '<input type="file" name="file" id="fileInput"';
            if (config.accept) html += ' accept="' + config.accept + '"';
            html += ' style="display:none;" onchange="onFileSelected(this)">';
            html += '<div class="file-upload-label" onclick="document.getElementById(\'fileInput\').click()">';
            html += '<span class="file-upload-icon">🖼️</span>';
            html += '<span class="file-upload-text" data-i18n="ocr.select_file">' + __('ocr.select_file') + '</span>';
            html += '<span class="file-upload-hint" data-i18n="ocr.supported_formats">' + __('ocr.supported_formats') + '</span>';
            html += '</div>';
            html += '<div class="file-selected-info" id="fileSelectedInfo" style="display:none;">';
            html += '<span class="file-name" id="selectedFileName"></span>';
            html += '<button type="button" class="file-clear-btn" onclick="clearFileSelection()">✕</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

            // OCR 上传区域 — 批量模式（默认隐藏）
            html += '<div id="ocrBatchArea" style="display:none;">';
            html += '<div class="input-group">';
            html += '<label data-i18n="ocr.files">' + __('ocr.files') + '</label>';
            html += '<div class="file-upload-area" id="fileUploadAreaBatch">';
            html += '<input type="file" name="files" id="fileInputBatch" multiple';
            if (config.accept) html += ' accept="' + config.accept + '"';
            html += ' style="display:none;" onchange="onBatchFilesSelected(this)">';
            html += '<div class="file-upload-label" onclick="document.getElementById(\'fileInputBatch\').click()">';
            html += '<span class="file-upload-icon">📚</span>';
            html += '<span class="file-upload-text" data-i18n="ocr.select_files">' + __('ocr.select_files') + '</span>';
            html += '<span class="file-upload-hint">' + __('ocr.batch_hint') + '</span>';
            html += '</div>';
            html += '<div class="file-selected-info" id="fileSelectedInfoBatch" style="display:none;">';
            html += '<span class="file-name" id="selectedFileNameBatch"></span>';
            html += '<button type="button" class="file-clear-btn" onclick="clearBatchFileSelection()">✕</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
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
                var conditionalAttrs = '';
                var conditionalStyle = '';
                if (inp.showWhen) {
                    conditionalAttrs = ' data-show-when-name="' + inp.showWhen.name + '" data-show-when-value="' + inp.showWhen.value + '"';
                    conditionalStyle = ' style="display:none;"';
                }
                html += '<div class="input-group"' + conditionalAttrs + conditionalStyle + '>';
                html += '<label data-i18n="' + inp.i18n + '">' + __(inp.i18n) + '</label>';
                if (inp.type === 'textarea') {
                    html += '<textarea name="' + inp.name + '" rows="' + (inp.rows || 3) + '" data-i18n-placeholder="' + (inp.ph_i18n || '') + '" placeholder="' + __(inp.ph_i18n || inp.placeholder || '') + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                    if (inp.default !== undefined) html += inp.default;
                    html += '</textarea>';
                } else {
                    html += '<input type="' + (inp.type || 'text') + '" name="' + inp.name + '" data-i18n-placeholder="' + (inp.ph_i18n || '') + '" placeholder="' + __(inp.ph_i18n || inp.placeholder || '') + '"';
                    if (inp.default !== undefined) html += ' value="' + inp.default + '"';
                    if (inp.required) html += ' required';
                    html += '>';
                }
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
        bindConditionalInputs();

        // Markdown 预览：输入时自动实时刷新
        if (TOOL.route === '/tools/format/markdown') {
            var mdArea = document.querySelector('[name="markdown"]');
            if (mdArea) {
                var debounceTimer;
                mdArea.addEventListener('input', function() {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(function() {
                        executeTool();
                    }, 400);
                });
                // 初始加载示例内容
                if (!mdArea.value) {
                    mdArea.value = __(mdArea.getAttribute('data-i18n-placeholder') || 'md.ph');
                }
            }
        }

        // OCR 模式切换：单张 ↔ 批量
        if (config.type === 'ocr-upload' || config.type === 'ocr-client') {
            var modeSelect = document.getElementById('option_mode');
            var singleArea = document.getElementById('ocrSingleArea');
            var batchArea = document.getElementById('ocrBatchArea');
            if (modeSelect && singleArea && batchArea) {
                var toggleOcrMode = function() {
                    if (modeSelect.value === 'batch') {
                        singleArea.style.display = 'none';
                        batchArea.style.display = 'block';
                    } else {
                        singleArea.style.display = 'block';
                        batchArea.style.display = 'none';
                    }
                };
                modeSelect.addEventListener('change', toggleOcrMode);
                toggleOcrMode();
            }
        }

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

        // JSON 工具：客户端预校验，即时反馈
        if (TOOL.route === '/tools/format/json') {
            var jsonInputEl = document.querySelector('[name="input"]');
            var jsonInput = jsonInputEl ? jsonInputEl.value : '';
            if (!jsonInput || !jsonInput.trim()) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠ ' + __('validate.json_empty');
                return;
            }
            try {
                JSON.parse(jsonInput);
            } catch (e) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠ ' + __('validate.json_invalid') + ': ' + e.message;
                return;
            }
        }

        // 文件上传类型：使用 FormData + multipart/form-data
        if (config.type === 'file-upload') {
            var fileInput = document.getElementById('fileInput');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                // 清空上次结果
                outputDiv.innerHTML = '';
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠ ' + __('excel2json.no_file');
                return;
            }

            var file = fileInput.files[0];
            var fileName = file.name || '';

            // 前端预校验：文件格式
            if (config.accept) {
                var acceptList = Array.isArray(config.accept) ? config.accept : config.accept.split(',');
                var extOk = false;
                var lowerName = fileName.toLowerCase();
                for (var ei = 0; ei < acceptList.length; ei++) {
                    if (lowerName.endsWith(acceptList[ei].trim().toLowerCase())) {
                        extOk = true;
                        break;
                    }
                }
                if (!extOk) {
                    if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                    outputDiv.innerHTML = '';
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = '⚠ ' + __('excel2json.invalid_format');
                    return;
                }
            }

            // 前端预校验：空文件
            if (file.size === 0) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                outputDiv.innerHTML = '';
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠ ' + __('excel2json.empty_file');
                return;
            }

            var formData = new FormData();
            formData.append(config.fileField || 'file', file);

            // 收集所有非文件字段：text/textarea/select
            inputSection.querySelectorAll('input[name], textarea[name], select[name]').forEach(function(el) {
                if (el.type === 'file') return;
                if (el.disabled) return;
                formData.append(el.name, el.value);
            });

            var url = config.endpoint;
            var options = { method: 'POST', body: formData };

            fetch(url, options)
                .then(function(r) { return r.json(); })
                .then(function(res) {
                    if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                    outputSection.style.display = 'block';
                    if (res.code === 200) {
                        var output = config.formatOutput(res.data);
                        if (config.outputAsHtml) {
                            outputDiv.className = 'tool-output tool-output-html';
                            outputDiv.innerHTML = output;
                        } else {
                            outputDiv.className = 'tool-output';
                            outputDiv.innerHTML = '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;font-family:inherit;">' + escapeHtml(output) + '</pre>';
                        }
                    } else {
                        // 清空上次成功的结果
                        outputDiv.innerHTML = '';
                        errorDiv.style.display = 'block';
                        errorDiv.textContent = '❌ ' + (res.message || __('engine.unknown_error'));
                    }
                })
                .catch(function(err) {
                    if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                    // 清空上次成功的结果
                    outputDiv.innerHTML = '';
                    errorDiv.style.display = 'block';
                    outputSection.style.display = 'block';
                    errorDiv.textContent = __('engine.network_error') + err.message;
                });
            return;
        }

        // OCR 识别：纯浏览器端 Tesseract.js，无需安装任何软件
        if (config.type === 'ocr-upload' || config.type === 'ocr-client') {
            var modeEl = document.getElementById('option_mode');
            var isBatch = modeEl && modeEl.value === 'batch';
            var fileInput = isBatch ? document.getElementById('fileInputBatch') : document.getElementById('fileInput');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                outputDiv.innerHTML = '';
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠ ' + __('ocr.no_file');
                return;
            }
            var maxSize = config.maxFileSize || 10 * 1024 * 1024;
            if (isBatch && fileInput.files.length > (config.maxBatchFiles || 20)) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠ ' + __('ocr.too_many_files').replace('{0}', config.maxBatchFiles);
                return;
            }
            for (var fi = 0; fi < fileInput.files.length; fi++) {
                if (fileInput.files[fi].size > maxSize) {
                    if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = '⚠ ' + __('ocr.file_too_large').replace('{0}', fileInput.files[fi].name);
                    return;
                }
            }

            var langEl = document.getElementById('option_language');
            var lang = langEl ? langEl.value : 'chi_sim+eng';

            outputDiv.className = 'tool-output tool-output-html';
            outputDiv.innerHTML = '<div style="text-align:center;padding:20px;" id="ocrProgressWrap">' +
                // 阶段标题
                '<div id="ocrLoadTitle" style="font-size:17px;font-weight:600;margin-bottom:14px;color:#e0e7ff;">⏳ 准备中...</div>' +
                // 进度条 + 百分比
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
                '<div style="flex:1;height:8px;background:#374151;border-radius:4px;overflow:hidden;">' +
                '<div id="ocrLoadBar" class="ocr-progress-bar" style="width:2%;height:100%;border-radius:4px;transition:width 0.4s ease;"></div>' +
                '</div>' +
                '<div id="ocrPercent" style="font-size:14px;font-weight:700;color:#a5b4fc;min-width:36px;text-align:right;">2%</div>' +
                '</div>' +
                // 阶段指示器（5个步骤点）
                '<div id="ocrPhase" style="display:flex;align-items:center;justify-content:center;gap:6px;margin:10px 0;font-size:12px;flex-wrap:wrap;"></div>' +
                // 详情信息 + 耗时
                '<div style="display:flex;justify-content:center;align-items:center;gap:16px;margin-top:4px;">' +
                '<div id="ocrLoadInfo" style="font-size:12px;color:#9ca3af;">初始化 OCR 引擎...</div>' +
                '<div id="ocrElapsed" style="font-size:12px;color:#6b7280;display:none;"></div>' +
                '</div>' +
                // 取消按钮
                '<button id="ocrAbortBtn" onclick="abortOcr()" style="margin-top:14px;padding:6px 20px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;transition:opacity 0.2s;">⏹ 取消识别</button>' +
                '</div>';
            outputSection.style.display = 'block';
            errorDiv.style.display = 'none';

            var files = Array.from(fileInput.files);
            ocrClientRecognize(files, lang, isBatch, btn, outputDiv, errorDiv, config);
            return;
        }

        var params = {};

        // 收集所有输入
        inputSection.querySelectorAll('[name]').forEach(function(el) {
            if (el.disabled) return;
            if (el.type === 'checkbox') {
                params[el.name] = el.checked;
            } else if (el.type !== 'file') {
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

        // 纯客户端计算类型（如贷款计算器）
        if (config.type === 'client-calc') {
            try {
                var result = doClientCalc(TOOL.route, params);
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                outputSection.style.display = 'block';
                outputDiv.className = 'tool-output tool-output-html';
                outputDiv.innerHTML = result;
            } catch (e) {
                if (btn) { btn.disabled = false; btn.innerHTML = __('engine.execute'); }
                errorDiv.style.display = 'block';
                errorDiv.textContent = '❌ ' + e.message;
            }
            return;
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
                        outputDiv.className = 'tool-output tool-output-html';
                        outputDiv.innerHTML = output;
                    } else {
                        outputDiv.className = 'tool-output';
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

    function bindConditionalInputs() {
        var groups = inputSection.querySelectorAll('[data-show-when-name]');
        if (!groups.length) return;

        function updateGroup(group) {
            var controlName = group.getAttribute('data-show-when-name');
            var expectedValue = group.getAttribute('data-show-when-value');
            var controller = inputSection.querySelector('[name="' + controlName + '"]');
            var show = controller && controller.value === expectedValue;
            group.style.display = show ? '' : 'none';
            group.querySelectorAll('[name]').forEach(function(el) {
                el.disabled = !show;
                if (!show) el.value = '';
            });
        }

        groups.forEach(function(group) {
            updateGroup(group);
            var controlName = group.getAttribute('data-show-when-name');
            var controller = inputSection.querySelector('[name="' + controlName + '"]');
            if (controller) {
                controller.addEventListener('change', function() { updateGroup(group); });
                controller.addEventListener('input', function() { updateGroup(group); });
            }
        });
    }

    // ============ JSON 树形视图渲染 ============
    function renderJsonNode(obj, key, isLast, indent) {
        indent = indent || 0;
        var pad = '';
        for (var i = 0; i < indent; i++) pad += '  ';

        var html = '';
        var type = Array.isArray(obj) ? 'array' : (obj !== null && typeof obj === 'object' ? 'object' : 'primitive');

        if (type === 'primitive') {
            var dispKey = key !== undefined && key !== null && key !== '' ? '<span style="color:#7c3aed;">"' + escapeHtml(String(key)) + '"</span>: ' : '';
            var val;
            if (obj === null) val = '<span style="color:#ef4444;">null</span>';
            else if (typeof obj === 'string') val = '<span style="color:#059669;">"' + escapeHtml(obj) + '"</span>';
            else if (typeof obj === 'boolean') val = '<span style="color:#d97706;">' + obj + '</span>';
            else val = '<span style="color:#2563eb;">' + obj + '</span>';
            html += '<div>' + pad + dispKey + val + '</div>';
            return html;
        }

        if (type === 'object' || type === 'array') {
            var entries = type === 'array' ? obj.map(function(v, i) { return { key: i, value: v }; }) : Object.keys(obj).map(function(k) { return { key: k, value: obj[k] }; });
            var isEmpty = entries.length === 0;

            if (isEmpty) {
                var label = type === 'array' ? '[]' : '{}';
                if (key !== undefined && key !== null && key !== '') {
                    html += '<div class="json-node">' + pad + '<span class="json-toggle collapsed" onclick="toggleJsonNode(this)">▶</span> <span style="color:#7c3aed;">"' + escapeHtml(String(key)) + '"</span>: ' + label + '</div>';
                } else {
                    html += '<div class="json-node">' + pad + label + '</div>';
                }
                return html;
            }

            var displayKey = (key !== undefined && key !== null && key !== '') ? '<span style="color:#7c3aed;">"' + escapeHtml(String(key)) + '"</span>: ' : '';
            var bracket = type === 'array' ? '[' : '{';
            var closeBracket = type === 'array' ? ']' : '}';

            html += '<div class="json-node">' + pad + '<span class="json-toggle collapsed" onclick="toggleJsonNode(this)" style="cursor:pointer;user-select:none;">▶</span> ' + displayKey + '<span class="json-bracket">' + bracket + '</span>';
            html += '<div class="json-children" style="display:none;">';
            entries.forEach(function(entry, idx) {
                var childIsLast = idx === entries.length - 1;
                html += renderJsonNode(entry.value, entry.key, childIsLast, indent + 1);
            });
            html += pad + '<span class="json-bracket">' + closeBracket + '</span>';
            html += '</div>';
            html += '</div>';
        }

        return html;
    }

    window.toggleJsonNode = function(el) {
        var children = el.parentElement.querySelector('.json-children');
        if (!children) return;
        if (el.classList.contains('collapsed')) {
            el.classList.remove('collapsed');
            el.textContent = '▼';
            children.style.display = 'block';
        } else {
            el.classList.add('collapsed');
            el.textContent = '▶';
            children.style.display = 'none';
        }
    };
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
        // 中止正在进行的 OCR（如果有）
        if (_ocrAbortCtrl && typeof _ocrAbortCtrl.cancel === 'function') {
            _ocrAbortCtrl.cancel();
            _ocrAbortCtrl = null;
        }
        outputSection.style.display = 'none';
        errorDiv.style.display = 'none';
        outputDiv.innerHTML = '';
        outputDiv.className = 'tool-output';
    };

    window.excelCopyJson = function() {
        var text = window.__excelJsonStr || outputDiv.textContent || outputDiv.innerText;
        navigator.clipboard.writeText(text).then(function() {
            showToast('✅ ' + (__('toast.copied') || 'Copied to clipboard'));
        }).catch(function() {
            showToast('⚠️ ' + (__('toast.copy_failed_manual') || 'Copy failed, please select manually'));
        });
    };

    // Excel 数据网格：切换某行为格式化 JSON 视图
    window.excelToggleGridRow = function(rowIdx) {
        var row = document.getElementById('excelGridRow' + rowIdx);
        if (!row || !window.__excelRowsData) return;
        var rowData = window.__excelRowsData[rowIdx];
        if (!rowData) return;

        var headers = window.__excelGridHeaders || [];
        var totalCols = headers.length + 2; // # + 数据列 + 操作列
        var isJsonMode = row.classList.contains('excel-grid-json-mode');

        if (isJsonMode) {
            // 恢复为网格视图
            if (window.__excelGridRowBackup && window.__excelGridRowBackup[rowIdx]) {
                row.outerHTML = window.__excelGridRowBackup[rowIdx];
                window.__excelGridRowBackup[rowIdx] = null;
            }
            window.__excelRowsFormatted[rowIdx] = false;
        } else {
            // 保存原行 HTML
            if (!window.__excelGridRowBackup) window.__excelGridRowBackup = {};
            window.__excelGridRowBackup[rowIdx] = row.outerHTML;

            // 替换为 JSON 视图
            var rowNum = parseInt(rowIdx) + 1;
            var pretty = JSON.stringify(rowData, null, 2);
            row.outerHTML = '<tr class="excel-grid-row excel-grid-json-mode" id="excelGridRow' + rowIdx + '" data-row-idx="' + rowIdx + '">'
                + '<td class="excel-grid-num">' + rowNum + '</td>'
                + '<td colspan="' + (totalCols - 2) + '" class="excel-grid-json-cell">'
                + '<pre class="excel-grid-json-pre">' + escapeHtml(pretty) + '</pre>'
                + '</td>'
                + '<td class="excel-grid-actions-cell">'
                + '<button class="excel-grid-btn" onclick="excelToggleGridRow(\'' + rowIdx + '\')" title="' + (__('excel2json.format') || 'Format') + '">📊</button>'
                + '<button class="excel-grid-btn" onclick="excelCopyGridRow(\'' + rowIdx + '\')" title="' + (__('tool.copy') || 'Copy') + '">📋</button>'
                + '</td>'
                + '</tr>';
            window.__excelRowsFormatted[rowIdx] = true;
        }
    };

    // Excel 数据网格：复制单行 JSON
    window.excelCopyGridRow = function(rowIdx) {
        if (!window.__excelRowsData) return;
        var rowData = window.__excelRowsData[rowIdx];
        if (!rowData) return;
        var text = JSON.stringify(rowData, null, 2);
        navigator.clipboard.writeText(text).then(function() {
            showToast('✅ ' + (__('toast.copied') || 'Copied to clipboard'));
        }).catch(function() {
            showToast('⚠️ ' + (__('toast.copy_failed_manual') || 'Copy failed, please select manually'));
        });
    };

    // Excel 数据网格：复制全部行 JSON
    window.excelCopyAllJson = function() {
        var text;
        if (window.__excelAllJson) {
            try {
                text = JSON.stringify(JSON.parse(window.__excelAllJson), null, 2);
            } catch(e) {
                text = window.__excelAllJson;
            }
        } else {
            text = outputDiv.textContent || outputDiv.innerText;
        }
        navigator.clipboard.writeText(text).then(function() {
            showToast('✅ ' + (__('toast.copied') || 'Copied to clipboard'));
        }).catch(function() {
            showToast('⚠️ ' + (__('toast.copy_failed_manual') || 'Copy failed, please select manually'));
        });
    };

    // 批量HTTP：展开/折叠响应体
    window.batchHttpToggleBody = function(bodyId) {
        var pre = document.getElementById(bodyId);
        if (!pre || !window.__batchHttpResults) return;
        var idx = parseInt(bodyId.replace('batchHttpBody', ''));
        var r = window.__batchHttpResults[idx];
        if (!r || !r.body) return;

        var isExpanded = pre.classList.contains('batch-expanded');
        if (isExpanded) {
            // 折叠
            pre.textContent = r.body.length > 300 ? escapeHtml(r.body.substring(0, 300)) + '...' : escapeHtml(r.body);
            pre.classList.remove('batch-expanded');
            // 更新按钮文字
            var wrapper = pre.parentElement;
            if (wrapper) {
                var btn = wrapper.querySelector('.batch-expand-btn');
                if (btn) btn.textContent = __('batch_http.expand');
            }
        } else {
            // 展开
            pre.textContent = r.body;
            pre.classList.add('batch-expanded');
            var wrapper2 = pre.parentElement;
            if (wrapper2) {
                var btn2 = wrapper2.querySelector('.batch-expand-btn');
                if (btn2) btn2.textContent = __('batch_http.collapse');
            }
        }
    };

    // 批量HTTP：复制单次请求的响应体
    window.batchHttpCopyRow = function(idx) {
        if (!window.__batchHttpResults) return;
        var r = window.__batchHttpResults[idx];
        if (!r) return;
        var text = r.body || (r.error || '');
        navigator.clipboard.writeText(text).then(function() {
            showToast('✅ ' + (__('toast.copied') || 'Copied to clipboard'));
        }).catch(function() {
            showToast('⚠️ ' + (__('toast.copy_failed_manual') || 'Copy failed, please select manually'));
        });
    };

    window.clearAll = function() {
        inputSection.querySelectorAll('textarea, input[type="text"], input[type="number"]').forEach(function(el) {
            el.value = '';
        });
        // 清除文件选择
        var fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            var info = document.getElementById('fileSelectedInfo');
            var label = document.querySelector('.file-upload-label');
            if (info) info.style.display = 'none';
            if (label) label.style.display = 'flex';
        }
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

// ============ 文件上传辅助函数 ============

// 文件选中回调
window.onFileSelected = function(input) {
    var info = document.getElementById('fileSelectedInfo');
    var nameEl = document.getElementById('selectedFileName');
    var label = document.querySelector('.file-upload-label');
    if (input.files && input.files.length > 0) {
        var file = input.files[0];
        if (nameEl) nameEl.textContent = file.name;
        if (info) info.style.display = 'flex';
        if (label) label.style.display = 'none';
    }
};

// 清除文件选择
window.clearFileSelection = function() {
    var fileInput = document.getElementById('fileInput');
    var info = document.getElementById('fileSelectedInfo');
    var label = document.querySelector('.file-upload-label');
    if (fileInput) fileInput.value = '';
    if (info) info.style.display = 'none';
    if (label) label.style.display = 'flex';
};

// ============ OCR 批量文件选择 ============
window.onBatchFilesSelected = function(input) {
    var info = document.getElementById('fileSelectedInfoBatch');
    var nameEl = document.getElementById('selectedFileNameBatch');
    var label = document.querySelector('#ocrBatchArea .file-upload-label');
    if (input.files && input.files.length > 0) {
        if (nameEl) nameEl.textContent = '已选择 ' + input.files.length + ' 个文件 (' + formatFileSize(Array.from(input.files).reduce(function(s,f){return s+f.size;},0)) + ')';
        if (info) info.style.display = 'flex';
        if (label) label.style.display = 'none';
    }
};

window.clearBatchFileSelection = function() {
    var fileInput = document.getElementById('fileInputBatch');
    var info = document.getElementById('fileSelectedInfoBatch');
    var label = document.querySelector('#ocrBatchArea .file-upload-label');
    if (fileInput) fileInput.value = '';
    if (info) info.style.display = 'none';
    if (label) label.style.display = 'flex';
};

// ============ Tesseract.js 客户端 OCR（纯浏览器端，无需安装）============
var _tesseractLoading = false;
var _tesseractLoaded = false;
var _tesseractLoadStart = 0;       // 开始加载的时间戳，用于检测卡死
var _tesseractScriptElem = null;   // 保存 script 元素引用，超时时可移除

function loadTesseract(callback) {
    if (_tesseractLoaded) { callback(null); return; }

    // 如果正在加载中，用轮询等待（有超时保护）
    if (_tesseractLoading) {
        var pollStart = Date.now();
        var check = setInterval(function() {
            if (_tesseractLoaded) {
                clearInterval(check);
                callback(null);
                return;
            }
            // 轮询超过 30 秒，认为加载已卡死，重置状态
            if (Date.now() - pollStart > 30000) {
                clearInterval(check);
                _tesseractLoading = false;
                // 尝试移除可能卡住的 script 标签
                if (_tesseractScriptElem && _tesseractScriptElem.parentNode) {
                    try { _tesseractScriptElem.parentNode.removeChild(_tesseractScriptElem); } catch(e) {}
                }
                _tesseractScriptElem = null;
                callback(new Error('Tesseract.js 加载超时（30s），请检查网络连接后刷新重试'));
            }
        }, 100);
        return;
    }

    // 防止 _tesseractLoading 卡死在 true（上次加载异常后没重置）
    if (_tesseractLoadStart && Date.now() - _tesseractLoadStart > 60000) {
        _tesseractLoading = false;
    }

    _tesseractLoading = true;
    _tesseractLoadStart = Date.now();

    var script = document.createElement('script');
    _tesseractScriptElem = script;
    // 从本地服务器加载，无需依赖外部 CDN
    script.src = '/ocr/tesseract/tesseract.min.js';

    // 10 秒超时：本地文件加载应该很快，超过 10 秒即为异常
    var loadTimeout = setTimeout(function() {
        if (_tesseractLoading && !_tesseractLoaded) {
            _tesseractLoading = false;
            if (script.parentNode) {
                try { script.parentNode.removeChild(script); } catch(e) {}
            }
            _tesseractScriptElem = null;
            callback(new Error('Tesseract.js 加载超时（10s），请刷新页面重试'));
        }
    }, 10000);

    script.onload = function() {
        clearTimeout(loadTimeout);
        _tesseractLoaded = true;
        _tesseractLoading = false;
        _tesseractScriptElem = null;
        callback(null);
    };
    script.onerror = function() {
        clearTimeout(loadTimeout);
        _tesseractLoading = false;
        _tesseractScriptElem = null;
        callback(new Error('无法加载 Tesseract.js，请刷新页面重试'));
    };
    document.head.appendChild(script);
}

/**
 * 图片压缩预处理 — 用于 OCR 前自动缩小大图以提升识别速度
 * Tesseract.js (WASM) 对高分辨率图片极慢，压缩后可提速 5-10 倍
 *
 * @param {File|Blob} file - 原始图片文件
 * @param {Object} opts - 配置选项
 * @param {number} opts.maxWidth - 最大宽度（默认 2000）
 * @param {number} opts.maxHeight - 最大高度（默认 2000）
 * @param {number} opts.quality - JPEG 质量（默认 0.85）
 * @returns {Promise<{blob: Blob, origW: number, origH: number, newW: number, newH: number}>}
 */
function compressImageForOcr(file, opts) {
    opts = Object.assign({ maxWidth: 2000, maxHeight: 2000, quality: 0.85 }, opts || {});
    return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() {
            var origW = img.naturalWidth || img.width;
            var origH = img.naturalHeight || img.height;
            var scale = Math.min(1, opts.maxWidth / origW, opts.maxHeight / origH);
            // 如果图片已经足够小，直接返回原文件（避免不必要的重编码开销）
            if (scale >= 1) {
                resolve({
                    blob: file instanceof File ? file : new Blob([file], { type: 'image/png' }),
                    origW: origW,
                    origH: origH,
                    newW: origW,
                    newH: origH,
                    compressed: false
                });
                URL.revokeObjectURL(img.src);
                return;
            }
            var newW = Math.round(origW * scale);
            var newH = Math.round(origH * scale);
            var canvas = document.createElement('canvas');
            canvas.width = newW;
            canvas.height = newH;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newW, newH);
            // 使用 JPEG 格式输出（体积更小、OCR 效果几乎无差异）
            canvas.toBlob(function(blob) {
                URL.revokeObjectURL(img.src);
                if (!blob) {
                    reject(new Error('图片编码失败'));
                    return;
                }
                resolve({
                    blob: blob,
                    origW: origW,
                    origH: origH,
                    newW: newW,
                    newH: newH,
                    compressed: true
                });
            }, 'image/jpeg', opts.quality);
        };
        img.onerror = function(e) {
            URL.revokeObjectURL(img.src);
            reject(new Error('图片加载失败'));
        };
        img.src = URL.createObjectURL(file);
    });
}

function ocrClientRecognize(files, lang, isBatch, btn, outputDiv, errorDiv, config) {
    var loadBar = document.getElementById('ocrLoadBar');
    var loadInfo = document.getElementById('ocrLoadInfo');
    var loadTitle = document.getElementById('ocrLoadTitle');
    var ocrPhase = document.getElementById('ocrPhase');
    var pctEl = document.getElementById('ocrPercent');
    var elapsedEl = document.getElementById('ocrElapsed');
    var worker = null;
    var finished = false;
    var timeoutId = null;
    var trickleId = null;
    var startTime = Date.now();
    var currentPct = 0;
    var TIMEOUT_MS = 120000; // 2 分钟超时兜底

    // ── 后端 OCR 降级函数 ──

    /** 检测后端 Tesseract 是否可用 */
    function checkBackendOcr() {
        return fetch('/api/tools/ocr/status', { method: 'GET' })
            .then(function(r) { return r.json(); })
            .then(function(data) { return data.code === 200 && data.data && data.data.available; })
            .catch(function() { return false; });
    }

    /** 通过后端 API 执行单张 OCR */
    function backendOcrSingle(file) {
        return new Promise(function(resolve, reject) {
            var formData = new FormData();
            formData.append('file', file);
            formData.append('language', lang);
            fetch('/api/tools/ocr/single', {
                method: 'POST',
                body: formData
            }).then(function(r) { return r.json(); }).then(function(res) {
                if (res.code === 200) resolve(res.data);
                else reject(new Error(res.message || '后端 OCR 失败'));
            }).catch(reject);
        });
    }

    /** 通过后端 API 执行批量 OCR */
    function backendOcrBatch(fileList) {
        return new Promise(function(resolve, reject) {
            var formData = new FormData();
            fileList.forEach(function(f) { formData.append('files', f); });
            formData.append('language', lang);
            fetch('/api/tools/ocr/batch', {
                method: 'POST',
                body: formData
            }).then(function(r) { return r.json(); }).then(function(res) {
                if (res.code === 200) resolve(res.data);
                else reject(new Error(res.message || '后端 OCR 批量失败'));
            }).catch(reject);
        });
    }

    // ── 阶段可视化：5 个步骤点 ──
    var phaseSteps = [
        { label: '加载引擎', icon: '📦' },
        { label: '编译核心', icon: '⚙️' },
        { label: '加载语言', icon: '🌐' },
        { label: '识别文字', icon: '🔍' },
        { label: '完成',     icon: '✅' }
    ];
    function renderPhase(activeIdx) {
        if (!ocrPhase) return;
        var h = '';
        for (var p = 0; p < phaseSteps.length; p++) {
            var cls = 'ocr-phase-dot';
            if (p < activeIdx) cls += ' ocr-phase-done';
            else if (p === activeIdx) cls += ' ocr-phase-active';
            else cls += ' ocr-phase-pending';
            var icon = p < activeIdx ? '✅' : (p === activeIdx ? phaseSteps[p].icon : '○');
            h += '<span style="display:inline-flex;align-items:center;gap:4px;">' +
                 '<span class="' + cls + '">' + icon + '</span>' +
                 '<span style="color:' + (p <= activeIdx ? '#e0e7ff' : '#6b7280') + '">' + phaseSteps[p].label + '</span>' +
                 '</span>';
            if (p < phaseSteps.length - 1) h += '<span style="color:#4b5563;">→</span>';
        }
        ocrPhase.innerHTML = h;
    }
    // 初始渲染所有步骤为待处理
    renderPhase(-1);

    // ── 主流程：纯后端模式 ──
    // WASM 方案已验证不可行（高分辨率图片超时/假死），改为仅使用后端 Tesseract CLI

    updateUI(2, '⏳ 正在检测服务端 OCR 引擎...', '准备开始识别...');

    checkBackendOcr().then(function(backendAvailable) {
        if (finished) return;
        if (backendAvailable) {
            // ✅ 后端可用 — 直接使用后端 Tesseract CLI
            stopTrickle();
            updateUI(5, '🖥️ 使用服务端 OCR 引擎', 'Tesseract CLI 已就绪，开始识别...');
            renderPhase(3);

            startTrickle(10, 80, 5000, '服务端正在处理图片...');

            var batchPromise = isBatch ? backendOcrBatch(files) : backendOcrSingle(files[0]);
            batchPromise.then(function(data) {
                if (finished) return;
                finishOk(function() {
                    outputDiv.className = 'tool-output tool-output-html';
                    outputDiv.innerHTML = config.formatOutput(data);
                });
            }).catch(function(err) {
                if (finished) return;
                finishFail('服务端 OCR 失败: ' + (err.message || err));
            });

        } else {
            // ❌ 后端不可用 — 给出明确提示（不再尝试慢速 WASM）
            stopTrickle();
            finishFail(
                '⚠️ 服务端 OCR 引擎不可用。\n\n' +
                '请在此服务器上安装 Tesseract OCR：\n' +
                'Windows: https://github.com/UB-Mannheim/tesseract/wiki\n' +
                '  安装时勾选「中文简体」和「英文」语言包\n\n' +
                '安装完成后刷新页面即可使用。'
            );
        }
    }).catch(function() {
        if (finished) return;
        finishFail('无法连接到服务端，请检查网络或刷新页面重试。');
    });

    // ── 浏览器端 Tesseract.js 初始化 + 识别（带超时降级）──
    function initBrowserOcr() {
        loadTesseract(function(err) {
            stopTrickle();
            if (err) { finishFail(err.message || 'OCR 引擎加载失败'); return; }
            if (finished) return;

            updateUI(5, '📦 引擎脚本已加载', '准备创建 OCR 工作线程...');
            renderPhase(0);
            startTrickle(5, 12, 5000, '正在编译 OCR 核心引擎 (WebAssembly)...');

            var LOCAL_BASE = '/ocr/tesseract/';
            var LOCAL_LANG = '/ocr/tessdata/';
            var workerPromise = Tesseract.createWorker(lang, 1, {
                workerPath: LOCAL_BASE + 'worker.min.js',
                corePath: LOCAL_BASE,
                langPath: LOCAL_LANG,
                logger: function(m) {
                    if (finished) return;
                    stopTrickle();
                    var st = m.status || '';
                    var prog = m.progress || 0;
                    if (st.indexOf('loading tesseract') >= 0 || st.indexOf('Loading tesseract') >= 0) {
                        updateUI(12 + prog * 8, '⚙️ 正在编译 OCR 核心...',
                            '编译 WebAssembly 引擎 (' + Math.round(prog * 100) + '%)');
                        if (prog > 0.3) renderPhase(1);
                    } else if (st.indexOf('initializ') >= 0) {
                        updateUI(20, '🔧 初始化引擎完成', '即将加载语言包...');
                        renderPhase(2);
                    } else if (st.indexOf('loading') >= 0 || st.indexOf('Loading') >= 0) {
                        var name = st.replace(/^[Ll]oading /, '');
                        updateUI(20 + prog * 8, '🌐 正在加载语言包...',
                            name + ' (' + Math.round(prog * 100) + '%)');
                        renderPhase(2);
                    }
                }
            });

            workerPromise.then(function(w) {
                stopTrickle();
                worker = w;
                if (finished) return;

                updateUI(28, '✅ OCR 引擎就绪', '开始识别图片文字...');
                renderPhase(3);

                if (isBatch) processBatch(); else processSingle(files[0]);
            }).catch(function(err) {
                finishFail('OCR 引擎初始化失败: ' + (err.message || err) + '。可刷新页面重试');
            });
        });
    }

    // 浏览器端单文件识别（含自动图片压缩 + 超时降级）
    function processSingle(file) {
        updateUI(30, '🔍 正在准备: ' + file.name, '浏览器端 OCR 进行中...');
        startTrickle(30, 35, 3000, '正在压缩大图以加速识别...');

        compressImageForOcr(file, { maxWidth: 2000, maxHeight: 2000 }).then(function(compressed) {
            if (finished) return;
            var sizeInfo = compressed.compressed
                ? ' (' + compressed.origW + 'x' + compressed.origH + ' → ' + compressed.newW + 'x' + compressed.newH + ')'
                : '';
            stopTrickle();
            updateUI(34, '🔍 [浏览器] 识别中: ' + file.name + sizeInfo, 'WASM 文字识别...');

            // ⚡ 关键改进：设置 WASM 识别超时（30s），超时自动降级到后端
            var wasmTimeout = setTimeout(function() {
                if (finished) return;
                console.warn('[OCR] WASM 识别超时(30s)，尝试降级到后端...');
                updateUI(36, '⚠️ 浏览器端较慢，切换到服务端...', '正在通过服务端重试...');

                // 终止 WASM worker
                if (worker) { worker.terminate().catch(function(){}); worker = null; }

                // 尝试后端降级
                checkBackendOcr().then(function(available) {
                    if (!available || finished) {
                        if (!finished) finishFail('浏览器端和服务端均不可用。请安装 Tesseract 或缩小图片后重试');
                        return;
                    }
                    backendOcrSingle(file).then(function(data) {
                        if (finished) return;
                        finishOk(function() {
                            outputDiv.className = 'tool-output tool-output-html';
                            outputDiv.innerHTML = config.formatOutput(data);
                        });
                    }).catch(function(e) {
                        if (finished) return;
                        finishFail('识别失败: ' + (e.message || e));
                    });
                });
            }, 30000);

            var recognizeOpts = {
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                logger: function(m) {
                    if (finished) return;
                    if (m.status === 'recognizing text') {
                        clearTimeout(wasmTimeout);
                        stopTrickle();
                        updateUI(35 + m.progress * 60, '🔍 [浏览器] 识别中: ' + file.name,
                            '文字识别中 ' + Math.round(m.progress * 100) + '%');
                    }
                }
            };
            worker.recognize(compressed.blob, recognizeOpts).then(function(result) {
                clearTimeout(wasmTimeout);
                if (finished) return;
                var text = (result.data.text || '').trim();
                var data = {
                    fileName: file.name, fileSize: file.size, text: text,
                    textLength: text.length,
                    lineCount: text ? text.split('\n').length : 0,
                    language: lang, success: true
                };
                finishOk(function() {
                    outputDiv.className = 'tool-output tool-output-html';
                    outputDiv.innerHTML = config.formatOutput(data);
                });
            }).catch(function(err) {
                clearTimeout(wasmTimeout);
                if (finished) return;
                finishFail('浏览器端识别失败: ' + (err.message || err));
            });
        }).catch(function(err) {
            if (finished) return;
            finishFail('图片预处理失败: ' + (err.message || err));
        });
    }

    // 浏览器端批量识别（复用同一个 Worker，含压缩）
    function processBatch() {
        var items = [];
        var successCount = 0, failCount = 0, totalChars = 0;
        var startTime = Date.now();
        var totalFiles = files.length;

        function processNext(index) {
            if (finished || index >= totalFiles) {
                if (!finished) {
                    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    var result = {
                        items: items, total: totalFiles,
                        successCount: successCount, failCount: failCount,
                        totalChars: totalChars, elapsed: elapsed + 's', language: lang
                    };
                    window.__ocrBatchData = result;
                    finishOk(function() {
                        outputDiv.className = 'tool-output tool-output-html';
                        outputDiv.innerHTML = renderOcrBatchResult(result);
                    });
                }
                return;
            }
            var file = files[index];
            var pctBase = 30 + (index / totalFiles) * 65;
            updateUI(pctBase, '🔍 预处理 (' + (index + 1) + '/' + totalFiles + '): ' + file.name,
                '批量 OCR 进行中，已完成 ' + index + ' / ' + totalFiles + ' 个文件');

            compressImageForOcr(file, { maxWidth: 2000, maxHeight: 2000 }).then(function(compressed) {
                if (finished) return;
                updateUI(pctBase, '🔍 识别中 (' + (index + 1) + '/' + totalFiles + '): ' + file.name,
                    (compressed.compressed ? '已压缩 → ' : '') + '[浏览器] 正在识别...');

                worker.recognize(compressed.blob, {
                    tessedit_pageseg_mode: Tesseract.PSM.AUTO
                }).then(function(result) {
                    if (finished) return;
                    var text = (result.data.text || '').trim();
                    items.push({ fileName: file.name, fileSize: file.size, text: text, textLength: text.length, success: true });
                    successCount++;
                    totalChars += text.length;
                    processNext(index + 1);
                }).catch(function(err) {
                    if (finished) return;
                    items.push({ fileName: file.name, fileSize: file.size, error: '识别失败: ' + (err.message || err), success: false });
                    failCount++;
                    processNext(index + 1);
                });
            }).catch(function(err) {
                if (finished) return;
                items.push({ fileName: file.name, fileSize: file.size, error: '图片预处理失败: ' + (err.message || err), success: false });
                failCount++;
                processNext(index + 1);
            });
        }
        processNext(0);
    }

    // ── 耗时更新循环 ──
    function updateElapsed() {
        if (finished) return;
        var s = Math.round((Date.now() - startTime) / 1000);
        if (elapsedEl) {
            elapsedEl.style.display = 'inline';
            elapsedEl.textContent = '⏱ 已耗时 ' + s + ' 秒';
        }
    }
    var elapsedTimer = setInterval(updateElapsed, 1000);
    updateElapsed();

    // ── 统一的进度更新 ──
    function updateUI(pct, title, info, phaseHtml, elapsed) {
        currentPct = Math.max(currentPct, pct);
        if (loadBar) {
            loadBar.style.width = Math.min(Math.round(currentPct), 100) + '%';
            // 未完成时使用流动色，完成时变绿色
            if (currentPct >= 100) {
                loadBar.style.background = 'linear-gradient(90deg,#10b981,#34d399)';
            } else if (currentPct < 5) {
                loadBar.style.background = 'linear-gradient(90deg,#6366f1,#8b5cf6,#6366f1)';
                loadBar.style.backgroundSize = '200% 100%';
                loadBar.style.animation = 'ocrPulse 1.5s ease-in-out infinite';
            } else {
                loadBar.style.background = 'linear-gradient(90deg,#6366f1,#8b5cf6)';
                loadBar.style.animation = 'none';
            }
        }
        if (pctEl) pctEl.textContent = Math.round(currentPct) + '%';
        if (loadTitle && title !== undefined) loadTitle.textContent = title;
        if (loadInfo && info !== undefined) loadInfo.textContent = info;
        if (ocrPhase && phaseHtml !== undefined) ocrPhase.innerHTML = phaseHtml;
        if (elapsedEl && elapsed !== undefined) elapsedEl.textContent = elapsed;
    }

    // ── 伪进度（让用户在等待加载时有反馈）──
    function startTrickle(fromPct, toPct, interval, info) {
        if (trickleId) clearInterval(trickleId);
        var val = fromPct;
        var step = (toPct - fromPct) / (interval / 200);
        trickleId = setInterval(function() {
            if (finished) { clearInterval(trickleId); return; }
            val += step;
            if (val >= toPct) { val = toPct; clearInterval(trickleId); trickleId = null; }
            updateUI(val, undefined, info);
        }, 200);
    }

    function stopTrickle() {
        if (trickleId) { clearInterval(trickleId); trickleId = null; }
    }

    function hideAbortBtn() {
        var abortBtn = document.getElementById('ocrAbortBtn');
        if (abortBtn) abortBtn.style.display = 'none';
    }

    // ── 安全的按钮文本恢复（防止 __() 未定义时雪崩）──
    function safeBtnText() {
        try { return typeof __ === 'function' ? __('engine.execute') : '⚡ 执行'; }
        catch(e) { return '⚡ 执行'; }
    }

    function finishFail(msg) {
        finished = true;
        stopTrickle();
        clearInterval(elapsedTimer);
        clearTimeout(timeoutId);
        if (worker) { worker.terminate().catch(function(){}); worker = null; }
        _ocrAbortCtrl = null;
        if (btn) { btn.disabled = false; btn.innerHTML = safeBtnText(); }
        hideAbortBtn();
        updateUI(0, '❌ 识别失败', msg);
        outputDiv.innerHTML = '';
        errorDiv.style.display = 'block';
        errorDiv.textContent = '❌ ' + msg;
    }

    function finishOk(renderFn) {
        finished = true;
        stopTrickle();
        clearInterval(elapsedTimer);
        clearTimeout(timeoutId);
        if (worker) { worker.terminate().catch(function(){}); worker = null; }
        _ocrAbortCtrl = null;
        if (btn) { btn.disabled = false; btn.innerHTML = safeBtnText(); }
        hideAbortBtn();
        var s = Math.round((Date.now() - startTime) / 1000);
        updateUI(100, '✅ 识别完成', '总耗时 ' + s + ' 秒', '', '⏱ 总耗时 ' + s + ' 秒');
        renderFn();
    }

    // ── 全局超时兜底 ──
    timeoutId = setTimeout(function() {
        if (!finished) finishFail('OCR 识别超时（已等待超过 ' + Math.round(TIMEOUT_MS/1000) + ' 秒），可尝试缩小图片后重试');
    }, TIMEOUT_MS);

    // ── 对外暴露终止方法 ──
    _ocrAbortCtrl = {
        cancel: function() {
            if (finished) return;
            finished = true;
            stopTrickle();
            clearInterval(elapsedTimer);
            clearTimeout(timeoutId);
            if (worker) { worker.terminate().catch(function(){}); worker = null; }
            hideAbortBtn();
            if (btn) { btn.disabled = false; btn.innerHTML = safeBtnText(); }
            updateUI(0, '⏹ 已取消', 'OCR 识别已取消');
            outputDiv.innerHTML = '';
            errorDiv.style.display = 'block';
            errorDiv.textContent = '⏹ OCR 识别已取消';
        }
    };

    window.abortOcr = function() {
        if (_ocrAbortCtrl) { _ocrAbortCtrl.cancel(); }
    };

}

// OCR 识别的 copy 按钮
window.copyOcrResult = function(btn) {
    var text = btn.getAttribute('data-text');
    if (!text) {
        var pre = btn.parentElement.querySelector('.ocr-text');
        text = pre ? pre.textContent : '';
    }
    navigator.clipboard.writeText(text).then(function() {
        showToast('✅ ' + (__('toast.copied') || 'Copied to clipboard'));
    }).catch(function() {
        showToast('⚠ ' + (__('toast.copy_failed_manual') || 'Copy failed'));
    });
};

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

// OCR 批量结果渲染
function renderOcrBatchResult(data) {
    var h = '';
    h += '<div class="ocr-batch-header">';
    h += '<span>📚 批量识别结果</span>';
    h += '<span class="ocr-meta">' + data.total + ' 个文件 / ' + data.successCount + ' 成功 / ' + data.failCount + ' 失败 / ' + data.totalChars + ' 字符 / 耗时 ' + data.elapsed + '</span>';
    h += '</div>';
    h += '<div class="ocr-batch-summary">';
    h += '<button class="btn-sm" onclick="copyAllOcrBatchResults()">📋 复制全部文字</button>';
    h += '<button class="btn-sm" onclick="downloadOcrBatchResults()">📥 导出结果 TXT</button>';
    h += '</div>';
    h += '<div class="ocr-batch-list">';
    data.items.forEach(function(item, idx) {
        h += '<div class="ocr-batch-item ' + (item.success ? '' : 'ocr-batch-fail') + '">';
        h += '<div class="ocr-batch-item-header">';
        h += '<span class="ocr-batch-idx">#' + (idx + 1) + '</span>';
        h += '<span class="ocr-batch-fname">📄 ' + escapeHtml(item.fileName || 'unknown') + '</span>';
        h += '<span class="ocr-batch-size">' + formatFileSize(item.fileSize || 0) + '</span>';
        if (item.success) h += '<span class="ocr-badge-ok">✅ ' + item.textLength + ' 字符</span>';
        else h += '<span class="ocr-badge-fail">❌ 失败</span>';
        h += '</div>';
        if (item.success) {
            h += '<pre class="ocr-text ocr-batch-text">' + escapeHtml(item.text) + '</pre>';
            h += '<button class="btn-sm ocr-batch-copy-btn" onclick="copyOcrBatchItem(this)" data-text="' + escapeHtml(item.text).replace(/"/g, '&quot;') + '">📋 复制</button>';
        } else if (item.error) {
            h += '<div class="ocr-error ocr-batch-error">' + escapeHtml(item.error) + '</div>';
        }
        h += '</div>';
    });
    h += '</div>';

    // Store for batch operations
    window.__ocrBatchData = data;
    return h;
}

window.copyAllOcrBatchResults = function() {
    if (!window.__ocrBatchData) return;
    var allText = window.__ocrBatchData.items
        .filter(function(item) { return item.success && item.text; })
        .map(function(item, idx) {
            return '=== ' + (item.fileName || ('File #' + (idx + 1))) + ' ===\n' + item.text;
        }).join('\n\n');
    navigator.clipboard.writeText(allText).then(function() {
        showToast('✅ 已复制 ' + window.__ocrBatchData.successCount + ' 个文件的文字');
    }).catch(function() {
        showToast('⚠ 复制失败，文字过长请使用导出功能');
    });
};

window.downloadOcrBatchResults = function() {
    if (!window.__ocrBatchData) return;
    var allText = window.__ocrBatchData.items
        .filter(function(item) { return item.success && item.text; })
        .map(function(item, idx) {
            return '=== ' + (item.fileName || ('File #' + (idx + 1))) + ' ===\n' + item.text;
        }).join('\n\n');
    var blob = new Blob(['\uFEFF' + allText], { type: 'text/plain;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'OCR_Batch_Result_' + new Date().toISOString().slice(0,10) + '.txt';
    a.click();
    URL.revokeObjectURL(url);
};

window.copyOcrBatchItem = function(btn) {
    var text = btn.getAttribute('data-text');
    navigator.clipboard.writeText(text).then(function() {
        showToast('✅ ' + (__('toast.copied') || 'Copied'));
    }).catch(function() {
        showToast('⚠ ' + (__('toast.copy_failed_manual') || 'Copy failed'));
    });
};

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

// ============ 客户端计算引擎 ============
function doClientCalc(route, params) {
    if (route === '/tools/finance/loan-calculator') {
        return calcLoan(params);
    }
    if (route === '/tools/format/markdown') {
        return renderMarkdown(params);
    }
    if (route === '/tools/converter/json-csv') {
        return convertJsonCsv(params);
    }
    throw new Error('Unknown client-calc route: ' + route);
}

// ============ Markdown 预览 ============
function renderMarkdown(params) {
    var md = params.markdown || '';
    if (!md.trim()) return '<div style="text-align:center;padding:40px;color:#9ca3af;">📝 请在输入框中输入 Markdown 内容</div>';

    var theme = params.theme || 'github';
    
    // 使用 marked.js CDN 渲染
    if (typeof marked === 'undefined') {
        return '<div style="text-align:center;padding:40px;color:#f59e0b;">⏳ 正在加载 Markdown 渲染引擎...<br><small>如果长时间未响应，请检查网络连接</small></div>';
    }

    marked.setOptions({ breaks: true, gfm: true });

    var html = '';
    
    // 暗色主题 CSS
    if (theme === 'dark') {
        html += '<style>' +
            '.md-preview-dark { background:#1e1e2e; color:#cdd6f4; padding:20px 30px; border-radius:8px; }' +
            '.md-preview-dark h1,.md-preview-dark h2,.md-preview-dark h3,.md-preview-dark h4 { color:#cba6f7; border-bottom:1px solid #45475a; padding-bottom:8px; }' +
            '.md-preview-dark code { background:#313244; color:#f5c2e7; padding:2px 6px; border-radius:4px; }' +
            '.md-preview-dark pre { background:#11111b; padding:16px; border-radius:8px; overflow-x:auto; }' +
            '.md-preview-dark pre code { background:none; color:#cdd6f4; }' +
            '.md-preview-dark a { color:#89b4fa; }' +
            '.md-preview-dark table { border-collapse:collapse; width:100%; }' +
            '.md-preview-dark th,.md-preview-dark td { border:1px solid #45475a; padding:8px 12px; text-align:left; }' +
            '.md-preview-dark th { background:#313244; }' +
            '.md-preview-dark blockquote { border-left:4px solid #cba6f7; padding-left:16px; margin-left:0; color:#a6adc8; }' +
            '.md-preview-dark img { max-width:100%; }' +
            '</style>';
    } else {
        html += '<style>' +
            '.md-preview-light { background:#fff; color:#24292e; padding:20px 30px; border-radius:8px; border:1px solid #d0d7de; }' +
            '.md-preview-light h1,.md-preview-light h2,.md-preview-light h3,.md-preview-light h4 { color:#1f2328; border-bottom:1px solid #d0d7de; padding-bottom:8px; }' +
            '.md-preview-light code { background:#f6f8fa; color:#cf222e; padding:2px 6px; border-radius:4px; }' +
            '.md-preview-light pre { background:#f6f8fa; padding:16px; border-radius:8px; overflow-x:auto; border:1px solid #d0d7de; }' +
            '.md-preview-light pre code { background:none; color:#24292e; }' +
            '.md-preview-light a { color:#0969da; }' +
            '.md-preview-light table { border-collapse:collapse; width:100%; }' +
            '.md-preview-light th,.md-preview-light td { border:1px solid #d0d7de; padding:8px 12px; text-align:left; }' +
            '.md-preview-light th { background:#f6f8fa; }' +
            '.md-preview-light blockquote { border-left:4px solid #d0d7de; padding-left:16px; margin-left:0; color:#656d76; }' +
            '.md-preview-light img { max-width:100%; }' +
            '</style>';
    }

    var themeClass = theme === 'dark' ? 'md-preview-dark' : 'md-preview-light';
    
    try {
        var rendered = marked.parse(md);
        html += '<div class="' + themeClass + '">' + rendered + '</div>';
    } catch(e) {
        html = '<div style="padding:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;">❌ 渲染失败: ' + e.message + '</div>';
    }

    // 词数统计
    var textOnly = md.replace(/[#*`~>\[\]\(\)!\-_=|{}.]/g, ' ').replace(/\s+/g, ' ').trim();
    var chars = md.replace(/\s/g, '').length;
    var words = textOnly ? textOnly.split(/\s+/).length : 0;
    var lines = md.split('\n').length;

    html += '<div style="margin-top:12px;display:flex;gap:16px;font-size:13px;color:#9ca3af;">';
    html += '<span>📊 ' + chars + ' 字符</span>';
    html += '<span>📝 ' + words + ' 单词</span>';
    html += '<span>📄 ' + lines + ' 行</span>';
    html += '</div>';

    return html;
}

// ============ JSON ↔ CSV 转换 ============
function convertJsonCsv(params) {
    var input = (params.input || '').trim();
    var direction = params.direction || 'json2csv';
    var delimiter = params.delimiter || ',';

    if (!input) return '<div style="text-align:center;padding:40px;color:#9ca3af;">📋 请输入要转换的内容</div>';

    try {
        if (direction === 'json2csv') {
            var data = JSON.parse(input);
            if (!Array.isArray(data)) throw new Error('JSON 必须是数组格式，例如 [{"name":"Alice","age":25}]');
            if (data.length === 0) throw new Error('JSON 数组不能为空');

            // 收集所有键作为列头
            var headers = [];
            var seen = {};
            data.forEach(function(row) {
                Object.keys(row).forEach(function(k) {
                    if (!seen[k]) { seen[k] = true; headers.push(k); }
                });
            });

            // 生成 CSV
            var csvRows = [headers.map(escapeCSV).join(delimiter)];
            data.forEach(function(row) {
                var vals = headers.map(function(h) {
                    var v = row[h];
                    if (v === null || v === undefined) return '';
                    if (typeof v === 'object') return escapeCSV(JSON.stringify(v));
                    return escapeCSV(String(v));
                });
                csvRows.push(vals.join(delimiter));
            });

            var csv = csvRows.join('\n');
            var rowCount = data.length;
            var colCount = headers.length;

            var resultHtml = '<div style="margin-bottom:8px;display:flex;gap:12px;align-items:center;">';
            resultHtml += '<span style="color:#10b981;">✅ 转换成功</span>';
            resultHtml += '<span style="color:#9ca3af;font-size:13px;">' + rowCount + ' 行 × ' + colCount + ' 列</span>';
            resultHtml += '<button class="btn-sm" onclick="copyToClipboard(this)" data-copy="' + escapeHtml(csv).replace(/"/g, '&quot;') + '">📋 复制结果</button>';
            resultHtml += '</div>';
            resultHtml += '<pre style="margin:0;background:rgba(99,102,241,0.06);padding:12px;border-radius:6px;overflow:auto;max-height:500px;font-size:13px;">' + escapeHtml(csv) + '</pre>';

            return resultHtml;

        } else {
            // CSV → JSON
            var lines = input.split('\n').filter(function(l) { return l.trim(); });
            if (lines.length < 2) throw new Error('CSV 至少需要包含表头和一行数据');

            var headers = parseCSVLine(lines[0], delimiter);
            var jsonRows = [];

            for (var i = 1; i < lines.length; i++) {
                var values = parseCSVLine(lines[i], delimiter);
                var row = {};
                headers.forEach(function(h, idx) {
                    var v = values[idx] || '';
                    // 尝试自动类型转换
                    if (v === 'true') v = true;
                    else if (v === 'false') v = false;
                    else if (v === 'null' || v === '') v = null;
                    else if (!isNaN(v) && v !== '' && v.trim() !== '') v = Number(v);
                    row[h] = v;
                });
                jsonRows.push(row);
            }

            var json = JSON.stringify(jsonRows, null, 2);
            var resultHtml = '<div style="margin-bottom:8px;display:flex;gap:12px;align-items:center;">';
            resultHtml += '<span style="color:#10b981;">✅ 转换成功</span>';
            resultHtml += '<span style="color:#9ca3af;font-size:13px;">' + jsonRows.length + ' 条记录</span>';
            resultHtml += '<button class="btn-sm" onclick="copyToClipboard(this)" data-copy="' + escapeHtml(json).replace(/"/g, '&quot;') + '">📋 复制结果</button>';
            resultHtml += '</div>';
            resultHtml += '<pre style="margin:0;background:rgba(99,102,241,0.06);padding:12px;border-radius:6px;overflow:auto;max-height:500px;font-size:13px;">' + escapeHtml(json) + '</pre>';

            return resultHtml;
        }
    } catch(e) {
        return '<div style="padding:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;">' +
            '<strong>❌ 转换失败</strong><br>' + escapeHtml(e.message) +
            '<br><small style="color:#9ca3af;">' + 
            (direction === 'json2csv' ? '示例: [{"name":"Alice","age":25},{"name":"Bob","age":30}]' : '示例: name,age\\nAlice,25\\nBob,30') +
            '</small></div>';
    }
}

function escapeCSV(val) {
    var s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function parseCSVLine(line, delimiter) {
    var result = [];
    var current = '';
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === delimiter) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current.trim());
    return result;
}

// 通用剪贴板复制
window.copyToClipboard = function(btn) {
    var text = btn.getAttribute('data-copy');
    if (!text) return;
    // 反转义 HTML 实体
    var txt = document.createElement('textarea');
    txt.innerHTML = text;
    text = txt.value;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            var orig = btn.innerHTML;
            btn.innerHTML = '✅ 已复制';
            btn.disabled = true;
            setTimeout(function() { btn.innerHTML = orig; btn.disabled = false; }, 1500);
        }).catch(function() {
            fallbackCopy(btn, text);
        });
    } else {
        fallbackCopy(btn, text);
    }
};

function fallbackCopy(btn, text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    var orig = btn.innerHTML;
    btn.innerHTML = '✅ 已复制';
    btn.disabled = true;
    setTimeout(function() { btn.innerHTML = orig; btn.disabled = false; }, 1500);
}

// ============ 二维码下载 ============
window.downloadQRCode = function(dataUrl) {
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode-' + Date.now() + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// ============ 贷款计算器 ============
function calcLoan(p) {
    var amount = parseFloat(p.amount) || 0;
    var rate = parseFloat(p.rate) || 0;      // 年利率 %
    var years = parseInt(p.years) || 1;
    var months = years * 12;
    var monthlyRate = rate / 100 / 12;
    var method = p.method || 'both';

    if (amount <= 0) throw new Error('请输入有效的贷款金额');
    if (rate <= 0) throw new Error('请输入有效的年利率');
    if (months <= 0) throw new Error('请输入有效的贷款年限');

    // 提前还款参数
    var prepayAmount = parseFloat(p.prepayAmount) || 0;
    var prepayMonth = parseInt(p.prepayMonth) || 0;

    function fmtMoney(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function fmtInt(v) { return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

    // ── 等额本息 ──
    function calcEI(P, r, n, startMonth) {
        startMonth = startMonth || 1;
        if (r === 0) {
            var mp = P / n;
            return { monthly: mp, totalPayment: P, totalInterest: 0, schedule: [] };
        }
        var pow = Math.pow(1 + r, n);
        var M = P * r * pow / (pow - 1);
        var totalPayment = M * n;
        var totalInterest = totalPayment - P;
        var schedule = [];
        var remaining = P;
        for (var k = 1; k <= n; k++) {
            var interest = remaining * r;
            var principal = M - interest;
            remaining -= principal;
            if (remaining < 0) remaining = 0;
            schedule.push({
                month: startMonth + k - 1,
                payment: M,
                principal: principal,
                interest: interest,
                remaining: remaining
            });
        }
        return { monthly: M, totalPayment: totalPayment, totalInterest: totalInterest, schedule: schedule };
    }

    // ── 等额本金 ──
    function calcEP(P, r, n, startMonth) {
        startMonth = startMonth || 1;
        var monthlyPrincipal = P / n;
        var totalInterest = 0;
        var totalPayment = 0;
        var schedule = [];
        var remaining = P;
        for (var k = 1; k <= n; k++) {
            var interest = remaining * r;
            var payment = monthlyPrincipal + interest;
            totalInterest += interest;
            totalPayment += payment;
            remaining -= monthlyPrincipal;
            if (remaining < 0) remaining = 0;
            schedule.push({
                month: startMonth + k - 1,
                payment: payment,
                principal: monthlyPrincipal,
                interest: interest,
                remaining: remaining
            });
        }
        return { firstMonth: schedule[0] ? schedule[0].payment : 0,
                 monthlyPrincipal: monthlyPrincipal,
                 totalPayment: totalPayment,
                 totalInterest: totalInterest,
                 schedule: schedule };
    }

    // ── 生成对比 HTML ──
    function buildComparison(ei, ep) {
        var h = '';
        h += '<div class="loan-compare-grid">';

        // 等额本息卡片
        h += '<div class="loan-card loan-card-ei">';
        h += '<div class="loan-card-title">📊 等额本息</div>';
        h += '<div class="loan-card-row"><span>月供</span><strong>¥' + fmtMoney(ei.monthly) + '</strong></div>';
        h += '<div class="loan-card-row"><span>总还款额</span><strong>¥' + fmtMoney(ei.totalPayment) + '</strong></div>';
        h += '<div class="loan-card-row"><span>总利息</span><strong style="color:#f59e0b;">¥' + fmtMoney(ei.totalInterest) + '</strong></div>';
        h += '</div>';

        // 等额本金卡片
        h += '<div class="loan-card loan-card-ep">';
        h += '<div class="loan-card-title">📉 等额本金</div>';
        h += '<div class="loan-card-row"><span>首月月供</span><strong>¥' + fmtMoney(ep.firstMonth) + '</strong></div>';
        h += '<div class="loan-card-row"><span>每月递减</span><strong>¥' + fmtMoney(ep.monthlyPrincipal * monthlyRate) + '</strong></div>';
        h += '<div class="loan-card-row"><span>总还款额</span><strong>¥' + fmtMoney(ep.totalPayment) + '</strong></div>';
        h += '<div class="loan-card-row"><span>总利息</span><strong style="color:#f59e0b;">¥' + fmtMoney(ep.totalInterest) + '</strong></div>';
        h += '</div>';

        h += '</div>';

        // 对比总结
        var diff = ei.totalInterest - ep.totalInterest;
        h += '<div class="loan-summary">';
        h += '<p>💡 <strong>等额本金比等额本息节省利息：<span style="color:#10b981;">¥' + fmtMoney(diff) + '</span></strong></p>';
        h += '<p style="font-size:13px;color:#9ca3af;">等额本息每月还款额固定，适合收入稳定的人群；等额本金前期还款压力大，但总利息更少。</p>';
        h += '</div>';

        return h;
    }

    // ── 还款明细表 ──
    function buildScheduleTable(schedule, title, maxRows) {
        maxRows = maxRows || 360;
        var showRows = Math.min(schedule.length, maxRows);
        var h = '';
        h += '<div class="loan-schedule">';
        h += '<h4 class="loan-schedule-title">' + title + '</h4>';
        h += '<div class="loan-table-wrap"><table class="loan-table">';
        h += '<thead><tr><th>期数</th><th>月供(元)</th><th>本金(元)</th><th>利息(元)</th><th>剩余本金(元)</th></tr></thead>';
        h += '<tbody>';
        for (var i = 0; i < showRows; i++) {
            var s = schedule[i];
            h += '<tr>';
            h += '<td>' + s.month + '</td>';
            h += '<td>' + fmtMoney(s.payment) + '</td>';
            h += '<td>' + fmtMoney(s.principal) + '</td>';
            h += '<td>' + fmtMoney(s.interest) + '</td>';
            h += '<td>' + fmtMoney(s.remaining) + '</td>';
            h += '</tr>';
        }
        if (schedule.length > maxRows) {
            h += '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">... 仅显示前 ' + maxRows + ' 期，共 ' + schedule.length + ' 期</td></tr>';
        }
        h += '</tbody></table></div>';
        h += '</div>';
        return h;
    }

    // ── 提前还款模拟 ──
    function buildPrepaySection(baseEI, baseEP, prepayAmt, prepayMon, P, r, n) {
        if (prepayAmt <= 0 || prepayMon <= 0 || prepayMon > n) return '';

        var h = '<div class="loan-prepay-section">';
        h += '<h4>⚡ 提前还款模拟（第 ' + prepayMon + ' 期还款 ' + fmtMoney(prepayAmt) + ' 元）</h4>';

        // 等额本息提前还款
        var remainingEI = 0;
        for (var i = 0; i < prepayMon; i++) {
            remainingEI = baseEI.schedule[i] ? baseEI.schedule[i].remaining : P;
        }
        remainingEI = baseEI.schedule[prepayMon - 1] ? baseEI.schedule[prepayMon - 1].remaining : P;
        var newRemainingEI = Math.max(0, remainingEI - prepayAmt);
        var newMonthsEI = n - prepayMon;
        var newEI = calcEI(newRemainingEI, r, newMonthsEI, prepayMon + 1);
        var savedEI = baseEI.totalInterest - (baseEI.schedule.slice(0, prepayMon).reduce(function(s,x){return s+x.interest;}, 0) + newEI.totalInterest);

        // 等额本金提前还款
        var remainingEP = baseEP.schedule[prepayMon - 1] ? baseEP.schedule[prepayMon - 1].remaining : P;
        var newRemainingEP = Math.max(0, remainingEP - prepayAmt);
        var newMonthsEP = n - prepayMon;
        var newEP = calcEP(newRemainingEP, r, newMonthsEP, prepayMon + 1);
        var savedEP = baseEP.totalInterest - (baseEP.schedule.slice(0, prepayMon).reduce(function(s,x){return s+x.interest;}, 0) + newEP.totalInterest);

        h += '<div class="loan-compare-grid">';
        h += '<div class="loan-card loan-card-ei">';
        h += '<div class="loan-card-title">📊 等额本息 - 提前还款后</div>';
        h += '<div class="loan-card-row"><span>剩余本金</span><strong>¥' + fmtMoney(newRemainingEI) + '</strong></div>';
        h += '<div class="loan-card-row"><span>新月供</span><strong>¥' + fmtMoney(newEI.monthly) + '</strong></div>';
        h += '<div class="loan-card-row"><span>节省利息</span><strong style="color:#10b981;">¥' + fmtMoney(savedEI) + '</strong></div>';
        h += '</div>';
        h += '<div class="loan-card loan-card-ep">';
        h += '<div class="loan-card-title">📉 等额本金 - 提前还款后</div>';
        h += '<div class="loan-card-row"><span>剩余本金</span><strong>¥' + fmtMoney(newRemainingEP) + '</strong></div>';
        h += '<div class="loan-card-row"><span>新首月月供</span><strong>¥' + fmtMoney(newEP.firstMonth) + '</strong></div>';
        h += '<div class="loan-card-row"><span>节省利息</span><strong style="color:#10b981;">¥' + fmtMoney(savedEP) + '</strong></div>';
        h += '</div>';
        h += '</div>';

        h += '</div>';
        return h;
    }

    // ── CSV 导出 ──
    function buildExportButton(schedule, label) {
        var id = 'csvData_' + label.replace(/[^a-zA-Z]/g, '_');
        window[id] = schedule;
        var h = '<button class="btn-sm" style="margin:8px 4px;" onclick="exportLoanCSV(\'' + id + '\',\'' + label + '\')">📥 导出 ' + label + ' CSV</button>';
        return h;
    }

    // ── 计算并渲染 ──
    var ei = calcEI(amount, monthlyRate, months, 1);
    var ep = calcEP(amount, monthlyRate, months, 1);

    var html = '';

    // 对比表格
    html += buildComparison(ei, ep);

    // 导出按钮
    html += '<div style="margin-top:12px;">';
    html += buildExportButton(ei.schedule, '等额本息还款明细');
    html += buildExportButton(ep.schedule, '等额本金还款明细');
    html += '</div>';

    // 还款明细表
    if (method === 'both' || method === 'equal_installment') {
        html += buildScheduleTable(ei.schedule, '等额本息 - 还款明细表', 120);
    }
    if (method === 'both' || method === 'equal_principal') {
        html += buildScheduleTable(ep.schedule, '等额本金 - 还款明细表', 120);
    }

    // 提前还款模拟
    if (prepayAmount > 0 && prepayMonth > 0) {
        html += buildPrepaySection(ei, ep, prepayAmount, prepayMonth, amount, monthlyRate, months);
    }

    return html;
}

// CSV 导出函数（挂载到 window 全局）
window.exportLoanCSV = function(dataId, label) {
    var schedule = window[dataId];
    if (!schedule || !schedule.length) return;
    var csv = '\uFEFF期数,月供(元),本金(元),利息(元),剩余本金(元)\n';
    schedule.forEach(function(s) {
        csv += s.month + ',' + s.payment.toFixed(2) + ',' + s.principal.toFixed(2) + ',' + s.interest.toFixed(2) + ',' + s.remaining.toFixed(2) + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = label + '.csv';
    a.click();
    URL.revokeObjectURL(url);
};
