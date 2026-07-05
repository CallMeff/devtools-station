/**
 * DevTools Station - 桌面模式主脚本
 * Apple 桌面风格：可拖拽图标 + 工具商店
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initKeyboardShortcuts();
    // 初始化窗口管理器（创建任务栏等）
    window.WindowManager && WindowManager.init();
    // 立即绑定商店按钮事件（避免 100ms 竞态条件导致按钮无响应）
    bindStoreEvents();
    // 绑定小组件按钮
    bindWidgetBtn();
    // 桌面管理器
    setTimeout(() => DesktopManager.init(), 100);
    // 桌面宠物
    if (window.PetManager) PetManager.init();
});

/**
 * 提前绑定工具商店按钮事件（在 DesktopManager.init() 之前）
 * 防止用户在页面加载瞬间点击按钮无响应
 */
function bindStoreEvents() {
    var btnOpen = document.getElementById('btnOpenStore');
    if (btnOpen) {
        btnOpen.addEventListener('click', function() {
            DesktopManager.openStore();
        });
    }

    var btnClose = document.getElementById('btnCloseStore');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            DesktopManager.closeStore();
        });
    }

    var overlay = document.getElementById('storeOverlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            DesktopManager.closeStore();
        });
    }

    // 商店搜索
    var storeSearch = document.getElementById('storeSearchInput');
    if (storeSearch) {
        storeSearch.addEventListener('input', function() {
            DesktopManager.renderStore(storeSearch.value);
        });
    }
}

function bindWidgetBtn() {
    var btn = document.getElementById('btnOpenWidgets');
    if (btn) {
        btn.addEventListener('click', function() {
            if (window.WidgetManager) WidgetManager.openStore();
        });
    }
}

/**
 * 从服务器加载小组件配置（登录用户切换设备/清缓存后恢复）
 */
function loadWidgetConfigFromServer() {
    api('GET', '/api/settings').then(function(res) {
        if (res.code === 200 && res.data && res.data.customConfig) {
            try {
                var config = JSON.parse(res.data.customConfig);
                if (config.widgets) {
                    localStorage.setItem('desktop_widgets', JSON.stringify(config.widgets));
                }
                if (config.widgetPositions) {
                    localStorage.setItem('desktop_widget_positions', JSON.stringify(config.widgetPositions));
                }
                // 触发 WidgetManager 重新加载
                if (window.WidgetManager && window.WidgetManager.reinit) {
                    window.WidgetManager.reinit();
                }
            } catch(e) {}
        }
    }).catch(function() {});
}

/**
 * 小组件数据同步到服务器（saveInstances/savePositions 的钩子）
 * 800ms 防抖，避免频繁请求
 */
(function() {
    var _wSyncTimer = null;
    window.__syncWidgetsToServer = function() {
        // 仅登录态同步
        if (!window.DevAuth || !window.DevAuth.isLoggedIn || !window.DevAuth.isLoggedIn()) return;
        clearTimeout(_wSyncTimer);
        _wSyncTimer = setTimeout(function() {
            var config = {};
            try {
                var w = localStorage.getItem('desktop_widgets');
                var p = localStorage.getItem('desktop_widget_positions');
                if (w) config.widgets = JSON.parse(w);
                if (p) config.widgetPositions = JSON.parse(p);
            } catch(e) {}
            api('PUT', '/api/settings', { customConfig: JSON.stringify(config) })
                .catch(function() {});
        }, 800);
    };
})();

/* ============================================
   全局搜索（保留原逻辑）
   ============================================ */
function initSearch() {
    const input = document.getElementById('searchInput');
    const dropdown = document.getElementById('searchDropdown');
    if (!input || !dropdown) return;

    let allTools = [];

    function buildSearchIndex() {
        allTools = DesktopManager.getAllTools().map(t => ({
            name: t.name,
            desc: t.description || '',
            icon: t.icon,
            href: t.route
        }));
    }

    // 延迟构建（等 DesktopManager 初始化）
    setTimeout(buildSearchIndex, 200);

    input.addEventListener('input', () => {
        if (allTools.length === 0) buildSearchIndex();
        const q = input.value.toLowerCase().trim();
        if (!q) { dropdown.classList.remove('active'); return; }

        const matched = allTools.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q)
        );

        if (matched.length === 0) {
            var noResult = (window.__I18N__ && window.__I18N__.t('search.no_result')) || '未找到匹配的工具';
            dropdown.innerHTML = '<div class="search-empty">' + noResult + '</div>';
        } else {
            dropdown.innerHTML = matched.slice(0, 8).map(t => `
                <a href="${t.href}" class="search-item">
                    <span class="search-item-icon">${t.icon}</span>
                    <div class="search-item-info">
                        <h4>${highlightMatch(t.name, q)}</h4>
                        <p>${highlightMatch(t.desc, q)}</p>
                    </div>
                </a>
            `).join('');
        }
        dropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#navSearch')) dropdown.classList.remove('active');
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { dropdown.classList.remove('active'); input.blur(); }
    });
}

