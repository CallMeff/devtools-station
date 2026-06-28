/**
 * DevTools Station - 用户认证模块 v2.0
 * 功能：登录/注册/微信扫码登录、Token管理、用户状态同步
 * 安全：Token 存储在 localStorage，通过 X-Auth-Token 头发送
 */
(function() {
    'use strict';

    var TOKEN_KEY = 'devtools-auth-token';
    var USER_KEY = 'devtools-user-info';
    var API_BASE = '';

    // ============ 状态管理 ============
    var currentUser = null;
    var currentToken = null;
    var wxPollTimer = null;
    var wxQrTicket = null;

    function loadStoredAuth() {
        currentToken = localStorage.getItem(TOKEN_KEY);
        var stored = localStorage.getItem(USER_KEY);
        if (stored) {
            try { currentUser = JSON.parse(stored); } catch (e) { currentUser = null; }
        }
    }

    function saveAuth(token, user) {
        currentToken = token;
        currentUser = user;
        // 补充 lastLoginAt（登录接口不直接返回）
        if (user && !user.lastLoginAt) {
            user.lastLoginAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        }
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearAuth() {
        currentToken = null;
        currentUser = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    // ============ API 调用 ============
    function api(method, path, body) {
        var headers = { 'Content-Type': 'application/json' };
        if (currentToken) {
            headers['X-Auth-Token'] = currentToken;
        }
        var opts = { method: method, headers: headers };
        if (body) opts.body = JSON.stringify(body);
        return fetch(API_BASE + path, opts).then(function(r) { return r.json(); });
    }

    function apiGet(path) { return api('GET', path); }
    function apiPost(path, body) { return api('POST', path, body); }
    function apiPut(path, body) { return api('PUT', path, body); }

    // ============ 弹窗通用 ============
    var _currentOverlay = null;

    function createOverlay(innerHTML) {
        closeOverlay();

        var overlay = document.createElement('div');
        overlay.id = 'authModalOverlay';
        overlay.className = 'auth-overlay';
        overlay.innerHTML = innerHTML;
        document.body.appendChild(overlay);

        // 不点击遮罩层关闭（用户只能通过关闭按钮关闭弹窗）

        // 阻止弹窗内所有 form 的原生提交（防止页面刷新）
        overlay.addEventListener('submit', function(e) {
            e.preventDefault();
        });

        // 阻止弹窗内部点击冒泡
        var modal = overlay.querySelector('.auth-modal-xhs');
        if (modal) {
            modal.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }

        _currentOverlay = overlay;
        // 锁定 body 滚动
        document.body.style.overflow = 'hidden';
        return overlay;
    }

    function closeOverlay() {
        if (_currentOverlay) {
            clearWxPoll();
            if (codeTimer) { clearInterval(codeTimer); codeTimer = null; }
            if (resetCodeTimer) { clearInterval(resetCodeTimer); resetCodeTimer = null; }
            _currentOverlay.remove();
            _currentOverlay = null;
            document.body.style.overflow = '';
        }
    }

    // 注册/重置密码倒计时 timer（需在外层作用域，closeOverlay 需要清除）
    var codeTimer = null;
    var resetCodeTimer = null;

    // 全局 Escape 关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && _currentOverlay) {
            closeOverlay();
        }
    });

    // ============ 登录/注册弹窗（小红书风格：左二维码 + 右表单） ============
    function showAuthModal(mode) {
        var isLogin = mode === 'login';

        var innerHTML =
            '<div class="auth-modal auth-modal-xhs">' +
                '<button class="auth-close" id="authCloseBtn">&times;</button>' +

                // ====== 左侧：二维码 / 微信登录区 ======
                '<div class="auth-left" id="authLeftPanel">' +
                    '<div class="auth-left-inner">' +
                        '<div class="auth-logo">' +
                            '<svg width="36" height="36" viewBox="0 0 36 36" fill="none">' +
                                '<rect width="36" height="36" rx="8" fill="url(#authLogoGrad)"/>' +
                                '<path d="M9 12h4l5 12-5-12h4l5 12-5-12h4l5 12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                                '<defs><linearGradient id="authLogoGrad" x1="0" y1="0" x2="36" y2="36"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>' +
                            '</svg>' +
                        '</div>' +
                        '<h2 class="auth-left-title">DevTools Station</h2>' +
                        '<p class="auth-left-desc">微信扫码 安全登录</p>' +
                        // 二维码区域
                        '<div class="auth-qr-wrapper" id="xhsQrWrapper">' +
                            '<div class="auth-qr-loading" id="xhsQrLoading">' +
                                '<div class="auth-spinner"></div>' +
                                '<p>正在加载二维码...</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="auth-left-status" id="xhsWxStatus"></div>' +
                        '<p class="auth-left-hint">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
                            ' 打开微信扫一扫' +
                        '</p>' +
                    '</div>' +
                '</div>' +

                // ====== 右侧：登录/注册表单区 ======
                '<div class="auth-right" id="authRightPanel">' +
                    '<div class="auth-right-inner">' +
                        // Tab 切换
                        '<div class="auth-tabs">' +
                            '<button class="auth-tab' + (isLogin ? ' active' : '') + '" id="authTabLogin">账号登录</button>' +
                            '<button class="auth-tab' + (!isLogin ? ' active' : '') + '" id="authTabReg">注册账号</button>' +
                        '</div>' +

                        // 登录表单（用 form 包裹以隔离浏览器自动填充）
                        '<form class="auth-body" id="authBodyLogin"' + (isLogin ? '' : ' style="display:none"') + ' autocomplete="on">' +
                            '<input type="hidden" name="username" autocomplete="username" style="display:none">' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                                '</div>' +
                                '<input type="text" id="loginUsername" name="loginUsername" placeholder="请输入用户名" autocomplete="username">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="loginPassword" name="loginPassword" placeholder="请输入密码" autocomplete="current-password">' +
                            '</div>' +
                            '<div class="auth-error" id="loginError"></div>' +
                            '<button type="button" class="auth-submit" id="loginSubmit">' +
                                '<span>登 录</span>' +
                            '</button>' +
                            '<div class="auth-links-row">' +
                                '<button type="button" class="auth-link-btn" id="forgotPwdBtn">忘记密码？</button>' +
                            '</div>' +
                            '<p class="auth-switch-hint">还没有账号？<button type="button" class="auth-link-btn" id="switchToReg">立即注册</button></p>' +
                        '</form>' +

                        // 注册表单（用 form 包裹以隔离浏览器自动填充）
                        '<form class="auth-body" id="authBodyReg"' + (isLogin ? ' style="display:none"' : '') + ' autocomplete="on">' +
                            '<input type="hidden" name="username" autocomplete="username" style="display:none">' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                                '</div>' +
                                '<input type="text" id="regUsername" name="regUsername" placeholder="用户名（2-20位）" autocomplete="username">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.6 6.5a2 2 0 0 1-2.8 0L2 7"/></svg>' +
                                '</div>' +
                                '<input type="email" id="regEmail" name="regEmail" placeholder="邮箱（必填）" autocomplete="email" required>' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="regPassword" name="regPassword" placeholder="密码（至少6位）" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="regPassword2" name="regPassword2" placeholder="确认密码" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-error" id="regError"></div>' +
                            '<button type="button" class="auth-submit" id="regSubmit">' +
                                '<span>注 册</span>' +
                            '</button>' +
                            '<p class="auth-switch-hint">已有账号？<button type="button" class="auth-link-btn" id="switchToLogin">立即登录</button></p>' +
                        '</form>' +

                        // 忘记密码表单（用 form 包裹以隔离浏览器自动填充）
                        '<form class="auth-body" id="authBodyReset" style="display:none" autocomplete="on">' +
                            '<input type="hidden" name="username" autocomplete="username" style="display:none">' +
                            '<div class="auth-reset-header">' +
                                '<h3>重置密码</h3>' +
                                '<p>请输入注册时使用的邮箱，我们将发送验证码</p>' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.6 6.5a2 2 0 0 1-2.8 0L2 7"/></svg>' +
                                '</div>' +
                                '<input type="email" id="resetEmail" name="resetEmail" placeholder="请输入注册邮箱" autocomplete="email">' +
                            '</div>' +
                            '<div class="auth-field auth-field-code">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="text" id="resetVerifyCode" name="resetVerifyCode" placeholder="验证码" maxlength="6" autocomplete="off">' +
                                '<button type="button" class="auth-send-code" id="resetSendCodeBtn">发送验证码</button>' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="resetNewPassword" name="resetNewPassword" placeholder="新密码（至少6位）" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="resetNewPassword2" name="resetNewPassword2" placeholder="确认新密码" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-error" id="resetError"></div>' +
                            '<button type="button" class="auth-submit" id="resetSubmit">' +
                                '<span>重置密码</span>' +
                            '</button>' +
                            '<p class="auth-switch-hint"><button type="button" class="auth-link-btn" id="switchToLoginFromReset">返回登录</button></p>' +
                        '</form>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var overlay = createOverlay(innerHTML);

        // 关闭按钮
        overlay.querySelector('#authCloseBtn').addEventListener('click', function() {
            closeOverlay();
        });

        // Tab 切换
        overlay.querySelector('#authTabLogin').addEventListener('click', function() {
            overlay.querySelector('#authTabLogin').classList.add('active');
            overlay.querySelector('#authTabReg').classList.remove('active');
            overlay.querySelector('#authBodyLogin').style.display = '';
            overlay.querySelector('#authBodyReg').style.display = 'none';
            overlay.querySelector('#authBodyReset').style.display = 'none';
        });
        overlay.querySelector('#authTabReg').addEventListener('click', function() {
            overlay.querySelector('#authTabReg').classList.add('active');
            overlay.querySelector('#authTabLogin').classList.remove('active');
            overlay.querySelector('#authBodyReg').style.display = '';
            overlay.querySelector('#authBodyLogin').style.display = 'none';
            overlay.querySelector('#authBodyReset').style.display = 'none';
        });

        // 底部链接切换
        overlay.querySelector('#switchToReg').addEventListener('click', function() {
            overlay.querySelector('#authTabReg').click();
        });
        overlay.querySelector('#switchToLogin').addEventListener('click', function() {
            overlay.querySelector('#authTabLogin').click();
        });

        // 忘记密码 - 切换到忘记密码表单（保持登录 Tab 高亮，属于登录流程）
        overlay.querySelector('#forgotPwdBtn').addEventListener('click', function() {
            overlay.querySelector('#authTabLogin').classList.add('active');
            overlay.querySelector('#authTabReg').classList.remove('active');
            overlay.querySelector('#authBodyLogin').style.display = 'none';
            overlay.querySelector('#authBodyReg').style.display = 'none';
            overlay.querySelector('#authBodyReset').style.display = '';
        });

        // 从忘记密码返回登录
        overlay.querySelector('#switchToLoginFromReset').addEventListener('click', function() {
            overlay.querySelector('#authTabLogin').click();
        });

        // 登录提交
        overlay.querySelector('#loginSubmit').addEventListener('click', function() {
            var username = overlay.querySelector('#loginUsername').value.trim();
            var password = overlay.querySelector('#loginPassword').value;
            var errEl = overlay.querySelector('#loginError');
            errEl.textContent = '';

            if (!username || !password) {
                errEl.textContent = '请输入用户名和密码';
                return;
            }

            var btn = overlay.querySelector('#loginSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = '登录中...';

            apiPost('/api/auth/login', { username: username, password: password })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '登 录';
                    if (res.code === 200) {
                        saveAuth(res.data.token, {
                            id: res.data.id,
                            username: res.data.username,
                            nickname: res.data.nickname,
                            email: res.data.email,
                            avatar: res.data.avatar,
                            theme: res.data.theme,
                            language: res.data.language
                        });
                        if (res.data.theme && window.DevTheme) {
                            window.DevTheme.set(res.data.theme);
                        }
                        closeOverlay();
                        updateUI();
                        showToast('登录成功，欢迎回来！');
                    } else {
                        errEl.textContent = res.message || '登录失败';
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '登 录';
                    errEl.textContent = '网络错误，请稍后重试';
                });
        });

        // 注册提交
        overlay.querySelector('#regSubmit').addEventListener('click', function() {
            var username = overlay.querySelector('#regUsername').value.trim();
            var email = overlay.querySelector('#regEmail').value.trim();
            var password = overlay.querySelector('#regPassword').value;
            var password2 = overlay.querySelector('#regPassword2').value;
            var errEl = overlay.querySelector('#regError');
            errEl.textContent = '';

            if (!username) { errEl.textContent = '请输入用户名'; return; }
            if (username.length < 2 || username.length > 20) { errEl.textContent = '用户名2-20个字符'; return; }
            if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) { errEl.textContent = '用户名只能包含字母、数字、下划线和中文'; return; }
            if (!email) { errEl.textContent = '请输入邮箱'; return; }
            if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) { errEl.textContent = '邮箱格式不正确'; return; }
            if (!password || password.length < 6) { errEl.textContent = '密码至少6位'; return; }
            if (password !== password2) { errEl.textContent = '两次密码不一致'; return; }

            var btn = overlay.querySelector('#regSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = '注册中...';

            apiPost('/api/auth/register', { username: username, password: password, email: email })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '注 册';
                    if (res.code === 200) {
                        saveAuth(res.data.token, {
                            id: res.data.id,
                            username: res.data.username,
                            nickname: res.data.nickname,
                            email: res.data.email,
                            avatar: res.data.avatar,
                            theme: res.data.theme,
                            language: res.data.language
                        });
                        if (res.data.theme && window.DevTheme) {
                            window.DevTheme.set(res.data.theme);
                        }
                        closeOverlay();
                        updateUI();
                        showToast('注册成功，欢迎加入！');
                    } else {
                        errEl.textContent = res.message || '注册失败';
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '注 册';
                    errEl.textContent = '网络错误，请稍后重试';
                });
        });


        // 发送验证码（重置密码用）
        overlay.querySelector('#resetSendCodeBtn').addEventListener('click', function() {
            var email = overlay.querySelector('#resetEmail').value.trim();
            var errEl = overlay.querySelector('#resetError');
            errEl.textContent = '';
            errEl.style.color = '';  // 重置颜色

            if (!email) { errEl.textContent = '请先输入邮箱'; return; }
            if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) { errEl.textContent = '邮箱格式不正确'; return; }

            var btn = overlay.querySelector('#resetSendCodeBtn');
            btn.disabled = true;

            apiPost('/api/auth/send-reset-code', { email: email })
                .then(function(res) {
                    if (res.code === 200) {
                        errEl.textContent = res.message || '验证码已发送';
                        errEl.style.color = '#4ade80';
                        var sec = 60;
                        btn.textContent = sec + 's 后重发';
                        resetCodeTimer = setInterval(function() {
                            sec--;
                            if (sec <= 0) {
                                clearInterval(resetCodeTimer);
                                btn.disabled = false;
                                btn.textContent = '发送验证码';
                            } else {
                                btn.textContent = sec + 's 后重发';
                            }
                        }, 1000);
                    } else {
                        errEl.style.color = '';  // 失败恢复红色
                        errEl.textContent = res.message || '发送失败';
                        btn.disabled = false;
                    }
                })
                .catch(function() {
                    errEl.style.color = '';
                    errEl.textContent = '网络错误，请稍后重试';
                    btn.disabled = false;
                });
        });

        // 重置密码提交
        overlay.querySelector('#resetSubmit').addEventListener('click', function() {
            var email = overlay.querySelector('#resetEmail').value.trim();
            var verifyCode = overlay.querySelector('#resetVerifyCode').value.trim();
            var newPassword = overlay.querySelector('#resetNewPassword').value;
            var newPassword2 = overlay.querySelector('#resetNewPassword2').value;
            var errEl = overlay.querySelector('#resetError');
            errEl.textContent = '';
            errEl.style.color = '';  // 重置颜色

            if (!email) { errEl.textContent = '请输入注册邮箱'; return; }
            if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) { errEl.textContent = '邮箱格式不正确'; return; }
            if (!verifyCode) { errEl.textContent = '请输入验证码'; return; }
            if (verifyCode.length !== 6) { errEl.textContent = '验证码为6位数字'; return; }
            if (!newPassword || newPassword.length < 6) { errEl.textContent = '新密码至少6位'; return; }
            if (newPassword !== newPassword2) { errEl.textContent = '两次密码不一致'; return; }

            var btn = overlay.querySelector('#resetSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = '重置中...';

            apiPost('/api/auth/reset-password', { email: email, verifyCode: verifyCode, newPassword: newPassword })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '重置密码';
                    if (res.code === 200) {
                        // 重置成功，切换到登录表单
                        closeOverlay();
                        showAuthModal('login');
                        showToast('密码重置成功，请使用新密码登录');
                    } else {
                        errEl.textContent = res.message || '重置失败';
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '重置密码';
                    errEl.textContent = '网络错误，请稍后重试';
                });
        });

        // Enter 提交（阻止 form 原生提交导致页面刷新）
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var loginVisible = overlay.querySelector('#authBodyLogin').style.display !== 'none';
                var regVisible = overlay.querySelector('#authBodyReg').style.display !== 'none';
                var resetVisible = overlay.querySelector('#authBodyReset').style.display !== 'none';
                if (resetVisible) {
                    overlay.querySelector('#resetSubmit').click();
                } else if (loginVisible) {
                    overlay.querySelector('#loginSubmit').click();
                } else if (regVisible) {
                    overlay.querySelector('#regSubmit').click();
                }
            }
        });

        // 自动加载微信二维码到左侧面板
        loadWxQrInPanel(overlay);

        // 聚焦
        setTimeout(function() {
            var firstInput = overlay.querySelector(isLogin ? '#loginUsername' : '#regUsername');
            if (firstInput) firstInput.focus();
        }, 150);
    }

    // ============ 在弹窗左侧面板加载微信二维码 ============
    function loadWxQrInPanel(overlay) {
        var qrWrapper = overlay.querySelector('#xhsQrWrapper');
        var statusEl = overlay.querySelector('#xhsWxStatus');

        // 清空状态
        statusEl.textContent = '';
        statusEl.className = 'auth-left-status';
        clearWxPoll();

        apiGet('/api/auth/wx/qrcode')
            .then(function(res) {
                if (res.code === 200 && res.data) {
                    wxQrTicket = res.data.ticket;
                    qrWrapper.innerHTML =
                        '<div class="auth-qr-box">' +
                            '<img class="auth-qr-img" src="' + res.data.qrUrl + '" alt="微信扫码登录">' +
                        '</div>';
                    // 开始轮询
                    startWxPoll(wxQrTicket, function(userInfo) {
                        clearWxPoll();
                        saveAuth(userInfo.token, {
                            id: userInfo.id,
                            username: userInfo.username,
                            nickname: userInfo.nickname,
                            email: userInfo.email,
                            avatar: userInfo.avatar,
                            theme: userInfo.theme,
                            language: userInfo.language
                        });
                        if (userInfo.theme && window.DevTheme) {
                            window.DevTheme.set(userInfo.theme);
                        }
                        closeOverlay();
                        updateUI();
                        showToast('微信登录成功，欢迎！');
                    }, function(status) {
                        statusEl.textContent = status;
                        statusEl.className = 'auth-left-status ' + (status.indexOf('失败') > -1 || status.indexOf('过期') > -1 ? 'error' : '');
                        // 二维码过期或失败时，显示刷新按钮
                        if (status.indexOf('过期') > -1 || status.indexOf('失败') > -1) {
                            qrWrapper.innerHTML =
                                '<div class="auth-qr-expired">' +
                                    '<div class="auth-qr-expired-icon">' +
                                        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
                                    '</div>' +
                                    '<p class="auth-qr-expired-text">' + status + '</p>' +
                                    '<button class="auth-qr-refresh-btn" id="xhsQrRefreshBtn">' +
                                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' +
                                        '<span>刷新二维码</span>' +
                                    '</button>' +
                                '</div>';
                            // 绑定刷新事件
                            document.getElementById('xhsQrRefreshBtn').addEventListener('click', function() {
                                loadWxQrInPanel(overlay);
                            });
                        }
                    });
                } else {
                    qrWrapper.innerHTML =
                        '<div class="auth-qr-error">' +
                            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>' +
                            '<p>' + (res.message || '获取二维码失败') + '</p>' +
                            '<button class="auth-qr-refresh-btn" onclick="DevAuth.refreshWxQr()">刷新重试</button>' +
                        '</div>';
                }
            })
            .catch(function() {
                qrWrapper.innerHTML =
                    '<div class="auth-qr-error">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>' +
                        '<p>网络错误</p>' +
                        '<button class="auth-qr-refresh-btn" onclick="DevAuth.refreshWxQr()">刷新重试</button>' +
                    '</div>';
            });
    }



    function startWxPoll(ticket, onSuccess, onStatus) {
        clearWxPoll();
        var maxAttempts = 60; // 最多轮询 2 分钟
        var attempts = 0;

        wxPollTimer = setInterval(function() {
            attempts++;
            if (attempts > maxAttempts) {
                clearWxPoll();
                onStatus('二维码已过期，请重新获取');
                return;
            }

            apiGet('/api/auth/wx/check?ticket=' + encodeURIComponent(ticket))
                .then(function(res) {
                    if (res.code === 200 && res.data) {
                        if (res.data.status === 'confirmed') {
                            onSuccess(res.data);
                        } else if (res.data.status === 'scanned') {
                            onStatus('已扫码，请在手机上确认登录');
                        } else if (res.data.status === 'expired') {
                            clearWxPoll();
                            onStatus('二维码已过期，请重新获取');
                        }
                        // status === 'pending' 继续轮询
                    }
                })
                .catch(function() {
                    // 网络错误不中断轮询
                });
        }, 2000);
    }

    function clearWxPoll() {
        if (wxPollTimer) {
            clearInterval(wxPollTimer);
            wxPollTimer = null;
        }
        wxQrTicket = null;
    }

    // ============ 语言切换器 ============
    var LANG_KEY = 'devtools-language';
    var languages = [
        { id: 'zh-CN', name: '中文', flag: '🇨🇳' },
        { id: 'en-US', name: 'English', flag: '🇺🇸' },
        { id: 'ja-JP', name: '日本語', flag: '🇯🇵' },
        { id: 'ko-KR', name: '한국어', flag: '🇰🇷' }
    ];

    function getLanguage() {
        var saved = localStorage.getItem(LANG_KEY);
        if (saved && languages.some(function(l) { return l.id === saved; })) return saved;
        return 'zh-CN';
    }

    function setLanguage(id) {
        localStorage.setItem(LANG_KEY, id);
        updateLangActive(id);
        // 同步到后端（已登录用户）
        if (currentToken && currentUser) {
            apiPut('/api/settings', { language: id });
            currentUser.language = id;
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
    }

    function updateLangActive(id) {
        var opts = document.querySelectorAll('.lang-option');
        opts.forEach(function(opt) {
            opt.classList.toggle('active', opt.getAttribute('data-lang') === id);
        });
        var btn = document.getElementById('langSwitcherBtn');
        if (btn) {
            var lang = languages.find(function(l) { return l.id === id; });
            if (lang) btn.innerHTML = lang.flag + ' ' + lang.name;
        }
    }

    function buildLangSwitcher(container) {
        var current = getLanguage();
        var currentLang = languages.find(function(l) { return l.id === current; }) || languages[0];

        container.className = 'lang-switcher';
        container.innerHTML =
            '<button class="lang-switcher-btn" id="langSwitcherBtn" title="切换语言">' +
                currentLang.flag + ' ' + currentLang.name +
            '</button>' +
            '<div class="lang-dropdown" id="langDropdown">' +
                languages.map(function(l) {
                    return '<div class="lang-option' + (l.id === current ? ' active' : '') + '" data-lang="' + l.id + '">' +
                        '<span class="lang-flag">' + l.flag + '</span>' +
                        '<span class="lang-name">' + l.name + '</span>' +
                        '<span class="lang-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>' +
                    '</div>';
                }).join('') +
            '</div>' +
            '<div class="lang-dropdown-backdrop" id="langBackdrop"></div>';

        var btn = document.getElementById('langSwitcherBtn');
        var drop = document.getElementById('langDropdown');
        var back = document.getElementById('langBackdrop');

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
            var opt = e.target.closest('.lang-option');
            if (!opt) return;
            var id = opt.getAttribute('data-lang');
            setLanguage(id);
            drop.classList.remove('active');
            back.classList.remove('active');
        });
    }

    function initLangSwitchers() {
        var containers = document.querySelectorAll('.lang-switcher');
        containers.forEach(buildLangSwitcher);
    }

    // ============ UI 更新 ============
    function updateUI() {
        var containers = document.querySelectorAll('.nav-user-area');
        containers.forEach(function(container) {
            if (currentUser) {
                var initial = (currentUser.nickname || currentUser.username).charAt(0).toUpperCase();
                var userEmail = currentUser.email || '';
                var loginTime = currentUser.lastLoginAt || '';
                container.innerHTML =
                    '<div class="user-menu" id="userMenu">' +
                        '<button class="user-btn" id="userMenuBtn">' +
                            '<span class="user-avatar">' + initial + '</span>' +
                            '<span class="user-name">' + (currentUser.nickname || currentUser.username) + '</span>' +
                            '<svg class="user-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                        '</button>' +
                        // 悬停浮窗
                        '<div class="user-hover-card" id="userHoverCard">' +
                            '<div class="user-hover-top">' +
                                '<span class="user-avatar user-avatar-lg">' + initial + '</span>' +
                                '<div>' +
                                    '<div class="user-hover-name">' + (currentUser.nickname || currentUser.username) + '</div>' +
                                    '<div class="user-hover-username">@' + currentUser.username + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="user-hover-info">' +
                                '<div class="user-hover-row">' +
                                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.6 6.5a2 2 0 0 1-2.8 0L2 7"/></svg>' +
                                    '<span>' + userEmail + '</span>' +
                                '</div>' +
                                '<div class="user-hover-row">' +
                                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                                    '<span>' + (loginTime ? '最近登录 ' + loginTime : '最近登录 --') + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="user-hover-actions">' +
                                '<a href="/profile" class="user-hover-btn">查看个人主页</a>' +
                            '</div>' +
                        '</div>' +
                        // 点击下拉菜单
                        '<div class="user-dropdown" id="userDropdown">' +
                            '<a href="/profile" class="user-dropdown-item">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                                '<span>个人主页</span>' +
                            '</a>' +
                            '<div class="user-dropdown-item" onclick="DevAuth.showChangePassword()">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '<span>修改密码</span>' +
                            '</div>' +
                            '<div class="user-dropdown-divider"></div>' +
                            '<div class="user-dropdown-item" onclick="DevAuth.logout()">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                                '<span>退出登录</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                // 绑定菜单事件
                setTimeout(function() {
                    var btn = document.getElementById('userMenuBtn');
                    var drop = document.getElementById('userDropdown');
                    if (btn && drop) {
                        btn.onclick = function(e) {
                            e.stopPropagation();
                            var isActive = drop.classList.contains('active');
                            document.querySelectorAll('.user-dropdown.active').forEach(function(d) {
                                d.classList.remove('active');
                            });
                            if (!isActive) {
                                drop.classList.add('active');
                            }
                        };
                    }
                }, 50);
            } else {
                container.innerHTML =
                    '<button class="btn-ghost" onclick="DevAuth.showLogin()" style="font-weight:600;">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>' +
                        '<span>登录</span>' +
                    '</button>';
            }
        });

        // 初始化语言切换器
        initLangSwitchers();
    }

    // 全局点击关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.querySelectorAll('.user-dropdown.active').forEach(function(d) {
                d.classList.remove('active');
            });
        }
        if (!e.target.closest('.lang-switcher')) {
            document.querySelectorAll('.lang-dropdown.active').forEach(function(d) {
                d.classList.remove('active');
            });
            document.querySelectorAll('.lang-dropdown-backdrop.active').forEach(function(b) {
                b.classList.remove('active');
            });
        }
    });

    // ============ 修改密码弹窗（已登录用户） ============
    function showChangePasswordModal() {
        // 先关闭下拉菜单
        document.querySelectorAll('.user-dropdown.active').forEach(function(d) {
            d.classList.remove('active');
        });

        var innerHTML =
            '<div class="auth-modal auth-modal-xhs auth-modal-cpwd">' +
                '<button class="auth-close" id="cpwdCloseBtn">&times;</button>' +
                // 左侧品牌区（简化版）
                '<div class="auth-left auth-left-cpwd">' +
                    '<div class="auth-left-inner">' +
                        '<div class="auth-logo">' +
                            '<svg width="36" height="36" viewBox="0 0 36 36" fill="none">' +
                                '<rect width="36" height="36" rx="8" fill="url(#authLogoGrad)"/>' +
                                '<path d="M9 12h4l5 12-5-12h4l5 12-5-12h4l5 12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                                '<defs><linearGradient id="authLogoGrad" x1="0" y1="0" x2="36" y2="36"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>' +
                            '</svg>' +
                        '</div>' +
                        '<h2 class="auth-left-title">修改密码</h2>' +
                        '<p class="auth-left-desc">为您的账号安全保驾护航</p>' +
                        '<div class="cpwd-left-icon">' +
                            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>' +
                        '</div>' +
                        '<p class="auth-left-hint" style="color:#9ca3af;">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
                            ' 修改后需重新登录' +
                        '</p>' +
                    '</div>' +
                '</div>' +
                // 右侧表单区
                '<div class="auth-right">' +
                    '<div class="auth-right-inner">' +
                        '<div class="cpwd-header">' +
                            '<h3>更改账户密码</h3>' +
                            '<p>请输入当前密码并设置新密码</p>' +
                        '</div>' +
                        '<div class="auth-body">' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="cpwdOldPassword" placeholder="请输入当前密码" autocomplete="current-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="cpwdNewPassword" placeholder="新密码（至少6位）" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="cpwdNewPassword2" placeholder="确认新密码" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-error" id="cpwdError"></div>' +
                            '<button class="auth-submit" id="cpwdSubmit">' +
                                '<span>确认修改</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var overlay = createOverlay(innerHTML);

        // 关闭按钮
        overlay.querySelector('#cpwdCloseBtn').addEventListener('click', function() {
            closeOverlay();
        });

        // 提交修改密码
        overlay.querySelector('#cpwdSubmit').addEventListener('click', function() {
            var oldPassword = overlay.querySelector('#cpwdOldPassword').value;
            var newPassword = overlay.querySelector('#cpwdNewPassword').value;
            var newPassword2 = overlay.querySelector('#cpwdNewPassword2').value;
            var errEl = overlay.querySelector('#cpwdError');
            errEl.textContent = '';

            if (!oldPassword) { errEl.textContent = '请输入当前密码'; return; }
            if (!newPassword || newPassword.length < 6) { errEl.textContent = '新密码至少6位'; return; }
            if (newPassword !== newPassword2) { errEl.textContent = '两次密码不一致'; return; }
            if (oldPassword === newPassword) { errEl.textContent = '新密码不能与旧密码相同'; return; }

            var btn = overlay.querySelector('#cpwdSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = '修改中...';

            apiPost('/api/auth/change-password', { oldPassword: oldPassword, newPassword: newPassword })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '确认修改';
                    if (res.code === 200) {
                        // 密码修改成功，清除登录态并关闭弹窗
                        clearAuth();
                        closeOverlay();
                        updateUI();
                        showToast('密码修改成功，请重新登录');
                    } else {
                        errEl.textContent = res.message || '修改失败';
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = '确认修改';
                    errEl.textContent = '网络错误，请稍后重试';
                });
        });

        // Enter 提交
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                overlay.querySelector('#cpwdSubmit').click();
            }
        });

        // 聚焦第一个输入框
        setTimeout(function() {
            var firstInput = overlay.querySelector('#cpwdOldPassword');
            if (firstInput) firstInput.focus();
        }, 150);
    }

    // ============ Toast 提示 ============
    function showToast(msg) {
        var existing = document.querySelector('.auth-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'auth-toast';
        toast.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
            '<span>' + msg + '</span>';
        document.body.appendChild(toast);
        requestAnimationFrame(function() {
            toast.classList.add('show');
        });
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 350);
        }, 2800);
    }

    // ============ 初始化 ============
    function init() {
        loadStoredAuth();

        // 在导航栏添加用户区域
        var navActions = document.querySelector('.nav-actions');
        if (navActions && !navActions.querySelector('.nav-user-area')) {
            var userArea = document.createElement('div');
            userArea.className = 'nav-user-area';
            navActions.insertBefore(userArea, navActions.firstChild);
        }
        updateUI();

        // 验证 Token 有效性
        if (currentToken) {
            apiGet('/api/auth/check').then(function(res) {
                if (res.code === 200 && res.data && res.data.valid) {
                    // Token 有效，拉取最新用户信息
                    return apiGet('/api/auth/me');
                } else {
                    // Token 失效，清除
                    clearAuth();
                    updateUI();
                    return null;
                }
            }).then(function(res) {
                if (res && res.code === 200 && res.data) {
                    currentUser = res.data;
                    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
                    updateUI();
                    // 同步主题
                    if (res.data.theme && window.DevTheme) {
                        window.DevTheme.set(res.data.theme);
                    }
                }
            }).catch(function() {
                // 网络异常，保留现有状态
            });
        }
    }

    // ============ 公开 API ============
    window.DevAuth = {
        showLogin: function() { showAuthModal('login'); },
        showRegister: function() { showAuthModal('register'); },
        showWxLogin: function() { showAuthModal('login'); },
        showChangePassword: function() { showChangePasswordModal(); },

        // 刷新微信二维码（过期后点击刷新按钮）
        refreshWxQr: function() {
            if (_currentOverlay) {
                loadWxQrInPanel(_currentOverlay);
            }
        },

        isLoggedIn: function() { return !!currentToken && !!currentUser; },
        getUser: function() { return currentUser; },
        getToken: function() { return currentToken; },

        // 刷新导航栏 UI（供外部调用）
        refreshUI: function() { updateUI(); },

        // 语言切换
        getLanguage: function() { return getLanguage(); },
        setLanguage: function(id) { setLanguage(id); },
        languages: languages,

        logout: function() {
            if (currentToken) {
                apiPost('/api/auth/logout', {});
            }
            clearAuth();
            updateUI();
            showToast('已退出登录');
        },

        saveSettings: function(data) {
            if (!currentToken) return Promise.resolve();
            return apiPut('/api/settings', data);
        },

        addRecentTool: function(route, name) {
            if (!currentToken) return;
            apiPost('/api/settings/recent-tool', { route: route, name: name });
        },

        saveInputHistory: function(route, input) {
            if (!currentToken) return;
            apiPost('/api/settings/input-history', { route: route, input: input });
        },

        getSettings: function() {
            if (!currentToken) return Promise.resolve({});
            return apiGet('/api/settings').then(function(res) {
                return res.code === 200 ? res.data : {};
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
