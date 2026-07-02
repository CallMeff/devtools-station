/**
 * DevTools Station - 主题商店页面逻辑
 */
(function() {
    'use strict';

    var allThemes = [];
    var currentTab = 'mine'; // 'mine' | 'all'
    var currentPoints = 0;
    var isLoggedIn = false;
    var previewOriginalTheme = null; // 预览前保存的原主题

    var $ = function(id) { return document.getElementById(id); };

    // ============ API ============
    function apiCall(method, path, body) {
        var headers = { 'Content-Type': 'application/json' };
        var token = localStorage.getItem('devtools-auth-token');
        if (token) headers['X-Auth-Token'] = token;
        var opts = { method: method, headers: headers };
        if (body) opts.body = JSON.stringify(body);
        return fetch(path, opts).then(function(r) { return r.json(); });
    }

    // ============ Toast ============
    function showToast(msg, type) {
        var el = $('storeToast');
        if (!el) return;
        el.className = 'store-toast ' + (type || 'success');
        el.innerHTML = (type === 'error' ? '⚠️ ' : '✅ ') + msg;
        el.classList.add('show');
        clearTimeout(el._timeout);
        el._timeout = setTimeout(function() {
            el.classList.remove('show');
        }, 2500);
    }

    // ============ 预览主题（临时预览，不保存） ============
    function previewTheme(theme) {
        if (!window.DevTheme || !window.DevTheme.set) return;

        // 保存当前主题作为原始主题（仅首次预览时保存）
        if (!previewOriginalTheme) {
            previewOriginalTheme = window.DevTheme.get();
        }

        // 临时应用新主题（不保存到 localStorage）
        var current = window.DevTheme.get();
        // 如果已经在预览这个主题，则不做任何事
        if (current === theme.themeKey) return;

        // 直接修改 DOM 类而不调用 setTheme（setTheme 会保存）
        [document.documentElement, document.body].forEach(function(el) {
            el.className = el.className.replace(/theme-\w+/g, '').trim();
            el.classList.add('theme-' + theme.themeKey);
        });

        // 更新下拉列表中的选中状态
        var options = document.querySelectorAll('.theme-option');
        options.forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === theme.themeKey);
        });

        // 显示预览通知栏
        showPreviewBar(theme);
    }

    // ============ 退出预览，恢复原主题 ============
    function exitPreview() {
        if (!previewOriginalTheme) return;

        // 恢复原主题（同样只改 DOM，不保存）
        [document.documentElement, document.body].forEach(function(el) {
            el.className = el.className.replace(/theme-\w+/g, '').trim();
            el.classList.add('theme-' + previewOriginalTheme);
        });

        // 更新下拉高亮
        var options = document.querySelectorAll('.theme-option');
        options.forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === previewOriginalTheme);
        });

        previewOriginalTheme = null;
        hidePreviewBar();
        showToast('已退出预览，恢复为原主题');
    }

    // ============ 显示预览通知栏 ============
    function showPreviewBar(theme) {
        var bar = $('previewBar');
        var nameEl = $('previewThemeName');
        if (!bar || !nameEl) return;

        nameEl.textContent = theme.icon + ' ' + theme.name;
        bar.classList.add('show');
    }

    // ============ 隐藏预览通知栏 ============
    function hidePreviewBar() {
        var bar = $('previewBar');
        if (bar) bar.classList.remove('show');
    }

    // ============ 页面离开时自动退出预览 ============
    window.addEventListener('beforeunload', function() {
        if (previewOriginalTheme) {
            // 恢复原主题到 DOM 和 localStorage
            [document.documentElement, document.body].forEach(function(el) {
                el.className = el.className.replace(/theme-\w+/g, '').trim();
                el.classList.add('theme-' + previewOriginalTheme);
            });
            // 确保 localStorage 记录的是原主题
            localStorage.setItem('devtools-theme', previewOriginalTheme);
        }
    });

    // ============ 购买主题 ============
    function buyTheme(theme) {
        if (!isLoggedIn) {
            if (window.DevAuth && window.DevAuth.showLogin) {
                window.DevAuth.showLogin();
            }
            return;
        }

        if (theme.purchased) {
            // 已拥有，直接应用
            previewTheme(theme);
            return;
        }

        if (theme.price > currentPoints) {
            showToast('积分不足！需要 ' + theme.price + ' 💎，当前只有 ' + currentPoints + ' 💎', 'error');
            return;
        }

        var confirmMsg = '确认花费 ' + theme.price + ' 💎 购买「' + theme.name + '」主题？\n购买后可在"我的主题"中随时切换。';
        if (!confirm(confirmMsg)) return;

        var btn = document.querySelector('.theme-card[data-theme-id="' + theme.id + '"] .btn-buy');
        if (btn) { btn.disabled = true; btn.textContent = '购买中...'; }

        apiCall('POST', '/api/theme-store/purchase/' + theme.id).then(function(res) {
            if (res.code === 200) {
                currentPoints = res.data.points;
                updatePoints();
                theme.purchased = true;
                showToast(res.data.message || '购买成功！');
                loadThemes(); // 刷新列表
            } else {
                showToast(res.message || '购买失败', 'error');
                if (btn) { btn.disabled = false; btn.textContent = '购买'; }
            }
        }).catch(function() {
            showToast('网络错误，请稍后重试', 'error');
            if (btn) { btn.disabled = false; btn.textContent = '购买'; }
        });
    }

    // ============ 更新积分显示 ============
    function updatePoints() {
        var pointsBar = $('pointsBar');
        var pointsValue = $('pointsValue');
        if (!pointsBar || !pointsValue) return;

        if (isLoggedIn) {
            pointsBar.classList.remove('no-login');
            pointsValue.textContent = currentPoints + ' 💎';
        } else {
            pointsBar.classList.add('no-login');
            pointsValue.innerHTML = '<span class="login-hint" onclick="DevAuth.showLogin()">登录后可查看积分</span>';
        }
    }

    // ============ 渲染主题卡片 ============
    function renderThemeCard(theme) {
        var previewColors = [];
        try {
            previewColors = theme.previewColors ? theme.previewColors.split(',') : [theme.bgPrimary, theme.accentColor];
        } catch(e) {
            previewColors = [theme.bgPrimary || '#111', theme.accentColor || '#6366f1'];
        }

        var isFree = theme.price === 0 || theme.category === 'free';
        var purchased = theme.purchased;

        var previewStyle = 'background: linear-gradient(135deg, ' + previewColors.join(',') + ');';

        // 窗口内预览线色
        var previewLineBg = previewColors.length > 0 ? previewColors[previewColors.length - 1] : 'rgba(255,255,255,0.2)';

        var card =
            '<div class="theme-card' + (purchased ? ' purchased' : '') + '" data-theme-id="' + theme.id + '" data-theme-key="' + theme.themeKey + '">' +
                '<div class="theme-card-preview" style="' + previewStyle + '">' +
                    (isFree ? '<span class="free-badge">免费</span>' : '') +
                    (purchased && !isFree ? '<span class="owned-badge">✓ 已拥有</span>' : '') +
                    '<div class="theme-preview-window">' +
                        '<div class="preview-dots">' +
                            '<div class="preview-dot"></div>' +
                            '<div class="preview-dot"></div>' +
                            '<div class="preview-dot"></div>' +
                        '</div>' +
                        '<div class="preview-lines">' +
                            '<div class="preview-line long" style="background:' + previewLineBg + ';opacity:0.5"></div>' +
                            '<div class="preview-line medium" style="background:' + previewLineBg + ';opacity:0.3"></div>' +
                            '<div class="preview-line short" style="background:' + previewLineBg + ';opacity:0.2"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="theme-card-body">' +
                    '<div class="theme-card-name">' +
                        '<span class="theme-icon">' + (theme.icon || '🎨') + '</span>' +
                        theme.name +
                    '</div>' +
                    '<div class="theme-card-desc">' + (theme.description || '') + '</div>' +
                    // 颜色预览条
                    '<div class="color-strip">' +
                        previewColors.map(function(c) {
                            return '<div class="color-dot" style="background:' + c.trim() + '" title="' + c.trim() + '"></div>';
                        }).join('') +
                    '</div>' +
                    '<div class="theme-card-footer">' +
                        '<div class="theme-price ' + (isFree ? 'free' : 'paid') + '">' +
                            (isFree ? '免费' : ('<span class="price-coin">💎</span> ' + theme.price)) +
                        '</div>' +
                        (purchased
                            ? '<button class="btn-preview" onclick="window.__storePreview && window.__storePreview(this)" data-key="' + theme.themeKey + '">预览</button>'
                            : '<div class="theme-card-actions">' +
                                '<button class="btn-preview btn-sm" onclick="window.__storePreview && window.__storePreview(this)" data-key="' + theme.themeKey + '">预览</button>' +
                                '<button class="btn-buy" onclick="window.__storeBuy && window.__storeBuy(' + theme.id + ')">' + (isFree ? '获取' : '购买') + '</button>' +
                              '</div>'
                        ) +
                    '</div>' +
                '</div>' +
            '</div>';
        return card;
    }

    function renderGrid(themes) {
        var grid = $('themeGrid');
        if (!grid) return;

        if (themes.length === 0) {
            var emptyIcon = currentTab === 'mine' ? '🛍️' : '✨';
            var emptyMsg = currentTab === 'mine'
                ? '还没有购买主题，去「其他主题」逛逛吧~'
                : '所有主题都在这里了，看看有没有喜欢的~';
            grid.innerHTML =
                '<div class="empty-state">' +
                    '<div class="empty-icon">' + emptyIcon + '</div>' +
                    '<p>' + emptyMsg + '</p>' +
                '</div>';
            return;
        }

        grid.innerHTML = themes.map(renderThemeCard).join('');
    }

    // ============ 全局购买/预览处理器 ============
    window.__storePreview = function(el) {
        var key = el.getAttribute('data-key');
        var theme = allThemes.find(function(t) { return t.themeKey === key; });
        if (theme) previewTheme(theme);
    };

    window.__storeBuy = function(themeId) {
        var theme = allThemes.find(function(t) { return t.id === themeId; });
        if (theme) buyTheme(theme);
    };

    window.__storeExitPreview = function() {
        exitPreview();
    };

    // ============ 加载主题 ============
    function loadThemes() {
        isLoggedIn = !!(window.DevAuth && window.DevAuth.isLoggedIn && window.DevAuth.isLoggedIn());
        currentPoints = 0;

        // 并行获取主题列表和积分（即使 isLoggedIn 判断为 false，也尝试获取积分，因为 token 可能已经存在）
        var themePromise = apiCall('GET', '/api/theme-store/list');
        var pointsPromise = apiCall('GET', '/api/theme-store/points');

        Promise.all([themePromise, pointsPromise]).then(function(results) {
            var themeRes = results[0];
            var pointsRes = results[1];

            if (themeRes.code === 200) {
                allThemes = themeRes.data || [];
            }

            // 如果积分 API 返回成功（说明 token 有效），更新 isLoggedIn 状态
            if (pointsRes.code === 200 && pointsRes.data) {
                currentPoints = pointsRes.data.points || 0;
                isLoggedIn = true;
            }

            updatePoints();
            switchTab(currentTab);
        }).catch(function() {
            showToast('加载主题列表失败', 'error');
        });
    }

    // ============ Tab 切换 ============
    function switchTab(tab) {
        currentTab = tab;

        // 更新 tab 样式
        $('tabMine').classList.toggle('active', tab === 'mine');
        $('tabAll').classList.toggle('active', tab === 'all');

        // 筛选主题
        var filtered;
        if (tab === 'mine') {
            filtered = allThemes.filter(function(t) { return t.purchased; });
        } else {
            filtered = allThemes.filter(function(t) { return !t.purchased; });
        }

        // 更新计数
        var mineCount = allThemes.filter(function(t) { return t.purchased; }).length;
        var allCount = allThemes.filter(function(t) { return !t.purchased; }).length;
        $('mineCount').textContent = '(' + mineCount + ')';
        $('allCount').textContent = '(' + allCount + ')';

        renderGrid(filtered);
    }

    // ============ 初始化 ============
    function init() {
        $('tabMine').addEventListener('click', function() { switchTab('mine'); });
        $('tabAll').addEventListener('click', function() { switchTab('all'); });

        loadThemes();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
