package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.GeneratorService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 生成器 API
 */
@RestController
@RequestMapping("/api/tools/generate")
public class GeneratorController {

    private final GeneratorService generatorService;

    public GeneratorController(GeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    @PostMapping("/uuid")
    public Result<Map<String, Object>> uuid(@RequestParam(defaultValue = "5") int count,
                                             @RequestParam(defaultValue = "false") boolean upperCase,
                                             @RequestParam(defaultValue = "false") boolean noDash) {
        return Result.success(generatorService.uuid(count, upperCase, noDash));
    }

    @PostMapping("/password")
    public Result<Map<String, Object>> password(@RequestParam(defaultValue = "16") int length,
                                                 @RequestParam(defaultValue = "true") boolean hasUpper,
                                                 @RequestParam(defaultValue = "true") boolean hasLower,
                                                 @RequestParam(defaultValue = "true") boolean hasDigit,
                                                 @RequestParam(defaultValue = "true") boolean hasSpecial) {
        return Result.success(generatorService.password(length, hasUpper, hasLower, hasDigit, hasSpecial));
    }

    @PostMapping("/random")
    public Result<Map<String, Object>> random(@RequestParam(defaultValue = "number") String type,
                                               @RequestParam(defaultValue = "1") int min,
                                               @RequestParam(defaultValue = "100") int max,
                                               @RequestParam(defaultValue = "10") int count,
                                               @RequestParam(defaultValue = "8") int length) {
        return Result.success(generatorService.random(type, min, max, count, length));
    }

    @PostMapping("/lorem")
    public Result<Map<String, Object>> lorem(@RequestParam(defaultValue = "3") int paragraphs,
                                              @RequestParam(defaultValue = "5") int sentencesPerParagraph) {
        return Result.success(generatorService.lorem(paragraphs, sentencesPerParagraph));
    }

    @PostMapping("/qrcode")
    public Result<Map<String, Object>> qrcode(@RequestParam String text,
                                                @RequestParam(defaultValue = "300") int size) {
        return Result.success(generatorService.qrcode(text, size));
    }
}
