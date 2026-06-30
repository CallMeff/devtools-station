package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.OcrService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * OCR 文字识别 API
 */
@RestController
@RequestMapping("/api/tools/ocr")
public class OcrController {

    private final OcrService ocrService;

    public OcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    /** 单张图片 OCR */
    @PostMapping("/single")
    public Result<Map<String, Object>> recognizeSingle(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", defaultValue = "chi_sim+eng") String language) {
        Map<String, Object> data = ocrService.recognize(file, language);
        if (data.containsKey("error")) {
            return Result.error(400, (String) data.get("error"));
        }
        return Result.success(data);
    }

    /** 批量 OCR */
    @PostMapping("/batch")
    public Result<Map<String, Object>> batchRecognize(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "language", defaultValue = "chi_sim+eng") String language) {
        Map<String, Object> data = ocrService.batchRecognize(files, language);
        if (data.containsKey("error")) {
            return Result.error(400, (String) data.get("error"));
        }
        return Result.success(data);
    }

    /** 检查 Tesseract 是否可用 */
    @GetMapping("/status")
    public Result<Map<String, Object>> status() {
        String tesseract = ocrService.findTesseract();
        Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("available", tesseract != null);
        data.put("path", tesseract);
        return Result.success(data);
    }
}
