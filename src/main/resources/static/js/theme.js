/**
 * DevTools Station - 三主题切换系统
 * 支持：暗黑(dark) / 明亮(light) / 二次元(anime)
 */
(function() {
    'use strict';

    var THEME_KEY = 'devtools-theme';
    var themes = [
        { id: 'dark',   name: function() { return (window.__I18N__ && window.__I18N__.t('theme.dark')) || '暗黑'; },     desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.dark_desc')) || '护眼深邃 · 专业暗色'; },     icon: '🌙' },
        { id: 'light',  name: function() { return (window.__I18N__ && window.__I18N__.t('theme.light')) || '明亮'; },     desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.light_desc')) || '清爽简洁 · 经典白昼'; },    icon: '☀️' },
        { id: 'anime',  name: function() { return (window.__I18N__ && window.__I18N__.t('theme.anime')) || '二次元'; },    desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.anime_desc')) || '樱花甜心 · 动漫风格'; },    icon: '🌸' },
        { id: 'pastel', name: function() { return (window.__I18N__ && window.__I18N__.t('theme.pastel')) || '马卡龙'; },   desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.pastel_desc')) || '黑白编辑框 · 马卡龙色块'; }, icon: '🎨' }
    ];

    function getThemeName(t) {
        return typeof t.name === 'function' ? t.name() : t.name;
    }
    function getThemeDesc(t) {
        return typeof t.desc === 'function' ? t.desc() : t.desc;
    }

    function getTheme() {
        var saved = localStorage.getItem(THEME_KEY);
        if (saved && themes.some(function(t) { return t.id === saved; })) {
            return saved;
        }
        return 'dark';
    }

    function setTheme(id) {
        // 同步更新 <html> 和 <body> 的主题类
        [document.documentElement, document.body].forEach(function(el) {
            el.className = el.className.replace(/theme-\w+/g, '').trim();
            el.classList.add('theme-' + id);
        });
        localStorage.setItem(THEME_KEY, id);
        updateActive(id);

        // 同步主题到后端（已登录用户）
        if (window.DevAuth && window.DevAuth.isLoggedIn()) {
            window.DevAuth.saveSettings({ theme: id });
        }
    }

    function updateActive(id) {
        var options = document.querySelectorAll('.theme-option');
        options.forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === id);
        });
        var btn = document.getElementById('themeSwitcherBtn');
        if (btn) {
            var theme = themes.find(function(t) { return t.id === id; });
            if (theme) btn.textContent = theme.icon;
        }
    }

    function buildSwitcher(container) {
        var current = getTheme();
        var currentTheme = themes.find(function(t) { return t.id === current; }) || themes[0];

        container.className = 'theme-switcher';
        container.innerHTML =
            '<button class="theme-switcher-btn" id="themeSwitcherBtn" data-i18n-title="theme.switch_title" title="' + ((window.__I18N__ && window.__I18N__.t('theme.switch_title')) || '切换主题') + '">' +
                currentTheme.icon +
            '</button>' +
            '<div class="theme-dropdown" id="themeDropdown">' +
                themes.map(function(t) {
                    return '<div class="theme-option' + (t.id === current ? ' active' : '') + '" data-theme="' + t.id + '">' +
                        '<div class="theme-preview theme-preview-' + t.id + '"></div>' +
                        '<div class="theme-option-info">' +
                            '<div class="theme-option-name">' + t.icon + ' ' + getThemeName(t) + '</div>' +
                            '<div class="theme-option-desc">' + getThemeDesc(t) + '</div>' +
                        '</div>' +
                        '<div class="theme-option-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                    '</div>';
                }).join('') +
                '<a class="theme-more-link" href="/theme-store" data-i18n="theme.more">' +
                    ((window.__I18N__ && window.__I18N__.t('theme.more')) || '查看更多') + ' →' +
                '</a>' +
            '</div>' +
            '<div class="theme-dropdown-backdrop" id="themeBackdrop"></div>';

        // 事件绑定
        var btn   = document.getElementById('themeSwitcherBtn');
        var drop  = document.getElementById('themeDropdown');
        var back  = document.getElementById('themeBackdrop');

        var hideTimeout;

        function showDropdown() {
            clearTimeout(hideTimeout);
            drop.classList.add('active');
        }

        function hideDropdown() {
            hideTimeout = setTimeout(function() {
                drop.classList.remove('active');
            }, 200);
        }

        btn.addEventListener('mouseenter', showDropdown);
        btn.addEventListener('mouseleave', hideDropdown);

        drop.addEventListener('mouseenter', showDropdown);
        drop.addEventListener('mouseleave', hideDropdown);

        drop.addEventListener('click', function(e) {
            var opt = e.target.closest('.theme-option');
            if (!opt) return;
            var id = opt.getAttribute('data-theme');
            setTheme(id);
            clearTimeout(hideTimeout);
            drop.classList.remove('active');
        });
    }

    // ========== 缓存清理按钮 ==========
    function buildCacheClearBtn() {
        var navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        // 避免重复添加
        if (document.getElementById('cacheClearBtn')) return;

        var btn = document.createElement('button');
        btn.id = 'cacheClearBtn';
        btn.className = 'cache-clear-btn';
        btn.title = '清除本站缓存并刷新';
        btn.innerHTML = '🗑';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('确定要清除 DevTools Station 的所有本地数据并刷新吗？\n\n这将清除：\n· 主题设置\n· 语言设置\n· 登录状态\n· 文档搜索索引缓存\n\n页面将在清除完成后自动刷新。')) {
                return;
            }
            // 清除所有本站相关数据
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && (key.startsWith('devtools-') || key.startsWith('ds-'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
            // 清除 sessionStorage
            sessionStorage.clear();
            // 清除 Service Worker 缓存（如果有）
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    names.forEach(function(name) { caches.delete(name); });
                });
            }
            // 硬刷新（跳过浏览器缓存）
            location.href = location.href.split('?')[0] + '?cleared=' + Date.now();
        });

        // 插入到 nav-actions 开头
        navActions.insertBefore(btn, navActions.firstChild);
    }

    // ========== 主题预览（来自主题商店，2分钟自动恢复） ==========
    var PREVIEW_KEY = 'devtools_theme_preview';

    function checkThemePreview() {
        try {
            var raw = localStorage.getItem(PREVIEW_KEY);
            if (!raw) return false;
            var data = JSON.parse(raw);

            // 检查是否过期
            if (Date.now() >= data.expiresAt) {
                restorePreviewTheme(data);
                return false;
            }

            // 还在预览期内 → 应用预览主题（不存 localStorage，原主题保留）
            [document.documentElement, document.body].forEach(function(el) {
                el.className = el.className.replace(/theme-\w+/g, '').trim();
                el.classList.add('theme-' + data.themeKey);
            });

            // 设置定时器，到期自动恢复
            var remaining = data.expiresAt - Date.now();
            setTimeout(function() {
                restorePreviewTheme(data);
            }, Math.max(remaining, 100));

            // 显示预览横幅
            showPreviewBanner(data);
            return true; // 预览活跃
        } catch(e) { return false; }
    }

    function restorePreviewTheme(data) {
        // 恢复原主题
        [document.documentElement, document.body].forEach(function(el) {
            el.className = el.className.replace(/theme-\w+/g, '').trim();
            el.classList.add('theme-' + data.originalTheme);
        });
        // 确保 localStorage 保持原主题
        localStorage.setItem(THEME_KEY, data.originalTheme);
        // 同步到后端
        if (window.DevAuth && window.DevAuth.isLoggedIn()) {
            window.DevAuth.saveSettings({ theme: data.originalTheme });
        }
        // 清除预览数据
        localStorage.removeItem(PREVIEW_KEY);
        // 隐藏预览横幅
        hidePreviewBanner();
        // 更新主题切换器图标
        updateActive(data.originalTheme);
    }

    function showPreviewBanner(data) {
        // 防止重复创建
        if (document.getElementById('themePreviewBanner')) return;

        var banner = document.createElement('div');
        banner.id = 'themePreviewBanner';
        banner.className = 'theme-preview-banner';
        var remain = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000));
        var min = Math.floor(remain / 60);
        var sec = remain % 60;
        banner.innerHTML =
            '<span class="preview-banner-icon">' + (data.themeIcon || '🎨') + '</span>' +
            '<span class="preview-banner-text">正在预览 <strong>' + data.themeName + '</strong> · ' + min + '分' + sec + '秒后自动恢复</span>' +
            '<button class="preview-banner-btn" onclick="window.__exitThemePreview()">返回原主题</button>' +
            '<button class="preview-banner-close" onclick="window.__exitThemePreview()">&times;</button>';

        document.body.appendChild(banner);

        // 导航栏下移，避免遮挡
        var navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.add('preview-active');

        // 暴露退出函数
        window.__exitThemePreview = function() {
            try {
                var raw = localStorage.getItem(PREVIEW_KEY);
                if (raw) restorePreviewTheme(JSON.parse(raw));
            } catch(e) {}
        };

        // 每秒更新倒计时
        banner._countdown = setInterval(function() {
            try {
                var r = localStorage.getItem(PREVIEW_KEY);
                if (!r) { clearInterval(banner._countdown); return; }
                var d = JSON.parse(r);
                var remain = Math.max(0, Math.ceil((d.expiresAt - Date.now()) / 1000));
                var m = Math.floor(remain / 60);
                var s = remain % 60;
                var text = banner.querySelector('.preview-banner-text');
                if (text) text.innerHTML = '正在预览 <strong>' + d.themeName + '</strong> · ' + m + '分' + s + '秒后自动恢复';
                if (remain <= 0) { clearInterval(banner._countdown); restorePreviewTheme(d); }
            } catch(e) {}
        }, 1000);
    }

    function hidePreviewBanner() {
        var banner = document.getElementById('themePreviewBanner');
        if (banner) {
            if (banner._countdown) clearInterval(banner._countdown);
            banner.remove();
        }
        var navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.remove('preview-active');
        delete window.__exitThemePreview;
    }

    // 初始化
    function init() {
        // 先检查主题预览状态（优先于 localStorage 主题）
        var isPreview = checkThemePreview();

        // 如果活跃预览，跳过 init 的主题覆盖逻辑
        if (isPreview) {
            // 只需更新主题切换器 UI（不改变 DOM 主题类）
            var match = document.documentElement.className.match(/theme-(\w+)/);
            updateActive(match ? match[1] : 'dark');
            // 继续构建切换器
            var containers = document.querySelectorAll('.theme-switcher');
            containers.forEach(buildSwitcher);
            buildCacheClearBtn();
            return;
        }

        var current = getTheme();
        // 确保 body 有主题 class（兼容旧的 class="dark"）
        if (!document.body.className.match(/theme-\w+/)) {
            if (document.body.classList.contains('dark') || document.body.classList.contains('light')) {
                // 迁移旧格式
                var old = document.body.classList.contains('light') ? 'light' : 'dark';
                document.body.classList.remove('dark', 'light');
                document.body.classList.add('theme-' + old);
                localStorage.setItem(THEME_KEY, old);
                current = old;
            } else {
                document.body.classList.add('theme-' + current);
            }
        } else {
            // 已有 theme- class（服务端硬编码），用 localStorage 的值覆盖它
            var match = document.body.className.match(/theme-(\w+)/);
            if (match && match[1] !== current) {
                // body 的类与 localStorage 不一致 → 以 localStorage 为准
                document.body.className = document.body.className
                    .replace(/theme-\w+/g, '')
                    .trim();
                document.body.classList.add('theme-' + current);
            }
        }

        // 确保 <html> 也同步主题类（与防闪烁内联脚本保持一致）
        var htmlMatch = document.documentElement.className.match(/theme-(\w+)/);
        if (!htmlMatch || htmlMatch[1] !== current) {
            document.documentElement.className = document.documentElement.className
                .replace(/theme-\w+/g, '')
                .trim();
            document.documentElement.classList.add('theme-' + current);
        }

        // 查找所有 .theme-switcher 容器并构建 UI
        var containers = document.querySelectorAll('.theme-switcher');
        containers.forEach(buildSwitcher);

        // 添加缓存清理按钮
        buildCacheClearBtn();
    }

    // 暴露 API
    window.DevTheme = {
        get: getTheme,
        set: setTheme,
        themes: themes
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 加载页面皮肤系统（注入 script 标签，无需修改模板）
    (function loadSkinScript() {
        var script = document.createElement('script');
        script.src = '/js/page-skin.js';
        script.defer = true;
        document.head.appendChild(script);
    })();
})();
