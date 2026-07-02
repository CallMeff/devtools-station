package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.ThemeStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 主题商店 API
 */
@RestController
@RequestMapping("/api/theme-store")
@RequiredArgsConstructor
public class ThemeStoreController {

    private final AuthService authService;
    private final ThemeStoreService themeStoreService;

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
     * 获取所有主题列表（含用户购买状态）
     * 未登录也返回列表，但 purchased 均为 false
     */
    @GetMapping("/list")
    public Result<List<Map<String, Object>>> listThemes(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        Long userId = null;
        if (token != null && !token.isEmpty()) {
            try {
                User user = requireAuth(token);
                userId = user.getId();
            } catch (RuntimeException ignored) {
                // token 无效则按未登录处理
            }
        }
        return Result.success(themeStoreService.listThemes(userId));
    }

    /**
     * 获取用户已购主题列表
     */
    @GetMapping("/my")
    public Result<List<Map<String, Object>>> listMyThemes(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            return Result.success(themeStoreService.listMyThemes(user.getId()));
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 购买主题
     */
    @PostMapping("/purchase/{themeId}")
    public Result<Map<String, Object>> purchaseTheme(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @PathVariable Long themeId) {
        try {
            User user = requireAuth(token);
            Map<String, Object> result = themeStoreService.purchaseTheme(user.getId(), themeId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /**
     * 获取当前用户积分
     */
    @GetMapping("/points")
    public Result<Map<String, Object>> getPoints(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            int points = themeStoreService.getUserPoints(user.getId());
            return Result.success(Map.of("points", points));
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }
}
