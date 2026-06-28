package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.CryptoService;
import com.devtools.service.TextService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 文本处理 API
 */
@RestController
@RequestMapping("/api/tools/text")
public class TextController {

    private final TextService textService;
    private final CryptoService cryptoService;

    public TextController(TextService textService, CryptoService cryptoService) {
        this.textService = textService;
        this.cryptoService = cryptoService;
    }

    @PostMapping("/diff")
    public Result<Map<String, Object>> diff(@RequestParam String text1,
                                             @RequestParam String text2) {
        return Result.success(textService.diff(text1, text2));
    }

    @PostMapping("/regex")
    public Result<Map<String, Object>> regex(@RequestParam String pattern,
                                              @RequestParam String text,
                                              @RequestParam(required = false) String flags) {
        return Result.success(textService.regex(pattern, text, flags));
    }

    @PostMapping("/count")
    public Result<Map<String, Object>> count(@RequestParam String text) {
        return Result.success(textService.count(text));
    }

    @PostMapping("/unique")
    public Result<Map<String, Object>> unique(@RequestParam String text,
                                               @RequestParam(defaultValue = "false") boolean sort) {
        return Result.success(textService.unique(text, sort));
    }

    @PostMapping("/base64")
    public Result<Map<String, String>> base64(@RequestParam String input,
                                               @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(cryptoService.base64(input, mode));
    }
}
