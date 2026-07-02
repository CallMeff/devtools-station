package com.devtools.service;

import cn.hutool.core.util.StrUtil;
import com.google.gson.Gson;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 网络工具服务
 */
@Service
public class NetworkService {

    /**
     * UserAgent 解析（简易版）
     */
    public Map<String, Object> parseUA(String ua) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("raw", ua);

        ua = ua.toLowerCase();

        // 操作系统
        if (ua.contains("windows nt 10")) result.put("os", "Windows 10/11");
        else if (ua.contains("windows nt 6.3")) result.put("os", "Windows 8.1");
        else if (ua.contains("windows nt 6.1")) result.put("os", "Windows 7");
        else if (ua.contains("mac os x")) result.put("os", "macOS");
        else if (ua.contains("linux")) result.put("os", "Linux");
        else if (ua.contains("android")) result.put("os", "Android");
        else if (ua.contains("iphone") || ua.contains("ipad")) result.put("os", "iOS");
        else result.put("os", "Unknown");

        // 浏览器
        if (ua.contains("edg/")) result.put("browser", "Microsoft Edge");
        else if (ua.contains("chrome/") && !ua.contains("edg/")) result.put("browser", "Google Chrome");
        else if (ua.contains("safari/") && !ua.contains("chrome")) result.put("browser", "Apple Safari");
        else if (ua.contains("firefox/")) result.put("browser", "Mozilla Firefox");
        else if (ua.contains("opr/") || ua.contains("opera")) result.put("browser", "Opera");
        else result.put("browser", "Unknown");

        // 设备类型
        if (ua.contains("mobile")) result.put("device", "Mobile");
        else if (ua.contains("tablet") || ua.contains("ipad")) result.put("device", "Tablet");
        else result.put("device", "Desktop");

        // 浏览器引擎
        if (ua.contains("webkit")) result.put("engine", "WebKit/Blink");
        else if (ua.contains("gecko")) result.put("engine", "Gecko");
        else result.put("engine", "Unknown");

