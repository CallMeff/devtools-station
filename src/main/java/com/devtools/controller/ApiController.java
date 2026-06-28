package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.Category;
import com.devtools.entity.Tool;
import com.devtools.service.ToolService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 工具分类/搜索 API
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private final ToolService toolService;

    public ApiController(ToolService toolService) {
        this.toolService = toolService;
    }

    @GetMapping("/categories")
    public Result<List<Category>> categories() {
        return Result.success(toolService.getCategoriesWithTools());
    }

    @GetMapping("/tools")
    public Result<List<Tool>> tools(@RequestParam(required = false) String keyword) {
        return Result.success(toolService.searchTools(keyword));
    }

    @GetMapping("/tools/hot")
    public Result<List<Tool>> hotTools(@RequestParam(defaultValue = "8") int limit) {
        return Result.success(toolService.getHotTools(limit));
    }

    @GetMapping("/tools/search")
    public Result<List<Tool>> search(@RequestParam String q) {
        return Result.success(toolService.searchTools(q));
    }
}
