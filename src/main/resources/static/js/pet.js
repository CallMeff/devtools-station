/**
 * DevTools Station - 桌面宠物引擎
 * 纯前端实现：图片宠物 + 拖拽 + 互动 + 右键菜单
 */
;(function() {
  'use strict';

  var STORAGE_KEY = 'devtools_desktop_pet';
  var pet = null;           // 当前宠物数据
  var petEl = null;         // DOM 元素
  var containerEl = null;   // 外层容器
  var menuEl = null;        // 右键菜单
  var emptyTipEl = null;    // 空状态提示

  var isDragging = false;
  var dragStart = { x: 0, y: 0, petX: 0, petY: 0 };
  var idleTimer = null;
  var walkTimer = null;
  var actionTimer = null;
  var state = 'idle';       // idle | walking | poked | dragged | eating | sleeping | happy

  /* ========== 初始化 ========== */
  function init() {
    // 只在桌面首页上显示宠物
    var desktop = document.getElementById('desktop');
    if (!desktop) return;

    // 创建菜单
    createContextMenu();

    // 创建空状态提示
    createEmptyTip();

    // 读取已保存的宠物
    loadPet();

    // 如果有宠物就渲染
    if (pet) {
      renderPet();
    }
  }

  /* ========== 加载/保存宠物 ========== */
  function loadPet() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) pet = JSON.parse(raw);
    } catch(e) { pet = null; }
  }

  function savePet(data) {
    pet = Object.assign(pet || {}, data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
    } catch(e) {}
  }

  function removePet() {
    pet = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch(e) {}
    destroyPetElement();
    showEmptyTip();
  }

  /* ========== 渲染宠物 ========== */
  function renderPet(data) {
    if (data) {
      // 新设置宠物
      savePet(data);
    }
    if (!pet) return;

    destroyPetElement();
    hideEmptyTip();

    // 容器
    containerEl = document.createElement('div');
    containerEl.className = 'desktop-pet-container';
    containerEl.id = 'desktopPetContainer';

    // 默认位置
    var savedX = pet.x || window.innerWidth - 140;
    var savedY = pet.y || window.innerHeight - 200;
    containerEl.style.left = savedX + 'px';
    containerEl.style.top = savedY + 'px';

    // 宠物元素
    petEl = document.createElement('div');
    petEl.className = 'desktop-pet pet-idle';

    // 身体
    var body = document.createElement('div');
    body.className = 'pet-body';

    if (pet.imageUrl) {
      var img = document.createElement('img');
      img.src = pet.imageUrl;
      img.alt = pet.name || '宠物';
      img.draggable = false;
      img.onerror = function() {
        this.style.display = 'none';
        body.innerHTML = '<div class="pet-emoji-fallback">🖼️</div>';
      };
      body.appendChild(img);
    } else if (pet.emoji) {
      body.innerHTML = '<div class="pet-emoji-fallback">' + pet.emoji + '</div>';
    } else {
      body.innerHTML = '<div class="pet-emoji-fallback">🐱</div>';
    }

    // 气泡
    var bubble = document.createElement('div');
    bubble.className = 'pet-bubble';
    bubble.id = 'petBubble';

    // Zzz
    var zzz = document.createElement('div');
    zzz.className = 'pet-zzz';
    zzz.id = 'petZzz';
    zzz.textContent = '💤';

    // 名字标签
    var nameTag = document.createElement('div');
    nameTag.className = 'pet-name-tag';
    nameTag.textContent = pet.name || '小宠物';

    petEl.appendChild(body);
    petEl.appendChild(bubble);
    petEl.appendChild(zzz);
    petEl.appendChild(nameTag);
    containerEl.appendChild(petEl);
    document.body.appendChild(containerEl);

    // 设置初始位置
    var x = pet.x || (window.innerWidth - 140);
    var y = pet.y || (window.innerHeight - 200);
    setPosition(x, y);

    // 绑定事件
    bindPetEvents();

    // 开始待机
    startIdle();
  }

  function destroyPetElement() {
    state = 'idle';
    clearTimeout(idleTimer);
    clearTimeout(walkTimer);
    clearTimeout(actionTimer);
    if (containerEl && containerEl.parentNode) {
      containerEl.parentNode.removeChild(containerEl);
    }
    petEl = null;
    containerEl = null;
  }

  function setPosition(x, y) {
    var maxX = window.innerWidth - 90;
    var maxY = window.innerHeight - 120;
    var minY = 70;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));
    if (containerEl) {
      containerEl.style.left = x + 'px';
      containerEl.style.top = y + 'px';
    }
    if (pet) {
      pet.x = x;
      pet.y = y;
    }
  }

  /* ========== 空状态提示 ========== */
  function createEmptyTip() {
    if (document.getElementById('petEmptyTip')) return;
    emptyTipEl = document.createElement('div');
    emptyTipEl.className = 'pet-empty-tip';
    emptyTipEl.id = 'petEmptyTip';
    emptyTipEl.title = '创建你的桌面宠物';
    emptyTipEl.innerHTML = '🐾 <span>领养一只桌面宠物</span>';
    emptyTipEl.addEventListener('click', function() {
      window.location.href = '/tools/fun/desktop-pet';
    });
    document.body.appendChild(emptyTipEl);
    // 默认隐藏，等需要时显示
    emptyTipEl.style.display = 'none';
  }

  function showEmptyTip() {
    if (!emptyTipEl) createEmptyTip();
    if (emptyTipEl) emptyTipEl.style.display = 'flex';
  }

  function hideEmptyTip() {
    if (emptyTipEl) emptyTipEl.style.display = 'none';
  }

  /* ========== 右键菜单 ========== */
  function createContextMenu() {
    if (document.getElementById('petContextMenu')) return;
    menuEl = document.createElement('div');
    menuEl.className = 'pet-context-menu';
    menuEl.id = 'petContextMenu';
    menuEl.innerHTML =
      '<div class="pet-menu-item" data-action="sayhi">👋 打招呼</div>' +
      '<div class="pet-menu-item" data-action="feed">🍪 喂食</div>' +
      '<div class="pet-menu-item" data-action="play">🎾 玩耍</div>' +
      '<div class="pet-menu-item" data-action="sleep">😴 睡觉</div>' +
      '<div class="pet-menu-divider"></div>' +
      '<div class="pet-menu-item danger" data-action="remove">👋 放生</div>';
    document.body.appendChild(menuEl);

    menuEl.addEventListener('click', function(e) {
      var item = e.target.closest('.pet-menu-item');
      if (!item) return;
      var action = item.getAttribute('data-action');
      handleAction(action);
      hideContextMenu();
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#petContextMenu') && !e.target.closest('.desktop-pet-container')) {
        hideContextMenu();
      }
    });
  }

  function showContextMenu(x, y) {
    if (!menuEl) return;
    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';
    menuEl.classList.add('active');

    // 确保不超出屏幕
    var rect = menuEl.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menuEl.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menuEl.style.top = (y - rect.height) + 'px';
    }
  }

  function hideContextMenu() {
    if (menuEl) menuEl.classList.remove('active');
  }

  /* ========== 动作处理 ========== */
  function handleAction(action) {
    if (!petEl) return;
    switch(action) {
      case 'sayhi':
        showBubble('你好呀~ 👋');
        triggerAnimation('happy');
        burstParticles(['💕', '✨', '💫']);
        setTimeout(resumeIdle, 2500);
        break;
      case 'feed':
        state = 'eating';
        petEl.className = 'desktop-pet pet-eating';
        showBubble('好吃好吃~ 🍪');
        setTimeout(function() {
          showBubble('谢谢投喂！😋');
          burstParticles(['🍪', '💖', '✨']);
        }, 800);
        setTimeout(resumeIdle, 3000);
        break;
      case 'play':
        state = 'happy';
        petEl.className = 'desktop-pet pet-happy';
        showBubble('好开心！🎾');
        burstParticles(['🎾', '💫', '🌟', '✨']);
        // 玩耍时跳一跳
        bounceAround();
        break;
      case 'sleep':
        state = 'sleeping';
        petEl.className = 'desktop-pet pet-sleeping';
        showBubble('zzZ... 💤');
        var zzzEl = document.getElementById('petZzz');
        if (zzzEl) zzzEl.classList.add('show');
        // 10 秒后自动醒来
        actionTimer = setTimeout(function() {
          if (zzzEl) zzzEl.classList.remove('show');
          showBubble('睡饱啦~ ☀️');
          resumeIdle();
        }, 10000);
        break;
      case 'remove':
        if (confirm('确定要放生 ' + (pet && pet.name ? pet.name : '这只宠物') + ' 吗？你可以随时去宠物画廊重新领养~')) {
          removePet();
        }
        break;
    }
  }

  function bounceAround() {
    var el = containerEl;
    if (!el) return;
    var x = pet.x;
    var y = pet.y;
    var bounces = 0;
    function bounce() {
      if (state !== 'happy' || !el) return;
      var dx = (Math.random() - 0.5) * 60;
      var dy = (Math.random() - 0.5) * 40 - 20;
      setPosition(x + dx, y + dy);
      bounces++;
      if (bounces < 5) {
        walkTimer = setTimeout(bounce, 300);
      } else {
        setPosition(x, y);
        resumeIdle();
      }
    }
    bounce();
  }

  function showBubble(text) {
    var bubble = document.getElementById('petBubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubble._timeout);
    bubble._timeout = setTimeout(function() {
      bubble.classList.remove('show');
    }, 2500);
  }

  function burstParticles(emojis) {
    if (!petEl) return;
    var burst = document.createElement('div');
    burst.className = 'pet-particle-burst';
    emojis.forEach(function(emoji, i) {
      var span = document.createElement('span');
      span.className = 'pet-particle';
      span.textContent = emoji;
      var angle = (i / emojis.length) * Math.PI * 2;
      var dist = 30 + Math.random() * 30;
      span.style.setProperty('--px', Math.cos(angle) * dist + 'px');
      span.style.setProperty('--py', Math.sin(angle) * dist + 'px');
      span.style.animationDelay = (i * 0.08) + 's';
      burst.appendChild(span);
    });
    petEl.appendChild(burst);
    setTimeout(function() {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 1000);
  }

  function triggerAnimation(animClass) {
    if (!petEl) return;
    petEl.className = 'desktop-pet pet-' + animClass;
  }

  function resumeIdle() {
    state = 'idle';
    if (petEl) {
      petEl.className = 'desktop-pet pet-idle';
    }
    var zzz = document.getElementById('petZzz');
    if (zzz) zzz.classList.remove('show');
    startIdle();
  }

  /* ========== 待机 & 行走 ========== */
  function startIdle() {
    if (state !== 'idle') return;
    // 随机行走间隔：5-20 秒
    var delay = 5000 + Math.random() * 15000;
    idleTimer = setTimeout(startWalking, delay);
  }

  function startWalking() {
    if (state !== 'idle' || !containerEl) return;

    state = 'walking';
    var targetX = Math.random() * (window.innerWidth - 100);
    var targetY = 70 + Math.random() * (window.innerHeight - 200);

    var startX = pet.x;
    var startY = pet.y;
    var startTime = Date.now();
    var duration = 2000 + Math.random() * 1000;

    function step() {
      if (state !== 'walking' || !containerEl) return;
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // easeInOutQuad
      var ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      var cx = startX + (targetX - startX) * ease;
      var cy = startY + (targetY - startY) * ease;
      setPosition(cx, cy);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        state = 'idle';
        savePosition();
        startIdle();
      }
    }
    requestAnimationFrame(step);
  }

  function savePosition() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
    } catch(e) {}
  }

  /* ========== 事件绑定 ========== */
  function bindPetEvents() {
    if (!petEl || !containerEl) return;

    // 左键点击 — 戳宠物
    petEl.addEventListener('click', function(e) {
      if (isDragging) return;
      e.stopPropagation();
      pokePet();
    });

    // 右键 — 动作菜单
    petEl.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      hideContextMenu();
      showContextMenu(e.clientX, e.clientY);
    });

    // 鼠标拖拽
    petEl.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });

    // 触摸拖拽
    petEl.addEventListener('touchstart', function(e) {
      if (e.target.closest('.pet-bubble')) return;
      var touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    // 全局移动/释放
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      e.preventDefault();
      var touch = e.touches[0];
      onDrag({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function pokePet() {
    if (!petEl || state === 'sleeping') return;
    state = 'poked';
    petEl.className = 'desktop-pet pet-poked';

    // 随机反应
    var reactions = ['哎呀！', '别戳啦~', '嘿嘿嘿', '😝', '干嘛呀~', '啊呜！'];
    var msg = reactions[Math.floor(Math.random() * reactions.length)];
    showBubble(msg);
    burstParticles(['💢', '💕', '✨']);

    setTimeout(resumeIdle, 1500);
  }

  function startDrag(cx, cy) {
    if (!containerEl || state === 'sleeping') return;
    isDragging = true;
    dragStart = {
      x: cx,
      y: cy,
      petX: parseInt(containerEl.style.left),
      petY: parseInt(containerEl.style.top)
    };
    state = 'dragged';
    if (petEl) petEl.className = 'desktop-pet pet-dragged';
    showBubble('诶诶诶~ ✨');
    clearTimeout(idleTimer);
    clearTimeout(walkTimer);
  }

  function onDrag(e) {
    if (!isDragging) return;
    var dx = e.clientX - dragStart.x;
    var dy = e.clientY - dragStart.y;
    setPosition(dragStart.petX + dx, dragStart.petY + dy);
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    // 甩动脱落动画
    if (petEl) {
      petEl.className = 'desktop-pet pet-poked';
    }

    savePosition();
    setTimeout(resumeIdle, 600);
  }

  /* ========== 窗口缩放时修正位置 ========== */
  window.addEventListener('resize', function() {
    if (pet && containerEl) {
      setPosition(pet.x, pet.y);
      savePosition();
    }
  });

  /* ========== 公开 API ========== */
  window.PetManager = {
    init: init,
    setPet: function(data) {
      renderPet(data);
    },
    getPet: function() { return pet; },
    hasPet: function() { return !!pet; },
    removePet: removePet,
    refresh: function() {
      loadPet();
      if (pet) renderPet();
      else if (containerEl) { destroyPetElement(); showEmptyTip(); }
      else showEmptyTip();
    }
  };

})();
