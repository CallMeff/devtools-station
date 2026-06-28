package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.UserSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户设置 API
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final AuthService authService;
    private final UserSettingsService settingsService;

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
     * 获取设置
     */
    @GetMapping
    public Result<Map<String, Object>> getSettings(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            return Result.success(settingsService.getSettings(user.getId()));
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 更新设置
     */
    @PutMapping
    public Result<Void> updateSettings(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, Object> data) {
        try {
            User user = requireAuth(token);
            settingsService.updateSettings(user.getId(), data);
            return Result.success("设置已保存", null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 记录最近使用的工具
     */
    @PostMapping("/recent-tool")
    public Result<Void> addRecentTool(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, String> body) {
        try {
            User user = requireAuth(token);
            settingsService.addRecentTool(
                    user.getId(),
                    body.get("route"),
                    body.get("name"));
            return Result.success(null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 保存输入历史
     */
    @PostMapping("/input-history")
    public Result<Void> saveInputHistory(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, String> body) {
        try {
            User user = requireAuth(token);
            settingsService.saveInputHistory(
                    user.getId(),
                    body.get("route"),
                    body.get("input"));
            return Result.success(null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }
}
