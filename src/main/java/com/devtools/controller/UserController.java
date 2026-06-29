package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户资料 API
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserProfileService userProfileService;

    private User requireAuth(String token) {
        if (token == null || token.isEmpty()) {
            throw new RuntimeException("未登录");
        }
        User user = authService.validateToken(token);
        if (user == null) {
            throw new RuntimeException("登录已过期");
        }
        return user;
    }

    /**
     * 获取用户详情（含统计数据）
     */
    @GetMapping("/profile")
    public Result<Map<String, Object>> profile(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            return Result.success(userProfileService.getProfile(user.getId()));
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 更新用户资料（昵称、头像）
     */
    @PutMapping("/profile")
    public Result<Map<String, Object>> updateProfile(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, Object> data) {
        try {
            User user = requireAuth(token);
            Map<String, Object> updated = userProfileService.updateProfile(user.getId(), data);
            return Result.success("资料已更新", updated);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 修改邮箱（需验证码）
     */
    @PostMapping("/change-email")
    public Result<Map<String, Object>> changeEmail(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, String> body) {
        try {
            User user = requireAuth(token);
            String newEmail = body.get("email");
            String verifyCode = body.get("verifyCode");

            if (newEmail == null || newEmail.trim().isEmpty()) {
                return Result.error(400, "新邮箱不能为空");
            }
            if (verifyCode == null || verifyCode.trim().isEmpty()) {
                return Result.error(400, "验证码不能为空");
            }

            Map<String, Object> result = userProfileService.changeEmail(
                    user.getId(), newEmail.trim(), verifyCode.trim());
            return Result.success("邮箱修改成功", result);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 发送修改邮箱验证码
     */
    @PostMapping("/send-email-code")
    public Result<Map<String, Object>> sendEmailCode(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, String> body) {
        try {
            User user = requireAuth(token);
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return Result.error(400, "邮箱不能为空");
            }
            String devCode = userProfileService.sendChangeEmailCode(email.trim());
            return Result.success("验证码已发送至 " + email.trim(), buildCodePayload(devCode));
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    private Map<String, Object> buildCodePayload(String devCode) {
        Map<String, Object> data = new HashMap<>();
        data.put("mock", devCode != null);
        if (devCode != null) {
            data.put("devCode", devCode);
        }
        return data;
    }
}
