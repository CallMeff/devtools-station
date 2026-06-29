package com.devtools.service;

import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.*;
import com.devtools.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户资料服务
 */
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserMapper userMapper;
    private final UserSessionMapper sessionMapper;
    private final UserSettingsMapper settingsMapper;
    private final UserActivityMapper activityMapper;
    private final EmailService emailService;

    /**
     * 获取用户完整资料（含统计）
     */
    public Map<String, Object> getProfile(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", maskEmail(user.getEmail()));
        profile.put("nickname", user.getNickname());
        profile.put("avatar", user.getAvatar());
        profile.put("status", user.getStatus());
        profile.put("lastLoginAt", user.getLastLoginAt() != null ?
                user.getLastLoginAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : null);
        profile.put("createdAt", user.getCreatedAt() != null ?
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : null);

        // 加载设置
        UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                .eq(UserSettings::getUserId, userId));
        if (settings != null) {
            profile.put("theme", settings.getTheme());
            profile.put("language", settings.getLanguage());
        }

        // 统计活跃会话数
        Long sessionCount = sessionMapper.selectCount(new LambdaQueryWrapper<UserSession>()
                .eq(UserSession::getUserId, userId)
                .gt(UserSession::getExpiresAt, LocalDateTime.now()));
        profile.put("activeSessions", sessionCount.intValue());

        // 统计操作日志数
        Long activityCount = activityMapper.selectCount(new LambdaQueryWrapper<UserActivity>()
                .eq(UserActivity::getUserId, userId));
        profile.put("activityCount", activityCount.intValue());

        return profile;
    }

    /**
     * 更新用户资料（昵称、头像）
     */
    public Map<String, Object> updateProfile(Long userId, Map<String, Object> data) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        if (data.containsKey("nickname")) {
            String nickname = (String) data.get("nickname");
            if (nickname != null) {
                nickname = nickname.trim();
                if (nickname.length() < 1 || nickname.length() > 30) {
                    throw new RuntimeException("昵称长度1-30个字符");
                }
                user.setNickname(nickname);
            }
        }

        if (data.containsKey("avatar")) {
            user.setAvatar((String) data.get("avatar"));
        }

        userMapper.updateById(user);

        // 记录日志
        logActivity(userId, "update-profile", "", "{}", "");

        // 返回更新后的基本信息
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("nickname", user.getNickname());
        result.put("avatar", user.getAvatar());
        result.put("email", maskEmail(user.getEmail()));
        return result;
    }

    /**
     * 发送修改邮箱验证码
     */
    public String sendChangeEmailCode(String email) {
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("邮箱格式不正确");
        }

        // 检查邮箱是否已被其他用户使用
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (count > 0) {
            throw new RuntimeException("该邮箱已被其他账号使用");
        }

        return emailService.sendRegisterCode(email);
    }

    /**
     * 修改邮箱（需验证码）
     */
    public Map<String, Object> changeEmail(Long userId, String newEmail, String verifyCode) {
        // 校验邮箱格式
        if (!newEmail.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("邮箱格式不正确");
        }

        // 校验验证码
        if (!emailService.verifyRegisterCode(newEmail, verifyCode)) {
            throw new RuntimeException("验证码错误或已过期");
        }

        // 检查邮箱是否已被其他用户使用
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, newEmail)
                .ne(User::getId, userId));
        if (count > 0) {
            throw new RuntimeException("该邮箱已被其他账号使用");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        user.setEmail(newEmail);
        userMapper.updateById(user);

        // 记录日志
        logActivity(userId, "change-email", "", "{}", "");

        Map<String, Object> result = new HashMap<>();
        result.put("email", maskEmail(newEmail));
        return result;
    }

    /**
     * 邮箱脱敏显示
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIdx = email.indexOf('@');
        String name = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        if (name.length() <= 2) {
            return name.charAt(0) + "***" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + domain;
    }

    private void logActivity(Long userId, String action, String target, String detail, String ip) {
        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setAction(action);
        activity.setTarget(target);
        activity.setDetail(detail);
        activity.setIpAddress(ip);
        activityMapper.insert(activity);
    }
}
