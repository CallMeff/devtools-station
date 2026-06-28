package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.FormatService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 格式化 API
 */
@RestController
@RequestMapping("/api/tools/format")
public class FormatController {

    private final FormatService formatService;

    public FormatController(FormatService formatService) {
        this.formatService = formatService;
    }

    @PostMapping("/json")
    public Result<Map<String, Object>> json(@RequestParam String input,
                                             @RequestParam(defaultValue = "format") String mode) {
        return Result.success(formatService.jsonFormat(input, mode));
    }

    @PostMapping("/sql")
    public Result<Map<String, Object>> sql(@RequestParam String input) {
        return Result.success(formatService.sqlFormat(input));
    }

    @PostMapping("/css")
    public Result<Map<String, Object>> css(@RequestParam String input,
                                            @RequestParam(defaultValue = "format") String mode) {
        return Result.success(formatService.cssFormat(input, mode));
    }

    @PostMapping("/html")
    public Result<Map<String, Object>> html(@RequestParam String input,
                                              @RequestParam(defaultValue = "format") String mode) {
        return Result.success(formatService.htmlFormat(input, mode));
    }

    @PostMapping("/xml")
    public Result<Map<String, Object>> xml(@RequestParam String input,
                                            @RequestParam(defaultValue = "format") String mode) {
        return Result.success(formatService.xmlFormat(input, mode));
    }
}
