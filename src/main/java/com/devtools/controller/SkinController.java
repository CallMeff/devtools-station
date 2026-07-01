package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.UserSkinService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 页面皮肤 API
 */
@RestController
@RequestMapping("/api/skin")
@RequiredArgsConstructor
public class SkinController {

    private final AuthService authService;
    private final UserSkinService skinService;

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
     * 获取当前皮肤
     */
    @GetMapping
    public Result<Map<String, Object>> getSkin(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            return Result.success(skinService.getSkin(user.getId()));
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 保存皮肤
     */
    @PostMapping
    public Result<Void> saveSkin(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, Object> body) {
        try {
            User user = requireAuth(token);
            String skinImage = (String) body.get("skinImage");
            Double opacity = body.get("opacity") != null
                    ? ((Number) body.get("opacity")).doubleValue() : 0.15;
            skinService.saveSkin(user.getId(), skinImage, opacity);
            return Result.success("皮肤已保存", null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 删除皮肤
     */
    @DeleteMapping
    public Result<Void> deleteSkin(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            skinService.deleteSkin(user.getId());
            return Result.success("皮肤已移除", null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }
}
