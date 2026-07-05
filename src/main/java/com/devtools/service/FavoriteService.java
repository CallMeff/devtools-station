package com.devtools.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.devtools.entity.Favorite;
import com.devtools.entity.Tool;
import com.devtools.mapper.FavoriteMapper;
import com.devtools.mapper.ToolMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户收藏/常用工具服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService extends ServiceImpl<FavoriteMapper, Favorite> {

    private final ToolMapper toolMapper;

    /**
     * 获取用户收藏的工具列表（按 sortOrder 排序）
     */
    public List<Tool> getUserFavorites(Long userId) {
        List<Favorite> favorites = this.list(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .orderByAsc(Favorite::getSortOrder)
                .orderByDesc(Favorite::getCreatedAt));

        if (favorites.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> toolIds = favorites.stream()
                .map(Favorite::getToolId)
                .collect(Collectors.toList());

        List<Tool> tools = toolMapper.selectBatchIds(toolIds);

        // 按收藏顺序排列
        Map<Long, Tool> toolMap = tools.stream()
                .collect(Collectors.toMap(Tool::getId, t -> t, (a, b) -> a));

        return favorites.stream()
                .map(f -> toolMap.get(f.getToolId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户收藏的工具 ID 集合
     */
    public Set<Long> getUserFavoriteIds(Long userId) {
        return this.list(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .select(Favorite::getToolId))
                .stream()
                .map(Favorite::getToolId)
                .collect(Collectors.toSet());
    }

    /**
     * 判断用户是否已收藏某工具
     */
    public boolean isFavorite(Long userId, Long toolId) {
        return this.count(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getToolId, toolId)) > 0;
    }

    /**
     * 添加收藏
     */
    @Transactional
    public void addFavorite(Long userId, Long toolId) {
        if (isFavorite(userId, toolId)) {
            return; // 已收藏，忽略
        }

        // 计算下一个 sortOrder
        Long count = this.count(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId));
        int nextOrder = count.intValue();

        Favorite fav = new Favorite();
        fav.setUserId(userId);
        fav.setUserKey("");  // 兼容 NOT NULL 约束（已登录用户用 user_id 标识）
        fav.setToolId(toolId);
        fav.setSortOrder(nextOrder);
        this.save(fav);

        log.info("用户 {} 收藏工具 {}", userId, toolId);
    }

    /**
     * 取消收藏
     */
    @Transactional
    public void removeFavorite(Long userId, Long toolId) {
        boolean removed = this.remove(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getToolId, toolId));

        if (removed) {
            log.info("用户 {} 取消收藏工具 {}", userId, toolId);
        }
    }

    /**
     * 重新排序收藏（拖拽排序）
     */
    @Transactional
    public void reorderFavorites(Long userId, List<Long> toolIds) {
        List<Favorite> favorites = this.list(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId));

        Map<Long, Favorite> favMap = favorites.stream()
                .collect(Collectors.toMap(Favorite::getToolId, f -> f, (a, b) -> a));

        for (int i = 0; i < toolIds.size(); i++) {
            Favorite fav = favMap.get(toolIds.get(i));
            if (fav != null) {
                fav.setSortOrder(i);
                this.updateById(fav);
            }
        }
    }

    /**
     * 获取用户收藏的工具位置（toolId → {xp, yp}）
     */
    public Map<String, Map<String, Double>> getUserFavoritePositions(Long userId) {
        List<Favorite> favorites = this.list(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .isNotNull(Favorite::getPosX)
                .isNotNull(Favorite::getPosY));

        Map<String, Map<String, Double>> positions = new HashMap<>();
        for (Favorite fav : favorites) {
            Map<String, Double> pos = new HashMap<>();
            pos.put("xp", fav.getPosX());
            pos.put("yp", fav.getPosY());
            positions.put(String.valueOf(fav.getToolId()), pos);
        }
        return positions;
    }

    /**
     * 批量保存工具位置
     * @param userId 用户 ID
     * @param positions toolId → {xp, yp}
     */
    @Transactional
    public void savePositions(Long userId, Map<String, Map<String, Double>> positions) {
        if (positions == null || positions.isEmpty()) return;

        // 查询该用户的所有收藏
        List<Favorite> favorites = this.list(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId));

        Map<Long, Favorite> favMap = favorites.stream()
                .collect(Collectors.toMap(Favorite::getToolId, f -> f, (a, b) -> a));

        for (Map.Entry<String, Map<String, Double>> entry : positions.entrySet()) {
            Long toolId = Long.valueOf(entry.getKey());
            Favorite fav = favMap.get(toolId);
            if (fav != null) {
                Double xp = entry.getValue().get("xp");
                Double yp = entry.getValue().get("yp");
                if (xp != null && yp != null) {
                    fav.setPosX(xp);
                    fav.setPosY(yp);
                    this.updateById(fav);
                }
            }
        }
        log.info("用户 {} 保存 {} 个工具位置", userId, positions.size());
    }
}
