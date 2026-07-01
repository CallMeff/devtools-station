package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.ConverterService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping("/excel2json")
    public Result<Map<String, Object>> excelToJson(@RequestParam(value = "file", required = false) MultipartFile file,
                                                    @RequestParam(defaultValue = "array") String mode) {
        return Result.success(converterService.excelToJson(file, mode));
    }

    /**
     * 下载 Excel 模板文件
     */
    @GetMapping("/excel2json/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] data = converterService.generateTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment",
                java.net.URLEncoder.encode("Excel转JSON模板.xlsx", java.nio.charset.StandardCharsets.UTF_8)
                        .replace("+", "%20"));
        headers.setContentLength(data.length);

        return ResponseEntity.ok().headers(headers).body(data);
    }

    /**
     * 数字转中文大写金额
     */
    @PostMapping("/rmb-upper")
    public Result<Map<String, Object>> rmbUpper(@RequestParam String input) {
        return Result.success(converterService.rmbUpper(input));
    }

    /**
     * JSON ↔ YAML 互转（统一入口）
     */
    @PostMapping("/json-yaml")
    public Result<Map<String, Object>> jsonYaml(@RequestParam String input,
                                                 @RequestParam(defaultValue = "json2yaml") String mode) {
        if ("yaml2json".equals(mode)) {
            return Result.success(converterService.yamlToJson(input));
        }
        return Result.success(converterService.jsonToYaml(input));
    }

    /**
     * JSON → YAML 转换
     */
    @PostMapping("/json2yaml")
    public Result<Map<String, Object>> jsonToYaml(@RequestParam String input) {
        return Result.success(converterService.jsonToYaml(input));
    }

    /**
     * YAML → JSON 转换
     */
    @PostMapping("/yaml2json")
    public Result<Map<String, Object>> yamlToJson(@RequestParam String input) {
        return Result.success(converterService.yamlToJson(input));
    }
}
