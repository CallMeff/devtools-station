package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.ConverterService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 转换器 API
 */
@RestController
@RequestMapping("/api/tools/convert")
public class ConverterController {

    private final ConverterService converterService;

    public ConverterController(ConverterService converterService) {
        this.converterService = converterService;
    }

    @PostMapping("/timestamp")
    public Result<Map<String, Object>> timestamp(@RequestParam String input,
                                                   @RequestParam(defaultValue = "auto") String mode) {
        return Result.success(converterService.timestamp(input, mode));
    }

    @PostMapping("/radix")
    public Result<Map<String, Object>> radix(@RequestParam String input,
                                              @RequestParam(defaultValue = "10") int fromRadix) {
        return Result.success(converterService.radix(input, fromRadix));
    }

    @PostMapping("/color")
    public Result<Map<String, Object>> colorConvert(@RequestParam String input) {
        return Result.success(converterService.colorConvert(input));
    }

    @PostMapping("/case")
    public Result<Map<String, String>> caseConvert(@RequestParam String input,
                                                    @RequestParam(defaultValue = "lower") String style) {
        return Result.success(converterService.caseConvert(input, style));
    }

    @PostMapping("/unicode")
    public Result<Map<String, String>> unicode(@RequestParam String input,
                                                 @RequestParam(defaultValue = "decode") String mode) {
        return Result.success(converterService.unicodeConvert(input, mode));
    }
}
