/**
 * DevTools Station - 三主题切换系统
 * 支持：暗黑(dark) / 明亮(light) / 二次元(anime)
 */
(function() {
    'use strict';

    var THEME_KEY = 'devtools-theme';
    var themes = [
        { id: 'dark',  name: function() { return (window.__I18N__ && window.__I18N__.t('theme.dark')) || '暗黑'; },   desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.dark_desc')) || '护眼深邃 · 专业暗色'; },     icon: '🌙' },
        { id: 'light', name: function() { return (window.__I18N__ && window.__I18N__.t('theme.light')) || '明亮'; },   desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.light_desc')) || '清爽简洁 · 经典白昼'; },    icon: '☀️' },
        { id: 'anime', name: function() { return (window.__I18N__ && window.__I18N__.t('theme.anime')) || '二次元'; },  desc: function() { return (window.__I18N__ && window.__I18N__.t('theme.anime_desc')) || '樱花甜心 · 动漫风格'; },    icon: '🌸' }
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
            '</div>' +
            '<div class="theme-dropdown-backdrop" id="themeBackdrop"></div>';

        // 事件绑定
        var btn   = document.getElementById('themeSwitcherBtn');
        var drop  = document.getElementById('themeDropdown');
        var back  = document.getElementById('themeBackdrop');

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var open = drop.classList.contains('active');
            drop.classList.toggle('active', !open);
            back.classList.toggle('active', !open);
        });

        back.addEventListener('click', function() {
            drop.classList.remove('active');
            back.classList.remove('active');
        });

        drop.addEventListener('click', function(e) {
            var opt = e.target.closest('.theme-option');
            if (!opt) return;
            var id = opt.getAttribute('data-theme');
            setTheme(id);
            drop.classList.remove('active');
            back.classList.remove('active');
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

    // 初始化
    function init() {
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
