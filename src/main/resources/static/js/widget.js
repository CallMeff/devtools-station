/**
 * DevTools Station - 桌面小组件系统
 * 类似 Android/iOS 桌面小组件，以卡片形式展示工具关键信息
 *
 * Widget 注册机制：
 *   WidgetRegistry.register({ id, name, icon, desc, render, onAdd, onRemove, updateInterval })
 *
 * WidgetManager 管理：
 *   - 小组件的生命周期（添加/移除/位置/大小）
 *   - 桌面渲染
 *   - 定时更新
 *   - localStorage 持久化
 */
(function() {
    'use strict';

    // ============ Widget Registry ============
    var registry = {};
    var widgetInstances = [];   // 用户桌面上的小组件实例
    var widgetPositions = {};   // { widgetId_instanceId: { x, y } }

    var WIDGET_MIN_W = 200;
    var WIDGET_MIN_H = 110;
    var WIDGET_DEFAULT_W = 220;

    var WIDGET_STORE_KEY = 'desktop_widgets';
    var WIDGET_POS_KEY = 'desktop_widget_positions';

    /* ---- 注册 ---- */
    function register(config) {
        registry[config.id] = config;
    }

    /* ---- 存储 ---- */
    function loadInstances() {
        try {
            var raw = localStorage.getItem(WIDGET_STORE_KEY);
            if (raw) widgetInstances = JSON.parse(raw);
        } catch(e) { widgetInstances = []; }
    }
    function saveInstances() {
        try { localStorage.setItem(WIDGET_STORE_KEY, JSON.stringify(widgetInstances)); } catch(e) {}
        // 登录态：触发服务器同步
        if (window.__syncWidgetsToServer) window.__syncWidgetsToServer();
    }
    function loadPositions() {
        try {
            var raw = localStorage.getItem(WIDGET_POS_KEY);
            if (raw) widgetPositions = JSON.parse(raw);
        } catch(e) { widgetPositions = {}; }
    }
    function savePositions() {
        try { localStorage.setItem(WIDGET_POS_KEY, JSON.stringify(widgetPositions)); } catch(e) {}
        if (window.__syncWidgetsToServer) window.__syncWidgetsToServer();
    }

    function getPositionKey(inst) {
        return 'w_' + inst.widgetId + '_' + inst.id;
    }

    function getPosition(inst) {
        var key = getPositionKey(inst);
        if (widgetPositions[key]) return widgetPositions[key];
        // 自动分配位置
        var x = 8, y = 8;
        var used = {};
        for (var k in widgetPositions) {
            if (widgetPositions.hasOwnProperty(k)) {
                var px = Math.round(widgetPositions[k].x / (WIDGET_DEFAULT_W + 12));
                var py = Math.round(widgetPositions[k].y / 150);
                used[px + ',' + py] = true;
            }
        }
        for (var row = 0; row < 20; row++) {
            for (var col = 0; col < 6; col++) {
                if (!used[col + ',' + row]) {
                    x = col * (WIDGET_DEFAULT_W + 12) + 8;
                    y = row * 150 + 8;
                    widgetPositions[key] = { x: x, y: y };
                    savePositions();
                    return { x: x, y: y };
                }
            }
        }
        widgetPositions[key] = { x: x, y: y };
        savePositions();
        return { x: x, y: y };
    }

    /* ---- 实例管理 ---- */
    function addWidget(widgetId) {
        var def = registry[widgetId];
        if (!def) return null;

        var inst = {
            id: Date.now(),
            widgetId: widgetId,
            createdAt: new Date().toISOString()
        };

        widgetInstances.push(inst);
        saveInstances();
        renderWidgets();

        // onAdd 回调
        if (def.onAdd) def.onAdd(inst);

        // 设置定时更新
        if (def.updateInterval) {
            inst._interval = setInterval(function() {
                updateWidgetContent(inst);
            }, def.updateInterval);
        }

        return inst;
    }

    function removeWidget(instanceId) {
        var inst = widgetInstances.find(function(w) { return w.id === instanceId; });
        if (!inst) return;

        var def = registry[inst.widgetId];
        if (inst._interval) clearInterval(inst._interval);
        if (def && def.onRemove) def.onRemove(inst);

        var key = getPositionKey(inst);
        delete widgetPositions[key];
        savePositions();

        widgetInstances = widgetInstances.filter(function(w) { return w.id !== instanceId; });
        saveInstances();
        renderWidgets();
    }

    function hasWidget(widgetId) {
        return widgetInstances.some(function(w) { return w.widgetId === widgetId; });
    }

    /* ---- 渲染 ---- */
    function renderWidgets() {
        var container = document.getElementById('desktopWidgets');
        if (!container) {
            // 创建容器
            var desktop = document.getElementById('desktop');
            if (!desktop) return;
            container = document.createElement('div');
            container.id = 'desktopWidgets';
            container.style.cssText = 'position:absolute;inset:24px;z-index:2;pointer-events:none;';
            desktop.appendChild(container);
        }

        container.innerHTML = '';

        widgetInstances.forEach(function(inst) {
            var def = registry[inst.widgetId];
            if (!def) return;

            var pos = getPosition(inst);
            var el = document.createElement('div');
            el.className = 'desktop-widget';
            el.setAttribute('data-widget-instance', inst.id);
            el.setAttribute('data-widget-id', inst.widgetId);
            el.style.left = pos.x + 'px';
            el.style.top = pos.y + 'px';
            el.style.pointerEvents = 'auto';

            el.innerHTML = getWidgetHTML(inst, def);
            container.appendChild(el);

            // 绑定事件
            bindWidgetEvents(el, inst, def);

            // 渲染后回调
            setTimeout(function() {
                if (def.render) def.render(el, inst);
            }, 0);
        });

        // 更新小组件按钮位置
        updateAddBtn();

        // 有小组件时隐藏桌面空状态提示
        if (widgetInstances.length > 0) {
            var emptyEl = document.getElementById('desktopEmpty');
            if (emptyEl) {
                emptyEl.style.display = 'none';
                // 持续监测：如果被其他代码（如 page-skin.js）改回，强制隐藏
                if (!window.__emptyMonitor) {
                    window.__emptyMonitor = new MutationObserver(function() {
                        if (widgetInstances.length > 0 && emptyEl.style.display !== 'none') {
                            emptyEl.style.display = 'none';
                        }
                    });
                    window.__emptyMonitor.observe(emptyEl, { attributes: true, attributeFilter: ['style'] });
                }
            }
        }
    }

    function getWidgetHTML(inst, def) {
        var h = '';
        h += '<div class="widget-body" data-widget-body="' + inst.widgetId + '">';
        h += def.getHTML ? def.getHTML(inst) : '';
        h += '</div>';
        h += '<button class="widget-close-btn" data-action="remove-widget" title="移除小组件">&times;</button>';
        return h;
    }

    function updateWidgetContent(inst) {
        var def = registry[inst.widgetId];
        if (!def) return;
        var body = document.querySelector('[data-widget-body="' + inst.widgetId + '"]');
        if (!body) return;
        var el = body.closest('.desktop-widget');
        if (!el) return;
        if (def.update) {
            def.update(body, inst, el);
        }
    }

    function bindWidgetEvents(el, inst, def) {
        // 移除按钮
        var removeBtn = el.querySelector('[data-action="remove-widget"]');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeWidget(inst.id);
                showWidgetToast('已移除小组件');
            });
        }

        // 拖拽（整个卡片可拖拽，但排除按钮、输入框等交互元素）
        el.addEventListener('mousedown', function(e) {
            if (e.target.closest('.widget-close-btn') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) return;
            startWidgetDrag(e, el, inst);
        });
        el.addEventListener('touchstart', function(e) {
            if (e.target.closest('.widget-close-btn') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) return;
            startWidgetDrag(e, el, inst);
        }, { passive: false });

        // 绑定自定义事件
        if (def.bindEvents) def.bindEvents(el, inst);
    }

    /* ---- 拖拽 ---- */
    var widgetDrag = null;

    function startWidgetDrag(e, el, inst) {
        e.preventDefault();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var rect = el.getBoundingClientRect();
        var desktopEl = document.getElementById('desktop');
        var desktopRect = desktopEl.getBoundingClientRect();

        widgetDrag = {
            el: el,
            inst: inst,
            startX: clientX,
            startY: clientY,
            origLeft: parseInt(el.style.left) || 0,
            origTop: parseInt(el.style.top) || 0,
            desktopLeft: desktopRect.left,
            desktopTop: desktopRect.top,
            desktopWidth: desktopRect.width,
            desktopHeight: desktopRect.height,
            moved: false
        };

        el.classList.add('dragging');

        document.addEventListener('mousemove', onWidgetDrag);
        document.addEventListener('mouseup', onWidgetDragEnd);
        document.addEventListener('touchmove', onWidgetDrag, { passive: false });
        document.addEventListener('touchend', onWidgetDragEnd);
    }

    function onWidgetDrag(e) {
        if (!widgetDrag) return;
        e.preventDefault();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var dx = clientX - widgetDrag.startX;
        var dy = clientY - widgetDrag.startY;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
        widgetDrag.moved = true;

        var nl = widgetDrag.origLeft + dx;
        var nt = widgetDrag.origTop + dy;
        nl = Math.max(0, Math.min(nl, widgetDrag.desktopWidth - 240));
        nt = Math.max(0, Math.min(nt, widgetDrag.desktopHeight - 140));

        widgetDrag.el.style.left = nl + 'px';
        widgetDrag.el.style.top = nt + 'px';
    }

    function onWidgetDragEnd() {
        if (!widgetDrag) return;
        document.removeEventListener('mousemove', onWidgetDrag);
        document.removeEventListener('mouseup', onWidgetDragEnd);
        document.removeEventListener('touchmove', onWidgetDrag);
        document.removeEventListener('touchend', onWidgetDragEnd);

        var el = widgetDrag.el;
        el.classList.remove('dragging');

        if (widgetDrag.moved) {
            var key = getPositionKey(widgetDrag.inst);
            widgetPositions[key] = {
                x: parseInt(el.style.left),
                y: parseInt(el.style.top)
            };
            savePositions();
        }
        widgetDrag = null;
    }

    /* ---- 小组件商店 ---- */
    function openStore() {
        var panel = document.getElementById('widgetStorePanel');
        var overlay = document.getElementById('widgetStoreOverlay');

        if (!panel) {
            // 动态创建
            overlay = document.createElement('div');
            overlay.id = 'widgetStoreOverlay';
            overlay.className = 'widget-store-overlay';
            document.body.appendChild(overlay);

            panel = document.createElement('div');
            panel.id = 'widgetStorePanel';
            panel.className = 'widget-store-panel';
            document.body.appendChild(panel);
        }

        renderStore();
        panel.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        overlay.addEventListener('click', closeStore);
    }

    function closeStore() {
        var panel = document.getElementById('widgetStorePanel');
        var overlay = document.getElementById('widgetStoreOverlay');
        if (panel) panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function renderStore() {
        var panel = document.getElementById('widgetStorePanel');
        if (!panel) return;

        var items = Object.values(registry);
        panel.innerHTML =
            '<div class="widget-store-header">' +
                '<div>' +
                    '<h2>🧩 小组件商店</h2>' +
                    '<p>添加小组件到桌面，快速查看关键信息</p>' +
                '</div>' +
                '<div class="widget-store-header-actions">' +
                    '<button class="widget-store-reset" id="widgetStoreResetBtn" title="清除所有小组件并重置排列">↺ 重置排列</button>' +
                    '<button class="widget-store-close" id="widgetStoreCloseBtn">&times;</button>' +
                '</div>' +
            '</div>' +
            '<div class="widget-store-body">' +
                '<div class="widget-store-grid">' +
                    items.map(function(w) {
                        var added = hasWidget(w.id);
                        return '<div class="widget-store-card' + (added ? ' already-added' : '') + '" data-widget="' + w.id + '">' +
                            '<div class="widget-store-card-icon">' + w.icon + '</div>' +
                            '<div class="widget-store-card-name">' + w.name + '</div>' +
                            '<div class="widget-store-card-desc">' + w.desc + '</div>' +
                            '<div class="add-btn">' + (added ? '已添加' : '添加到桌面') + '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
            '</div>';

        // 绑定关闭按钮
        var closeBtn = panel.querySelector('#widgetStoreCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeStore);

        // 绑定重置排列按钮
        var resetBtn = panel.querySelector('#widgetStoreResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (widgetInstances.length === 0) {
                    showWidgetToast('桌面已是空白的');
                    return;
                }
                if (confirm('确定要清除所有小组件并重置排列吗？')) {
                    resetWidgetLayout();
                    closeStore();
                }
            });
        }

        // 绑定卡片点击
        panel.querySelectorAll('.widget-store-card:not(.already-added)').forEach(function(card) {
            card.addEventListener('click', function() {
                var widgetId = card.getAttribute('data-widget');
                var inst = addWidget(widgetId);
                if (inst) {
                    closeStore();
                    showWidgetToast('已添加「' + registry[widgetId].name + '」到桌面');
                }
            });
        });

        // Escape 关闭
        var escHandler = function(e) {
            if (e.key === 'Escape') { closeStore(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
    }

    /* ---- 添加按钮 ---- */
    function updateAddBtn() {
        var desktop = document.getElementById('desktop');
        if (!desktop) return;

        var btn = document.getElementById('desktopWidgetAddBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'desktopWidgetAddBtn';
            btn.className = 'desktop-widget-add-btn';
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加小组件';
            btn.addEventListener('click', openStore);
            desktop.appendChild(btn);
        }

        // 如果已有 widget 实例，调整按钮位置
        if (widgetInstances.length === 0) {
            btn.style.display = '';
        } else {
            btn.style.display = '';
        }
    }

    /* ---- Toast ---- */
    function showWidgetToast(msg) {
        var toast = document.getElementById('desktopToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function() {
            toast.classList.remove('show');
        }, 2000);
    }

    /* ---- 重置排列 ---- */
    function resetWidgetLayout() {
        // 清除所有位置缓存
        widgetPositions = {};
        try { localStorage.removeItem(WIDGET_POS_KEY); } catch(e) {}
        // 清除实例数据
        widgetInstances = [];
        try { localStorage.removeItem(WIDGET_STORE_KEY); } catch(e) {}
        // 重新渲染
        renderWidgets();
        showWidgetToast('桌面小组件排列已重置');
    }

    /* ---- 初始化 ---- */
    var _initCalled = false;
    var _initTimer = null;

    function init() {
        if (_initCalled) return;
        _initCalled = true;
        if (_initTimer) { clearTimeout(_initTimer); _initTimer = null; }

        loadInstances();
        loadPositions();

        // 清理无效的 registry 引用（保留已注册的）
        var before = widgetInstances.length;
        widgetInstances = widgetInstances.filter(function(inst) {
            return !!registry[inst.widgetId];
        });
        if (widgetInstances.length !== before) {
            saveInstances();
        }

        if (widgetInstances.length > 0) {
            renderWidgets();
        } else {
            // 即使没有实例也要显示添加按钮
            updateAddBtn();
        }

        // 建立定时更新
        widgetInstances.forEach(function(inst) {
            var def = registry[inst.widgetId];
            if (def && def.updateInterval && !inst._interval) {
                inst._interval = setInterval(function() {
                    updateWidgetContent(inst);
                }, def.updateInterval);
            }
        });
    }

    // 延迟调度初始化，确保 DOM 就绪且所有扩展组件已注册
    function scheduleInit() {
        if (_initTimer) clearTimeout(_initTimer);
        // 使用 setTimeout 给 widgets-extended.js 等后续脚本充足时间注册
        _initTimer = setTimeout(init, 200);
    }

    // 供外部调用的重新初始化（等所有注册完成后）
    function reinit() {
        _initCalled = false;
        if (_initTimer) { clearTimeout(_initTimer); _initTimer = null; }
        init();
    }

    // ==========================================
    // 内置小组件定义
    // ==========================================

    // 1. 时间戳小组件
    register({
        id: 'timestamp',
        name: '时间戳',
        icon: '⏱️',
        desc: '实时显示当前 Unix 时间戳和可读时间',
        updateInterval: 1000,
        getHTML: function() {
            return '<div class="widget-timestamp">' +
                '<div class="ts-big" id="w_ts_big">--</div>' +
                '<div class="ts-label">UNIX TIMESTAMP<span class="ts-updating"></span></div>' +
                '<div class="ts-readable" id="w_ts_readable">--</div>' +
            '</div>';
        },
        update: function(body) {
            var now = Date.now();
            var sec = Math.floor(now / 1000);
            var bigEl = body.querySelector('#w_ts_big');
            var readableEl = body.querySelector('#w_ts_readable');
            if (bigEl) bigEl.textContent = sec;
            if (readableEl) {
                var d = new Date();
                readableEl.textContent = d.getFullYear() + '-' +
                    String(d.getMonth()+1).padStart(2,'0') + '-' +
                    String(d.getDate()).padStart(2,'0') + ' ' +
                    String(d.getHours()).padStart(2,'0') + ':' +
                    String(d.getMinutes()).padStart(2,'0') + ':' +
                    String(d.getSeconds()).padStart(2,'0');
            }
        }
    });

    // 2. UUID 小组件
    register({
        id: 'uuid',
        name: 'UUID 生成',
        icon: '🆔',
        desc: '一键生成 UUID，点击复制到剪贴板',
        getHTML: function() {
            var uuid = generateUUID();
            return '<div class="widget-uuid">' +
                '<div class="uuid-value" id="w_uuid_val">' + uuid + '</div>' +
                '<div class="uuid-actions">' +
                    '<button class="uuid-btn" data-action="uuid-copy">📋 复制</button>' +
                    '<button class="uuid-btn" data-action="uuid-refresh">🔄 刷新</button>' +
                '</div>' +
            '</div>';
        },
        bindEvents: function(el) {
            el.querySelector('[data-action="uuid-copy"]').addEventListener('click', function(e) {
                e.stopPropagation();
                var val = el.querySelector('#w_uuid_val').textContent;
                copyToClipboard(val);
                showWidgetToast('UUID 已复制');
            });
            el.querySelector('[data-action="uuid-refresh"]').addEventListener('click', function(e) {
                e.stopPropagation();
                var valEl = el.querySelector('#w_uuid_val');
                if (valEl) valEl.textContent = generateUUID();
            });
        }
    });

    // 3. 密码生成小组件
    register({
        id: 'password',
        name: '密码生成',
        icon: '🔐',
        desc: '随机生成高强度密码，一键复制',
        getHTML: function() {
            var pw = generatePassword(16);
            return '<div class="widget-password">' +
                '<div class="pw-display" id="w_pw_val">' + pw + '</div>' +
                '<div class="pw-actions">' +
                    '<button class="pw-btn" data-action="pw-copy">📋 复制</button>' +
                    '<button class="pw-btn" data-action="pw-refresh">🔄 刷新</button>' +
                '</div>' +
            '</div>';
        },
        bindEvents: function(el) {
            el.querySelector('[data-action="pw-copy"]').addEventListener('click', function(e) {
                e.stopPropagation();
                var val = el.querySelector('#w_pw_val').textContent;
                copyToClipboard(val);
                showWidgetToast('密码已复制');
            });
            el.querySelector('[data-action="pw-refresh"]').addEventListener('click', function(e) {
                e.stopPropagation();
                var valEl = el.querySelector('#w_pw_val');
                if (valEl) valEl.textContent = generatePassword(16);
            });
        }
    });

    // 4. 随机数小组件
    register({
        id: 'random',
        name: '随机数',
        icon: '🎲',
        desc: '指定范围生成随机数',
        getHTML: function() {
            return '<div class="widget-random">' +
                '<div class="rand-display">' +
                    '<div class="rand-big" id="w_rand_val">42</div>' +
                    '<div class="rand-small">随机数</div>' +
                '</div>' +
                '<div class="rand-actions">' +
                    '<div class="rand-range">' +
                        '<input type="number" id="w_rand_min" value="1" min="0" max="9999">' +
                        '<span>~</span>' +
                        '<input type="number" id="w_rand_max" value="100" min="1" max="10000">' +
                    '</div>' +
                    '<button class="rand-btn" data-action="rand-gen">生成</button>' +
                '</div>' +
            '</div>';
        },
        bindEvents: function(el) {
            el.querySelector('[data-action="rand-gen"]').addEventListener('click', function(e) {
                e.stopPropagation();
                var min = parseInt(el.querySelector('#w_rand_min').value) || 1;
                var max = parseInt(el.querySelector('#w_rand_max').value) || 100;
                if (min > max) { var t = min; min = max; max = t; }
                var val = Math.floor(Math.random() * (max - min + 1)) + min;
                el.querySelector('#w_rand_val').textContent = val;
            });
            // 输入时阻止拖拽
            el.querySelectorAll('input').forEach(function(inp) {
                inp.addEventListener('mousedown', function(e) { e.stopPropagation(); });
            });
        }
    });

    // 5. 颜色拾取小组件
    register({
        id: 'colorpicker',
        name: '颜色拾取',
        icon: '🎨',
        desc: '快速预览颜色，支持 HEX 输入',
        colors: ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6'],
        getHTML: function() {
            var currentColor = '#6366f1';
            return '<div class="widget-color">' +
                '<div class="color-preview" id="w_color_preview" style="background:' + currentColor + '"></div>' +
                '<div class="color-hex" id="w_color_hex" data-action="color-copy">' + currentColor + '</div>' +
                '<div class="color-rgb" id="w_color_rgb">rgb(99, 102, 241)</div>' +
                '<div class="color-actions" id="w_color_presets">' +
                    this.colors.map(function(c) {
                        return '<div class="color-preset' + (c === currentColor ? ' active' : '') + '" data-color="' + c + '" style="background:' + c + '"></div>';
                    }).join('') +
                '</div>' +
                '<div class="color-input-row">' +
                    '<input type="text" id="w_color_input" placeholder="#HEX" value="' + currentColor + '">' +
                '</div>' +
            '</div>';
        },
        updateColor: function(el, hex) {
            hex = hex.trim();
            if (!/^#[0-9a-fA-F]{3,6}$/.test(hex)) return;
            // 展开短 HEX
            if (hex.length === 4) hex = '#' + hex[1]+hex[1] + hex[2]+hex[2] + hex[3]+hex[3];
            var r = parseInt(hex.slice(1,3), 16);
            var g = parseInt(hex.slice(3,5), 16);
            var b = parseInt(hex.slice(5,7), 16);

            var preview = el.querySelector('#w_color_preview');
            var hexEl = el.querySelector('#w_color_hex');
            var rgbEl = el.querySelector('#w_color_rgb');
            if (preview) preview.style.background = hex;
            if (hexEl) hexEl.textContent = hex;
            if (rgbEl) rgbEl.textContent = 'rgb(' + r + ', ' + g + ', ' + b + ')';

            el.querySelectorAll('.color-preset').forEach(function(p) {
                p.classList.toggle('active', p.getAttribute('data-color').toLowerCase() === hex.toLowerCase());
            });
        },
        bindEvents: function(el) {
            var self = this;
            // 点击预设颜色
            el.querySelectorAll('.color-preset').forEach(function(preset) {
                preset.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var hex = preset.getAttribute('data-color');
                    self.updateColor(el, hex);
                    el.querySelector('#w_color_input').value = hex;
                });
            });
            // 输入 HEX
            var input = el.querySelector('#w_color_input');
            input.addEventListener('input', function(e) {
                e.stopPropagation();
                self.updateColor(el, input.value);
            });
            input.addEventListener('mousedown', function(e) { e.stopPropagation(); });
            // 点击 HEX 复制
            el.querySelector('[data-action="color-copy"]').addEventListener('click', function(e) {
                e.stopPropagation();
                copyToClipboard(el.querySelector('#w_color_hex').textContent);
                showWidgetToast('颜色值已复制');
            });
        }
    });

    // ==========================================
    // 工具函数
    // ==========================================
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function generatePassword(len) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
        var result = '';
        for (var i = 0; i < len; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(function() {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    // ==========================================
    // 公开 API
    // ==========================================
    window.WidgetManager = {
        init: init,
        reinit: reinit,
        register: register,
        add: addWidget,
        remove: removeWidget,
        openStore: openStore,
        closeStore: closeStore,
        resetLayout: resetWidgetLayout,
        renderWidgets: renderWidgets,
        getInstances: function() { return widgetInstances; },
        getRegistry: function() { return registry; },
        hasWidget: hasWidget
    };

    // 页面加载后初始化
    // 使用 scheduleInit 延迟 200ms，给 widgets-extended.js 等后续脚本时间注册
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            scheduleInit();
        });
    } else {
        scheduleInit();
    }
})();
