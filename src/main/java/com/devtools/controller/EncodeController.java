package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.EncodeService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 编码解码 API
 */
@RestController
@RequestMapping("/api/tools/encode")
public class EncodeController {

    private final EncodeService encodeService;

    public EncodeController(EncodeService encodeService) {
        this.encodeService = encodeService;
    }

    @PostMapping("/url")
    public Result<Map<String, String>> urlCode(@RequestParam String input,
                                                 @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(encodeService.urlCode(input, mode));
    }

    @PostMapping("/html")
    public Result<Map<String, String>> htmlEntity(@RequestParam String input,
                                                    @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(encodeService.htmlEntity(input, mode));
    }

    @PostMapping("/morse")
    public Result<Map<String, String>> morse(@RequestParam String input,
                                               @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(encodeService.morse(input, mode));
    }
}
