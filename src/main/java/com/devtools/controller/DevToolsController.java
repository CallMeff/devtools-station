package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.DevToolsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 开发工具 API
 */
@RestController
@RequestMapping("/api/tools/dev")
public class DevToolsController {

    private final DevToolsService devToolsService;

    public DevToolsController(DevToolsService devToolsService) {
        this.devToolsService = devToolsService;
    }

    @PostMapping("/cron")
    public Result<Map<String, Object>> parseCron(@RequestParam String expression) {
        return Result.success(devToolsService.parseCron(expression));
    }

    @GetMapping("/git")
    public Result<Map<String, Object>> gitCheatsheet() {
        return Result.success(devToolsService.gitCheatsheet());
    }

    @GetMapping("/mime")
    public Result<Map<String, Object>> mimeTypes() {
        return Result.success(devToolsService.mimeTypes());
    }
}
