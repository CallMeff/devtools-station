/**
 * DevTools Station - 主脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initKeyboardShortcuts();
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
