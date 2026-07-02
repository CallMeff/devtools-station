package com.devtools.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.ThemeStore;
import com.devtools.entity.User;
import com.devtools.entity.UserTheme;
import com.devtools.mapper.ThemeStoreMapper;
import com.devtools.mapper.UserMapper;
import com.devtools.mapper.UserThemeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 主题商店服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeStoreService {

    private final ThemeStoreMapper themeStoreMapper;
    private final UserThemeMapper userThemeMapper;
    private final UserMapper userMapper;

    /**
     * 获取所有已启用的主题（含用户购买状态）
     */
    public List<Map<String, Object>> listThemes(Long userId) {
        List<ThemeStore> allThemes = themeStoreMapper.selectList(
                new LambdaQueryWrapper<ThemeStore>()
                        .eq(ThemeStore::getEnabled, 1)
                        .orderByAsc(ThemeStore::getSortOrder)
        );

        Set<Long> purchasedThemeIds = Collections.emptySet();
        if (userId != null) {
            List<UserTheme> userThemes = userThemeMapper.selectList(
                    new LambdaQueryWrapper<UserTheme>()
                            .eq(UserTheme::getUserId, userId)
            );
            purchasedThemeIds = userThemes.stream()
                    .map(UserTheme::getThemeId)
                    .collect(Collectors.toSet());
        }

        Set<Long> finalPurchasedThemeIds = purchasedThemeIds;
        return allThemes.stream().map(theme -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", theme.getId());
            map.put("themeKey", theme.getThemeKey());
            map.put("name", theme.getName());
            map.put("description", theme.getDescription());
            map.put("icon", theme.getIcon());
            map.put("price", theme.getPrice());
            map.put("category", theme.getCategory());
            map.put("accentColor", theme.getAccentColor());
            map.put("bgPrimary", theme.getBgPrimary());
            map.put("previewColors", theme.getPreviewColors());
            map.put("purchased", "free".equals(theme.getCategory()) || finalPurchasedThemeIds.contains(theme.getId()));
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * 获取用户已购主题
     */
    public List<Map<String, Object>> listMyThemes(Long userId) {
        List<UserTheme> userThemes = userThemeMapper.selectList(
                new LambdaQueryWrapper<UserTheme>()
                        .eq(UserTheme::getUserId, userId)
        );

        Set<Long> themeIds = userThemes.stream()
                .map(UserTheme::getThemeId)
                .collect(Collectors.toSet());

        // 免费主题自动视为已购
        List<ThemeStore> freeThemes = themeStoreMapper.selectList(
                new LambdaQueryWrapper<ThemeStore>()
                        .eq(ThemeStore::getCategory, "free")
                        .eq(ThemeStore::getEnabled, 1)
        );
        for (ThemeStore ft : freeThemes) {
            themeIds.add(ft.getId());
        }

        if (themeIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<ThemeStore> themes = themeStoreMapper.selectList(
                new LambdaQueryWrapper<ThemeStore>()
                        .in(ThemeStore::getId, themeIds)
                        .eq(ThemeStore::getEnabled, 1)
                        .orderByAsc(ThemeStore::getSortOrder)
        );

        return themes.stream().map(theme -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", theme.getId());
            map.put("themeKey", theme.getThemeKey());
            map.put("name", theme.getName());
            map.put("description", theme.getDescription());
            map.put("icon", theme.getIcon());
            map.put("price", theme.getPrice());
            map.put("category", theme.getCategory());
            map.put("accentColor", theme.getAccentColor());
            map.put("bgPrimary", theme.getBgPrimary());
            map.put("previewColors", theme.getPreviewColors());
            map.put("purchased", true);
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * 购买主题
     */
    @Transactional
    public Map<String, Object> purchaseTheme(Long userId, Long themeId) {
        // 1. 验证主题存在且启用
        ThemeStore theme = themeStoreMapper.selectById(themeId);
        if (theme == null || theme.getEnabled() != 1) {
            throw new RuntimeException("主题不存在或已下架");
        }

        // 2. 免费主题无需购买
        if ("free".equals(theme.getCategory())) {
            // 自动添加到我的主题
            ensureOwned(userId, themeId);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "免费主题已添加");
            result.put("points", getUserPoints(userId));
            return result;
        }

        // 3. 检查是否已购买
        Long count = userThemeMapper.selectCount(
                new LambdaQueryWrapper<UserTheme>()
                        .eq(UserTheme::getUserId, userId)
                        .eq(UserTheme::getThemeId, themeId)
        );
        if (count > 0) {
            throw new RuntimeException("您已拥有该主题，无需重复购买");
        }

        // 4. 获取用户并检查积分
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        int currentPoints = (user.getPoints() != null) ? user.getPoints() : 0;
        if (currentPoints < theme.getPrice()) {
            throw new RuntimeException("积分不足！需要 " + theme.getPrice() + " 积分，当前只有 " + currentPoints + " 积分");
        }

        // 5. 扣减积分
        user.setPoints(currentPoints - theme.getPrice());
        userMapper.updateById(user);

        // 6. 添加购买记录
        UserTheme userTheme = new UserTheme();
        userTheme.setUserId(userId);
        userTheme.setThemeId(themeId);
        userThemeMapper.insert(userTheme);

        log.info("用户 {} 购买主题 {} ({}), 消耗 {} 积分, 剩余 {} 积分",
                userId, theme.getThemeKey(), theme.getName(), theme.getPrice(), user.getPoints());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "购买成功！已消耗 " + theme.getPrice() + " 积分");
        result.put("points", user.getPoints());
        result.put("theme", theme.getThemeKey());
        return result;
    }

    /**
     * 获取用户积分
     */
    public int getUserPoints(Long userId) {
        User user = userMapper.selectById(userId);
        return (user != null && user.getPoints() != null) ? user.getPoints() : 0;
    }

    /**
     * 确保用户拥有某个主题（免费主题自动添加）
     */
    private void ensureOwned(Long userId, Long themeId) {
        Long count = userThemeMapper.selectCount(
                new LambdaQueryWrapper<UserTheme>()
                        .eq(UserTheme::getUserId, userId)
                        .eq(UserTheme::getThemeId, themeId)
        );
        if (count == 0) {
            UserTheme ut = new UserTheme();
            ut.setUserId(userId);
            ut.setThemeId(themeId);
            userThemeMapper.insert(ut);
        }
    }

    /**
     * 初始化主题商店数据（系统启动时调用）
     */
    @Transactional
    public void initThemeStoreData() {
        Long count = themeStoreMapper.selectCount(null);
        if (count > 0) {
            return; // 已初始化
        }

        log.info("初始化主题商店数据...");

        Object[][] themes = {
            // {themeKey, name, description, icon, price, category, accentColor, bgPrimary, previewColors, sortOrder}
            {"dark",      "暗黑",      "护眼深邃 · 专业暗色",         "🌙", 0, "free",    "#6366f1", "#0a0a0b", "#0a0a0b,#6366f1",  1},
            {"light",     "明亮",      "清爽简洁 · 经典白昼",         "☀️", 0, "free",    "#6366f1", "#f8f9fc", "#f8f9fc,#6366f1",  2},
            {"cyberpunk", "赛博朋克",  "霓虹光效 · 未来科技",         "🧬", 6, "premium", "#00e5ff", "#0a0a1a", "#0a0a1a,#00e5ff,#bf00ff", 3},
            {"forest",    "森系",      "自然静谧 · 养眼护目",         "🌿", 6, "premium", "#84cc6a", "#0d1f17", "#0d1f17,#84cc6a,#d4a853", 4},
            {"sunset",    "日落黄昏",  "温暖霞光 · 暮色鎏金",         "🌅", 8, "premium", "#f59e0b", "#1a1028", "#1a1028,#c2416e,#f59e0b", 5},
            {"ocean",     "深海幽蓝",  "静谧深海 · 深邃冷静",         "🫧", 4, "premium", "#38bdf8", "#0a1628", "#0a1628,#38bdf8,#0284c7", 6},
            {"autumn",    "秋叶暖棕",  "秋意浓浓 · 温暖质朴",         "🍂", 4, "premium", "#d97706", "#1a1008", "#1a1008,#d97706,#a16207", 7},
            {"anime",     "二次元",    "樱花甜心 · 动漫风格",         "🌸", 6, "premium", "#ff6b9d", "#1a0a14", "#1a0a14,#ff6b9d,#f472b6", 8},
        };

        for (Object[] t : themes) {
            ThemeStore ts = new ThemeStore();
            ts.setThemeKey((String) t[0]);
            ts.setName((String) t[1]);
            ts.setDescription((String) t[2]);
            ts.setIcon((String) t[3]);
            ts.setPrice((Integer) t[4]);
            ts.setCategory((String) t[5]);
            ts.setAccentColor((String) t[6]);
            ts.setBgPrimary((String) t[7]);
            ts.setPreviewColors((String) t[8]);
            ts.setSortOrder((Integer) t[9]);
            ts.setEnabled(1);
            themeStoreMapper.insert(ts);
        }

        log.info("主题商店数据初始化完成，共 {} 个主题", themes.length);
    }
}
