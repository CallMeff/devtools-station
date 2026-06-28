/**
 * DevTools Station - 主脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initKeyboardShortcuts();
    // 延迟初始化收藏（等待 DevAuth 加载）
    setTimeout(initFavorites, 200);
});

/* ============================================
   全局搜索
   ============================================ */
function initSearch() {
    const input = document.getElementById('searchInput');
    const dropdown = document.getElementById('searchDropdown');
    if (!input || !dropdown) return;

    let allTools = [];
    // 从页面收集所有工具数据
    document.querySelectorAll('.tool-card, .hot-tool-card').forEach(card => {
        const link = card.tagName === 'A' ? card : card.closest('a');
        if (!link) return;
        const name = card.querySelector('h3, h4, .tool-card-name')?.textContent || '';
        const desc = card.querySelector('p, .tool-card-desc')?.textContent || '';
        const icon = card.querySelector('.tool-icon, .tool-card-icon')?.textContent || '';
        const href = link.getAttribute('href');
        allTools.push({ name: name.trim(), desc: desc.trim(), icon: icon.trim(), href });
    });

    // 去重
    const seen = new Set();
    allTools = allTools.filter(t => {
        const key = t.name + t.href;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        if (!q) {
            dropdown.classList.remove('active');
            return;
        }

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

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#navSearch')) {
            dropdown.classList.remove('active');
        }
    });

    // 键盘导航
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            input.blur();
        }
    });
}

function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return `${before}<mark style="background:rgba(99,102,241,0.3);color:inherit;border-radius:2px;">${match}</mark>${after}`;
}

/* ============================================
   键盘快捷键
   ============================================ */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // ⌘K / Ctrl+K 聚焦搜索
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const input = document.getElementById('searchInput');
            if (input) input.focus();
        }
    });
}

/* ============================================
   我的常用工具（收藏）
   ============================================ */
var DevFavorites = (function() {
    'use strict';

    var favoriteIds = new Set();
    var favoriteTools = [];

    function getToken() {
        return window.DevAuth && window.DevAuth.getToken ? window.DevAuth.getToken() : null;
    }

    function isLoggedIn() {
        return window.DevAuth && window.DevAuth.isLoggedIn ? window.DevAuth.isLoggedIn() : false;
    }

    function api(method, path, body) {
        var headers = { 'Content-Type': 'application/json' };
        var token = getToken();
        if (token) headers['X-Auth-Token'] = token;
        var opts = { method: method, headers: headers };
        if (body) opts.body = JSON.stringify(body);
        return fetch(path, opts).then(function(r) { return r.json(); });
    }

    /** 加载收藏列表 */
    function load() {
        if (!isLoggedIn()) {
            document.getElementById('favoriteSection').style.display = 'none';
            return;
        }

        return api('GET', '/api/favorites').then(function(res) {
            if (res.code === 200 && res.data) {
                favoriteIds = new Set(res.data.toolIds || []);
                favoriteTools = res.data.tools || [];
                renderSection();
                updateAllStars();
            }
        });
    }

    /** 渲染"我的常用工具"区域 */
    function renderSection() {
        var section = document.getElementById('favoriteSection');
        var grid = document.getElementById('favoriteToolsGrid');
        var empty = document.getElementById('favoriteEmpty');

        if (!section || !grid || !empty) return;

        if (favoriteTools.length === 0) {
            grid.innerHTML = '';
            empty.style.display = '';
            section.style.display = '';
            return;
        }

        empty.style.display = 'none';
        section.style.display = '';

        grid.innerHTML = favoriteTools.map(function(t) {
            return '<a href="' + t.route + '" class="tool-card fav-tool-card" data-tool-id="' + t.id + '" data-tool-key="' + t.route + '">' +
                '<span class="tool-card-icon">' + (t.icon || '🔧') + '</span>' +
                '<div class="tool-card-body">' +
                    '<h4 class="tool-card-name">' + t.name + '</h4>' +
                    '<p class="tool-card-desc">' + (t.description || '') + '</p>' +
                '</div>' +
                '<button class="fav-star fav-star-filled" data-tool-id="' + t.id + '" title="取消收藏" onclick="event.preventDefault(); DevFavorites.toggle(this)" aria-label="取消收藏"></button>' +
            '</a>';
        }).join('');
    }

    /** 更新所有页面星标状态 */
    function updateAllStars() {
        document.querySelectorAll('.fav-star').forEach(function(star) {
            var toolId = parseInt(star.getAttribute('data-tool-id'));
            if (favoriteIds.has(toolId)) {
                star.classList.add('fav-star-filled');
                star.title = '取消收藏';
            } else {
                star.classList.remove('fav-star-filled');
                star.title = '添加到常用工具';
            }
        });
    }

    /** 切换收藏状态 */
    function toggle(starEl) {
        var toolId = parseInt(starEl.getAttribute('data-tool-id'));
        if (!toolId) return;

        if (!isLoggedIn()) {
            // 未登录，弹出登录框
            if (window.DevAuth && window.DevAuth.showLogin) {
                window.DevAuth.showLogin();
            }
            return;
        }

        var isFav = favoriteIds.has(toolId);

        if (isFav) {
            // 取消收藏
            api('POST', '/api/favorites/remove', { toolId: toolId }).then(function(res) {
                if (res.code === 200) {
                    favoriteIds.delete(toolId);
                    favoriteTools = favoriteTools.filter(function(t) { return t.id !== toolId; });
                    updateAllStars();
                    renderSection();
                    showFavToast('已从常用工具移除');
                }
            });
        } else {
            // 添加收藏
            api('POST', '/api/favorites/add', { toolId: toolId }).then(function(res) {
                if (res.code === 200) {
                    favoriteIds.add(toolId);
                    // 从卡片获取工具信息
                    var card = starEl.closest('.tool-card, .hot-tool-card, .fav-tool-card');
                    var name = card ? (card.querySelector('.tool-card-name') || card.querySelector('h3') || {}).textContent : '';
                    var desc = card ? (card.querySelector('.tool-card-desc') || card.querySelector('p') || {}).textContent : '';
                    var icon = card ? (card.querySelector('.tool-card-icon, .tool-icon') || {}).textContent : '';
                    var route = card ? card.getAttribute('data-tool-key') || card.getAttribute('href') : '';
                    favoriteTools.push({ id: toolId, name: name, description: desc, icon: icon, route: route });
                    updateAllStars();
                    renderSection();
                    showFavToast('已添加到常用工具');
                }
            });
        }
    }

    /** 刷新（供外部 auth 事件调用） */
    function refresh() {
        load();
    }

    /** Toast 提示 */
    function showFavToast(msg) {
        var existing = document.querySelector('.fav-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'fav-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(function() {
            toast.classList.add('show');
        });
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }

    // 暴露 API
    return {
        toggle: toggle,
        refresh: refresh,
        load: load
    };
})();

/** 初始化收藏功能 */
function initFavorites() {
    DevFavorites.load();
}
