package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.UserSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户认证 API
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserSettingsService settingsService;

    /**
     * 发送注册验证码
     */
    @PostMapping("/send-code")
    public Result<Void> sendCode(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return Result.error(400, "邮箱不能为空");
            }
            authService.sendRegisterCode(email.trim());
            return Result.success("验证码已发送至 " + email.trim(), null);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 发送重置密码验证码
     */
    @PostMapping("/send-reset-code")
    public Result<Void> sendResetCode(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return Result.error(400, "邮箱不能为空");
            }
            authService.sendResetCode(email.trim());
            return Result.success("验证码已发送至 " + email.trim(), null);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 重置密码
     */
    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String verifyCode = body.get("verifyCode");
            String newPassword = body.get("newPassword");

            if (email == null || email.trim().isEmpty()) {
                return Result.error(400, "邮箱不能为空");
            }
            if (verifyCode == null || verifyCode.trim().isEmpty()) {
                return Result.error(400, "验证码不能为空");
            }
            if (newPassword == null || newPassword.length() < 6) {
                return Result.error(400, "新密码至少6位");
            }

            authService.resetPassword(email.trim(), verifyCode.trim(), newPassword);
            return Result.success("密码重置成功，请使用新密码登录", null);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 注册
     */
    @PostMapping("/register")
    public Result<Map<String, Object>> register(@RequestBody Map<String, String> body,
                                                 HttpServletRequest request) {
        try {
            String username = body.get("username");
            String password = body.get("password");
            String email = body.get("email");

            if (username == null || username.trim().isEmpty()) {
                return Result.error(400, "用户名不能为空");
            }
            if (password == null || password.length() < 6) {
                return Result.error(400, "密码至少6位");
            }
            if (username.length() < 2 || username.length() > 20) {
                return Result.error(400, "用户名2-20个字符");
            }
            if (!username.matches("^[a-zA-Z0-9_\\u4e00-\\u9fa5]+$")) {
                return Result.error(400, "用户名只能包含字母、数字、下划线和中文");
            }
            if (email == null || email.trim().isEmpty()) {
                return Result.error(400, "邮箱不能为空");
            }

            Map<String, Object> userInfo = authService.register(
                    username.trim(), password, email.trim());
            return Result.success("注册成功", userInfo);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 登录
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> body,
                                              HttpServletRequest request) {
        try {
            String username = body.get("username");
            String password = body.get("password");

            if (username == null || password == null) {
                return Result.error(400, "用户名和密码不能为空");
            }

            String ip = getClientIp(request);
            String ua = request.getHeader("User-Agent");

            Map<String, Object> userInfo = authService.login(
                    username.trim(), password, ip, ua);
            return Result.success("登录成功", userInfo);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 修改密码（已登录用户，需验证旧密码）
     */
    @PostMapping("/change-password")
    public Result<Void> changePassword(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                        @RequestBody Map<String, String> body) {
        if (token == null || token.isEmpty()) {
            return Result.error(401, "未登录");
        }
        User user = authService.validateToken(token);
        if (user == null) {
            return Result.error(401, "登录已过期，请重新登录");
        }

        try {
            String oldPassword = body.get("oldPassword");
            String newPassword = body.get("newPassword");

            authService.changePassword(user.getId(), oldPassword, newPassword);
            return Result.success("密码修改成功，请重新登录", null);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        if (token != null && !token.isEmpty()) {
            authService.logout(token);
        }
        return Result.success("已登出", null);
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public Result<Map<String, Object>> me(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        if (token == null || token.isEmpty()) {
            return Result.error(401, "未登录");
        }
        User user = authService.validateToken(token);
        if (user == null) {
            return Result.error(401, "登录已过期，请重新登录");
        }

        Map<String, Object> info = new HashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("email", user.getEmail());
        info.put("nickname", user.getNickname());
        info.put("avatar", user.getAvatar());

        // 加载设置
        Map<String, Object> settings = settingsService.getSettings(user.getId());
        info.putAll(settings);

        return Result.success(info);
    }

    /**
     * 检查 Token 有效性
     */
    @GetMapping("/check")
    public Result<Map<String, Object>> check(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        if (token == null || token.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("valid", false);
            return Result.success(result);
        }
        User user = authService.validateToken(token);
        Map<String, Object> result = new HashMap<>();
        result.put("valid", user != null);
        if (user != null) {
            result.put("username", user.getUsername());
        }
        return Result.success(result);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
