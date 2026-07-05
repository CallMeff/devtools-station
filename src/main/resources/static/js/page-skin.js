/**
 * DevTools Station - 页面皮肤系统 (v4)
 *
 * 简化版：统一上传入口，预览框拖拽+缩放，仅保留透明度
 *  - 上传图片/视频统一入口，自动识别类型
 *  - 预览框直接拖拽移动 → 控制页面位置
 *  - 预览框拖角缩放 → 控制页面大小
 *  - 保留透明度滑块
 */
(function () {
  'use strict';

  // ============ 存储键 ============
  var SKIN_KEY = 'devtools-skin-v4';

  // ============ IndexedDB (匿名用户视频存储) ============
  var IDB_NAME = 'DevSkinDB';
  var IDB_VERSION = 1;
  var IDB_STORE = 'videos';

  function openIDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPutVideo(key, blob) {
    return openIDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(blob, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbGetVideo(key) {
    return openIDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readonly');
        var req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function idbDeleteVideo(key) {
    return openIDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  // ============ 状态 ============
  var state = {
    mediaType: null,       // 'image' | 'video' | null
    image: null,           // base64
    videoUrl: null,        // blob URL 或服务端 URL
    opacity: 0.25,
    visible: true,
    width: 40,             // 占视口宽度百分比
    left: 30,              // 距左边百分比
    top: 35,               // 距上边百分比
    aspectRatio: 1.5,      // 原始宽高比
    naturalWidth: 0,
    naturalHeight: 0,
    videoMuted: true,
    videoLoop: true
  };

    var SETTINGS_KEY = 'devtools-page-settings';
    var PASTEL_SCHEME_KEY = 'devtools-pastel-scheme';
    var pastelScheme = ''; // '' | 'lime' | 'lavender' | 'cream' | 'mint' | 'pink' | 'coral'
    var pageSettings = {
        showContent: true,
        showWidgets: true,
        showParticles: true,
        showQuickLinks: true,
        showNav: true,
        showSearch: true,
        showWeather: true,
        showInfo: true,
        iconLayout: 'free'  // 'free' | 'grid'
    };

    function loadPageSettings() {
        try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) Object.assign(pageSettings, JSON.parse(raw));
        } catch (e) {}
    }

    function savePageSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(pageSettings));
    }

    function applyPageSettings() {
        var particles = document.querySelector('.desktop-particles');
        if (particles) particles.style.display = pageSettings.showParticles ? '' : 'none';

        var navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = pageSettings.showNav ? '' : 'none';

        var searchWrap = document.querySelector('.nav-search');
        if (searchWrap) searchWrap.style.display = pageSettings.showSearch ? '' : 'none';

        var icons = document.querySelector('.desktop-icons');
        var empty = document.querySelector('.desktop-empty');
        var info = document.querySelector('.desktop-info');
        if (icons) icons.style.display = pageSettings.showContent ? '' : 'none';
        // empty 状态需要额外考虑：
        // 1) 如果有桌面小组件则不显示
        // 2) 如果有桌面工具图标（从 DesktopManager 或 localStorage 兜底）也不显示
        //    否则会导致有图标时也弹出"桌面还是空的"提示
        if (empty) {
            var hasContent = false;
            try {
                if (window.WidgetManager && window.WidgetManager.getInstances) {
                    if (window.WidgetManager.getInstances().length > 0) hasContent = true;
                }
                if (!hasContent) {
                    var rawW = localStorage.getItem('desktop_widgets');
                    if (rawW) {
                        var arrW = JSON.parse(rawW);
                        if (Array.isArray(arrW) && arrW.length > 0) hasContent = true;
                    }
                }
                if (!hasContent && window.DesktopManager) {
                    // 已登录态用 getDesktopTools（API 收藏）
                    if (typeof window.DesktopManager.getDesktopTools === 'function') {
                        if (window.DesktopManager.getDesktopTools().length > 0) hasContent = true;
                    }
                }
                if (!hasContent) {
                    // 匿名态兜底：localStorage 中的桌面工具
                    var rawT = localStorage.getItem('desktop_tools_anonymous');
                    if (rawT) {
                        var arrT = JSON.parse(rawT);
                        if (Array.isArray(arrT) && arrT.length > 0) hasContent = true;
                    }
                }
                if (!hasContent) {
                    // 最后一层兜底：直接看 DOM 里是否已经有渲染出来的桌面图标
                    var iconsContainer = document.getElementById('desktopIcons');
                    if (iconsContainer && iconsContainer.children && iconsContainer.children.length > 0) {
                        hasContent = true;
                    }
                }
            } catch(e) {}
            empty.style.display = (pageSettings.showContent && !hasContent) ? '' : 'none';
        }
        if (info) info.style.display = pageSettings.showInfo ? '' : 'none';

        var widgetBtn = document.getElementById('btnOpenWidgets');
        if (widgetBtn) widgetBtn.style.display = pageSettings.showWidgets ? '' : 'none';

        // 天气小部件（如果有）
        var weatherWidget = document.querySelector('.weather-widget');
        if (weatherWidget) weatherWidget.style.display = pageSettings.showWeather ? '' : 'none';
    }

  // ============ DOM 引用 ============
  var overlayContainer = null;
  var mediaEl = null;
  var panelEl = null;

  var PREVIEW_W = 280;
  var PREVIEW_H = 180;

  // ============ 覆盖层 ============

  function createOverlay() {
    if (!overlayContainer) {
      overlayContainer = document.createElement('div');
      overlayContainer.id = 'page-skin-overlay';
      overlayContainer.style.position = 'fixed';
      overlayContainer.style.top = '0';
      overlayContainer.style.left = '0';
      overlayContainer.style.width = '100vw';
      overlayContainer.style.height = '100vh';
      overlayContainer.style.zIndex = '-1';
      overlayContainer.style.pointerEvents = 'none';
      overlayContainer.style.overflow = 'hidden';
      document.body.insertBefore(overlayContainer, document.body.firstChild);
    }
  }

  function clearOverlay() {
    if (mediaEl) {
      if (mediaEl.tagName === 'VIDEO') {
        mediaEl.pause();
        if (mediaEl.src && mediaEl.src.startsWith('blob:')) {
          URL.revokeObjectURL(mediaEl.src);
        }
        mediaEl.removeAttribute('src');
      }
      mediaEl.remove();
      mediaEl = null;
    }
    if (overlayContainer) {
      overlayContainer.style.display = 'none';
    }
  }

  function applySkin() {
    if (!overlayContainer) createOverlay();

    var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
    if (!hasMedia || !state.visible) {
      clearOverlay();
      return;
    }

    // 清理旧媒体元素
    if (mediaEl) {
      if ((state.mediaType === 'image' && mediaEl.tagName === 'VIDEO') ||
          (state.mediaType === 'video' && mediaEl.tagName === 'IMG')) {
        if (mediaEl.tagName === 'VIDEO') {
          mediaEl.pause();
          if (mediaEl.src && mediaEl.src.startsWith('blob:')) URL.revokeObjectURL(mediaEl.src);
          mediaEl.removeAttribute('src');
        }
        mediaEl.remove();
        mediaEl = null;
      }
    }

    if (!mediaEl) {
      if (state.mediaType === 'image') {
        mediaEl = document.createElement('img');
        mediaEl.src = state.image;
      } else {
        mediaEl = document.createElement('video');
        mediaEl.src = state.videoUrl;
        mediaEl.muted = state.videoMuted;
        mediaEl.loop = state.videoLoop;
        mediaEl.playsInline = true;
        mediaEl.setAttribute('playsinline', '');
      }
      mediaEl.style.position = 'absolute';
      mediaEl.style.pointerEvents = 'none';
      mediaEl.style.willChange = 'left, top, width, opacity';
      mediaEl.style.transition = 'opacity 0.4s ease';
      overlayContainer.appendChild(mediaEl);
    }

    // 更新位置和大小
    var w = state.width;
    var aspect = state.aspectRatio || 1.5;
    var hVh = w / aspect * (window.innerWidth / window.innerHeight);
    // 限制高度不超过视口，避免竖向图片撑开
    if (hVh > 100) {
        hVh = 100;
    }

    mediaEl.style.left = state.left + '%';
    mediaEl.style.top = state.top + '%';
    mediaEl.style.width = w + 'vw';
    mediaEl.style.height = hVh + 'vh';
    mediaEl.style.maxWidth = '100vw';
    mediaEl.style.maxHeight = '100vh';
    mediaEl.style.objectFit = 'contain';
    mediaEl.style.opacity = state.opacity;

    overlayContainer.style.display = 'block';

    // 视频
    if (state.mediaType === 'video') {
      mediaEl.muted = state.videoMuted;
      mediaEl.loop = state.videoLoop;
      if (mediaEl.src !== state.videoUrl) {
        mediaEl.src = state.videoUrl;
      }
      mediaEl.load();
      mediaEl.play().catch(function () {});
    } else if (state.mediaType === 'image' && mediaEl.src !== state.image) {
      mediaEl.src = state.image;
    }
  }

  // ============ 控制按钮（已移除，改为右键菜单入口）============

  function createControlButton() {
    // 背景控制已迁移到桌面右键菜单，不再在导航栏创建按钮
  }

  // ============ 面板遮罩 ============

  var skinOverlayEl = null;

  function createSkinOverlay() {
    if (skinOverlayEl) return skinOverlayEl;
    skinOverlayEl = document.createElement('div');
    skinOverlayEl.id = 'skinPanelOverlay';
    skinOverlayEl.className = 'skin-panel-overlay';
    document.body.appendChild(skinOverlayEl);
    skinOverlayEl.addEventListener('click', closePanel);
    return skinOverlayEl;
  }

  function removeSkinOverlay() {
    if (skinOverlayEl) {
      skinOverlayEl.classList.remove('active');
    }
  }

  // ============ 面板 ============

  function createPanel() {
    if (panelEl) return panelEl;

    createSkinOverlay();

    var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
    var isVideo = state.mediaType === 'video';
    var isBgOn = hasMedia && state.visible;

    panelEl = document.createElement('div');
    panelEl.id = 'skinControlPanel';
    panelEl.className = 'skin-control-panel';

    var bgBodyContent =
      '  <!-- 上传区域 -->' +
      '  <div class="skin-upload-area" id="skinUploadArea">' +
      '    <input type="file" id="skinFileInput" accept="image/*,video/*" hidden>' +
      '    <div class="skin-upload-hint" id="skinUploadHint">' +
      '      <div class="skin-upload-icon">📎</div>' +
      '      <div class="skin-upload-text">点击或拖放上传图片/视频</div>' +
      '      <div class="skin-upload-sub" id="skinUploadSub">图片: JPG/PNG/WebP/GIF · 视频: MP4/WebM ≤20MB</div>' +
      '    </div>' +
      '    <div class="skin-upload-preview" id="skinMiniPreview" style="display:none">' +
      '      <img id="skinMiniImg" src="" alt="" style="display:none">' +
      '      <video id="skinMiniVideo" muted loop playsinline style="display:none"></video>' +
      '      <span class="skin-mini-label" id="skinMiniLabel"></span>' +
      '      <button class="skin-mini-change" id="skinMiniChange">换一个</button>' +
      '    </div>' +
      '  </div>' +
      '  <!-- 预览拖拽区 -->' +
      '  <div class="skin-preview-section' + (hasMedia ? '' : ' empty') + '" id="skinPreviewSection">' +
      '    <div class="skin-preview-label">' +
      '      <span>🖼️ 预览与定位</span>' +
      '      <span class="skin-preview-pos" id="skinPreviewPos"></span>' +
      '    </div>' +
      '    <div class="skin-preview-box" id="skinPreviewBox">' +
      (isVideo ? '<div class="skin-video-inline-btn-row" id="skinVideoInlineBtns">' +
      '  <button class="skin-video-inline-btn' + (state.videoMuted ? ' on' : '') + '" id="skinVidMuteBtn" title="静音">🔇</button>' +
      '  <button class="skin-video-inline-btn' + (state.videoLoop ? ' on' : '') + '" id="skinVidLoopBtn" title="循环">🔁</button>' +
      '</div>' : '') +
      '      <div class="skin-preview-media" id="skinPreviewMedia" style="display:none">' +
      '        <div class="skin-resize-handle nw" data-dir="nw"></div>' +
      '        <div class="skin-resize-handle ne" data-dir="ne"></div>' +
      '        <div class="skin-resize-handle sw" data-dir="sw"></div>' +
      '        <div class="skin-resize-handle se" data-dir="se"></div>' +
      '      </div>' +
      '      <div class="skin-preview-empty" id="skinPreviewEmpty">' +
      '        <span>上传媒体后在此预览定位</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="skin-preview-hint">💡 拖拽移动 · 拖四角缩放</div>' +
      '  </div>' +
      '  <!-- 透明度 -->' +
      '  <div class="skin-opacity-section">' +
      '    <div class="skin-opacity-label">' +
      '      <span>🌓 透明度</span>' +
      '      <span class="skin-opacity-value" id="skinOpacityValue">' + Math.round(state.opacity * 100) + '%</span>' +
      '    </div>' +
      '    <div class="skin-opacity-slider-wrapper">' +
      '      <input type="range" class="skin-opacity-slider" id="skinOpacitySlider" min="5" max="100" value="' + Math.round(state.opacity * 100) + '">' +
      '    </div>' +
      '    <div class="skin-opacity-quick">' +
      '      <button data-v="10">10%</button>' +
      '      <button data-v="25">25%</button>' +
      '      <button data-v="40">40%</button>' +
      '      <button data-v="60">60%</button>' +
      '    </div>' +
      '  </div>' +
      '  <button class="skin-btn-remove" id="skinBtnRemove"' + (hasMedia ? '' : ' disabled') + '>🗑 移除皮肤</button>' +
      '  <span class="skin-save-hint" id="skinSaveHint"></span>';

    panelEl.innerHTML =
      '<div class="skin-panel-header">' +
      '  <span class="skin-panel-title">页面设置</span>' +
      '  <button class="skin-panel-close" id="skinPanelClose">✕</button>' +
      '</div>' +
      '<div class="skin-panel-body">' +
      '  <div class="skin-section">' +
      '    <div class="skin-section-header" id="skinBgHeader">' +
      '      <span class="skin-section-title">背景</span>' +
      '      <div class="skin-section-right">' +
      '        <span class="skin-section-status" id="skinBgStatus">' + (isBgOn ? '打开' : '关闭') + '</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinBgToggle"' + (isBgOn ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '    </div>' +
      '    <div class="skin-section-body' + (isBgOn ? ' open' : '') + '" id="skinBgBody">' +
      bgBodyContent +
      '    </div>' +
      '  </div>' +
      '  <div class="skin-section">' +
      '    <div class="skin-section-header" id="skinContentHeader">' +
      '      <span class="skin-section-title">显示内容</span>' +
      '      <div class="skin-section-right">' +
      '        <span class="skin-section-status" id="skinContentStatus">' + (pageSettings.showContent ? '打开' : '关闭') + '</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinContentToggle"' + (pageSettings.showContent ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '    </div>' +
      '    <div class="skin-section-body" id="skinContentBody">' +
      '      <div class="skin-sub-item">' +
      '        <span>显示搜索栏</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinSearchToggle"' + (pageSettings.showSearch ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '      <div class="skin-sub-item">' +
      '        <span>显示小组件</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinWidgetsToggle"' + (pageSettings.showWidgets ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '      <div class="skin-sub-item">' +
      '        <span>显示粒子效果</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinParticlesToggle"' + (pageSettings.showParticles ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '      <div class="skin-sub-item">' +
      '        <span>显示天气</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinWeatherToggle"' + (pageSettings.showWeather ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '      <div class="skin-sub-item">' +
      '        <span>显示底部信息</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinInfoToggle"' + (pageSettings.showInfo ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="skin-section">' +
      '    <div class="skin-section-header">' +
      '      <span class="skin-section-title">图标排列</span>' +
      '      <div class="skin-section-right">' +
      '        <span class="skin-section-status" id="skinLayoutStatus">' + (pageSettings.iconLayout === 'grid' ? '网格' : '自由') + '</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="skin-section-body" id="skinLayoutBody">' +
      '      <div class="skin-sub-item">' +
      '        <span>自由排列（可拖拽）</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="radio" name="iconLayout" value="free" id="skinLayoutFree"' + (pageSettings.iconLayout === 'free' ? ' checked' : '') + '>' +
      '          <span class="skin-radio"></span>' +
      '        </label>' +
      '      </div>' +
      '      <div class="skin-sub-item">' +
      '        <span>网格排列（自动对齐）</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="radio" name="iconLayout" value="grid" id="skinLayoutGrid"' + (pageSettings.iconLayout === 'grid' ? ' checked' : '') + '>' +
      '          <span class="skin-radio"></span>' +
      '        </label>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="skin-section">' +
      '    <div class="skin-section-header">' +
      '      <span class="skin-section-title">快速链接</span>' +
      '      <div class="skin-section-right">' +
      '        <span class="skin-section-status" id="skinQuickLinksStatus">' + (pageSettings.showQuickLinks ? '打开' : '关闭') + '</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinQuickLinksToggle"' + (pageSettings.showQuickLinks ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="skin-section">' +
      '    <div class="skin-section-header">' +
      '      <span class="skin-section-title">网站导航</span>' +
      '      <div class="skin-section-right">' +
      '        <span class="skin-section-status" id="skinNavStatus">' + (pageSettings.showNav ? '打开' : '关闭') + '</span>' +
      '        <label class="skin-toggle">' +
      '          <input type="checkbox" id="skinNavToggle"' + (pageSettings.showNav ? ' checked' : '') + '>' +
      '          <span class="skin-toggle-slider"></span>' +
      '        </label>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
'  <div class="skin-section">' +
'    <div class="skin-section-header">' +
'      <span class="skin-section-title">🎨 色彩方案</span>' +
'      <span class="skin-section-status" id="skinSchemeStatus">' + (pastelScheme ? pastelScheme : '默认') + '</span>' +
'    </div>' +
'    <div class="skin-section-body open" id="skinSchemeBody">' +
'      <div class="skin-scheme-grid" id="skinSchemeGrid">' +
'        <div class="skin-scheme-item' + (pastelScheme === '' ? ' active' : '') + '" data-scheme="">' +
'          <div class="skin-scheme-swatch default"></div><span>默认</span></div>' +
'        <div class="skin-scheme-item' + (pastelScheme === 'lime' ? ' active' : '') + '" data-scheme="lime">' +
'          <div class="skin-scheme-swatch" style="background:#dceeb1"></div><span>青柠</span></div>' +
'        <div class="skin-scheme-item' + (pastelScheme === 'lavender' ? ' active' : '') + '" data-scheme="lavender">' +
'          <div class="skin-scheme-swatch" style="background:#c5b0f4"></div><span>薰衣草</span></div>' +
'        <div class="skin-scheme-item' + (pastelScheme === 'cream' ? ' active' : '') + '" data-scheme="cream">' +
'          <div class="skin-scheme-swatch" style="background:#f4ecd6"></div><span>奶油</span></div>' +
'        <div class="skin-scheme-item' + (pastelScheme === 'mint' ? ' active' : '') + '" data-scheme="mint">' +
'          <div class="skin-scheme-swatch" style="background:#c8e6cd"></div><span>薄荷</span></div>' +
'        <div class="skin-scheme-item' + (pastelScheme === 'pink' ? ' active' : '') + '" data-scheme="pink">' +
'          <div class="skin-scheme-swatch" style="background:#efd4d4"></div><span>樱花</span></div>' +
'        <div class="skin-scheme-item' + (pastelScheme === 'coral' ? ' active' : '') + '" data-scheme="coral">' +
'          <div class="skin-scheme-swatch" style="background:#f3c9b6"></div><span>珊瑚</span></div>' +
'      </div>' +
'    </div>' +
'  </div>' +
'  <div class="skin-section">' +
'    <div class="skin-section-header">' +
'      <span class="skin-section-title">自定义主题</span>' +
'      <button class="skin-section-link" id="skinManageTheme">管理</button>' +
'    </div>' +
'  </div>' +
      '</div>' +
      '<div class="skin-panel-footer">' +
      '  <a href="#" onclick="return false;">设置</a>' +
      '  <a href="#" onclick="return false;">帮助</a>' +
      '  <a href="#" onclick="return false;">反馈</a>' +
      '  <span class="skin-footer-copy">© DevTools Station</span>' +
      '</div>';

    document.body.appendChild(panelEl);

    if (hasMedia) {
      updateMiniPreview();
      updatePreviewMedia();
    }

    bindPanelEvents();
    return panelEl;
  }

  function updateBgToggleUI() {
    var toggle = document.getElementById('skinBgToggle');
    var status = document.getElementById('skinBgStatus');
    var body = document.getElementById('skinBgBody');
    var on = state.visible && (state.image || state.videoUrl);
    if (toggle) toggle.checked = on;
    if (status) status.textContent = on ? '打开' : '关闭';
    if (body) body.classList.toggle('open', on);
  }

  function bindSettingToggle(id, key, statusId) {
    var el = document.getElementById(id);
    if (!el) return;
    el.checked = pageSettings[key];
    el.addEventListener('change', function() {
      pageSettings[key] = el.checked;
      savePageSettings();
      applyPageSettings();
      if (statusId) {
        var statusEl = document.getElementById(statusId);
        if (statusEl) statusEl.textContent = el.checked ? '打开' : '关闭';
      }
      var parentBody = el.closest('.skin-section-body');
      if (parentBody) {
        var parentHeader = parentBody.previousElementSibling;
        if (parentHeader) {
          var parentStatus = parentHeader.querySelector('.skin-section-status');
          if (parentStatus) {
            var allOff = true;
            parentBody.querySelectorAll('.skin-toggle input').forEach(function(child) {
              if (child.checked) allOff = false;
            });
            parentStatus.textContent = allOff ? '关闭' : '打开';
            var parentToggle = parentHeader.querySelector('.skin-toggle input');
            if (parentToggle) parentToggle.checked = !allOff;
          }
        }
      }
    });
  }

  // ============ 迷你预览（上传区里的小缩略图） ============

  function updateMiniPreview() {
    var hint = document.getElementById('skinUploadHint');
    var mini = document.getElementById('skinMiniPreview');
    var img = document.getElementById('skinMiniImg');
    var vid = document.getElementById('skinMiniVideo');
    var label = document.getElementById('skinMiniLabel');

    if (!mini) return;

    var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
    if (!hasMedia) {
      if (hint) hint.style.display = '';
      if (mini) mini.style.display = 'none';
      return;
    }

    if (hint) hint.style.display = 'none';
    if (mini) mini.style.display = 'flex';

    if (state.mediaType === 'image') {
      if (img) { img.style.display = 'block'; img.src = state.image; }
      if (vid) vid.style.display = 'none';
      if (label) label.textContent = '图片背景';
    } else {
      if (img) img.style.display = 'none';
      if (vid) { vid.style.display = 'block'; vid.src = state.videoUrl; vid.play().catch(function () {}); }
      if (label) label.textContent = '视频背景';
    }
  }

  // ============ 预览框 ============

  function updatePreviewMedia() {
    var media = document.getElementById('skinPreviewMedia');
    var empty = document.getElementById('skinPreviewEmpty');
    var posEl = document.getElementById('skinPreviewPos');
    var section = document.getElementById('skinPreviewSection');
    var videoRow = document.getElementById('skinVideoInlineBtns');

    if (!media) return;

    var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
    if (!hasMedia) {
      media.style.display = 'none';
      if (empty) empty.style.display = 'flex';
      if (section) section.classList.add('empty');
      if (videoRow) videoRow.style.display = 'none';
      return;
    }

    if (section) section.classList.remove('empty');
    if (empty) empty.style.display = 'none';
    if (media) media.style.display = 'block';

    // 视频控制行
    if (videoRow) {
      videoRow.style.display = state.mediaType === 'video' ? 'flex' : 'none';
    }

    // 计算在预览框中的位置和大小
    var pw = PREVIEW_W;
    var ph = PREVIEW_H;
    var aspect = state.aspectRatio || 1.5;
    var viewAspect = window.innerWidth / window.innerHeight;

    // 先算在真实页面上的高度百分比（vh），被 100vh 封顶
    var realHvh = state.width / aspect * viewAspect;
    if (realHvh > 100) realHvh = 100;

    // 按百分比映射到预览框：宽度占预览框 state.width%，高度占预览框 realHvh%
    var mw = (state.width / 100) * pw;
    var mh = (realHvh / 100) * ph;
    var ml = (state.left / 100) * pw;
    var mt = (state.top / 100) * ph;

    // 限制不超出预览框
    ml = Math.max(0, Math.min(ml, pw - mw));
    mt = Math.max(0, Math.min(mt, ph - mh));

    media.style.left = ml + 'px';
    media.style.top = mt + 'px';
    media.style.width = mw + 'px';
    media.style.height = mh + 'px';

    // 背景图片就是上传的图片
    if (state.mediaType === 'image' && state.image) {
      media.style.backgroundImage = 'url(' + state.image + ')';
      media.style.backgroundSize = 'contain';
      media.style.backgroundRepeat = 'no-repeat';
      media.style.backgroundPosition = 'center';
    } else if (state.mediaType === 'video') {
      media.style.background = '#000';
      // 视频模式显示一个播放图标
      media.style.backgroundImage = 'none';
    }

    if (posEl) {
      posEl.textContent = Math.round(state.left) + '%, ' + Math.round(state.top) + '% · ' + Math.round(state.width) + '%';
    }
  }

  // ============ 预览框拖拽逻辑 ============

  var dragState = null; // null | 'move' | 'resize-nw' | ...

  function bindPreviewDrag() {
    var box = document.getElementById('skinPreviewBox');
    var media = document.getElementById('skinPreviewMedia');
    if (!box || !media) return;

    // 移除旧事件（简单做法：用标记避免重复绑定）
    if (box._dragBound) return;
    box._dragBound = true;

    // 拖拽移动
    media.addEventListener('mousedown', function (e) {
      if (e.target.classList.contains('skin-resize-handle')) return; // 留给缩放手柄
      if (!(state.mediaType === 'image' ? state.image : state.videoUrl)) return;

      e.preventDefault();
      dragState = { type: 'move', startX: e.clientX, startY: e.clientY, origLeft: state.left, origTop: state.top };
      media.style.cursor = 'grabbing';
    });

    // 缩放手柄
    var handles = media.querySelectorAll('.skin-resize-handle');
    handles.forEach(function (h) {
      h.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!(state.mediaType === 'image' ? state.image : state.videoUrl)) return;

        var dir = h.getAttribute('data-dir');
        var pw = PREVIEW_W;
        var ph = PREVIEW_H;
        var mw = (state.width / 100) * pw;
        var ml = (state.left / 100) * pw;
        var mt = (state.top / 100) * ph;
        var aspect = state.aspectRatio || 1.5;
        var viewAspect = window.innerWidth / window.innerHeight;
        var realHvh = state.width / aspect * viewAspect;
        if (realHvh > 100) realHvh = 100;
        var mh = (realHvh / 100) * ph;

        dragState = {
          type: 'resize',
          dir: dir,
          startX: e.clientX,
          startY: e.clientY,
          origWidth: state.width,
          origLeft: state.left,
          origTop: state.top,
          origMw: mw,
          origMh: mh,
          origMl: ml,
          origMt: mt,
          aspect: aspect
        };
      });
    });

    // 全局 move / up
    document.addEventListener('mousemove', function (e) {
      if (!dragState) return;

      if (dragState.type === 'move') {
        var dx = e.clientX - dragState.startX;
        var dy = e.clientY - dragState.startY;
        var pw = PREVIEW_W;
        var ph = PREVIEW_H;
        var viewAspect = window.innerWidth / window.innerHeight;
        var realHvh = state.width / (state.aspectRatio || 1.5) * viewAspect;
        if (realHvh > 100) realHvh = 100;
        state.left = Math.max(0, Math.min(100 - state.width, dragState.origLeft + (dx / pw) * 100));
        state.top = Math.max(0, Math.min(100 - realHvh, dragState.origTop + (dy / ph) * 100));
        updatePreviewMedia();
        applySkin();
      } else if (dragState.type === 'resize') {
        var dxR = e.clientX - dragState.startX;
        var dyR = e.clientY - dragState.startY;
        var pwR = PREVIEW_W;
        var phR = PREVIEW_H;
        var asp = dragState.aspect;
        var viewAspectR = window.innerWidth / window.innerHeight;
        var newMw, newMl, newMt;

        // 根据移动的距离计算新的预览宽度，保持对角固定
        var origMw = dragState.origMw;
        var origMh = dragState.origMh;
        // 辅助：从预览像素宽反推高度（与 updatePreviewMedia 一致）
        function pxToMh(pwPx) {
          var wp = (pwPx / pwR) * 100;
          var hvh = wp / asp * viewAspectR;
          if (hvh > 100) hvh = 100;
          return (hvh / 100) * phR;
        }

        if (dragState.dir === 'se') {
          // 左上角固定，向右下扩展
          newMw = origMw + dxR;
          newMl = dragState.origMl;
          newMt = dragState.origMt;
        } else if (dragState.dir === 'sw') {
          // 右上角固定，向左下扩展
          newMw = origMw - dxR;
          newMl = dragState.origMl + origMw - newMw;
          newMt = dragState.origMt;
        } else if (dragState.dir === 'ne') {
          // 左下角固定，向右上扩展
          newMw = origMw + dxR;
          newMl = dragState.origMl;
          var newMh = pxToMh(newMw);
          newMt = dragState.origMt + origMh - newMh;
        } else if (dragState.dir === 'nw') {
          // 右下角固定，向左上扩展
          newMw = origMw - dxR;
          newMl = dragState.origMl + origMw - newMw;
          var newMh2 = pxToMh(newMw);
          newMt = dragState.origMt + origMh - newMh2;
        }

        // 转百分比并限制最小/最大
        var newW = (newMw / pwR) * 100;
        newW = Math.max(10, Math.min(100, newW));
        newMw = (newW / 100) * pwR;

        // 重新按 clamp 后的宽度校正位置
        if (dragState.dir === 'se') {
          newMl = dragState.origMl;
          newMt = dragState.origMt;
        } else if (dragState.dir === 'sw') {
          newMl = dragState.origMl + origMw - newMw;
          newMt = dragState.origMt;
        } else if (dragState.dir === 'ne') {
          newMl = dragState.origMl;
          var newMhFinal = pxToMh(newMw);
          newMt = dragState.origMt + origMh - newMhFinal;
        } else if (dragState.dir === 'nw') {
          newMl = dragState.origMl + origMw - newMw;
          var newMhFinal2 = pxToMh(newMw);
          newMt = dragState.origMt + origMh - newMhFinal2;
        }

        state.width = newW;
        state.left = Math.max(0, (newMl / pwR) * 100);
        state.top = Math.max(0, (newMt / phR) * 100);

        // 不让超出边界
        var viewAspectM = window.innerWidth / window.innerHeight;
        var realHvhM = state.width / asp * viewAspectM;
        if (realHvhM > 100) realHvhM = 100;
        state.left = Math.max(0, Math.min(state.left, 100 - state.width));
        state.top = Math.max(0, Math.min(state.top, 100 - realHvhM));

        updatePreviewMedia();
        applySkin();
      }
    });

    document.addEventListener('mouseup', function () {
      if (!dragState) return;
      var mediaEl2 = document.getElementById('skinPreviewMedia');
      if (mediaEl2) mediaEl2.style.cursor = 'grab';
      dragState = null;
      saveSkin();
    });
  }

  // ============ 面板事件 ============

  function bindPanelEvents() {
    // 关闭
    var closeBtn = document.getElementById('skinPanelClose');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    // 展开/折叠
    document.querySelectorAll('.skin-section-header').forEach(function(h) {
      h.addEventListener('click', function(e) {
        if (e.target.closest('.skin-toggle') || e.target.closest('.skin-section-link')) return;
        var body = h.nextElementSibling;
        if (body && body.classList.contains('skin-section-body')) {
          body.classList.toggle('open');
        }
      });
    });

    // 背景 toggle
    var bgToggle = document.getElementById('skinBgToggle');
    if (bgToggle) {
      bgToggle.addEventListener('change', function() {
        if (bgToggle.checked) {
          if (state.mediaType && (state.image || state.videoUrl)) {
            state.visible = true;
            applySkin();
            saveSkin();
          } else {
            showToast('请先上传背景图片或视频');
            bgToggle.checked = false;
            return;
          }
        } else {
          state.visible = false;
          applySkin();
          saveSkin();
        }
        updateBgToggleUI();
      });
    }

    // 其他设置 toggles
    bindSettingToggle('skinContentToggle', 'showContent', 'skinContentStatus');
    bindSettingToggle('skinWidgetsToggle', 'showWidgets', null);
    bindSettingToggle('skinParticlesToggle', 'showParticles', null);
    bindSettingToggle('skinQuickLinksToggle', 'showQuickLinks', 'skinQuickLinksStatus');
    bindSettingToggle('skinNavToggle', 'showNav', 'skinNavStatus');
    bindSettingToggle('skinSearchToggle', 'showSearch', null);
    bindSettingToggle('skinWeatherToggle', 'showWeather', null);
    bindSettingToggle('skinInfoToggle', 'showInfo', null);

    // 图标排列
    var layoutFree = document.getElementById('skinLayoutFree');
    var layoutGrid = document.getElementById('skinLayoutGrid');
    var layoutStatus = document.getElementById('skinLayoutStatus');
    if (layoutFree && layoutGrid) {
      layoutFree.addEventListener('change', function() {
        if (layoutFree.checked) {
          pageSettings.iconLayout = 'free';
          if (layoutStatus) layoutStatus.textContent = '自由';
          savePageSettings();
        }
      });
      layoutGrid.addEventListener('change', function() {
        if (layoutGrid.checked) {
          pageSettings.iconLayout = 'grid';
          if (layoutStatus) layoutStatus.textContent = '网格';
          savePageSettings();
          if (DesktopManager && DesktopManager.arrangeIcons) {
            DesktopManager.arrangeIcons();
          }
        }
      });
    }

    // 管理主题
    var manageTheme = document.getElementById('skinManageTheme');
    if (manageTheme) {
      manageTheme.addEventListener('click', function(e) {
        e.stopPropagation();
        closePanel();
        var themeSwitcher = document.querySelector('.theme-switcher');
        if (themeSwitcher) {
          var btn = themeSwitcher.querySelector('button, .theme-btn');
          if (btn) btn.click();
        }
      });
    }

    // 色彩方案
    var schemeGrid = document.getElementById('skinSchemeGrid');
    if (schemeGrid) {
      schemeGrid.addEventListener('click', function(e) {
        var item = e.target.closest('.skin-scheme-item');
        if (!item) return;
        var scheme = item.getAttribute('data-scheme') || '';
        setPastelScheme(scheme);
        // 更新 active
        schemeGrid.querySelectorAll('.skin-scheme-item').forEach(function(el) {
          el.classList.toggle('active', el.getAttribute('data-scheme') === scheme);
        });
        var status = document.getElementById('skinSchemeStatus');
        if (status) status.textContent = scheme || '默认';
      });
    }

    // 上传
    var uploadArea = document.getElementById('skinUploadArea');
    var fileInput = document.getElementById('skinFileInput');
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function (e) {
        if (e.target.closest('#skinMiniChange')) return;
        // 先清空，允许再次选择同一个文件
        fileInput.value = '';
        fileInput.click();
      });
      uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });
      uploadArea.addEventListener('dragleave', function () {
        uploadArea.classList.remove('dragover');
      });
      uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        var file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      });
      fileInput.addEventListener('change', function () {
        if (fileInput.files[0]) {
          handleFile(fileInput.files[0]);
          // 清空 value，允许再次选择同一个文件
          fileInput.value = '';
        }
      });
    }

    // 更换按钮
    var changeBtn = document.getElementById('skinMiniChange');
    if (changeBtn) {
      changeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (fileInput) {
          // 先清空，允许再次选择同一个文件
          fileInput.value = '';
          fileInput.click();
        }
      });
    }

    // 透明度
    var opSlider = document.getElementById('skinOpacitySlider');
    if (opSlider) {
      opSlider.addEventListener('input', function () {
        updateOpacity(parseInt(opSlider.value) / 100);
      });
    }
    var quickBtns = document.querySelectorAll('.skin-opacity-quick button');
    quickBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(b.getAttribute('data-v')) / 100;
        updateOpacity(v);
        var slider = document.getElementById('skinOpacitySlider');
        if (slider) slider.value = Math.round(v * 100);
      });
    });

    // 视频控件
    var muteBtn = document.getElementById('skinVidMuteBtn');
    if (muteBtn) muteBtn.addEventListener('click', toggleVideoMute);
    var loopBtn = document.getElementById('skinVidLoopBtn');
    if (loopBtn) loopBtn.addEventListener('click', toggleVideoLoop);

    // 移除
    var removeBtn = document.getElementById('skinBtnRemove');
    if (removeBtn) removeBtn.addEventListener('click', removeSkin);

    // 预览框拖拽
    bindPreviewDrag();
  }

  function togglePanel() {
    if (panelEl && panelEl.classList.contains('active')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    createOverlay();
    createSkinOverlay();
    var panel = createPanel();
    panel.classList.add('active');
    if (skinOverlayEl) skinOverlayEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateSaveHint();
    updateUploadHint();
    updatePreviewMedia();
    updateMiniPreview();
    updateBgToggleUI();
  }

  function closePanel() {
    if (panelEl) {
      panelEl.classList.remove('active');
    }
    removeSkinOverlay();
    document.body.style.overflow = '';
  }

  // ============ 文件处理 ============

  function handleFile(file) {
    if (file.type.match(/^image\//)) {
      handleImageFile(file);
    } else if (file.type.match(/^video\//)) {
      handleVideoFile(file);
    } else {
      showToast('不支持的文件格式，请上传图片或视频', 'error');
    }
  }

  function isLoggedIn() {
    return window.DevAuth && window.DevAuth.isLoggedIn && window.DevAuth.isLoggedIn();
  }

  function handleImageFile(file) {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif|svg\+xml)$/)) {
      showToast('请上传 JPG/PNG/WebP/GIF 格式的图片', 'error');
      return;
    }
    // 未登录：受限于 localStorage，限制 5MB
    if (!isLoggedIn() && file.size > 5 * 1024 * 1024) {
      showToast('未登录时图片不能超过 5MB，登录后无限制', 'error');
      return;
    }
    // 已登录：给一个较大的上限（50MB）防止极端情况
    if (isLoggedIn() && file.size > 50 * 1024 * 1024) {
      showToast('图片不能超过 50MB', 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var img = new Image();
      img.onload = function () {
        // 清除旧视频
        clearOldVideo();

        state.mediaType = 'image';
        state.image = compressIfNeeded(img, dataUrl);
        state.naturalWidth = img.naturalWidth;
        state.naturalHeight = img.naturalHeight;
        state.aspectRatio = img.naturalWidth / img.naturalHeight;
        state.visible = true;
        // 默认居中 40% 宽
        state.width = 40;
        state.left = 30;
        // 根据宽高比算 top
        var viewAspect = window.innerWidth / window.innerHeight;
        var mediaHeight = state.width / state.aspectRatio * viewAspect;
        state.top = Math.max(0, (100 - mediaHeight) / 2);

        applySkin();
        updateMiniPreview();
        updatePreviewMedia();
        updateRemoveBtn(true);
        updateControlBtnBadge();
        updateBgToggleUI();
        // 视频控件行隐藏
        var videoRow = document.getElementById('skinVideoInlineBtns');
        if (videoRow) videoRow.style.display = 'none';
        var section = document.getElementById('skinPreviewSection');
        if (section) section.classList.remove('empty');
        saveSkin();
      };
      img.onerror = function () {
        showToast('图片加载失败，文件可能已损坏', 'error');
      };
      img.src = dataUrl;
    };
    reader.onerror = function () {
      showToast('文件读取失败，请重试', 'error');
    };
    reader.readAsDataURL(file);
  }

  function handleVideoFile(file) {
    if (!file.type.match(/^video\/(mp4|webm|quicktime|x-msvideo|x-matroska|ogg)$/)) {
      showToast('请上传 MP4/WebM/MOV 格式的视频', 'error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast('视频不能超过 20MB', 'error');
      return;
    }

    showToast('正在处理视频...', 'info');

    // 清除旧图片
    state.image = null;

    if (isLoggedIn()) {
      uploadVideoToServer(file);
    } else {
      storeVideoLocal(file);
    }
  }

  function finishVideoSetup(url) {
    state.mediaType = 'video';
    state.videoUrl = url;
    state.visible = true;
    state.aspectRatio = 16 / 9; // 默认 16:9
    state.width = 40;
    state.left = 30;
    var viewAspect = window.innerWidth / window.innerHeight;
    var mediaHeight = state.width / state.aspectRatio * viewAspect;
    state.top = Math.max(0, (100 - mediaHeight) / 2);

    applySkin();
    updateMiniPreview();
    updatePreviewMedia();
    updateRemoveBtn(true);
    updateControlBtnBadge();
    updateBgToggleUI();
    // 显示视频控件
    var videoRow = document.getElementById('skinVideoInlineBtns');
    if (videoRow) videoRow.style.display = 'flex';
    var section = document.getElementById('skinPreviewSection');
    if (section) section.classList.remove('empty');
    saveSkin();
  }

  function uploadVideoToServer(file) {
    var formData = new FormData();
    formData.append('file', file);

    fetch('/api/skin/video/upload', {
      method: 'POST',
      headers: { 'X-Auth-Token': window.DevAuth.getToken() },
      body: formData
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.code === 200) {
        clearOldVideo();
        finishVideoSetup(data.data.videoUrl);
        showToast('视频上传成功 ✅');
      } else {
        showToast(data.message || '上传失败', 'error');
      }
    })
    .catch(function (err) {
      console.warn('[Skin] 视频上传失败:', err);
      showToast('上传失败，切换到本地存储', 'error');
      storeVideoLocal(file);
    });
  }

  function storeVideoLocal(file) {
    clearOldVideo();
    var url = URL.createObjectURL(file);
    finishVideoSetup(url);

    idbPutVideo('video-blob', file).then(function () {
      showToast('视频已保存到本地 ✅');
    }).catch(function () {
      showToast('视频已加载（浏览器关闭后可能丢失）', 'error');
    });
  }

  function clearOldVideo() {
    if (state.videoUrl && state.videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.videoUrl);
    }
    state.videoUrl = null;
    idbDeleteVideo('video-blob').catch(function () {});
  }

  function compressIfNeeded(img, originalDataUrl) {
    var maxW = 1920, maxH = 1080;
    var w = img.width, h = img.height;
    if (w <= maxW && h <= maxH && originalDataUrl.length < 500 * 1024) {
      return originalDataUrl;
    }
    if (w > maxW) { h = h * (maxW / w); w = maxW; }
    if (h > maxH) { w = w * (maxH / h); h = maxH; }
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  // ============ 透明度 ============

  function updateOpacity(value) {
    state.opacity = Math.max(0.05, Math.min(1.0, value));
    if (mediaEl) mediaEl.style.opacity = state.opacity;
    var valEl = document.getElementById('skinOpacityValue');
    if (valEl) valEl.textContent = Math.round(state.opacity * 100) + '%';
    saveSkin();
  }

  // ============ 视频静音/循环 ============

  function toggleVideoMute() {
    state.videoMuted = !state.videoMuted;
    if (mediaEl && mediaEl.tagName === 'VIDEO') mediaEl.muted = state.videoMuted;
    var btn = document.getElementById('skinVidMuteBtn');
    if (btn) {
      btn.textContent = state.videoMuted ? '🔇' : '🔊';
      btn.classList.toggle('on', state.videoMuted);
    }
    saveSkin();
  }

  function toggleVideoLoop() {
    state.videoLoop = !state.videoLoop;
    if (mediaEl && mediaEl.tagName === 'VIDEO') mediaEl.loop = state.videoLoop;
    var btn = document.getElementById('skinVidLoopBtn');
    if (btn) {
      btn.classList.toggle('on', state.videoLoop);
    }
    saveSkin();
  }

  // ============ 移除皮肤 ============

  function removeSkin() {
    clearOldVideo();
    state.image = null;
    state.mediaType = null;
    state.opacity = 0.25;
    state.width = 40;
    state.left = 30;
    state.top = 35;
    state.aspectRatio = 1.5;
    state.visible = true;

    applySkin();
    updateMiniPreview();
    updatePreviewMedia();
    updateRemoveBtn(false);
    updateControlBtnBadge();
    clearSkinData();

    var opSlider = document.getElementById('skinOpacitySlider');
    if (opSlider) opSlider.value = 25;
    var opVal = document.getElementById('skinOpacityValue');
    if (opVal) opVal.textContent = '25%';
    var section = document.getElementById('skinPreviewSection');
    if (section) section.classList.add('empty');
    var videoRow = document.getElementById('skinVideoInlineBtns');
    if (videoRow) videoRow.style.display = 'none';

    updateBgToggleUI();
    showToast('皮肤已移除');
  }

  // ============ 持久化 ============

  function saveSkin() {
    var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
    if (!hasMedia) return;

    try {
      var data = {
        mediaType: state.mediaType,
        opacity: state.opacity,
        width: state.width,
        left: state.left,
        top: state.top,
        aspectRatio: state.aspectRatio,
        videoMuted: state.videoMuted,
        videoLoop: state.videoLoop,
        visible: state.visible
      };
      if (state.mediaType === 'image') {
        data.image = state.image;
        data.videoUrl = null;
      } else {
        data.image = null;
        data.videoUrl = state.videoUrl;
      }
      localStorage.setItem(SKIN_KEY, JSON.stringify(data));
    } catch (e) {
      showToast('存储空间不足，请清理浏览器缓存', 'error');
    }

    if (isLoggedIn()) {
      syncToServer();
    } else {
      updateSaveHint();
    }
  }

  function syncToServer() {
    fetch('/api/skin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': window.DevAuth.getToken()
      },
      body: JSON.stringify({
        skinImage: state.mediaType === 'image' ? state.image : null,
        skinMediaType: state.mediaType || 'image',
        skinVideo: state.mediaType === 'video' ? state.videoUrl : null,
        opacity: state.opacity,
        skinWidth: state.width,
        skinLeft: state.left,
        skinTop: state.top,
        skinAspectRatio: state.aspectRatio,
        videoMuted: state.videoMuted,
        videoLoop: state.videoLoop
      })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.code === 200) console.log('[Skin] 已同步到服务器');
        updateSaveHint();
      }).catch(function (err) {
        console.warn('[Skin] 同步失败:', err);
      });
  }

  function clearSkinData() {
    localStorage.removeItem(SKIN_KEY);
    if (window.DevAuth && window.DevAuth.isLoggedIn()) {
      fetch('/api/skin', {
        method: 'DELETE',
        headers: { 'X-Auth-Token': window.DevAuth.getToken() }
      }).catch(function () {});
    }
  }

  // ============ 加载 ============

  function loadSkin() {
    try {
      var raw = localStorage.getItem(SKIN_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        state.mediaType = d.mediaType || null;
        state.opacity = d.opacity || 0.25;
        state.width = d.width || 40;
        state.left = d.left != null ? d.left : 30;
        state.top = d.top != null ? d.top : 35;
        state.visible = d.visible != null ? d.visible : true;
        state.aspectRatio = d.aspectRatio || 1.5;
        state.videoMuted = d.videoMuted != null ? d.videoMuted : true;
        state.videoLoop = d.videoLoop != null ? d.videoLoop : true;
        state.image = d.image || null;
        state.videoUrl = d.videoUrl || null;

        // 如果有视频 URL 但 IndexedDB 里可能有 blob
        if (state.mediaType === 'video' && !state.videoUrl) {
          idbGetVideo('video-blob').then(function (blob) {
            if (blob) {
              state.videoUrl = URL.createObjectURL(blob);
              createOverlay();
              applySkin();
            }
          });
        }

        if (state.mediaType === 'video' && state.videoUrl) {
          createOverlay();
          applySkin();
        } else if (state.mediaType === 'image' && state.image) {
          createOverlay();
          applySkin();
        }
      }
    } catch (e) {
      // 忽略损坏的数据
    }

    // 服务器同步
    if (window.DevAuth && window.DevAuth.isLoggedIn()) {
      fetch('/api/skin', {
        headers: { 'X-Auth-Token': window.DevAuth.getToken() }
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.code === 200 && data.data) {
          var d = data.data;
          var serverType = d.skinMediaType || 'image';
          var hasServerSkin = serverType === 'image' ? !!d.skinImage : !!d.skinVideo;

          if (hasServerSkin) {
            state.mediaType = serverType;
            state.visible = true;
            state.opacity = d.opacity || 0.25;
            state.width = d.skinWidth || 40;
            state.left = d.skinLeft != null ? d.skinLeft : 30;
            state.top = d.skinTop != null ? d.skinTop : 35;
            state.aspectRatio = d.skinAspectRatio || 1.5;
            state.videoMuted = d.videoMuted != null ? d.videoMuted : true;
            state.videoLoop = d.videoLoop != null ? d.videoLoop : true;

            if (serverType === 'image') {
              state.image = d.skinImage;
              state.videoUrl = null;
            } else {
              state.videoUrl = d.skinVideo;
              state.image = null;
            }

            createOverlay();
            applySkin();
            saveSkin();
            console.log('[Skin] 已从服务器加载皮肤 (' + serverType + ')');
          }
        } else {
          // 本地有皮肤就上传到服务器
          var hasLocal = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
          if (hasLocal) syncToServer();
        }
      }).catch(function (err) {
        console.warn('[Skin] 服务器加载失败:', err);
      });
    }

    updateControlBtnBadge();
  }

  // ============ UI 辅助 ============

  function updateSaveHint() {
    var hint = document.getElementById('skinSaveHint');
    if (!hint) return;
    if (isLoggedIn()) {
      hint.textContent = '✅ 已登录，皮肤自动保存';
      hint.style.color = 'var(--green-primary, #4ade80)';
    } else {
      hint.textContent = '⚠️ 未登录，仅保存在当前浏览器';
      hint.style.color = 'var(--yellow-primary, #fbbf24)';
    }
  }

  function updateUploadHint() {
    var sub = document.getElementById('skinUploadSub');
    if (!sub) return;
    if (isLoggedIn()) {
      sub.textContent = '图片: JPG/PNG/WebP/GIF · 视频: MP4/WebM ≤20MB';
      sub.style.color = '';
    } else {
      sub.textContent = '图片: JPG/PNG/WebP/GIF ≤5MB · 视频: MP4/WebM ≤20MB';
      sub.style.color = 'var(--yellow-primary, #fbbf24)';
    }
  }

  function updateRemoveBtn(has) {
    var btn = document.getElementById('skinBtnRemove');
    if (btn) btn.disabled = !has;
  }

  function updateControlBtnBadge() {
    var btn = document.getElementById('skinControlBtn');
    if (!btn) return;
    var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
    if (hasMedia) {
      btn.classList.add('has-skin');
      btn.innerHTML = state.mediaType === 'video' ? '🎬' : '🎨';
    } else {
      btn.classList.remove('has-skin');
      btn.innerHTML = '🎨';
    }
  }

  // ============ Toast ============

  function showToast(msg, type) {
    type = type || 'info';
    var existing = document.querySelector('.skin-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'skin-toast skin-toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // ============ 全局手势 ============

  // ============ 色彩方案 ============
  var SCHEME_CLASSES = ['pastel-lime', 'pastel-lavender', 'pastel-cream', 'pastel-mint', 'pastel-pink', 'pastel-coral'];

  function removeSchemeClasses() {
    SCHEME_CLASSES.forEach(function(cls) {
      document.body.classList.remove(cls);
      document.documentElement.classList.remove(cls);
    });
  }

  function setPastelScheme(scheme) {
    pastelScheme = scheme;
    localStorage.setItem(PASTEL_SCHEME_KEY, scheme);
    applyPastelScheme();
  }

  function applyPastelScheme() {
    // 断开 observer 防止修改 class 时触发自身造成无限循环
    _pastelObserver.disconnect();
    removeSchemeClasses();
    if (pastelScheme && document.body.classList.contains('theme-pastel')) {
      document.body.classList.add('pastel-' + pastelScheme);
      document.documentElement.classList.add('pastel-' + pastelScheme);
    }
    // 重新开始观察
    _pastelObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function loadPastelScheme() {
    try {
      pastelScheme = localStorage.getItem(PASTEL_SCHEME_KEY) || '';
    } catch(e) { pastelScheme = ''; }
    applyPastelScheme();
  }

  // 监听主题切换，重新应用方案
  var _pastelObserver = new MutationObserver(function() {
    applyPastelScheme();
  });
  function watchPastelThemeChanges() {
    _pastelObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function bindGlobalSwipe() {
    var touchStartX = 0;
    var touchStartOpacity = 0;

    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 2) return;
      var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
      if (!hasMedia) return;
      touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchStartOpacity = state.opacity;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2) return;
      var hasMedia = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
      if (!hasMedia) return;
      var currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var delta = currentX - touchStartX;
      var newOpacity = touchStartOpacity + (delta / window.innerWidth) * 0.5;
      updateOpacity(newOpacity);
      var slider = document.getElementById('skinOpacitySlider');
      if (slider) slider.value = Math.round(state.opacity * 100);
    }, { passive: true });
  }

  // ============ 监听登录状态 ============

  function watchAuthChanges() {
    var checkInterval = setInterval(function () {
      if (window.DevAuth && window.DevAuth.isLoggedIn) {
        var prevLoggedIn = watchAuthChanges._lastState;
        var nowLoggedIn = window.DevAuth.isLoggedIn();
        if (prevLoggedIn !== undefined && prevLoggedIn !== nowLoggedIn) {
          if (nowLoggedIn) {
            var hasLocal = state.mediaType === 'image' ? !!state.image : !!state.videoUrl;
            if (hasLocal) syncToServer();
          }
          // 登录状态变化时刷新面板提示
          updateSaveHint();
          updateUploadHint();
        }
        watchAuthChanges._lastState = nowLoggedIn;
      }
    }, 2000);
  }

  // ============ 初始化 ============

  function init() {
    createOverlay();
    loadSkin();
    loadPageSettings();
    loadPastelScheme();
    applyPageSettings();
    bindGlobalSwipe();
    watchAuthChanges();
    watchPastelThemeChanges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      var attempts = 0;
      var tryInit = setInterval(function () {
        if (window.DevAuth || attempts > 20) {
          clearInterval(tryInit);
          init();
        }
        attempts++;
      }, 150);
    });
  } else {
    init();
  }

  // 暴露 API
  window.DevSkin = {
    getState: function () { return state; },
    setOpacity: updateOpacity,
    remove: removeSkin,
    refresh: loadSkin,
    openPanel: openPanel,
    closePanel: closePanel
  };

})();
