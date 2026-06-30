package com.devtools.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * OCR 文字识别服务 — 使用 Tesseract CLI
 */
@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);
    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "bmp", "tiff", "tif", "webp");
    private static final int MAX_BATCH_FILES = 20;
    private static final long MAX_SINGLE_SIZE = 10 * 1024 * 1024; // 10 MB

    /** 查找 tesseract 可执行文件路径 */
    public String findTesseract() {
        // 先检查 PATH
        try {
            Process p = new ProcessBuilder("tesseract", "--version").redirectErrorStream(true).start();
            if (p.waitFor(5, TimeUnit.SECONDS)) {
                return "tesseract";
            }
        } catch (Exception ignored) {}

        // Windows 常见安装路径
        String[] candidates = {
            "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
            "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
            "/opt/homebrew/bin/tesseract"
        };
        for (String path : candidates) {
            if (Files.exists(Path.of(path)) && Files.isExecutable(Path.of(path))) {
                return path;
            }
        }
        return null;
    }

    /** 单张图片 OCR */
    public Map<String, Object> recognize(MultipartFile file, String language) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fileName", file.getOriginalFilename());
        result.put("fileSize", file.getSize());
        result.put("language", language);

        // 校验
        String err = validateFile(file);
        if (err != null) {
            result.put("error", err);
            return result;
        }

        String tesseract = findTesseract();
        if (tesseract == null) {
            result.put("error", "⚠️ 未检测到 Tesseract OCR 引擎。请安装 Tesseract：\n" +
                    "Windows: https://github.com/UB-Mannheim/tesseract/wiki\n" +
                    "  - 安装时勾选中文简体和英文语言包\n" +
                    "  - 或安装后运行: tesseract --list-langs 确认语言包\n" +
                    "macOS: brew install tesseract tesseract-lang\n" +
                    "Linux: sudo apt install tesseract-ocr tesseract-ocr-chi-sim");
            return result;
        }

        Path tempFile = null;
        try {
            // 保存上传文件到临时目录
            String ext = getExtension(Objects.requireNonNull(file.getOriginalFilename()));
            tempFile = Files.createTempFile("ocr_", "." + ext);
            file.transferTo(tempFile.toFile());

            // 执行 OCR
            String text = runTesseract(tesseract, tempFile, language);
            result.put("text", text);
            result.put("textLength", text.length());
            result.put("lineCount", text.lines().count());
            result.put("success", true);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            result.put("error", "OCR 处理被中断: " + e.getMessage());
        } catch (IOException e) {
            result.put("error", "Tesseract 执行失败: " + e.getMessage() +
                    "\n\n请确认:\n1. Tesseract 已正确安装\n2. 所选语言包已安装（chi_sim/eng）");
        } catch (Exception e) {
            result.put("error", "OCR 识别异常: " + e.getMessage());
        } finally {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
            }
        }

        return result;
    }

    /** 批量 OCR 识别 */
    public Map<String, Object> batchRecognize(List<MultipartFile> files, String language) {
        Map<String, Object> result = new LinkedHashMap<>();

        if (files == null || files.isEmpty()) {
            result.put("error", "请选择要识别的图片文件");
            return result;
        }
        if (files.size() > MAX_BATCH_FILES) {
            result.put("error", "批量识别最多支持 " + MAX_BATCH_FILES + " 个文件，当前选择了 " + files.size() + " 个");
            return result;
        }

        String tesseract = findTesseract();
        if (tesseract == null) {
            result.put("error", "⚠️ 未检测到 Tesseract OCR 引擎。请安装 Tesseract。");
            return result;
        }

        List<Map<String, Object>> items = new ArrayList<>();
        int successCount = 0, failCount = 0;
        long totalChars = 0;
        long startTime = System.currentTimeMillis();

        for (MultipartFile file : files) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("fileName", file.getOriginalFilename());
            item.put("fileSize", file.getSize());

            String err = validateFile(file);
            if (err != null) {
                item.put("error", err);
                items.add(item);
                failCount++;
                continue;
            }

            Path tempFile = null;
            try {
                String ext = getExtension(Objects.requireNonNull(file.getOriginalFilename()));
                tempFile = Files.createTempFile("ocr_batch_", "." + ext);
                file.transferTo(tempFile.toFile());

                String text = runTesseract(tesseract, tempFile, language);
                item.put("text", text);
                item.put("textLength", text.length());
                item.put("success", true);
                successCount++;
                totalChars += text.length();

            } catch (Exception e) {
                item.put("error", "识别失败: " + e.getMessage());
                failCount++;
            } finally {
                if (tempFile != null) {
                    try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
                }
            }

            items.add(item);
        }

        long elapsed = System.currentTimeMillis() - startTime;
        result.put("items", items);
        result.put("total", files.size());
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("totalChars", totalChars);
        result.put("elapsed", (elapsed / 1000.0) + "s");
        result.put("language", language);

        return result;
    }

    /** 运行 tesseract CLI */
    private String runTesseract(String tesseractPath, Path imagePath, String language)
            throws IOException, InterruptedException {

        // tesseract input.png stdout -l chi_sim+eng
        ProcessBuilder pb = new ProcessBuilder(
                tesseractPath,
                imagePath.toAbsolutePath().toString(),
                "stdout",
                "-l", (language != null && !language.isEmpty()) ? language : "chi_sim+eng"
        );
        pb.redirectErrorStream(true);
        Process p = pb.start();

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        p.getInputStream().transferTo(bos);

        boolean finished = p.waitFor(120, TimeUnit.SECONDS);
        if (!finished) {
            p.destroyForcibly();
            throw new IOException("Tesseract 执行超时（120秒），图片可能过大或太复杂");
        }

        int exitCode = p.exitValue();
        String output = bos.toString(StandardCharsets.UTF_8).trim();

        if (exitCode != 0) {
            log.warn("Tesseract exited with code {}: {}", exitCode, output);
            if (output.contains("Error opening data file") || output.contains("Failed to load language")) {
                throw new IOException("语言包未安装。Tesseract 输出: " + output +
                        "\n请安装中文简体语言包: https://github.com/tesseract-ocr/tessdata/raw/main/chi_sim.traineddata");
            }
            throw new IOException("Tesseract 执行错误 (exit=" + exitCode + "): " + output);
        }

        // 如果识别结果为空，给出提醒
        if (output.isEmpty()) {
            output = "(未识别到文字，请检查图片是否包含清晰文字)";
        }

        return output;
    }

    /** 校验上传文件 */
    private String validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "文件为空";
        }
        if (file.getSize() > MAX_SINGLE_SIZE) {
            return "文件过大（最大 10MB），当前文件: " + (file.getSize() / 1024 / 1024) + " MB";
        }
        String ext = getExtension(file.getOriginalFilename());
        if (ext == null || !SUPPORTED_EXTENSIONS.contains(ext.toLowerCase())) {
            return "不支持的文件格式: ." + ext + "，支持: " + String.join(", ", SUPPORTED_EXTENSIONS);
        }
        return null;
    }

    /** 获取文件扩展名 */
    private String getExtension(String filename) {
        if (filename == null) return null;
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1) : null;
    }
}
