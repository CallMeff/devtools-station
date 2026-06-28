package com.devtools.service;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.UserSettings;
import com.devtools.mapper.UserSettingsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户设置服务
 */
@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserSettingsMapper settingsMapper;

    /**
     * 获取用户设置
     */
    public Map<String, Object> getSettings(Long userId) {
        UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                .eq(UserSettings::getUserId, userId));
        Map<String, Object> result = new HashMap<>();
        if (settings != null) {
            result.put("theme", settings.getTheme() != null ? settings.getTheme() : "dark");
            result.put("language", settings.getLanguage() != null ? settings.getLanguage() : "zh-CN");
            result.put("recentTools", settings.getRecentTools());
            result.put("favoriteTools", settings.getFavoriteTools());
            result.put("inputHistory", settings.getInputHistory());
            result.put("uiPreferences", settings.getUiPreferences());
            result.put("customConfig", settings.getCustomConfig());
        }
        return result;
    }

    /**
     * 更新用户设置
     */
    public void updateSettings(Long userId, Map<String, Object> data) {
        UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                .eq(UserSettings::getUserId, userId));
        if (settings == null) {
            settings = new UserSettings();
            settings.setUserId(userId);
            settings.setTheme("dark");
            settings.setLanguage("zh-CN");
        }

        if (data.containsKey("theme")) {
            settings.setTheme((String) data.get("theme"));
        }
        if (data.containsKey("language")) {
            settings.setLanguage((String) data.get("language"));
        }
        if (data.containsKey("recentTools")) {
            settings.setRecentTools((String) data.get("recentTools"));
        }
        if (data.containsKey("favoriteTools")) {
            settings.setFavoriteTools((String) data.get("favoriteTools"));
        }
        if (data.containsKey("inputHistory")) {
            settings.setInputHistory((String) data.get("inputHistory"));
        }
        if (data.containsKey("uiPreferences")) {
            settings.setUiPreferences((String) data.get("uiPreferences"));
        }
        if (data.containsKey("customConfig")) {
            settings.setCustomConfig((String) data.get("customConfig"));
        }

        if (settings.getId() == null) {
            settingsMapper.insert(settings);
        } else {
            settingsMapper.updateById(settings);
        }
    }

    /**
     * 记录最近使用的工具
     */
    public void addRecentTool(Long userId, String toolRoute, String toolName) {
        UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                .eq(UserSettings::getUserId, userId));
        if (settings == null) {
            settings = new UserSettings();
            settings.setUserId(userId);
            settings.setTheme("dark");
            settings.setLanguage("zh-CN");
        }

        // 解析现有最近工具列表
        String recent = settings.getRecentTools();
        java.util.List<Map<String, Object>> list = new java.util.ArrayList<>();
        if (recent != null && !recent.isEmpty()) {
            try {
                java.util.List<Map> rawList = JSONUtil.toList(recent, Map.class);
                for (Map m : rawList) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("route", m.get("route"));
                    item.put("name", m.get("name"));
                    item.put("time", m.get("time"));
                    list.add(item);
                }
            } catch (Exception e) {
                list = new java.util.ArrayList<>();
            }
        }

        // 移除已存在的同路由记录
        list.removeIf(item -> toolRoute.equals(item.get("route")));

        // 插入到最前面
        Map<String, Object> entry = new HashMap<>();
        entry.put("route", toolRoute);
        entry.put("name", toolName);
        entry.put("time", System.currentTimeMillis());
        list.add(0, entry);

        // 保留最近20条
        if (list.size() > 20) {
            list = list.subList(0, 20);
        }

        settings.setRecentTools(JSONUtil.toJsonStr(list));

        if (settings.getId() == null) {
            settingsMapper.insert(settings);
        } else {
            settingsMapper.updateById(settings);
        }
    }

    /**
     * 保存输入历史
     */
    public void saveInputHistory(Long userId, String toolRoute, String input) {
        if (input == null || input.isEmpty() || input.length() > 5000) return;

        UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                .eq(UserSettings::getUserId, userId));
        if (settings == null) {
            settings = new UserSettings();
            settings.setUserId(userId);
            settings.setTheme("dark");
            settings.setLanguage("zh-CN");
        }

        String historyJson = settings.getInputHistory();
        Map<String, java.util.List<String>> history = new HashMap<>();
        if (historyJson != null && !historyJson.isEmpty()) {
            try {
                Map rawMap = JSONUtil.toBean(historyJson, Map.class);
                for (Object key : rawMap.keySet()) {
                    Object val = rawMap.get(key);
                    if (val instanceof java.util.List) {
                        java.util.List<String> list = new java.util.ArrayList<>();
                        for (Object item : (java.util.List<?>) val) {
                            if (item != null) list.add(item.toString());
                        }
                        history.put(key.toString(), list);
                    }
                }
            } catch (Exception e) {
                history = new HashMap<>();
            }
        }

        java.util.List<String> toolHistory = history.computeIfAbsent(toolRoute, k -> new java.util.ArrayList<>());

        // 去重
        toolHistory.remove(input);
        toolHistory.add(0, input);

        // 每个工具最多保留5条历史
        if (toolHistory.size() > 5) {
            toolHistory = new java.util.ArrayList<>(toolHistory.subList(0, 5));
            history.put(toolRoute, toolHistory);
        }

        settings.setInputHistory(JSONUtil.toJsonStr(history));

        if (settings.getId() == null) {
            settingsMapper.insert(settings);
        } else {
            settingsMapper.updateById(settings);
        }
    }
}