function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return before + '<mark style="background:rgba(99,102,241,0.3);color:inherit;border-radius:2px;">' + match + '</mark>' + after;
}

/* ============================================
   键盘快捷键
   ============================================ */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const input = document.getElementById('searchInput');
            if (input) input.focus();
        }
        // Escape 关闭商店
        if (e.key === 'Escape') {
            DesktopManager.closeStore();
            DesktopManager.closeContextMenu();
            DesktopManager.deselectAll();
        }
    });
}

/* ============================================
   DesktopManager - 桌面管理器
   ============================================ */
var DesktopManager = (function() {
    'use strict';

    var allTools = [];          // 所有工具数据
    var categories = [];        // 分类数据
    var desktopTools = [];      // 桌面上的工具（来自收藏）
    var desktopIds = new Set(); // 桌面工具 ID 集合
    var positions = {};         // { toolId: { xp: 0.5, yp: 0.3 } } 百分比坐标
    var currentDrag = null;     // 当前拖拽状态
    var contextTarget = null;   // 右键目标

    var COL = 100;  // 列宽
    var ROW = 110;  // 行高
    var COLS = 12;  // 最大列数

    /* ---- 初始化 ---- */
    function init() {
        // 1. 从 meta 标签读取工具和分类数据
        try {
            var toolsMeta = document.querySelector('meta[name="all-tools-data"]');
            if (toolsMeta) allTools = JSON.parse(toolsMeta.getAttribute('content'));
        } catch(e) { allTools = []; }

        try {
            var catMeta = document.querySelector('meta[name="categories-data"]');
            if (catMeta) categories = JSON.parse(catMeta.getAttribute('content'));
        } catch(e) { categories = []; }

        // 2. 读取本地位置数据
        loadPositions();

        // 3. 计算列数（响应式）
        updateLayout();

        // 4. 加载收藏（桌面工具）
        loadDesktopTools();

        // 5. 事件绑定
        bindEvents();
    }

    function updateLayout() {
        var desktop = document.getElementById('desktop');
        if (desktop) {
            var w = desktop.clientWidth - 60;
            COLS = Math.max(3, Math.floor(w / COL));
        }
    }

    /* ---- 位置存储（v2：百分比坐标） ---- */
    function loadPositions() {
        try {
            var raw = localStorage.getItem('desktop_positions_v2');
            if (raw) {
                positions = JSON.parse(raw);
            } else {
                // 迁移旧数据
                var oldRaw = localStorage.getItem('desktop_positions');
                if (oldRaw) {
                    var oldPos = JSON.parse(oldRaw);
                    var desktop = document.getElementById('desktop');
                    var dw = desktop ? desktop.clientWidth : 1920;
                    var dh = desktop ? desktop.clientHeight : 1080;
                    positions = {};
                    for (var id in oldPos) {
                        if (oldPos.hasOwnProperty(id)) {
                            var p = oldPos[id];
                            positions[id] = {
                                xp: Math.max(0, Math.min(1, (p.x || 0) / dw)),
                                yp: Math.max(0, Math.min(1, (p.y || 0) / dh))
                            };
                        }
                    }
                    savePositions();
                    localStorage.removeItem('desktop_positions');
                }
            }
        } catch(e) { positions = {}; }
    }

    function savePositions() {
        try {
            localStorage.setItem('desktop_positions_v2', JSON.stringify(positions));
        } catch(e) {}
        // 登录态：防抖同步到服务器（拖拽结束后调用）
        scheduleServerPositionSync();
    }

    var _posSyncTimer = null;
    function scheduleServerPositionSync() {
        if (!isLoggedIn()) return;
        clearTimeout(_posSyncTimer);
        _posSyncTimer = setTimeout(function() {
            api('POST', '/api/favorites/positions', {
                positions: positions
            }).catch(function() { /* 静默失败，localStorage 兜底 */ });
        }, 800); // 800ms 防抖，避免拖拽过程中频繁请求
    }

    function getPosition(toolId) {
        var key = String(toolId);
        if (positions[key]) return positions[key];
        return autoPosition(toolId);
    }

    /* ---- 按视觉位置排序工具数组，保持 DOM 顺序与视觉顺序一致 ---- */
    function sortDesktopToolsByPosition() {
        if (desktopTools.length === 0) return;
        var pos = positions;
        desktopTools.sort(function(a, b) {
            var pa = pos[String(a.id)];
            var pb = pos[String(b.id)];
            if (!pa && !pb) return 0;
            if (!pa) return 1;
            if (!pb) return -1;
            // 按行排序（yp），同行再按列排序（xp）
            var rowA = Math.round(pa.yp * 100);
            var rowB = Math.round(pb.yp * 100);
            if (rowA !== rowB) return rowA - rowB;
            return Math.round(pa.xp * 100) - Math.round(pb.xp * 100);
        });
    }

    function autoPosition(toolId) {
        var desktop = document.getElementById('desktop');
        var dw = desktop ? desktop.clientWidth : 1920;
        var dh = desktop ? desktop.clientHeight : 1080;

        var used = new Set();
        for (var id in positions) {
            if (positions.hasOwnProperty(id) && id !== String(toolId)) {
                var p = positions[id];
                var px = Math.round(p.xp * dw);
                var py = Math.round(p.yp * dh);
                var key = Math.round(px / COL) + ',' + Math.round(py / ROW);
                used.add(key);
            }
        }

        for (var row = 0; row < 20; row++) {
            for (var col = 0; col < COLS; col++) {
                var key = col + ',' + row;
                if (!used.has(key)) {
                    var pos = {
                        xp: Math.max(0, Math.min(1, (col * COL + 8) / dw)),
                        yp: Math.max(0, Math.min(1, (row * ROW + 8) / dh))
                    };
                    positions[String(toolId)] = pos;
                    savePositions();
                    return pos;
                }
            }
        }
        // 兜底
        var pos = {
            xp: 8 / dw,
            yp: Math.max(0, Math.min(1, (Object.keys(positions).length * ROW + 8) / dh))
        };
        positions[String(toolId)] = pos;
        savePositions();
        return pos;
    }

    var ANON_TOOLS_KEY = 'desktop_tools_anonymous';

    function saveAnonymousTools() {
        try {
            // 只保存工具的基本信息（id, name, icon, route, description）
            var data = desktopTools.map(function(t) {
                return { id: t.id, name: t.name, icon: t.icon, route: t.route, description: t.description };
            });
            localStorage.setItem(ANON_TOOLS_KEY, JSON.stringify(data));
        } catch(e) {}
    }

    function loadAnonymousToolsFromStorage() {
        try {
            var raw = localStorage.getItem(ANON_TOOLS_KEY);
            if (raw) {
                var tools = JSON.parse(raw);
                desktopTools = tools;
                desktopIds = new Set(tools.map(function(t) { return t.id; }));
            }
        } catch(e) {
            desktopTools = [];
            desktopIds = new Set();
        }
    }

    /* ---- 桌面工具加载 ---- */
    function loadDesktopTools() {
        // 防止时序竞态：auth-changed 事件可能在 init() 的 loadPositions() 之前触发，
        // 此时 positions 为空，autoPosition() 会覆盖所有拖拽保存的自定义位置。
        // 这里无条件先加载一次位置（幂等操作，重复调用无副作用）
        loadPositions();

        if (!isLoggedIn()) {
            // 匿名模式：从 localStorage 加载桌面工具
            loadAnonymousToolsFromStorage();
            renderDesktop();
            return;
        }
        // 登录模式：使用收藏 API 获取桌面工具
        api('GET', '/api/favorites').then(function(res) {
            if (res.code === 200 && res.data) {
                desktopTools = res.data.tools || [];
                desktopIds = new Set(res.data.toolIds || []);

                // 从服务器加载位置（优先级高于 localStorage，跨设备同步）
                var serverPos = res.data.positions;
                if (serverPos) {
                    for (var key in serverPos) {
                        if (serverPos.hasOwnProperty(key)) {
                            positions[key] = serverPos[key];
                        }
                    }
                    // 同步到 localStorage 作为离线缓存
                    savePositions();
                }
                renderDesktop();
            } else {
                // 无收藏
                desktopTools = [];
                desktopIds = new Set();
                renderDesktop();
            }

            // 登录后同步小组件数据
            loadWidgetConfigFromServer();
        }).catch(function() {
            desktopTools = [];
            desktopIds = new Set();
            renderDesktop();
        });
    }

    /* ---- API 调用 ---- */
    function api(method, path, body) {
        var headers = { 'Content-Type': 'application/json' };
        var token = window.DevAuth && window.DevAuth.getToken ? window.DevAuth.getToken() : null;
        if (token) headers['X-Auth-Token'] = token;
        var opts = { method: method, headers: headers };
        if (body) opts.body = JSON.stringify(body);
        return fetch(path, opts).then(function(r) { return r.json(); });
    }

    function isLoggedIn() {
        return window.DevAuth && window.DevAuth.isLoggedIn ? window.DevAuth.isLoggedIn() : false;
    }

    /* ---- 渲染桌面 ---- */
    function renderDesktop() {
        var iconsContainer = document.getElementById('desktopIcons');
        var emptyEl = document.getElementById('desktopEmpty');
        var infoEl = document.getElementById('desktopToolCount');
        var desktop = document.getElementById('desktop');
        var dw = desktop ? desktop.clientWidth : 1920;
        var dh = desktop ? desktop.clientHeight : 1080;

        if (!iconsContainer) return;

        // 检查是否有桌面小组件，有则不显示空状态
        // 即使 WidgetManager 还没初始化完成，也检查 localStorage 作为兜底
        var widgetCount = 0;
        if (window.WidgetManager && window.WidgetManager.getInstances) {
            widgetCount = window.WidgetManager.getInstances().length;
        }
        if (widgetCount === 0) {
            try {
                var raw = localStorage.getItem('desktop_widgets');
                if (raw) {
                    var arr = JSON.parse(raw);
                    if (Array.isArray(arr)) widgetCount = arr.length;
                }
            } catch(e) {}
        }
        var hasWidgets = widgetCount > 0;

        if (desktopTools.length === 0) {
            iconsContainer.innerHTML = '';
            if (hasWidgets) {
                // 有桌面小组件，隐藏空状态但保留信息
                if (emptyEl) emptyEl.style.display = 'none';
                if (infoEl) infoEl.textContent = '0 个工具 · ' + widgetCount + ' 个小组件';
            } else {
                // 真正空状态
                if (emptyEl) emptyEl.style.display = '';
                if (infoEl) infoEl.textContent = '0 个工具';
            }
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (infoEl) infoEl.textContent = desktopTools.length + ' 个工具';

        // 确保所有工具有位置
        desktopTools.forEach(function(t) {
            if (!positions[String(t.id)]) autoPosition(t.id);
        });

        // 按视觉位置排序工具数组，确保 DOM 顺序与视觉排列一致
        // 避免刷新后图标堆叠顺序( z-index )和 Tab 键导航顺序混乱
        sortDesktopToolsByPosition();
        // 匿名模式下把排序后的顺序持久化到 localStorage
        if (!isLoggedIn()) saveAnonymousTools();

        iconsContainer.innerHTML = desktopTools.map(function(t) {
            var pos = positions[String(t.id)] || { xp: 0, yp: 0 };
            var displayX = Math.round(pos.xp * dw);
            var displayY = Math.round(pos.yp * dh);
            // 边界限制
            displayX = Math.max(0, Math.min(displayX, dw - 100));
            displayY = Math.max(0, Math.min(displayY, dh - 120));
            var isNew = allTools.find(function(at) { return at.id === t.id; });
            var showNew = isNew && isNew.isNew === 1;
            return '<div class="desktop-icon" ' +
                'data-tool-id="' + t.id + '" ' +
                'data-route="' + (t.route || '') + '" ' +
                'style="left:' + displayX + 'px;top:' + displayY + 'px;"' +
                'title="' + t.name + (t.description ? ' - ' + t.description : '') + '">' +
                '<div class="desktop-icon-icon">' +
                    (t.icon || '🔧') +
                    (showNew ? '<span class="desktop-icon-badge">NEW</span>' : '') +
                '</div>' +
                '<button class="desktop-icon-remove" title="从桌面移除" data-action="remove">×</button>' +
                '<div class="desktop-icon-name">' + t.name + '</div>' +
            '</div>';
        }).join('');

        // 绑定图标事件
        bindIconEvents();
    }

    function bindIconEvents() {
        var icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(function(icon) {
            // 移除按钮
            var removeBtn = icon.querySelector('.desktop-icon-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var toolId = parseInt(icon.getAttribute('data-tool-id'));
                    removeFromDesktop(toolId);
                });
            }

            // 鼠标拖拽
            icon.addEventListener('mousedown', function(e) {
                if (e.button !== 0) return; // 只响应左键
                if (e.target.closest('.desktop-icon-remove')) return; // 不拖拽删除按钮
                startDrag(e, icon);
            });

            // 触摸拖拽
            icon.addEventListener('touchstart', function(e) {
                if (e.target.closest('.desktop-icon-remove')) return;
                startDrag(e, icon);
            }, { passive: false });

            // 双击打开窗口
            icon.addEventListener('dblclick', function(e) {
                var route = icon.getAttribute('data-route');
                var toolId = parseInt(icon.getAttribute('data-tool-id'));
                var tool = allTools.find(function(t) { return t.id === toolId; });
                if (tool && tool.route && window.WindowManager) {
                    WindowManager.open(tool);
                } else if (route) {
                    window.location.href = route;
                }
            });

            // 右键菜单
            icon.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                contextTarget = icon;
                showContextMenu(e.clientX, e.clientY);
            });

            // 单击选中
            icon.addEventListener('click', function(e) {
                if (currentDrag && currentDrag.moved) return; // 拖拽中不选中
                deselectAll();
                icon.classList.add('selected');
            });
        });
    }

    /* ---- 拖拽系统 ---- */
    function startDrag(e, icon) {
        e.preventDefault();

        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;

        var rect = icon.getBoundingClientRect();
        var desktopEl = document.getElementById('desktop');
        var desktopRect = desktopEl.getBoundingClientRect();

        currentDrag = {
            icon: icon,
            startX: clientX,
            startY: clientY,
            origLeft: parseInt(icon.style.left) || 0,
            origTop: parseInt(icon.style.top) || 0,
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top,
            desktopLeft: desktopRect.left,
            desktopTop: desktopRect.top,
            desktopWidth: desktopRect.width,
            desktopHeight: desktopRect.height,
            moved: false
        };

        icon.classList.add('dragging');
        icon.style.zIndex = '100';

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', onDragEnd);
    }

    function onDrag(e) {
        if (!currentDrag) return;
        e.preventDefault();

        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;

        var dx = clientX - currentDrag.startX;
        var dy = clientY - currentDrag.startY;

        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return; // 死区
        currentDrag.moved = true;

        var newLeft = currentDrag.origLeft + dx;
        var newTop = currentDrag.origTop + dy;

        // 边界限制
        var maxLeft = currentDrag.desktopWidth - 100;
        var maxTop = currentDrag.desktopHeight - 120;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        currentDrag.icon.style.left = newLeft + 'px';
        currentDrag.icon.style.top = newTop + 'px';
    }

    function onDragEnd(e) {
        if (!currentDrag) return;

        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', onDragEnd);

        var icon = currentDrag.icon;
        icon.classList.remove('dragging');
        icon.style.zIndex = '1';

        if (currentDrag.moved) {
            var toolId = parseInt(icon.getAttribute('data-tool-id'));
            var newLeft = parseInt(icon.style.left);
            var newTop = parseInt(icon.style.top);

            // 网格吸附（轻柔的10px吸附）
            var snapX = Math.round(newLeft / 10) * 10;
            var snapY = Math.round(newTop / 10) * 10;
            icon.style.left = snapX + 'px';
            icon.style.top = snapY + 'px';

            var desktop = document.getElementById('desktop');
            var dw = desktop ? desktop.clientWidth : 1920;
            var dh = desktop ? desktop.clientHeight : 1080;

            positions[String(toolId)] = {
                xp: Math.max(0, Math.min(1, snapX / dw)),
                yp: Math.max(0, Math.min(1, snapY / dh))
            };
            savePositions();
            // 拖拽后重新按视觉位置排序，保持 DOM 顺序一致
            sortDesktopToolsByPosition();
            if (!isLoggedIn()) saveAnonymousTools();
        }

        currentDrag = null;
    }

    /* ---- 选中管理 ---- */
    function deselectAll() {
        document.querySelectorAll('.desktop-icon.selected').forEach(function(el) {
            el.classList.remove('selected');
        });
    }

    /* ---- 右键菜单 ---- */
    function showContextMenu(x, y) {
        var menu = document.getElementById('contextMenu');
        if (!menu) return;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('active');

        // 确保菜单不超出屏幕
        var rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
    }

    function closeContextMenu() {
        var menu = document.getElementById('contextMenu');
        if (menu) menu.classList.remove('active');
        contextTarget = null;
    }

    /* ---- 桌面空白右键菜单 ---- */
    function showDesktopContextMenu(x, y) {
        var menu = document.getElementById('desktopContextMenu');
        if (!menu) return;
        closeContextMenu(); // 关闭图标右键菜单
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('active');

        // 确保菜单不超出屏幕
        var rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
    }

    function closeDesktopContextMenu() {
        var menu = document.getElementById('desktopContextMenu');
        if (menu) menu.classList.remove('active');
    }

    /* ---- 从桌面移除工具 ---- */
    function removeFromDesktop(toolId) {
        // 同步关闭窗口
        if (window.WindowManager && WindowManager.isOpen && WindowManager.isOpen(toolId)) {
            WindowManager.close(toolId);
        }

        if (!isLoggedIn()) {
            // 匿名模式：从本地移除
            desktopTools = desktopTools.filter(function(t) { return t.id !== toolId; });
            desktopIds.delete(toolId);
            delete positions[String(toolId)];
            savePositions();
            saveAnonymousTools();
            renderDesktop();
            showToast('已从桌面移除');
            return;
        }

        api('POST', '/api/favorites/remove', { toolId: toolId }).then(function(res) {
            if (res.code === 200) {
                desktopTools = desktopTools.filter(function(t) { return t.id !== toolId; });
                desktopIds.delete(toolId);
                delete positions[String(toolId)];
                savePositions();
                renderDesktop();
                showToast('已从桌面移除');
            }
        });
    }

    /* ---- 添加到桌面 ---- */
    function addToDesktop(tool) {
        if (!isLoggedIn()) {
            // 匿名模式：添加到本地
            if (desktopIds.has(tool.id)) {
                showToast('已在桌面上');
                return;
            }
            desktopTools.push(tool);
            desktopIds.add(tool.id);
            saveAnonymousTools();
            renderDesktop();
            // 高亮新图标
            setTimeout(function() {
                var icon = document.querySelector('.desktop-icon[data-tool-id="' + tool.id + '"]');
                if (icon) {
                    icon.classList.add('just-added');
                    icon.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

            showToast('已添加到桌面，双击图标打开');
            return;
        }

        api('POST', '/api/favorites/add', { toolId: tool.id }).then(function(res) {
            if (res.code === 200) {
                desktopTools.push(tool);
                desktopIds.add(tool.id);
                renderDesktop();
                // 高亮新图标
                setTimeout(function() {
                    var icon = document.querySelector('.desktop-icon[data-tool-id="' + tool.id + '"]');
                    if (icon) {
                        icon.classList.add('just-added');
                        icon.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 50);

                showToast('已添加到桌面 🎉，双击图标打开');
            }
        });
    }

    /* ---- 工具商店面板 ---- */
    function openStore() {
        var panel = document.getElementById('storePanel');
        var overlay = document.getElementById('storeOverlay');
        if (!panel || !overlay) return;

        renderStore();
        panel.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeStore() {
        var panel = document.getElementById('storePanel');
        var overlay = document.getElementById('storeOverlay');
        if (panel) panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function renderStore(filter) {
        var body = document.getElementById('storeBody');
        if (!body) return;

        var q = (filter || '').toLowerCase().trim();
        var filteredTools = allTools;

        if (q) {
            filteredTools = allTools.filter(function(t) {
                return t.name.toLowerCase().includes(q) ||
                       (t.description && t.description.toLowerCase().includes(q)) ||
                       (t.keywords && t.keywords.toLowerCase().includes(q));
            });
        }

        if (filteredTools.length === 0) {
            body.innerHTML = '<div class="store-no-result">😕 没有找到匹配的工具</div>';
            return;
        }

        // 按分类分组
        var grouped = {};
        filteredTools.forEach(function(t) {
            var catId = t.categoryId || 0;
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(t);
        });

        body.innerHTML = Object.keys(grouped).map(function(catId) {
            var cat = categories.find(function(c) { return c.id === parseInt(catId); });
            var catName = cat ? cat.name : '其他工具';
            var catIcon = cat ? cat.icon : '🔧';
            var tools = grouped[catId];

            return '<div class="store-category">' +
                '<div class="store-cat-header">' +
                    '<span class="store-cat-icon">' + catIcon + '</span>' +
                    '<span class="store-cat-name">' + catName + '</span>' +
                    '<span class="store-cat-count">' + tools.length + '</span>' +
                '</div>' +
                tools.map(function(t) {
                    var onDesktop = desktopIds.has(t.id);
                    return '<div class="store-tool" data-tool-id="' + t.id + '">' +
                        '<span class="store-tool-icon">' + (t.icon || '🔧') + '</span>' +
                        '<div class="store-tool-info">' +
                            '<div class="store-tool-name">' + t.name + '</div>' +
                            '<div class="store-tool-desc">' + (t.description || '') + '</div>' +
                        '</div>' +
                        (onDesktop
                            ? '<button class="store-btn remove" data-action="remove" data-tool-id="' + t.id + '">移除</button>'
                            : '<button class="store-btn" data-action="add" data-tool-id="' + t.id + '" data-tool-name="' + t.name + '" data-tool-icon="' + (t.icon || '🔧') + '" data-tool-route="' + t.route + '" data-tool-desc="' + (t.description || '') + '">添加到桌面</button>'
                        ) +
                    '</div>';
                }).join('') +
            '</div>';
        }).join('');

        // 绑定商店按钮事件
        body.querySelectorAll('.store-btn[data-action="add"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var tool = {
                    id: parseInt(btn.getAttribute('data-tool-id')),
                    name: btn.getAttribute('data-tool-name'),
                    icon: btn.getAttribute('data-tool-icon'),
                    route: btn.getAttribute('data-tool-route'),
                    description: btn.getAttribute('data-tool-desc')
                };
                addToDesktop(tool);
                // 更新按钮状态
                btn.textContent = '移除';
                btn.classList.add('remove');
                btn.setAttribute('data-action', 'remove');
                bindRemoveBtn(btn);
            });
        });

        body.querySelectorAll('.store-btn[data-action="remove"]').forEach(function(btn) {
            bindRemoveBtn(btn);
        });

        // 点击工具卡片打开
        body.querySelectorAll('.store-tool').forEach(function(item) {
            var btn = item.querySelector('.store-btn');
            item.addEventListener('click', function(e) {
                if (e.target.closest('.store-btn')) return;
                var toolId = parseInt(item.getAttribute('data-tool-id'));
                var tool = allTools.find(function(t) { return t.id === toolId; });
                if (tool && tool.route) {
                    if (window.WindowManager && WindowManager.isOpen && WindowManager.isOpen(toolId)) {
                        WindowManager.focusWindow(toolId);
                        DesktopManager.closeStore();
                    } else if (window.WindowManager) {
                        WindowManager.open(tool);
                        DesktopManager.closeStore();
                    } else {
                        window.location.href = tool.route;
                    }
                }
            });
        });
    }

    function bindRemoveBtn(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var toolId = parseInt(btn.getAttribute('data-tool-id'));
            removeFromDesktop(toolId);
            // 更新按钮状态
            btn.textContent = '添加到桌面';
            btn.classList.remove('remove');
            btn.setAttribute('data-action', 'add');
        });
    }

    /* ---- Toast ---- */
    function showToast(msg) {
        var toast = document.getElementById('desktopToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function() {
            toast.classList.remove('show');
        }, 2000);
    }

    /* ---- 事件绑定 ---- */
    function bindEvents() {
        // 注意：商店按钮/遮罩/搜索已在 bindStoreEvents() 中提前绑定

        // 右键菜单项
        document.getElementById('contextMenu').addEventListener('click', function(e) {
            var item = e.target.closest('.context-item');
            if (!item || !contextTarget) return;
            var action = item.getAttribute('data-action');
            var toolId = parseInt(contextTarget.getAttribute('data-tool-id'));

            if (action === 'open') {
                var route = contextTarget.getAttribute('data-route');
                var toolId = parseInt(contextTarget.getAttribute('data-tool-id'));
                var tool = allTools.find(function(t) { return t.id === toolId; });
                if (tool && tool.route && window.WindowManager) {
                    WindowManager.open(tool);
                } else if (route) {
                    window.location.href = route;
                }
            } else if (action === 'add-widget') {
                if (window.WidgetManager) WidgetManager.openStore();
            } else if (action === 'remove') {
                removeFromDesktop(toolId);
            }
            closeContextMenu();
        });

        // 点击桌面空白处取消选择 + 关闭菜单
        var desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.addEventListener('click', function(e) {
                if (e.target === desktop || e.target.closest('.desktop-bg') || e.target.closest('.desktop-icons') || e.target.closest('.desktop-empty')) {
                    deselectAll();
                    closeContextMenu();
                    closeDesktopContextMenu();
                }
            });

        desktop.addEventListener('contextmenu', function(e) {
            // 桌面空白处右键显示菜单（图标有自己的右键处理）
            if (e.target === desktop || e.target.closest('.desktop-bg') || e.target.closest('.desktop-particles') || e.target.closest('.desktop-empty')) {
                e.preventDefault();
                showDesktopContextMenu(e.clientX, e.clientY);
            }
        });
        }

        // 桌面空白右键菜单项
        document.getElementById('desktopContextMenu').addEventListener('click', function(e) {
            var item = e.target.closest('.context-item');
            if (!item) return;
            var action = item.getAttribute('data-action');
            if (action === 'edit-bg') {
                if (window.DevSkin && window.DevSkin.openPanel) {
                    window.DevSkin.openPanel();
                }
            } else if (action === 'desktop-settings') {
                if (window.DevSkin && window.DevSkin.openPanel) {
                    window.DevSkin.openPanel();
                }
            } else if (action === 'view-bg') {
                if (window.DevSkin && window.DevSkin.getState) {
                    var s = window.DevSkin.getState();
                    var hasMedia = s.mediaType === 'image' ? !!s.image : !!s.videoUrl;
                    if (!hasMedia) {
                        showToast('当前没有设置背景');
                    } else {
                        showToast('背景已显示在桌面上');
                    }
                }
            } else if (action === 'refresh') {
                window.location.reload();
            } else if (action === 'reset-widget-layout') {
                if (window.WidgetManager && window.WidgetManager.resetLayout) {
                    window.WidgetManager.resetLayout();
                }
            }
            closeDesktopContextMenu();
        });

        // 全局点击关闭上下文菜单
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#contextMenu') && !e.target.closest('.desktop-icon') &&
                !e.target.closest('#desktopContextMenu') && !e.target.closest('.desktop')) {
                closeContextMenu();
                closeDesktopContextMenu();
            }
        });

        // 窗口/缩放变化时重新渲染
        var resizeTimer = null;
        function handleDesktopResize() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                var d = document.getElementById('desktop');
                if (!d) return;
                updateLayout();
                if (desktopTools.length > 0) {
                    renderDesktop();
                }
            }, 120);
        }

        window.addEventListener('resize', handleDesktopResize);

        // 缩放（Ctrl+滚轮）触发 visualViewport resize
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleDesktopResize);
        }

        // 监听登录状态变化
        document.addEventListener('devtools-auth-changed', function() {
            loadDesktopTools();
        });

        // 一键排列（网格排列）
        var arrangeBtn = document.querySelector('.desktop-arrange-btn');
        if (arrangeBtn) {
            arrangeBtn.addEventListener('click', function() {
                arrangeIcons();
            });
        }
    }

    function arrangeIcons() {
        var desktop = document.getElementById('desktop');
        var dw = desktop ? desktop.clientWidth : 1920;
        var dh = desktop ? desktop.clientHeight : 1080;

        positions = {};
        desktopTools.forEach(function(t, i) {
            var col = i % COLS;
            var row = Math.floor(i / COLS);
            positions[String(t.id)] = {
                xp: Math.max(0, Math.min(1, (col * COL + 8) / dw)),
                yp: Math.max(0, Math.min(1, (row * ROW + 8) / dh))
            };
        });
        savePositions();
        renderDesktop();
        showToast('已整齐排列');
    }

    /* ---- 公开 API ---- */
    return {
        init: init,
        openStore: openStore,
        closeStore: closeStore,
        renderStore: renderStore,
        closeContextMenu: closeContextMenu,
        deselectAll: deselectAll,
        getAllTools: function() { return allTools; },
        getDesktopTools: function() { return desktopTools; },
        addToDesktop: addToDesktop,
        removeFromDesktop: removeFromDesktop,
        arrangeIcons: arrangeIcons,
        refreshDesktop: loadDesktopTools
    };
})();

/* ============================================
   收藏模块兼容（供 auth 事件调用）
   ============================================ */
var DevFavorites = (function() {
    'use strict';
    return {
        toggle: function() {},
        refresh: function() {
            if (DesktopManager && DesktopManager.refreshDesktop) {
                DesktopManager.refreshDesktop();
            }
        },
        load: function() {}
    };
})();

function initFavorites() {
    // 不再需要独立初始化，由 DesktopManager 管理
}
