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

    // 从页面 meta 标签读取服务端配置
    function getPasswordMinLength() {
        var meta = document.querySelector('meta[name="app-password-min-length"]');
        return meta ? parseInt(meta.getAttribute('content')) || 8 : 8;
    }
    function getUserMinLength() { return 2; }
    function getUserMaxLength() { return 20; }

    // 翻译辅助函数
    function __(key, params) {
        if (window.__I18N__ && typeof window.__I18N__.t === 'function') {
            return window.__I18N__.t(key, params);
        }
        return key;
    }

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
                        '<h2 class="auth-left-title" data-i18n="auth.wx_title">DevTools Station</h2>' +
                        '<p class="auth-left-desc" data-i18n="auth.wx_desc">微信扫码 安全登录</p>' +
                        // 二维码区域
                        '<div class="auth-qr-wrapper" id="xhsQrWrapper">' +
                            '<div class="auth-qr-loading" id="xhsQrLoading">' +
                                '<div class="auth-spinner"></div>' +
                                '<p data-i18n="auth.wx_loading">正在加载二维码...</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="auth-left-status" id="xhsWxStatus"></div>' +
                        '<p class="auth-left-hint">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
                            '<span data-i18n="auth.wx_tip">打开微信扫一扫</span>' +
                        '</p>' +
                    '</div>' +
                '</div>' +

                // ====== 右侧：登录/注册表单区 ======
                '<div class="auth-right" id="authRightPanel">' +
                    '<div class="auth-right-inner">' +
                        // Tab 切换
                        '<div class="auth-tabs">' +
                            '<button class="auth-tab' + (isLogin ? ' active' : '') + '" id="authTabLogin" data-i18n="auth.tab_login">账号登录</button>' +
                            '<button class="auth-tab' + (!isLogin ? ' active' : '') + '" id="authTabReg" data-i18n="auth.tab_register">注册账号</button>' +
                        '</div>' +

                        // 登录表单（用 form 包裹以隔离浏览器自动填充）
                        '<form class="auth-body" id="authBodyLogin"' + (isLogin ? '' : ' style="display:none"') + ' autocomplete="on">' +
                            '<input type="hidden" name="username" autocomplete="username" style="display:none">' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                                '</div>' +
                                '<input type="text" id="loginUsername" name="loginUsername" data-i18n-placeholder="auth.username_placeholder" placeholder="请输入用户名" autocomplete="username">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="loginPassword" name="loginPassword" data-i18n-placeholder="auth.password_placeholder" placeholder="请输入密码" autocomplete="current-password">' +
                            '</div>' +
                            '<div class="auth-error" id="loginError"></div>' +
                            '<button type="button" class="auth-submit" id="loginSubmit">' +
                                '<span data-i18n="auth.btn_login">登 录</span>' +
                            '</button>' +
                            '<div class="auth-links-row">' +
                                '<button type="button" class="auth-link-btn" id="forgotPwdBtn" data-i18n="auth.forgot_pwd">忘记密码？</button>' +
                            '</div>' +
                            '<p class="auth-switch-hint"><span data-i18n="auth.no_account">还没有账号？</span><button type="button" class="auth-link-btn" id="switchToReg" data-i18n="auth.go_register">立即注册</button></p>' +
                        '</form>' +

                        // 注册表单（用 form 包裹以隔离浏览器自动填充）
                        '<form class="auth-body" id="authBodyReg"' + (isLogin ? ' style="display:none"' : '') + ' autocomplete="on">' +
                            '<input type="hidden" name="username" autocomplete="username" style="display:none">' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                                '</div>' +
                                '<input type="text" id="regUsername" name="regUsername" data-i18n-placeholder="auth.username_reg_placeholder" placeholder="用户名（' + getUserMinLength() + '-' + getUserMaxLength() + '位）" autocomplete="username">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.6 6.5a2 2 0 0 1-2.8 0L2 7"/></svg>' +
                                '</div>' +
                                '<input type="email" id="regEmail" name="regEmail" data-i18n-placeholder="auth.email_reg_placeholder" placeholder="邮箱（必填）" autocomplete="email" required>' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="regPassword" name="regPassword" data-i18n-placeholder="auth.password_reg_placeholder" placeholder="密码（至少' + getPasswordMinLength() + '位）" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="regPassword2" name="regPassword2" data-i18n-placeholder="auth.confirm_pwd_reg_placeholder" placeholder="确认密码" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-error" id="regError"></div>' +
                            '<button type="button" class="auth-submit" id="regSubmit">' +
                                '<span data-i18n="auth.btn_register">注 册</span>' +
                            '</button>' +
                            '<p class="auth-switch-hint"><span data-i18n="auth.has_account">已有账号？</span><button type="button" class="auth-link-btn" id="switchToLogin" data-i18n="auth.go_login">立即登录</button></p>' +
                        '</form>' +

                        // 忘记密码表单（用 form 包裹以隔离浏览器自动填充）
                        '<form class="auth-body" id="authBodyReset" style="display:none" autocomplete="on">' +
                            '<input type="hidden" name="username" autocomplete="username" style="display:none">' +
                            '<div class="auth-reset-header">' +
                                '<h3 data-i18n="auth.reset_title">重置密码</h3>' +
                                '<p data-i18n="auth.reset_desc">请输入注册时使用的邮箱，我们将发送验证码</p>' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.6 6.5a2 2 0 0 1-2.8 0L2 7"/></svg>' +
                                '</div>' +
                                '<input type="email" id="resetEmail" name="resetEmail" data-i18n-placeholder="auth.reset_email_placeholder" placeholder="请输入注册邮箱" autocomplete="email">' +
                            '</div>' +
                            '<div class="auth-field auth-field-code">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="text" id="resetVerifyCode" name="resetVerifyCode" data-i18n-placeholder="auth.reset_code_placeholder" placeholder="验证码" maxlength="6" autocomplete="off">' +
                                '<button type="button" class="auth-send-code" id="resetSendCodeBtn" data-i18n="profile.send_code">发送验证码</button>' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="resetNewPassword" name="resetNewPassword" data-i18n-placeholder="auth.reset_new_pwd_placeholder" placeholder="新密码（至少' + getPasswordMinLength() + '位）" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="resetNewPassword2" name="resetNewPassword2" data-i18n-placeholder="auth.reset_confirm_pwd_placeholder" placeholder="确认新密码" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-error" id="resetError"></div>' +
                            '<button type="button" class="auth-submit" id="resetSubmit">' +
                                '<span data-i18n="auth.btn_reset">重置密码</span>' +
                            '</button>' +
                            '<p class="auth-switch-hint"><button type="button" class="auth-link-btn" id="switchToLoginFromReset" data-i18n="auth.back_login">返回登录</button></p>' +
                        '</form>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var overlay = createOverlay(innerHTML);

        // 立即应用翻译到弹窗内容
        if (window.__I18N__ && typeof window.__I18N__.refreshPage === 'function') {
            window.__I18N__.refreshPage();
        }

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
                errEl.textContent = __('validate.username_password_required');
                return;
            }

            var btn = overlay.querySelector('#loginSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = __('toast.logging_in');

            apiPost('/api/auth/login', { username: username, password: password })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('auth.btn_login');
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
                        if (window.DevFavorites) window.DevFavorites.refresh();
                        showToast(__('toast.login_success'));
                    } else {
                        errEl.textContent = res.message || __('validate.login_failed');
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('auth.btn_login');
                    errEl.textContent = __('toast.network_error');
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

            if (!username) { errEl.textContent = __('validate.username_required'); return; }
            if (username.length < 2 || username.length > 20) { errEl.textContent = __('validate.username_format'); return; }
            if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) { errEl.textContent = __('validate.username_chars'); return; }
            if (!email) { errEl.textContent = __('validate.email_required'); return; }
            if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) { errEl.textContent = __('validate.email_format'); return; }
            if (!password || password.length < getPasswordMinLength()) { errEl.textContent = __('validate.password_min', [getPasswordMinLength()]); return; }
            if (password !== password2) { errEl.textContent = __('validate.password_mismatch'); return; }

            var btn = overlay.querySelector('#regSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = __('toast.registering');

            apiPost('/api/auth/register', { username: username, password: password, email: email })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('auth.btn_register');
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
                        if (window.DevFavorites) window.DevFavorites.refresh();
                        showToast(__('toast.register_success'));
                    } else {
                        errEl.textContent = res.message || __('validate.register_failed');
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('auth.btn_register');
                    errEl.textContent = __('toast.network_error');
                });
        });


        // 发送验证码（重置密码用）
        overlay.querySelector('#resetSendCodeBtn').addEventListener('click', function() {
            var email = overlay.querySelector('#resetEmail').value.trim();
            var errEl = overlay.querySelector('#resetError');
            errEl.textContent = '';
            errEl.style.color = '';  // 重置颜色

            if (!email) { errEl.textContent = __('validate.email_first'); return; }
            if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) { errEl.textContent = __('validate.email_format'); return; }

            var btn = overlay.querySelector('#resetSendCodeBtn');
            btn.disabled = true;

            apiPost('/api/auth/send-reset-code', { email: email })
                .then(function(res) {
                    if (res.code === 200) {
                        errEl.textContent = res.message || __('toast.code_sent');
                        errEl.style.color = '#4ade80';
                        var sec = 60;
                        btn.textContent = __('toast.retry_after', [sec]);
                        resetCodeTimer = setInterval(function() {
                            sec--;
                            if (sec <= 0) {
                                clearInterval(resetCodeTimer);
                                btn.disabled = false;
                                btn.textContent = __('profile.send_code');
                            } else {
                                btn.textContent = __('toast.retry_after', [sec]);
                            }
                        }, 1000);
                    } else {
                        errEl.style.color = '';  // 失败恢复红色
                        errEl.textContent = res.message || __('toast.code_send_failed');
                        btn.disabled = false;
                    }
                })
                .catch(function() {
                    errEl.style.color = '';
                    errEl.textContent = __('toast.network_error');
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

            if (!email) { errEl.textContent = __('validate.email_required'); return; }
            if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) { errEl.textContent = __('validate.email_format'); return; }
            if (!verifyCode) { errEl.textContent = __('validate.code_required'); return; }
            if (verifyCode.length !== 6) { errEl.textContent = __('validate.code_format'); return; }
            if (!newPassword || newPassword.length < getPasswordMinLength()) { errEl.textContent = __('validate.password_min', [getPasswordMinLength()]); return; }
            if (newPassword !== newPassword2) { errEl.textContent = __('validate.password_mismatch'); return; }

            var btn = overlay.querySelector('#resetSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = __('toast.resetting');

            apiPost('/api/auth/reset-password', { email: email, verifyCode: verifyCode, newPassword: newPassword })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('auth.btn_reset');
                    if (res.code === 200) {
                        // 重置成功，切换到登录表单
                        closeOverlay();
                        showAuthModal('login');
                        showToast(__('toast.pwd_reset'));
                    } else {
                        errEl.textContent = res.message || __('validate.reset_failed');
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('auth.btn_reset');
                    errEl.textContent = __('toast.network_error');
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
                        if (window.DevFavorites) window.DevFavorites.refresh();
                        showToast(__('toast.wx_login_success'));
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
                                        '<span data-i18n="toast.refresh_qr">' + __('toast.refresh_qr') + '</span>' +
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
                            '<p>' + (res.message || __('toast.qr_failed')) + '</p>' +
                            '<button class="auth-qr-refresh-btn" onclick="DevAuth.refreshWxQr()" data-i18n="toast.refresh_retry">' + __('toast.refresh_retry') + '</button>' +
                        '</div>';
                }
            })
            .catch(function() {
                qrWrapper.innerHTML =
                    '<div class="auth-qr-error">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>' +
                        '<p data-i18n="toast.network_error">' + __('toast.network_error') + '</p>' +
                        '<button class="auth-qr-refresh-btn" onclick="DevAuth.refreshWxQr()" data-i18n="toast.refresh_retry">' + __('toast.refresh_retry') + '</button>' +
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
                onStatus(__('toast.qr_expired'));
                return;
            }

            apiGet('/api/auth/wx/check?ticket=' + encodeURIComponent(ticket))
                .then(function(res) {
                    if (res.code === 200 && res.data) {
                        if (res.data.status === 'confirmed') {
                            onSuccess(res.data);
                        } else if (res.data.status === 'scanned') {
                            onStatus(__('toast.qr_scanned'));
                        } else if (res.data.status === 'expired') {
                            clearWxPoll();
                            onStatus(__('toast.qr_expired'));
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
        // 刷新页面翻译
        if (window.__I18N__ && typeof window.__I18N__.refreshPage === 'function') {
            window.__I18N__.refreshPage();
        }
        // 同步到后端（已登录用户）
        if (currentToken && currentUser) {
            apiPut('/api/settings', { language: id });
            currentUser.language = id;
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
    }

    // 监听 i18n 刷新事件，重新渲染动态内容
    document.addEventListener('i18n:refresh', function() {
        updateUI();
    });

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
                                    '<span>' + (loginTime ? (window.__I18N__ ? window.__I18N__.t('nav.last_login') : '最近登录') + ' ' + loginTime : (window.__I18N__ ? window.__I18N__.t('nav.last_login') : '最近登录') + ' --') + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div class="user-hover-actions">' +
                                '<a href="/profile" class="user-hover-btn" data-i18n="nav.user_card">' + (window.__I18N__ ? window.__I18N__.t('nav.user_card') : '查看个人主页') + '</a>' +
                            '</div>' +
                        '</div>' +
                        // 点击下拉菜单
                        '<div class="user-dropdown" id="userDropdown">' +
                            '<a href="/profile" class="user-dropdown-item">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                                '<span data-i18n="nav.profile">' + (window.__I18N__ ? window.__I18N__.t('nav.profile') : '个人主页') + '</span>' +
                            '</a>' +
                            '<div class="user-dropdown-item" onclick="DevAuth.showChangePassword()">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '<span data-i18n="nav.change_pwd">' + (window.__I18N__ ? window.__I18N__.t('nav.change_pwd') : '修改密码') + '</span>' +
                            '</div>' +
                            '<div class="user-dropdown-divider"></div>' +
                            '<div class="user-dropdown-item" onclick="DevAuth.logout()">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                                '<span data-i18n="nav.logout">' + (window.__I18N__ ? window.__I18N__.t('nav.logout') : '退出登录') + '</span>' +
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
                        '<span data-i18n="nav.login">' + (window.__I18N__ ? window.__I18N__.t('nav.login') : '登录') + '</span>' +
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
                        '<h2 class="auth-left-title" data-i18n="auth.change_pwd_title_left">' + __('auth.change_pwd_title_left') + '</h2>' +
                        '<p class="auth-left-desc" data-i18n="auth.change_pwd_desc_left">' + __('auth.change_pwd_desc_left') + '</p>' +
                        '<div class="cpwd-left-icon">' +
                            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>' +
                        '</div>' +
                        '<p class="auth-left-hint" style="color:#9ca3af;">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
                            '<span data-i18n="auth.change_pwd_tip">' + __('auth.change_pwd_tip') + '</span>' +
                        '</p>' +
                    '</div>' +
                '</div>' +
                // 右侧表单区
                '<div class="auth-right">' +
                    '<div class="auth-right-inner">' +
                        '<div class="cpwd-header">' +
                            '<h3 data-i18n="auth.change_pwd_title_right">' + __('auth.change_pwd_title_right') + '</h3>' +
                            '<p data-i18n="auth.change_pwd_desc_right">' + __('auth.change_pwd_desc_right') + '</p>' +
                        '</div>' +
                        '<div class="auth-body">' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="cpwdOldPassword" data-i18n-placeholder="profile.old_pwd_placeholder" placeholder="' + __('profile.old_pwd_placeholder') + '" autocomplete="current-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="cpwdNewPassword" data-i18n-placeholder="profile.new_pwd_placeholder" placeholder="' + __('profile.new_pwd_placeholder') + '" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-field">' +
                                '<div class="auth-field-icon">' +
                                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
                                '</div>' +
                                '<input type="password" id="cpwdNewPassword2" data-i18n-placeholder="profile.confirm_pwd_placeholder" placeholder="' + __('profile.confirm_pwd_placeholder') + '" autocomplete="new-password">' +
                            '</div>' +
                            '<div class="auth-error" id="cpwdError"></div>' +
                            '<button class="auth-submit" id="cpwdSubmit">' +
                                '<span data-i18n="profile.confirm_change">' + __('profile.confirm_change') + '</span>' +
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

            if (!oldPassword) { errEl.textContent = __('validate.old_pwd_required'); return; }
            if (!newPassword || newPassword.length < getPasswordMinLength()) { errEl.textContent = __('validate.password_min', [getPasswordMinLength()]); return; }
            if (newPassword !== newPassword2) { errEl.textContent = __('validate.password_mismatch'); return; }
            if (oldPassword === newPassword) { errEl.textContent = __('validate.new_pwd_diff'); return; }

            var btn = overlay.querySelector('#cpwdSubmit');
            btn.classList.add('loading');
            btn.querySelector('span').textContent = __('toast.changing');

            apiPost('/api/auth/change-password', { oldPassword: oldPassword, newPassword: newPassword })
                .then(function(res) {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('profile.confirm_change');
                    if (res.code === 200) {
                        // 密码修改成功，清除登录态并关闭弹窗
                        clearAuth();
                        closeOverlay();
                        updateUI();
                        showToast(__('toast.pwd_changed'));
                    } else {
                        errEl.textContent = res.message || __('validate.change_failed');
                    }
                })
                .catch(function() {
                    btn.classList.remove('loading');
                    btn.querySelector('span').textContent = __('profile.confirm_change');
                    errEl.textContent = __('toast.network_error');
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
                    if (window.DevFavorites) window.DevFavorites.refresh();
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
            if (window.DevFavorites) window.DevFavorites.refresh();
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
