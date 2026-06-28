package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.DevToolsService;
import com.devtools.service.JwtService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 开发工具 API
 */
@RestController
@RequestMapping("/api/tools/dev")
public class DevToolsController {

    private final DevToolsService devToolsService;
    private final JwtService jwtService;

    public DevToolsController(DevToolsService devToolsService, JwtService jwtService) {
        this.devToolsService = devToolsService;
        this.jwtService = jwtService;
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

    @PostMapping("/jwt")
    public Result<Map<String, Object>> jwtDecode(@RequestParam String input) {
        return Result.success(jwtService.decode(input));
    }
}
