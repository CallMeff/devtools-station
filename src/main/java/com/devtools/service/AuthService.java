package com.devtools.service;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.crypto.digest.DigestUtil;
import cn.hutool.crypto.symmetric.AES;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.*;
import com.devtools.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户认证服务
 * 安全策略：
 * 1. 密码：BCrypt 哈希存储（带随机盐）
 * 2. Token：AES加密 + SHA-256哈希双重保护
 * 3. 传输：前端 AES 加密敏感字段 + HTTPS
 * 4. Token密钥：从外部配置读取（可通过环境变量 APP_TOKEN_SECRET 覆盖）
 */
@Slf4j
@Service
public class AuthService {

    private final UserMapper userMapper;
    private final UserSessionMapper sessionMapper;
    private final UserSettingsMapper settingsMapper;
    private final UserActivityMapper activityMapper;
    private final EmailService emailService;

    // Token AES 密钥（从配置文件读取，支持环境变量覆盖）
    @Value("${app.security.token-secret:DevTools!Station@2026#SecureKey}")
    private String tokenSecret;

    // 密码最小长度
    @Value("${app.security.password-min-length:8}")
    private int passwordMinLength;

    // Token 有效期：7天
    private static final int TOKEN_EXPIRE_DAYS = 7;

    public AuthService(UserMapper userMapper, UserSessionMapper sessionMapper,
                       UserSettingsMapper settingsMapper, UserActivityMapper activityMapper,
                       EmailService emailService) {
        this.userMapper = userMapper;
        this.sessionMapper = sessionMapper;
        this.settingsMapper = settingsMapper;
        this.activityMapper = activityMapper;
        this.emailService = emailService;
    }

    private AES getTokenAes() {
        byte[] fullKey = DigestUtil.sha256(tokenSecret);
        // AES-128: key 和 IV 各取前 16 字节
        byte[] aesKey = new byte[16];
        byte[] iv = new byte[16];
        System.arraycopy(fullKey, 0, aesKey, 0, 16);
        System.arraycopy(fullKey, 16, iv, 0, 16);
        return new AES("CBC", "PKCS5Padding", aesKey, iv);
    }

    /**
     * 发送注册验证码到邮箱
     */
    public String sendRegisterCode(String email) {
        email = email == null ? null : email.trim();

        // 校验邮箱格式
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("邮箱格式不正确");
        }

        // 检查邮箱是否已被注册
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (count > 0) {
            throw new RuntimeException("该邮箱已被注册");
        }

