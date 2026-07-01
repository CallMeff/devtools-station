/**
 * DevTools Station - 页面皮肤水印系统
 * 
 * 功能：
 *  - 上传图片作为页面背景皮肤（水印效果）
 *  - 滑杆/触控滑动调节不透明度
 *  - 匿名用户：localStorage 保存，不登录可用
 *  - 登录用户：后端 API 持久化，跨设备同步
 */
(function () {
  'use strict';

  var SKIN_KEY = 'devtools-page-skin';
  var SKIN_OPACITY_KEY = 'devtools-page-skin-opacity';

  // 皮肤状态
  var state = {
    image: null,      // base64 图片数据
    opacity: 0.15,    // 默认 15% 不透明度
    visible: true
  };

  // DOM 元素引用
  var overlayEl = null;
  var controlPanelEl = null;
  var touchStartX = 0;
  var touchStartOpacity = 0;

  // ============ 皮肤面板 UI ============

  function createOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.id = 'page-skin-overlay';
    // 插入为 body 第一个子元素，确保在内容下方
    document.body.insertBefore(overlayEl, document.body.firstChild);
    applySkin();
    return overlayEl;
  }

  function applySkin() {
    if (!overlayEl) return;
    if (state.image && state.visible) {
      overlayEl.style.backgroundImage = 'url(' + state.image + ')';
      overlayEl.style.opacity = state.opacity;
      overlayEl.style.display = 'block';
    } else {
      overlayEl.style.display = 'none';
    }
  }

  function createControlButton() {
    // 插入到 nav-actions 区域
    var navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // 避免重复
    if (document.getElementById('skinControlBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'skinControlBtn';
    btn.className = 'skin-control-btn';
    btn.title = '页面皮肤';
    btn.innerHTML = '🎨';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });

    navActions.appendChild(btn);
  }

  function createPanel() {
    if (controlPanelEl) return controlPanelEl;

    controlPanelEl = document.createElement('div');
    controlPanelEl.id = 'skinControlPanel';
    controlPanelEl.className = 'skin-control-panel';

    var hasSkin = !!state.image;
    var previewSrc = state.image || '';

    controlPanelEl.innerHTML =
      '<div class="skin-panel-header">' +
      '  <span class="skin-panel-title">🎨 页面皮肤</span>' +
      '  <button class="skin-panel-close" id="skinPanelClose">✕</button>' +
      '</div>' +
      '<div class="skin-panel-body">' +
      '  <!-- 上传区域 -->' +
      '  <div class="skin-upload-area" id="skinUploadArea">' +
      '    <input type="file" id="skinFileInput" accept="image/*" hidden>' +
      '    <div class="skin-upload-hint" id="skinUploadHint">' +
      '      <div class="skin-upload-icon">🖼️</div>' +
      '      <div class="skin-upload-text">点击或拖放图片</div>' +
      '      <div class="skin-upload-sub">支持 JPG/PNG/WebP，建议深色系图片效果更佳</div>' +
      '    </div>' +
      '    <div class="skin-preview" id="skinPreview" style="display:none">' +
      '      <img id="skinPreviewImg" src="" alt="预览">' +
      '      <button class="skin-preview-change" id="skinPreviewChange">更换图片</button>' +
      '    </div>' +
      '  </div>' +
      '  <!-- 透明度控制 -->' +
      '  <div class="skin-opacity-section">' +
      '    <div class="skin-opacity-label">' +
      '      <span>不透明度</span>' +
      '      <span class="skin-opacity-value" id="skinOpacityValue">' + Math.round(state.opacity * 100) + '%</span>' +
      '    </div>' +
      '    <div class="skin-opacity-slider-wrapper">' +
      '      <input type="range" class="skin-opacity-slider" id="skinOpacitySlider" ' +
      '        min="5" max="100" value="' + Math.round(state.opacity * 100) + '">' +
      '    </div>' +
      '    <div class="skin-opacity-quick">' +
      '      <button data-v="5">5%</button>' +
      '      <button data-v="15">15%</button>' +
      '      <button data-v="30">30%</button>' +
      '      <button data-v="50">50%</button>' +
      '    </div>' +
      '    <div class="skin-swipe-hint" id="skinSwipeHint">' +
      '      <span>💡 在页面任意位置左滑降低 / 右滑升高透明度</span>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="skin-panel-footer">' +
      '  <button class="skin-btn-remove" id="skinBtnRemove"' + (hasSkin ? '' : ' disabled') + '>🗑 移除皮肤</button>' +
      '  <span class="skin-save-hint" id="skinSaveHint"></span>' +
      '</div>';

    document.body.appendChild(controlPanelEl);

    // 已有皮肤时显示预览
    if (hasSkin) {
      showPreview(state.image);
    }

    // 绑定事件
    bindPanelEvents();

    return controlPanelEl;
  }

  function showPreview(src) {
    var hint = document.getElementById('skinUploadHint');
    var preview = document.getElementById('skinPreview');
    var img = document.getElementById('skinPreviewImg');
    if (hint) hint.style.display = 'none';
    if (preview) preview.style.display = 'block';
    if (img) img.src = src;
  }

  function showHint() {
    var hint = document.getElementById('skinUploadHint');
    var preview = document.getElementById('skinPreview');
    if (hint) hint.style.display = '';
    if (preview) preview.style.display = 'none';
  }

  function bindPanelEvents() {
    // 关闭按钮
    var closeBtn = document.getElementById('skinPanelClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePanel);
    }

    // 点击上传区域
    var uploadArea = document.getElementById('skinUploadArea');
    var fileInput = document.getElementById('skinFileInput');
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function (e) {
        if (e.target.id === 'skinPreviewChange') return;
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
        if (fileInput.files[0]) handleFile(fileInput.files[0]);
      });
    }

    // 更换图片按钮
    var changeBtn = document.getElementById('skinPreviewChange');
    if (changeBtn) {
      changeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (fileInput) fileInput.click();
      });
    }

    // 透明度滑块
    var slider = document.getElementById('skinOpacitySlider');
    if (slider) {
      slider.addEventListener('input', function () {
        var v = parseInt(slider.value) / 100;
        updateOpacity(v);
      });
    }

    // 快速预设
    var quickBtns = document.querySelectorAll('.skin-opacity-quick button');
    quickBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(b.getAttribute('data-v')) / 100;
        updateOpacity(v);
        var slider = document.getElementById('skinOpacitySlider');
        if (slider) slider.value = Math.round(v * 100);
      });
    });

    // 移除按钮
    var removeBtn = document.getElementById('skinBtnRemove');
    if (removeBtn) {
      removeBtn.addEventListener('click', removeSkin);
    }

    // 点击面板外部关闭（延迟绑定避免立即触发）
    setTimeout(function () {
      document.addEventListener('click', outsideClickHandler);
    }, 0);
  }

  function outsideClickHandler(e) {
    if (!controlPanelEl) return;
    var btn = document.getElementById('skinControlBtn');
    if (controlPanelEl.contains(e.target)) return;
    if (btn && btn.contains(e.target)) return;
    closePanel();
  }

  function togglePanel() {
    if (controlPanelEl && controlPanelEl.classList.contains('active')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    createOverlay();
    var panel = createPanel();
    updateSaveHint();
    panel.classList.add('active');
    document.body.classList.add('skin-panel-open');
  }

  function closePanel() {
    if (controlPanelEl) {
      controlPanelEl.classList.remove('active');
      document.body.classList.remove('skin-panel-open');
    }
    document.removeEventListener('click', outsideClickHandler);
  }

  // ============ 文件处理 ============

  function handleFile(file) {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif|svg\+xml)$/)) {
      showToast('请上传 JPG/PNG/WebP/GIF 格式的图片', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片不能超过 5MB', 'error');
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      // 如果是大图，用 canvas 压缩
      var img = new Image();
      img.onload = function () {
        var compressed = compressIfNeeded(img, dataUrl);
        state.image = compressed;
        state.opacity = state.opacity || 0.15;
        state.visible = true;
        applySkin();
        showPreview(compressed);
        saveSkin();
        updateRemoveBtn(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function compressIfNeeded(img, originalDataUrl) {
    var maxW = 1920;
    var maxH = 1080;
    var w = img.width;
    var h = img.height;

    if (w <= maxW && h <= maxH && originalDataUrl.length < 500 * 1024) {
      return originalDataUrl;
    }

    // 缩放
    if (w > maxW) { h = h * (maxW / w); w = maxW; }
    if (h > maxH) { w = w * (maxH / h); h = maxH; }

    var canvas = document.createElement('canvas');
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // JPEG 质量 0.7
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  // ============ 透明度 ============

  function updateOpacity(value) {
    state.opacity = Math.max(0.05, Math.min(1.0, value));
    applySkin();
    var valEl = document.getElementById('skinOpacityValue');
    if (valEl) valEl.textContent = Math.round(state.opacity * 100) + '%';
    saveSkin();
  }

  // ============ 移除皮肤 ============

  function removeSkin() {
    state.image = null;
    state.opacity = 0.15;
    state.visible = true;
    applySkin();
    showHint();
    updateRemoveBtn(false);
    clearSkin();
    var slider = document.getElementById('skinOpacitySlider');
    if (slider) slider.value = 15;
    var valEl = document.getElementById('skinOpacityValue');
    if (valEl) valEl.textContent = '15%';
    showToast('皮肤已移除');
  }

  // ============ 持久化 ============

  function saveSkin() {
    if (!state.image) return;

    // 始终保存到 localStorage（匿名也能用）
    try {
      localStorage.setItem(SKIN_KEY, state.image);
      localStorage.setItem(SKIN_OPACITY_KEY, String(state.opacity));
    } catch (e) {
      // localStorage 满了，清除后重试
      showToast('存储空间不足，请清理浏览器缓存', 'error');
    }

    // 已登录 → 同步到后端
    if (window.DevAuth && window.DevAuth.isLoggedIn()) {
      fetch('/api/skin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': window.DevAuth.getToken()
        },
        body: JSON.stringify({
          skinImage: state.image,
          opacity: state.opacity
        })
      }).then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.code === 200) {
            console.log('[Skin] 已同步到服务器');
            updateSaveHint();
          }
        }).catch(function (err) {
          console.warn('[Skin] 同步失败:', err);
        });
    } else {
      updateSaveHint();
    }
  }

  function clearSkin() {
    localStorage.removeItem(SKIN_KEY);
    localStorage.removeItem(SKIN_OPACITY_KEY);

    if (window.DevAuth && window.DevAuth.isLoggedIn()) {
      fetch('/api/skin', {
        method: 'DELETE',
        headers: { 'X-Auth-Token': window.DevAuth.getToken() }
      }).catch(function () {});
    }
  }

  function updateSaveHint() {
    var hint = document.getElementById('skinSaveHint');
    if (!hint) return;
    if (window.DevAuth && window.DevAuth.isLoggedIn()) {
      hint.textContent = '✅ 已登录，皮肤自动保存';
      hint.style.color = 'var(--green-primary, #4ade80)';
    } else {
      hint.textContent = '⚠️ 未登录，仅保存在当前浏览器';
      hint.style.color = 'var(--yellow-primary, #fbbf24)';
    }
  }

  function updateRemoveBtn(hasSkin) {
    var btn = document.getElementById('skinBtnRemove');
    if (btn) btn.disabled = !hasSkin;
  }

  // ============ 加载皮肤 ============

  function loadSkin() {
    // 先从 localStorage 加载（快速）
    var localImage = localStorage.getItem(SKIN_KEY);
    var localOpacity = parseFloat(localStorage.getItem(SKIN_OPACITY_KEY));

    if (localImage) {
      state.image = localImage;
      state.opacity = !isNaN(localOpacity) ? localOpacity : 0.15;
      createOverlay();
    }

    // 如果已登录，尝试从服务器拉取（覆盖本地）
    if (window.DevAuth && window.DevAuth.isLoggedIn()) {
      fetch('/api/skin', {
        headers: { 'X-Auth-Token': window.DevAuth.getToken() }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.code === 200 && data.data && data.data.skinImage) {
            // 服务器有皮肤 → 使用服务器的
            state.image = data.data.skinImage;
            state.opacity = data.data.opacity || 0.15;
            createOverlay();
            applySkin();
            // 同步到 localStorage
            try {
              localStorage.setItem(SKIN_KEY, state.image);
              localStorage.setItem(SKIN_OPACITY_KEY, String(state.opacity));
            } catch (e) {}
            console.log('[Skin] 已从服务器加载皮肤');
          } else {
            // 服务器没有皮肤但本地有 → 上传到服务器
            if (localImage) {
              syncLocalToServer();
            }
          }
        }).catch(function (err) {
          console.warn('[Skin] 服务器加载失败，使用本地:', err);
        });
    }

    updateControlBtnBadge();
  }

  /** 登录后把本地皮肤同步到服务器 */
  function syncLocalToServer() {
    if (!state.image) return;
    fetch('/api/skin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': window.DevAuth.getToken()
      },
      body: JSON.stringify({
        skinImage: state.image,
        opacity: state.opacity
      })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.code === 200) {
          console.log('[Skin] 本地皮肤已同步到服务器');
        }
      }).catch(function (err) {
        console.warn('[Skin] 同步失败:', err);
      });
  }

  function updateControlBtnBadge() {
    var btn = document.getElementById('skinControlBtn');
    if (!btn) return;
    if (state.image) {
      btn.classList.add('has-skin');
    } else {
      btn.classList.remove('has-skin');
    }
  }

  // ============ 全局触控滑动手势 ============

  function bindGlobalSwipe() {
    document.addEventListener('touchstart', function (e) {
      // 只在双指时启用（避免干扰滚动）
      if (e.touches.length !== 2) return;
      if (!state.image) return;

      touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchStartOpacity = state.opacity;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2) return;
      if (!state.image) return;

      var currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var delta = currentX - touchStartX;
      var newOpacity = touchStartOpacity + (delta / window.innerWidth) * 0.5;
      updateOpacity(newOpacity);

      var slider = document.getElementById('skinOpacitySlider');
      if (slider) slider.value = Math.round(state.opacity * 100);
    }, { passive: true });

    // 桌面端键盘快捷键：左右方向键精调透明度（仅当面板打开时）
    document.addEventListener('keydown', function (e) {
      if (!controlPanelEl || !controlPanelEl.classList.contains('active')) return;
      if (!state.image) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        var delta = e.key === 'ArrowRight' ? 0.05 : -0.05;
        updateOpacity(state.opacity + delta);
        var slider = document.getElementById('skinOpacitySlider');
        if (slider) slider.value = Math.round(state.opacity * 100);
      }
    });
  }

  // ============ Toast 提示 ============

  function showToast(msg, type) {
    type = type || 'info';
    var existing = document.querySelector('.skin-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'skin-toast skin-toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // ============ 监听登录/登出事件 ============

  function watchAuthChanges() {
    // 劫持 DevAuth 的 refreshUI 来感知登录状态变化
    var checkInterval = setInterval(function () {
      if (window.DevAuth && window.DevAuth.isLoggedIn) {
        var prevLoggedIn = watchAuthChanges._lastState;
        var nowLoggedIn = window.DevAuth.isLoggedIn();
        if (prevLoggedIn !== undefined && prevLoggedIn !== nowLoggedIn) {
          if (nowLoggedIn) {
            // 刚登录 → 同步本地皮肤到服务器
            syncLocalToServer();
          } else {
            // 刚登出 → 保留本地皮肤
          }
          updateSaveHint();
        }
        watchAuthChanges._lastState = nowLoggedIn;
      }
    }, 2000);
  }

  // ============ 初始化 ============

  function init() {
    createControlButton();
    createOverlay();
    loadSkin();
    bindGlobalSwipe();
    watchAuthChanges();
  }

  // 等待 DOM 和 auth 准备好
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // 等 DevAuth 初始化（最多等 3 秒）
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
    refresh: loadSkin
  };

})();