        return result;
    }

    /**
     * IP 信息（基于请求获取客户端IP）
     */
    public Map<String, Object> getClientIpInfo(String ip, String userAgent) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ip", ip);
        result.put("user_agent", userAgent);

        // 判断IP类型
        if (ip.contains(":")) {
            result.put("ip_version", "IPv6");
        } else {
            result.put("ip_version", "IPv4");
        }

        // 判断是否为内网IP
        result.put("is_private", isPrivateIp(ip));
        result.put("is_loopback", "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip));

        return result;
    }

    private boolean isPrivateIp(String ip) {
        if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
        if (ip.startsWith("172.")) {
            try {
                int second = Integer.parseInt(ip.split("\\.")[1]);
                return second >= 16 && second <= 31;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    /**
     * 批量发送 HTTP 请求（Excel 每行作为请求体）
     *
     * @param file     Excel 文件
     * @param url      目标 URL
     * @param method   HTTP 方法 (GET/POST/PUT/PATCH/DELETE)
     * @param headers  请求头（每行 key:value）
     * @param sendMode 发送模式：one_per_row / all_at_once
     */
    public Map<String, Object> batchHttpRequest(MultipartFile file, String url, String method,
                                                 String headers, String sendMode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("url", url);
        result.put("method", method.toUpperCase());
        result.put("sendMode", sendMode);

        // 1. 解析 Excel
        List<String> parsedHeaders;
        List<Map<String, Object>> rows;
        try {
            Map<String, Object> parsed = parseExcel(file);
            if (parsed.containsKey("error")) {
                result.put("error", parsed.get("error"));
                return result;
            }
            @SuppressWarnings("unchecked")
            List<String> h = (List<String>) parsed.get("headers");
            parsedHeaders = h;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> r = (List<Map<String, Object>>) parsed.get("rows");
            rows = r;
            result.put("rowCount", rows.size());
            result.put("columnCount", parsedHeaders.size());
            result.put("headers", parsedHeaders);
            result.put("fileName", file.getOriginalFilename());
        } catch (Exception e) {
            result.put("error", "Excel 解析失败: " + e.getMessage());
            return result;
        }

        if (rows.isEmpty()) {
            result.put("error", "Excel 文件中没有数据行");
            return result;
        }

        // 2. 解析请求头
        Map<String, String> headerMap = parseHeaders(headers);

        // 3. 构建 HttpClient
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();

        // 4. 发送请求
        List<Map<String, Object>> requestResults = new ArrayList<>();
        long totalStart = System.currentTimeMillis();
        int successCount = 0;
        int failCount = 0;

        if ("all_at_once".equals(sendMode)) {
            // 一次性发送所有数据
            String jsonBody = toJsonArray(rows);
            Map<String, Object> singleResult = sendSingleRequest(client, url, method.toUpperCase(), headerMap, jsonBody);
            singleResult.put("rowIndex", -1);
            singleResult.put("dataCount", rows.size());
            requestResults.add(singleResult);
            if ((int) singleResult.get("status") >= 200 && (int) singleResult.get("status") < 300) {
                successCount = 1;
            } else {
                failCount = 1;
            }
        } else {
            // 逐行发送
            for (int i = 0; i < rows.size(); i++) {
                Map<String, Object> rowData = rows.get(i);
                String jsonBody = toJson(rowData);
                Map<String, Object> rowResult = sendSingleRequest(client, url, method.toUpperCase(), headerMap, jsonBody);
                rowResult.put("rowIndex", i + 1);
                rowResult.put("dataCount", 1);
                rowResult.put("rowData", rowData);
                requestResults.add(rowResult);
                if ((int) rowResult.get("status") >= 200 && (int) rowResult.get("status") < 300) {
                    successCount++;
                } else {
                    failCount++;
                }
            }
        }

        long totalEnd = System.currentTimeMillis();
        result.put("totalTime", totalEnd - totalStart);
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("totalCount", requestResults.size());
        result.put("results", requestResults);

        return result;
    }

    /**
     * 批量发送 HTTP 请求（直接粘贴 JSON 对象文本作为数据源）
     *
     * @param jsonText 连续的 JSON 对象文本，无分隔符，如 {}{}{}
     * @param url      目标 URL
     * @param method   HTTP 方法
     * @param headers  请求头
     * @param sendMode 发送模式
     */
    public Map<String, Object> batchHttpJsonRequest(String jsonText, String url, String method,
                                                     String headers, String sendMode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("url", url);
        result.put("method", method.toUpperCase());
        result.put("sendMode", sendMode);

        // 1. 解析连续的 JSON 对象（无分隔符）
        List<Map<String, Object>> rows;
        try {
            rows = parseConcatenatedJson(jsonText);
            if (rows.isEmpty()) {
                result.put("error", "未识别到有效的 JSON 对象");
                return result;
            }
            result.put("rowCount", rows.size());
            if (!rows.isEmpty()) {
                result.put("headers", new ArrayList<>(rows.get(0).keySet()));
                result.put("columnCount", rows.get(0).size());
            }
        } catch (Exception e) {
            result.put("error", "JSON 解析失败: " + e.getMessage());
            return result;
        }

        // 2. 解析请求头
        Map<String, String> headerMap = parseHeaders(headers);

        // 3. 构建 HttpClient
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();

        // 4. 发送请求
        List<Map<String, Object>> requestResults = new ArrayList<>();
        long totalStart = System.currentTimeMillis();
        int successCount = 0;
        int failCount = 0;

        if ("all_at_once".equals(sendMode)) {
            String jsonBody = toJsonArray(rows);
            Map<String, Object> singleResult = sendSingleRequest(client, url, method.toUpperCase(), headerMap, jsonBody);
            singleResult.put("rowIndex", -1);
            singleResult.put("dataCount", rows.size());
            requestResults.add(singleResult);
            if ((int) singleResult.get("status") >= 200 && (int) singleResult.get("status") < 300) {
                successCount = 1;
            } else {
                failCount = 1;
            }
        } else {
            for (int i = 0; i < rows.size(); i++) {
                Map<String, Object> rowData = rows.get(i);
                String jsonBody = toJson(rowData);
                Map<String, Object> rowResult = sendSingleRequest(client, url, method.toUpperCase(), headerMap, jsonBody);
                rowResult.put("rowIndex", i + 1);
                rowResult.put("dataCount", 1);
                rowResult.put("rowData", rowData);
                requestResults.add(rowResult);
                if ((int) rowResult.get("status") >= 200 && (int) rowResult.get("status") < 300) {
                    successCount++;
                } else {
                    failCount++;
                }
            }
        }

        long totalEnd = System.currentTimeMillis();
        result.put("totalTime", totalEnd - totalStart);
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("totalCount", requestResults.size());
        result.put("results", requestResults);

        return result;
    }

    /**
     * 解析连续的 JSON 对象文本（无分隔符的 {}{}{} 格式）
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> parseConcatenatedJson(String text) {
        List<Map<String, Object>> objects = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) return objects;

        // 按 } 和 { 的边界拆分为独立 JSON 字符串
        List<String> segments = splitJsonObjects(text);
        for (String seg : segments) {
            String trimmed = seg.trim();
            if (trimmed.isEmpty()) continue;
            try {
                Map<String, Object> obj = gson.fromJson(trimmed, Map.class);
                if (obj != null && !obj.isEmpty()) {
                    objects.add(obj);
                }
            } catch (Exception ignored) {
                // 跳过无法解析的片段
            }
        }
        return objects;
    }

    /**
     * 按 JSON 对象边界拆分文本
     * 在每次找到匹配的 } 闭合时作为一个对象
     */
    private List<String> splitJsonObjects(String text) {
        List<String> parts = new ArrayList<>();
        int depth = 0;
        boolean inString = false;
        boolean escape = false;
        int start = -1;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);

            if (escape) {
                escape = false;
                continue;
            }

            if (c == '\\') {
                escape = true;
                continue;
            }

            if (c == '"') {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (c == '{') {
                if (depth == 0) start = i;
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0 && start >= 0) {
                    parts.add(text.substring(start, i + 1));
                    start = -1;
                }
            }
        }

        return parts;
    }

    /**
     * 发送单次 HTTP 请求
     */
    private Map<String, Object> sendSingleRequest(HttpClient client, String url, String method,
                                                   Map<String, String> headers, String jsonBody) {
        Map<String, Object> result = new LinkedHashMap<>();
        long start = System.currentTimeMillis();

        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30));

            // 设置请求头
            builder.header("Content-Type", "application/json");
            for (Map.Entry<String, String> e : headers.entrySet()) {
                builder.header(e.getKey(), e.getValue());
            }

            // 设置方法和请求体
            String upperMethod = method.toUpperCase();
            HttpRequest.BodyPublisher bodyPublisher;
            if ("GET".equals(upperMethod) || "HEAD".equals(upperMethod) || "DELETE".equals(upperMethod)) {
                // GET/HEAD/DELETE 通常不带 body，但支持的话也可以
                bodyPublisher = HttpRequest.BodyPublishers.noBody();
            } else {
                bodyPublisher = HttpRequest.BodyPublishers.ofString(jsonBody, java.nio.charset.StandardCharsets.UTF_8);
            }

            builder.method(upperMethod, bodyPublisher);
            HttpRequest request = builder.build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            long elapsed = System.currentTimeMillis() - start;

            result.put("status", response.statusCode());
            result.put("time", elapsed);
            result.put("body", truncateBody(response.body(), 5000));
            result.put("error", null);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            result.put("status", 0);
            result.put("time", elapsed);
            result.put("body", null);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 解析 Excel 文件，返回 headers 和 rows
     */
    private Map<String, Object> parseExcel(MultipartFile file) throws Exception {
        Map<String, Object> result = new LinkedHashMap<>();
        try (java.io.InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getLastRowNum() < 1) {
                result.put("error", "Excel 文件为空或没有数据行");
                return result;
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                result.put("error", "Excel 文件第一行为空，无法获取表头");
                return result;
            }

            List<String> headers = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String header = getCellStringValue(cell);
                if (header.isEmpty()) {
                    header = getColumnLetter(i);
                }
                headers.add(header);
            }

            List<Map<String, Object>> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;
                Map<String, Object> obj = new LinkedHashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    Cell cell = row.getCell(c);
                    obj.put(headers.get(c), getCellValue(cell));
                }
                rows.add(obj);
            }

            result.put("headers", headers);
            result.put("rows", rows);
        }
        return result;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double v = cell.getNumericCellValue();
                if (v == Math.floor(v) && !Double.isInfinite(v)) {
                    yield String.valueOf((long) v);
                }
                yield String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue().trim();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> "";
        };
    }

    private Object getCellValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double v = cell.getNumericCellValue();
                if (v == Math.floor(v) && !Double.isInfinite(v)) {
                    yield (long) v;
                }
                yield v;
            }
            case BOOLEAN -> cell.getBooleanCellValue();
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield cell.getNumericCellValue();
                }
            }
            default -> null;
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK
                    && !getCellStringValue(cell).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String getColumnLetter(int index) {
        StringBuilder sb = new StringBuilder();
        int n = index;
        while (n >= 0) {
            sb.insert(0, (char) ('A' + (n % 26)));
            n = n / 26 - 1;
        }
        return sb.toString();
    }

    /**
     * 解析请求头字符串（每行 key:value）
     */
    private Map<String, String> parseHeaders(String headers) {
        Map<String, String> map = new LinkedHashMap<>();
        if (headers == null || headers.trim().isEmpty()) return map;
        for (String line : headers.split("\\n")) {
            line = line.trim();
            if (line.isEmpty()) continue;
            int idx = line.indexOf(':');
            if (idx > 0) {
                String key = line.substring(0, idx).trim();
                String value = line.substring(idx + 1).trim();
                if (!key.isEmpty()) {
                    map.put(key, value);
                }
            }
        }
        return map;
    }

    private final Gson gson = new Gson();

    private String toJson(Map<String, Object> map) {
        return gson.toJson(map);
    }

    private String toJsonArray(List<Map<String, Object>> rows) {
        return gson.toJson(rows);
    }

    private String truncateBody(String body, int maxLen) {
        if (body == null) return null;
        if (body.length() <= maxLen) return body;
        return body.substring(0, maxLen) + "\n... (截断，共 " + body.length() + " 字符)";
    }

    /**
     * 测试回显接口 —— 用于批量 HTTP 工具本地试功能
     * 返回接收到的请求体 + 元信息
     */
    public Map<String, Object> echoTestRequest(Map<String, Object> body) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "✅ 批量HTTP测试接口 - 请求已收到!");
        result.put("receivedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        if (body != null && !body.isEmpty()) {
            // 判断是单条数据还是数组
            result.put("dataType", "single");
            result.put("fieldCount", body.size());
            result.put("fields", new ArrayList<>(body.keySet()));
            result.put("received", body);
        } else {
            result.put("dataType", "empty");
            result.put("tip", "未收到请求体数据，请确认 Excel 文件包含数据行");
        }

        return result;
    }

    /**
     * 批量HTTP测试接口 —— 接收 JSON 数组的回显
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> echoTestRequestArray(Object body) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "✅ 批量HTTP测试接口 - 请求已收到! (一次性模式)");
        result.put("receivedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        if (body instanceof List list) {
            result.put("dataType", "array");
            result.put("rowCount", list.size());
            result.put("received", body);
            // 每行字段名汇总
            if (!list.isEmpty() && list.get(0) instanceof Map m) {
                result.put("fields", new ArrayList<>(m.keySet()));
                result.put("fieldCount", m.size());
            }
        } else if (body instanceof Map map) {
            // 兼容包装的情况
            result.put("dataType", "single");
            result.put("fieldCount", map.size());
            result.put("fields", new ArrayList<>(map.keySet()));
            result.put("received", map);
        } else {
            result.put("dataType", "unknown");
            result.put("tip", "未收到有效请求体数据");
        }

        return result;
    }

    /**
     * 生成批量 HTTP 请求的 Excel 模板文件
     */
    public byte[] generateBatchHttpTemplate() {
        try (Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("批量请求数据");

            // 列宽
            sheet.setColumnWidth(0, 4000);
            sheet.setColumnWidth(1, 2500);
            sheet.setColumnWidth(2, 4500);
            sheet.setColumnWidth(3, 5500);

            // 表头样式
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // 表头行
            Row headerRow = sheet.createRow(0);
            String[] headers = {"姓名", "年龄", "城市", "邮箱"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 示例数据行
            Object[][] data = {
                    {"张三", 28, "北京", "zhangsan@example.com"},
                    {"李四", 35, "上海", "lisi@example.com"},
                    {"王五", 22, "深圳", "wangwu@example.com"}
            };

            for (int r = 0; r < data.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < data[r].length; c++) {
                    Cell cell = row.createCell(c);
                    if (data[r][c] instanceof Number) {
                        cell.setCellValue(((Number) data[r][c]).doubleValue());
                    } else {
                        cell.setCellValue((String) data[r][c]);
                    }
                }
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("生成模板文件失败: " + e.getMessage(), e);
        }
    }

    /**
     * HTTP 状态码参考
     */
    public Map<String, Object> httpStatusCodes() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("categories", new Object[]{
                Map.of("name", "1xx 信息", "codes", new Object[]{
                        Map.of("code", 100, "name", "Continue", "desc", "继续请求"),
                        Map.of("code", 101, "name", "Switching Protocols", "desc", "切换协议"),
                }),
                Map.of("name", "2xx 成功", "codes", new Object[]{
                        Map.of("code", 200, "name", "OK", "desc", "请求成功"),
                        Map.of("code", 201, "name", "Created", "desc", "已创建"),
                        Map.of("code", 204, "name", "No Content", "desc", "无内容"),
                }),
                Map.of("name", "3xx 重定向", "codes", new Object[]{
                        Map.of("code", 301, "name", "Moved Permanently", "desc", "永久移动"),
                        Map.of("code", 302, "name", "Found", "desc", "临时移动"),
                        Map.of("code", 304, "name", "Not Modified", "desc", "未修改"),
                }),
                Map.of("name", "4xx 客户端错误", "codes", new Object[]{
                        Map.of("code", 400, "name", "Bad Request", "desc", "错误请求"),
                        Map.of("code", 401, "name", "Unauthorized", "desc", "未授权"),
                        Map.of("code", 403, "name", "Forbidden", "desc", "禁止访问"),
                        Map.of("code", 404, "name", "Not Found", "desc", "未找到"),
                        Map.of("code", 405, "name", "Method Not Allowed", "desc", "方法不允许"),
                        Map.of("code", 429, "name", "Too Many Requests", "desc", "请求过多"),
                }),
                Map.of("name", "5xx 服务端错误", "codes", new Object[]{
                        Map.of("code", 500, "name", "Internal Server Error", "desc", "服务器内部错误"),
                        Map.of("code", 502, "name", "Bad Gateway", "desc", "网关错误"),
                        Map.of("code", 503, "name", "Service Unavailable", "desc", "服务不可用"),
                }),
        });
        return result;
    }
}