        return emailService.sendRegisterCode(email);
    }

    /**
     * 发送重置密码验证码到邮箱
     */
    public String sendResetCode(String email) {
        email = email == null ? null : email.trim();

        // 校验邮箱格式
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("邮箱格式不正确");
        }

        // 检查邮箱是否已注册（未注册的邮箱无法重置密码）
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (count == 0) {
            throw new RuntimeException("该邮箱未注册，请先注册账号");
        }

        return emailService.sendResetCode(email);
    }

    /**
     * 重置密码
     */
    public void resetPassword(String email, String verifyCode, String newPassword) {
        // 校验邮箱
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("邮箱不能为空");
        }
        email = email.trim();

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("邮箱格式不正确");
        }

        // 校验验证码
        if (verifyCode == null || verifyCode.trim().isEmpty()) {
            throw new RuntimeException("验证码不能为空");
        }

        // 校验新密码
        if (newPassword == null || newPassword.length() < passwordMinLength) {
            throw new RuntimeException("新密码至少" + passwordMinLength + "位");
        }

        // 验证验证码
        if (!emailService.verifyResetCode(email, verifyCode.trim())) {
            throw new RuntimeException("验证码错误或已过期");
        }

        // 查找用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (user == null) {
            throw new RuntimeException("该邮箱未注册");
        }

        // 更新密码
        String salt = BCrypt.gensalt(12);
        String passwordHash = BCrypt.hashpw(newPassword, salt);
        user.setPasswordHash(passwordHash);
        user.setSalt(salt);
        userMapper.updateById(user);

        // 清除该用户的所有会话（强制重新登录）
        sessionMapper.delete(new LambdaQueryWrapper<UserSession>()
                .eq(UserSession::getUserId, user.getId()));

        // 记录日志
        logActivity(user.getId(), "reset-password", "", "{}", "");
    }

    /**
     * 注册
     */
    public Map<String, Object> register(String username, String password, String email, String verifyCode) {
        if (password == null || password.length() < passwordMinLength) {
            throw new RuntimeException("密码至少" + passwordMinLength + "位");
        }

        // 校验邮箱不能为空
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("邮箱不能为空");
        }
        email = email.trim();
        verifyCode = verifyCode == null ? "" : verifyCode.trim();

        // 校验邮箱格式
        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("邮箱格式不正确");
        }

        // 校验用户名唯一
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
        if (count > 0) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查邮箱是否已被注册
        Long emailCount = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (emailCount > 0) {
            throw new RuntimeException("该邮箱已被注册");
        }

        if (!verifyCode.matches("^\\d{6}$")) {
            throw new RuntimeException("验证码为6位数字");
        }
        if (!emailService.verifyRegisterCode(email, verifyCode)) {
            throw new RuntimeException("验证码错误或已过期");
        }

        // 密码加密
        String salt = BCrypt.gensalt(12);
        String passwordHash = BCrypt.hashpw(password, salt);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setSalt(salt);
        user.setNickname(username);
        user.setStatus(1);
        userMapper.insert(user);

        // 创建默认设置
        UserSettings settings = new UserSettings();
        settings.setUserId(user.getId());
        settings.setTheme("dark");
        settings.setLanguage("zh-CN");
        settingsMapper.insert(settings);

        // 注册成功后自动创建会话（自动登录）
        UserSession session = createSession(user.getId(), "", "register-auto-login");

        // 记录日志
        logActivity(user.getId(), "register", "", "{\"autoLogin\":true}", "");

        return buildUserInfo(user, session);
    }

    /**
     * 登录
     */
    public Map<String, Object> login(String username, String password, String ip, String ua) {
        String account = username == null ? "" : username.trim();
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .and(wrapper -> wrapper
                        .eq(User::getUsername, account)
                        .or()
                        .eq(User::getEmail, account))
                .last("LIMIT 1"));
        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }

        // 验证密码
        if (!BCrypt.checkpw(password, user.getPasswordHash())) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 更新登录信息
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(ip);
        userMapper.updateById(user);

        // 创建会话
        UserSession session = createSession(user.getId(), ip, ua);

        // 记录日志
        logActivity(user.getId(), "login", "", "{\"ip\":\"" + ip + "\"}", ip);

        return buildUserInfo(user, session);
    }

    /**
     * 通过 Token 验证用户
     */
    public User validateToken(String encryptedToken) {
        try {
            // 计算 token hash 快速查找
            String tokenHash = DigestUtil.sha256Hex(encryptedToken);

            UserSession session = sessionMapper.selectOne(new LambdaQueryWrapper<UserSession>()
                    .eq(UserSession::getTokenHash, tokenHash));
            if (session == null) {
                return null;
            }

            // 检查过期
            if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
                sessionMapper.deleteById(session.getId());
                return null;
            }

            return userMapper.selectById(session.getUserId());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 通过 Token 获取会话
     */
    public UserSession getSession(String encryptedToken) {
        String tokenHash = DigestUtil.sha256Hex(encryptedToken);
        return sessionMapper.selectOne(new LambdaQueryWrapper<UserSession>()
                .eq(UserSession::getTokenHash, tokenHash));
    }

    /**
     * 通过 Token 获取会话（供外部服务调用）
     */
    public UserSession getSessionByToken(String token) {
        return getSession(token);
    }

    /**
     * 创建会话并返回（供微信扫码登录调用）
     */
    public String createSession(Long userId) {
        UserSession session = createSession(userId, "", "wx-scan-login");
        return session.getToken();
    }

    /**
     * 登出
     */
    public void logout(String encryptedToken) {
        String tokenHash = DigestUtil.sha256Hex(encryptedToken);
        UserSession session = sessionMapper.selectOne(new LambdaQueryWrapper<UserSession>()
                .eq(UserSession::getTokenHash, tokenHash));
        if (session != null) {
            logActivity(session.getUserId(), "logout", "", "", "");
            sessionMapper.deleteById(session.getId());
        }
    }

    /**
     * 生成加密 Token
     */
    private String generateToken(Long userId) {
        String raw = userId + ":" + System.currentTimeMillis() + ":" + RandomUtil.randomString(32);
        AES aes = getTokenAes();
        return aes.encryptBase64(raw);
    }

    /**
     * 创建会话
     */
    private UserSession createSession(Long userId, String ip, String ua) {
        String token = generateToken(userId);
        String tokenHash = DigestUtil.sha256Hex(token);

        UserSession session = new UserSession();
        session.setUserId(userId);
        session.setToken(token);
        session.setTokenHash(tokenHash);
        session.setIpAddress(ip);
        session.setUserAgent(ua);
        session.setExpiresAt(LocalDateTime.now().plusDays(TOKEN_EXPIRE_DAYS));
        sessionMapper.insert(session);

        return session;
    }

    /**
     * 构建返回给前端的用户信息（不包含密码等敏感字段）
     */
    private Map<String, Object> buildUserInfo(User user, UserSession session) {
        Map<String, Object> info = new HashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("email", user.getEmail());
        info.put("nickname", user.getNickname());
        info.put("avatar", user.getAvatar());
        if (session != null) {
            info.put("token", session.getToken());
            info.put("expiresAt", session.getExpiresAt().toString());
        }

        // 加载用户设置
        UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                .eq(UserSettings::getUserId, user.getId()));
        if (settings != null) {
            info.put("theme", settings.getTheme());
            info.put("language", settings.getLanguage());
        }

        return info;
    }

    /**
     * 修改密码（已登录用户，需验证旧密码）
     */
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        // 校验旧密码
        if (oldPassword == null || oldPassword.trim().isEmpty()) {
            throw new RuntimeException("旧密码不能为空");
        }
        // 校验新密码
        if (newPassword == null || newPassword.length() < passwordMinLength) {
            throw new RuntimeException("新密码至少" + passwordMinLength + "位");
        }
        // 新旧密码不能相同
        if (oldPassword.equals(newPassword)) {
            throw new RuntimeException("新密码不能与旧密码相同");
        }

        // 查找用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 验证旧密码
        if (!BCrypt.checkpw(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("旧密码错误");
        }

        // 更新密码
        String salt = BCrypt.gensalt(12);
        String passwordHash = BCrypt.hashpw(newPassword, salt);
        user.setPasswordHash(passwordHash);
        user.setSalt(salt);
        userMapper.updateById(user);

        // 清除该用户的所有会话（强制重新登录）
        sessionMapper.delete(new LambdaQueryWrapper<UserSession>()
                .eq(UserSession::getUserId, user.getId()));

        // 记录日志
        logActivity(user.getId(), "change-password", "", "{}", "");
    }

    /**
     * 记录操作日志
     */
    private void logActivity(Long userId, String action, String target, String detail, String ip) {
        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setAction(action);
        activity.setTarget(target);
        activity.setDetail(detail);
        activity.setIpAddress(ip);
        activityMapper.insert(activity);
    }

    /**
     * 定时清理过期会话（每小时执行一次）
     */
    @Scheduled(fixedRate = 3600000)
    public void cleanExpiredSessions() {
        try {
            int deleted = sessionMapper.delete(new LambdaQueryWrapper<UserSession>()
                    .lt(UserSession::getExpiresAt, LocalDateTime.now()));
            if (deleted > 0) {
                log.info("清理过期会话: {} 条", deleted);
            }
        } catch (Exception e) {
            log.error("清理过期会话失败", e);
        }
    }
}
