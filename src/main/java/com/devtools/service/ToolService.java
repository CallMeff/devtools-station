package com.devtools.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.devtools.entity.Category;
import com.devtools.entity.Tool;
import com.devtools.mapper.CategoryMapper;
import com.devtools.mapper.ToolMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 工具服务 - 提供工具分类、搜索、收藏等核心逻辑
 */
@Service
public class ToolService extends ServiceImpl<ToolMapper, Tool> {

    private final CategoryMapper categoryMapper;
    private final ToolMapper toolMapper;

    /** 搜索索引缓存: keyword -> toolIds */
    private final Map<String, Set<Long>> searchIndex = new HashMap<>();

    public ToolService(CategoryMapper categoryMapper, ToolMapper toolMapper) {
        this.categoryMapper = categoryMapper;
        this.toolMapper = toolMapper;
    }

    @PostConstruct
    public void buildSearchIndex() {
        List<Tool> tools = toolMapper.selectList(new LambdaQueryWrapper<Tool>()
                .eq(Tool::getStatus, 1));
        searchIndex.clear();
        for (Tool tool : tools) {
            indexTool(tool);
        }
    }

    private void indexTool(Tool tool) {
        String text = (tool.getName() + " " + tool.getDescription() + " " + tool.getKeywords()).toLowerCase();
        for (String word : text.split("[\\s,，]+")) {
            if (StrUtil.isNotBlank(word)) {
                searchIndex.computeIfAbsent(word, k -> new HashSet<>()).add(tool.getId());
            }
        }
    }

    /**
     * 搜索工具
     */
    public List<Tool> searchTools(String keyword) {
        if (StrUtil.isBlank(keyword)) {
            return toolMapper.selectList(new LambdaQueryWrapper<Tool>()
                    .eq(Tool::getStatus, 1)
                    .orderByAsc(Tool::getSortOrder));
        }
        String kw = keyword.toLowerCase().trim();
        Set<Long> matchedIds = new HashSet<>();
        // 前缀匹配
        for (Map.Entry<String, Set<Long>> entry : searchIndex.entrySet()) {
            if (entry.getKey().startsWith(kw) || entry.getKey().contains(kw)) {
                matchedIds.addAll(entry.getValue());
            }
        }
        if (matchedIds.isEmpty()) {
            return Collections.emptyList();
        }
        return toolMapper.selectList(new LambdaQueryWrapper<Tool>()
                .in(Tool::getId, matchedIds)
                .eq(Tool::getStatus, 1)
                .orderByAsc(Tool::getSortOrder));
    }

    /**
     * 获取所有启用的分类及其工具
     */
    public List<Category> getCategoriesWithTools() {
        List<Category> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>().orderByAsc(Category::getSortOrder));
        List<Tool> tools = toolMapper.selectList(new LambdaQueryWrapper<Tool>()
                .eq(Tool::getStatus, 1)
                .orderByAsc(Tool::getSortOrder));
        Map<Long, List<Tool>> toolMap = tools.stream()
                .collect(Collectors.groupingBy(Tool::getCategoryId));
        for (Category cat : categories) {
            cat.setDeleted(null); // 不返回逻辑删除标记
        }
        // 将工具关联到分类（用 transient 或 VO）
        return categories;
    }

    /**
     * 获取热门工具 Top N
     */
    public List<Tool> getHotTools(int limit) {
        return toolMapper.selectList(new LambdaQueryWrapper<Tool>()
                .eq(Tool::getStatus, 1)
                .eq(Tool::getIsHot, 1)
                .orderByDesc(Tool::getUseCount)
                .last("LIMIT " + limit));
    }

    /**
     * 增加工具使用计数
     */
    public void incrementUseCount(Long toolId) {
        Tool tool = toolMapper.selectById(toolId);
        if (tool != null) {
            tool.setUseCount((tool.getUseCount() == null ? 0 : tool.getUseCount()) + 1);
            toolMapper.updateById(tool);
        }
    }
}
