package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.Tool;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 用户收藏/常用工具 API
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final AuthService authService;

    /**
     * 从请求头提取登录用户
     */
    private User getLoginUser(String token) {
        if (token == null || token.isEmpty()) return null;
        return authService.validateToken(token);
    }

    /**
     * 获取当前用户的收藏工具列表
     */
    @GetMapping
    public Result<Map<String, Object>> list(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        User user = getLoginUser(token);
        if (user == null) {
            return Result.error(401, "请先登录");
        }

        List<Tool> tools = favoriteService.getUserFavorites(user.getId());
        Set<Long> ids = favoriteService.getUserFavoriteIds(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("tools", tools);
        data.put("toolIds", ids);
        return Result.success(data);
    }

    /**
     * 添加收藏
     */
    @PostMapping("/add")
    public Result<Void> add(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                            @RequestBody Map<String, Long> body) {
        User user = getLoginUser(token);
        if (user == null) {
            return Result.error(401, "请先登录");
        }

        Long toolId = body.get("toolId");
        if (toolId == null) {
            return Result.error(400, "toolId 不能为空");
        }

        favoriteService.addFavorite(user.getId(), toolId);
        return Result.success("已添加到常用工具", null);
    }

    /**
     * 取消收藏
     */
    @PostMapping("/remove")
    public Result<Void> remove(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                               @RequestBody Map<String, Long> body) {
        User user = getLoginUser(token);
        if (user == null) {
            return Result.error(401, "请先登录");
        }

        Long toolId = body.get("toolId");
        if (toolId == null) {
            return Result.error(400, "toolId 不能为空");
        }

        favoriteService.removeFavorite(user.getId(), toolId);
        return Result.success("已从常用工具移除", null);
    }

    /**
     * 重新排序
     */
    @PostMapping("/reorder")
    public Result<Void> reorder(@RequestHeader(value = "X-Auth-Token", required = false) String token,
                                @RequestBody Map<String, Object> body) {
        User user = getLoginUser(token);
        if (user == null) {
            return Result.error(401, "请先登录");
        }

        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) body.get("toolIds");
        if (rawIds == null || rawIds.isEmpty()) {
            return Result.error(400, "toolIds 不能为空");
        }

        List<Long> toolIds = rawIds.stream()
                .map(Long::valueOf)
                .toList();

        favoriteService.reorderFavorites(user.getId(), toolIds);
        return Result.success("排序已更新", null);
    }
}
