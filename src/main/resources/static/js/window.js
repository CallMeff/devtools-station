/**
 * WindowManager - 自适应桌面窗口管理器（macOS / Windows 风格）
 * 负责：窗口创建/关闭/最小化/最大化、拖拽、缩放、任务栏管理
 */
var WindowManager = (function() {
    'use strict';

    // 检测操作系统
    var ua = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    var isWindows = (ua || '').toLowerCase().indexOf('win') !== -1;
    var OS_CLASS = isWindows ? 'os-win' : 'os-mac';
    // 页面加载时立即标记
    document.documentElement.classList.add(OS_CLASS);

    var windows = {};           // { toolId: { tool, el, state, prevBounds, zIndex } }
    var activeWindowId = null;  // 当前聚焦的窗口 ID
    var nextZIndex = 1000;
    var MIN_W = 400;
    var MIN_H = 300;
    var DEFAULT_W = 800;
    var DEFAULT_H = 550;

    var desktopEl = null;
    var taskbarEl = null;
    var taskbarWindowsEl = null;

    // 拖拽/缩放临时状态
    var dragState = null;
    var resizeState = null;

    /* ========== 初始化 ========== */
    function init() {
        desktopEl = document.getElementById('desktop');
        if (!desktopEl) return;

        // 创建任务栏
        createTaskbar();
        taskbarEl = document.getElementById('taskbar');
        taskbarWindowsEl = document.getElementById('taskbarWindows');

        // 桌面为任务栏留空间
        desktopEl.classList.add('has-taskbar');

        // 启动时钟
        updateClock();
        setInterval(updateClock, 30000);

        // 全局事件：点击窗口/任务栏标签时聚焦
        document.addEventListener('mousedown', function(e) {
            var win = e.target.closest('.app-window');
            if (win) {
                var toolId = parseInt(win.getAttribute('data-tool-id'));
                focusWindow(toolId);
                return;
            }

            var taskbarTab = e.target.closest('.taskbar-tab');
            if (taskbarTab) {
                var toolId = parseInt(taskbarTab.getAttribute('data-tool-id'));
                handleTaskbarClick(toolId);
                return;
            }

            // 点击空白处取消聚焦
            if (!e.target.closest('.taskbar') && !e.target.closest('.app-window')) {
                blurAllWindows();
            }
        });

        // 拖拽/缩放事件：按需绑定，避免全局 mousemove 性能问题
        document.addEventListener('mousedown', function(e) {
            if (dragState || resizeState) {
                document.addEventListener('mousemove', onGlobalMouseMove);
                document.addEventListener('mouseup', onGlobalMouseUp);
            }
        });

        // Esc 关闭/最小化聚焦窗口
        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Escape' || activeWindowId === null) return;
            // 检查是否有弹窗/面板打开（不拦截它们的 Esc）
            var storePanel = document.getElementById('storePanel');
            var contextMenu = document.getElementById('contextMenu');
            if ((storePanel && storePanel.classList.contains('active')) ||
                (contextMenu && contextMenu.classList.contains('active'))) {
                return;
            }
            // Esc 最小化聚焦窗口
            e.preventDefault();
            minimizeWindow(activeWindowId);
        });
    }

    /* ========== 任务栏 ========== */
    function createTaskbar() {
        if (document.getElementById('taskbar')) return;

        var taskbar = document.createElement('div');
        taskbar.id = 'taskbar';
        taskbar.className = 'taskbar';
        taskbar.innerHTML =
            '<div class="taskbar-inner">' +
                '<div class="taskbar-start">' +
                    '<div class="taskbar-logo" title="DevTools Station">🛠️</div>' +
                '</div>' +
                '<div class="taskbar-windows" id="taskbarWindows"></div>' +
                '<div class="taskbar-right">' +
                    '<div class="taskbar-clock" id="taskbarClock"></div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(taskbar);

        // Logo 点击刷新桌面
        taskbar.querySelector('.taskbar-start').addEventListener('click', function() {
            if (DesktopManager && DesktopManager.refreshDesktop) {
                DesktopManager.refreshDesktop();
            }
        });
    }

    function updateClock() {
        var clockEl = document.getElementById('taskbarClock');
        if (!clockEl) return;
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        clockEl.textContent = padZero(h) + ':' + padZero(m);
    }

    function padZero(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    /* ========== 任务栏标签刷新 ========== */
    function updateTaskbar() {
        if (!taskbarWindowsEl) return;

        var ids = Object.keys(windows);
        if (ids.length === 0) {
            taskbarWindowsEl.innerHTML = '';
            return;
        }

        taskbarWindowsEl.innerHTML = ids.map(function(id) {
            var w = windows[id];
            var isActive = (parseInt(id) === activeWindowId);
            var isMinimized = (w.state === 'minimized');
            var cls = 'taskbar-tab';
            if (isActive) cls += ' active';
            if (isMinimized) cls += ' minimized';

            return '<div class="' + cls + '" data-tool-id="' + id + '" title="' + w.tool.name + '">' +
                '<span class="taskbar-tab-icon">' + (w.tool.icon || '🔧') + '</span>' +
                '<span class="taskbar-tab-name">' + w.tool.name + '</span>' +
            '</div>';
        }).join('');
    }

    function handleTaskbarClick(toolId) {
        var w = windows[toolId];
        if (!w) return;

        if (w.state === 'minimized') {
            restoreWindow(toolId);
        } else if (activeWindowId === toolId) {
            minimizeWindow(toolId);
        } else {
            focusWindow(toolId);
        }
    }

    /* ========== 窗口生命周期 ========== */

    /**
     * 打开一个工具的窗口
     */
    function open(tool) {
        var toolId = tool.id;

        // 如果窗口已存在
        if (windows[toolId]) {
            var w = windows[toolId];
            if (w.state === 'minimized') {
                restoreWindow(toolId);
            } else {
                focusWindow(toolId);
            }
            return;
        }

        // 创建窗口 DOM
        var pos = getWindowPosition(toolId);
        var rect = calcWindowBounds(tool.route, pos);

        var winEl = document.createElement('div');
        winEl.className = 'app-window focused';
        winEl.setAttribute('data-tool-id', toolId);
        winEl.style.left = rect.x + 'px';
        winEl.style.top = rect.y + 'px';
        winEl.style.width = rect.w + 'px';
        winEl.style.height = rect.h + 'px';
        winEl.style.zIndex = ++nextZIndex;

        winEl.innerHTML =
            buildTitlebar(tool) +
            '<div class="app-window-body">' +
                '<div class="app-window-loading"></div>' +
                '<iframe src="' + tool.route + '" frameborder="0" allowtransparency="true"></iframe>' +
            '</div>' +
            // 调整大小手柄
            '<div class="win-resize-n" data-resize="n"></div>' +
            '<div class="win-resize-s" data-resize="s"></div>' +
            '<div class="win-resize-e" data-resize="e"></div>' +
            '<div class="win-resize-w" data-resize="w"></div>' +
            '<div class="win-resize-ne" data-resize="ne"></div>' +
            '<div class="win-resize-nw" data-resize="nw"></div>' +
            '<div class="win-resize-se" data-resize="se"></div>' +
            '<div class="win-resize-sw" data-resize="sw"></div>';

        document.body.appendChild(winEl);

        // iframe 加载处理（含超时和错误处理）
        var iframe = winEl.querySelector('iframe');
        var loadingEl = winEl.querySelector('.app-window-loading');
        var loadHandled = false;

        function removeLoading(msg) {
            if (loadHandled) return;
            loadHandled = true;
            if (loadingEl) {
                if (msg) loadingEl.innerHTML = '<div style="text-align:center;padding:20px">' + msg + '<br><button onclick="location.reload()" style="margin-top:10px;padding:6px 16px;border-radius:8px;border:1px solid var(--border-color);background:var(--hover-bg);color:var(--text-primary);cursor:pointer">🔄 重试</button></div>';
                else loadingEl.style.display = 'none';
            }
        }

        iframe.addEventListener('load', function() { removeLoading(); });
        iframe.addEventListener('error', function() { removeLoading('⚠️ 页面加载失败'); });
        // 15秒超时
        setTimeout(function() {
            if (!loadHandled) removeLoading('⏳ 加载超时，请检查网络');
        }, 15000);

        // 绑定窗口事件
        bindWindowEvents(winEl, toolId);

        // 记录窗口状态
        windows[toolId] = {
            tool: tool,
            el: winEl,
            state: 'normal',
            prevBounds: null,
            zIndex: nextZIndex
        };

        activeWindowId = toolId;
        updateTaskbar();

        // 保存位置偏好
        saveWindowPositions();
    }

    /**
     * 关闭窗口
     */
    function close(toolId) {
        var w = windows[toolId];
        if (!w) return;

        // 动画关闭
        w.el.style.transition = 'opacity 0.15s, transform 0.15s';
        w.el.style.opacity = '0';
        w.el.style.transform = 'scale(0.95)';

        setTimeout(function() {
            if (w.el && w.el.parentNode) {
                w.el.parentNode.removeChild(w.el);
            }
        }, 150);

        if (activeWindowId === toolId) {
            activeWindowId = null;
        }

        delete windows[toolId];
        saveWindowPositions();
        updateTaskbar();
    }

    /**
     * 最小化窗口
     */
    function minimizeWindow(toolId) {
        var w = windows[toolId];
        if (!w || w.state === 'minimized') return;

        // 如果是最大化状态，先还原再最小化
        if (w.state === 'maximized') {
            restoreMaximize(toolId, true); // 静默还原
        }

        w.state = 'minimized';
        w.el.classList.remove('focused');
        w.el.classList.add('minimized');

        if (activeWindowId === toolId) {
            activeWindowId = null;
        }

        updateTaskbar();
    }

    /**
     * 还原窗口（从任务栏）
     */
    function restoreWindow(toolId) {
        var w = windows[toolId];
        if (!w || w.state !== 'minimized') return;

        w.state = 'normal';
        w.el.classList.remove('minimized');

        focusWindow(toolId);
        updateTaskbar();
    }

    /**
     * 切换最大化
     */
    function toggleMaximize(toolId) {
        var w = windows[toolId];
        if (!w) return;

        if (w.state === 'maximized') {
            // 还原
            restoreMaximize(toolId);
        } else if (w.state === 'normal') {
            // 最大化
            var rect = w.el.getBoundingClientRect();
            var taskbarH = taskbarEl ? taskbarEl.offsetHeight : 48;

            w.prevBounds = {
                x: rect.left,
                y: rect.top,
                w: rect.width,
                h: rect.height
            };

            w.state = 'maximized';
            w.el.classList.add('maximized');
        }
        // minimized 状态不能最大化，先还原
    }

    function restoreMaximize(toolId, silent) {
        var w = windows[toolId];
        if (!w || w.state !== 'maximized') return;

        w.state = 'normal';
        w.el.classList.remove('maximized');

        if (w.prevBounds) {
            w.el.style.left = w.prevBounds.x + 'px';
            w.el.style.top = w.prevBounds.y + 'px';
            w.el.style.width = w.prevBounds.w + 'px';
            w.el.style.height = w.prevBounds.h + 'px';
            w.prevBounds = null;
        }

        if (!silent) {
            focusWindow(toolId);
        }
    }

    /* ========== 窗口聚焦 ========== */
    function focusWindow(toolId) {
        var w = windows[toolId];
        if (!w || w.state === 'minimized') return;

        // 取消所有窗口聚焦
        blurAllWindows();

        // 聚焦目标窗口
        w.zIndex = ++nextZIndex;
        w.el.style.zIndex = w.zIndex;
        w.el.classList.add('focused');
        activeWindowId = toolId;
        updateTaskbar();
    }

    function blurAllWindows() {
        for (var id in windows) {
            if (windows.hasOwnProperty(id)) {
                windows[id].el.classList.remove('focused');
            }
        }
        activeWindowId = null;
        updateTaskbar();
    }

    /**
     * 构建标题栏 HTML（根据 OS 生成不同风格）
     */
    function buildTitlebar(tool) {
        var icon = tool.icon || '🔧';
        var name = tool.name;

        if (isWindows) {
            // Windows 风格：图标+标题左对齐，按钮在右侧
            return '<div class="app-window-titlebar" data-action="drag">' +
                '<div class="win-title">' +
                    '<span class="win-title-icon">' + icon + '</span>' +
                    '<span class="win-title-text">' + name + '</span>' +
                '</div>' +
                '<div class="win-titlebar-spacer"></div>' +
                '<div class="win-controls">' +
                    '<button class="win-btn win-minimize" data-action="minimize" title="最小化">' +
                        '<svg width="10" height="10" viewBox="0 0 10 10"><line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" stroke-width="1"/></svg>' +
                    '</button>' +
                    '<button class="win-btn win-maximize" data-action="maximize" title="最大化">' +
                        '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/></svg>' +
                    '</button>' +
                    '<button class="win-btn win-close" data-action="close" title="关闭">' +
                        '<svg width="10" height="10" viewBox="0 0 10 10"><line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" stroke-width="1.2"/><line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" stroke-width="1.2"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>';
        }

        // macOS 风格：红绿灯按钮在左侧，标题居中
        return '<div class="app-window-titlebar" data-action="drag">' +
            '<div class="win-traffic-lights">' +
                '<button class="win-btn win-close" data-action="close" title="关闭"></button>' +
                '<button class="win-btn win-minimize" data-action="minimize" title="最小化"></button>' +
                '<button class="win-btn win-maximize" data-action="maximize" title="最大化"></button>' +
            '</div>' +
            '<div class="win-title">' +
                '<span class="win-title-icon">' + icon + '</span>' +
                '<span class="win-title-text">' + name + '</span>' +
            '</div>' +
            '<div class="win-titlebar-spacer"></div>' +
        '</div>';
    }

    /* ========== 窗口事件绑定 ========== */
    function bindWindowEvents(winEl, toolId) {
        // 关闭/最小化/最大化按钮（同时适配 macOS 和 Windows）
        var btnClose = winEl.querySelector('.win-close');
        var btnMin = winEl.querySelector('.win-minimize');
        var btnMax = winEl.querySelector('.win-maximize');

        if (btnClose) btnClose.addEventListener('click', function(e) { e.stopPropagation(); close(toolId); });
        if (btnMin) btnMin.addEventListener('click', function(e) { e.stopPropagation(); minimizeWindow(toolId); });
        if (btnMax) btnMax.addEventListener('click', function(e) { e.stopPropagation(); toggleMaximize(toolId); });

        // 标题栏双击最大化
        var titlebar = winEl.querySelector('.app-window-titlebar');
        if (titlebar) {
            titlebar.addEventListener('dblclick', function(e) {
                if (e.target.closest('.win-traffic-lights') || e.target.closest('.win-controls')) return;
                toggleMaximize(toolId);
            });
            // 标题栏拖拽
            titlebar.addEventListener('mousedown', function(e) {
                if (e.target.closest('.win-traffic-lights') || e.target.closest('.win-controls')) return;
                if (e.target.closest('[data-action]')) return;
                startWindowDrag(e, toolId);
            });
        }

        // 缩放手柄
        winEl.querySelectorAll('[data-resize]').forEach(function(handle) {
            handle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                startWindowResize(e, toolId, handle.getAttribute('data-resize'));
            });
        });
    }

    /* ========== 窗口拖拽 ========== */
    function startWindowDrag(e, toolId) {
        var w = windows[toolId];
        if (!w || w.state === 'maximized') return;

        e.preventDefault();

        dragState = {
            toolId: toolId,
            startX: e.clientX,
            startY: e.clientY,
            origLeft: w.el.offsetLeft,
            origTop: w.el.offsetTop
        };

        // 拖拽时禁用 iframe 鼠标事件
        var iframe = w.el.querySelector('iframe');
        if (iframe) iframe.style.pointerEvents = 'none';

        // 按需绑定全局事件
        document.addEventListener('mousemove', onGlobalMouseMove);
        document.addEventListener('mouseup', onGlobalMouseUp);
    }

    function onWindowDrag(e) {
        if (!dragState) return;

        var w = windows[dragState.toolId];
        if (!w) return;

        var dx = e.clientX - dragState.startX;
        var dy = e.clientY - dragState.startY;
        var newLeft = dragState.origLeft + dx;
        var newTop = dragState.origTop + dy;

        // 边界限制（至少 100px 留在屏幕内）
        var maxLeft = window.innerWidth - 100;
        var maxTop = window.innerHeight - 60;
        newLeft = Math.max(-w.el.offsetWidth + 100, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        w.el.style.left = newLeft + 'px';
        w.el.style.top = newTop + 'px';
    }

    function onWindowDragEnd(e) {
        if (!dragState) return;

        var w = windows[dragState.toolId];
        if (w) {
            // 恢复 iframe 鼠标事件
            var iframe = w.el.querySelector('iframe');
            if (iframe) iframe.style.pointerEvents = '';

            saveWindowPositions();
        }

        dragState = null;
        unbindGlobalMouseEvents();
    }

    /** 按需全局事件代理 */
    function onGlobalMouseMove(e) {
        if (dragState) onWindowDrag(e);
        if (resizeState) onWindowResize(e);
    }

    function onGlobalMouseUp(e) {
        if (dragState) onWindowDragEnd(e);
        if (resizeState) onWindowResizeEnd(e);
    }

    function unbindGlobalMouseEvents() {
        if (!dragState && !resizeState) {
            document.removeEventListener('mousemove', onGlobalMouseMove);
            document.removeEventListener('mouseup', onGlobalMouseUp);
        }
    }

    /* ========== 窗口缩放 ========== */
    function startWindowResize(e, toolId, direction) {
        var w = windows[toolId];
        if (!w || w.state !== 'normal') return;

        var rect = w.el.getBoundingClientRect();

        resizeState = {
            toolId: toolId,
            direction: direction,
            startX: e.clientX,
            startY: e.clientY,
            origLeft: rect.left,
            origTop: rect.top,
            origWidth: rect.width,
            origHeight: rect.height
        };

        // 按需绑定全局事件
        document.addEventListener('mousemove', onGlobalMouseMove);
        document.addEventListener('mouseup', onGlobalMouseUp);
    }

    function onWindowResize(e) {
        if (!resizeState) return;

        var w = windows[resizeState.toolId];
        if (!w) return;

        var d = resizeState.direction;
        var dx = e.clientX - resizeState.startX;
        var dy = e.clientY - resizeState.startY;

        var newLeft = resizeState.origLeft;
        var newTop = resizeState.origTop;
        var newW = resizeState.origWidth;
        var newH = resizeState.origHeight;

        if (d.indexOf('e') !== -1) {
            newW = Math.max(MIN_W, resizeState.origWidth + dx);
        }
        if (d.indexOf('w') !== -1) {
            var wDiff = resizeState.origWidth - dx;
            if (wDiff >= MIN_W) {
                newLeft = resizeState.origLeft + dx;
                newW = wDiff;
            }
        }
        if (d.indexOf('s') !== -1) {
            newH = Math.max(MIN_H, resizeState.origHeight + dy);
        }
        if (d.indexOf('n') !== -1) {
            var hDiff = resizeState.origHeight - dy;
            if (hDiff >= MIN_H) {
                newTop = resizeState.origTop + dy;
                newH = hDiff;
            }
        }

        w.el.style.left = newLeft + 'px';
        w.el.style.top = newTop + 'px';
        w.el.style.width = newW + 'px';
        w.el.style.height = newH + 'px';
    }

    function onWindowResizeEnd(e) {
        if (resizeState) {
            saveWindowPositions();
        }
        resizeState = null;
        unbindGlobalMouseEvents();
    }

    /* ========== 位置计算 ========== */
    function calcWindowBounds(route, pos) {
        var x = pos.x;
        var y = pos.y;

        // 根据工具类型给不同的默认尺寸
        var w = DEFAULT_W;
        var h = DEFAULT_H;

        if (route) {
            // 大窗口：编辑器、图表、漫画、游戏（需要大画布）
            if (route.indexOf('/mermaid') !== -1 || route.indexOf('/draw') !== -1 ||
                route.indexOf('/comic') !== -1 || route.indexOf('/2048') !== -1 ||
                route.indexOf('/game') !== -1 || route.indexOf('/mindmap') !== -1 ||
                route.indexOf('/whiteboard') !== -1) {
                w = 1050; h = 720;
            }
            // 较大窗口：格式化、diff、代码编辑、正则
            else if (route.indexOf('/json') !== -1 || route.indexOf('/yaml') !== -1 ||
                     route.indexOf('/docker') !== -1 || route.indexOf('/diff') !== -1 ||
                     route.indexOf('/regex') !== -1 || route.indexOf('/editor') !== -1 ||
                     route.indexOf('/sql') !== -1 || route.indexOf('/xml') !== -1 ||
                     route.indexOf('/html') !== -1 || route.indexOf('/css') !== -1 ||
                     route.indexOf('/code') !== -1) {
                w = 950; h = 650;
            }
            // 中等窗口：转换器、编码解码、二维码
            else if (route.indexOf('/encode') !== -1 || route.indexOf('/decode') !== -1 ||
                     route.indexOf('/base64') !== -1 || route.indexOf('/qrcode') !== -1 ||
                     route.indexOf('/convert') !== -1 || route.indexOf('/image') !== -1 ||
                     route.indexOf('/pdf') !== -1 || route.indexOf('/text') !== -1) {
                w = 750; h = 580;
            }
            // 加密工具：需展示多行结果
            else if (route.indexOf('/md5') !== -1 || route.indexOf('/sha') !== -1 ||
                     route.indexOf('/hash') !== -1 || route.indexOf('/crypto') !== -1 ||
                     route.indexOf('/openssl') !== -1 || route.indexOf('/cert') !== -1) {
                w = 680; h = 550;
            }
            // 网络/IP 工具：表格展示
            else if (route.indexOf('/ip') !== -1 || route.indexOf('/network') !== -1 ||
                     route.indexOf('/dns') !== -1 || route.indexOf('/whois') !== -1 ||
                     route.indexOf('/ping') !== -1 || route.indexOf('/port') !== -1) {
                w = 700; h = 520;
            }
            // 紧凑窗口：生成器、简单工具
            else if (route.indexOf('/uuid') !== -1 || route.indexOf('/password') !== -1 ||
                     route.indexOf('/timestamp') !== -1 || route.indexOf('/random') !== -1 ||
                     route.indexOf('/counter') !== -1 || route.indexOf('/unit') !== -1 ||
                     route.indexOf('/color') !== -1 || route.indexOf('/gradient') !== -1) {
                w = 580; h = 460;
            }
        }

        // 确保不超出视口
        var maxX = window.innerWidth - 100;
        var maxY = window.innerHeight - 100;
        x = Math.max(20, Math.min(x, maxX));
        y = Math.max(20, Math.min(y, maxY));

        return { x: x, y: y, w: w, h: h };
    }

    function getWindowPosition(toolId) {
        try {
            var raw = localStorage.getItem('window_positions');
            if (raw) {
                var data = JSON.parse(raw);
                if (data[toolId]) return data[toolId];
            }
        } catch(e) {}

        // 默认位置：居中偏上
        var x = (window.innerWidth - DEFAULT_W) / 2 + (Math.random() - 0.5) * 100;
        var y = (window.innerHeight - DEFAULT_H) / 2 + (Math.random() - 0.5) * 60;
        return { x: Math.max(20, x), y: Math.max(40, y) };
    }

    function saveWindowPositions() {
        try {
            var data = {};
            for (var id in windows) {
                if (windows.hasOwnProperty(id) && windows[id].state === 'normal') {
                    var el = windows[id].el;
                    data[id] = {
                        x: el.offsetLeft,
                        y: el.offsetTop,
                        w: el.offsetWidth,
                        h: el.offsetHeight
                    };
                }
            }
            localStorage.setItem('window_positions', JSON.stringify(data));
        } catch(e) {}
    }

    /* ========== 公开 API ========== */
    function isOpen(toolId) {
        return !!windows[toolId];
    }

    return {
        init: init,
        open: open,
        close: close,
        focusWindow: focusWindow,
        isOpen: isOpen,
        minimizeWindow: minimizeWindow
    };
})();
