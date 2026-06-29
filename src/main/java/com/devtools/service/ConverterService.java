package com.devtools.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.StrUtil;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

/**
 * 转换器服务
 */
@Service
public class ConverterService {

    /**
     * 时间戳转换 — 自动识别输入类型，返回全格式结果
     */
    public Map<String, Object> timestamp(String input, String mode) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String trimmed = input.trim();
            long timestampMillis;

            // 自动识别：纯数字 → 时间戳；否则 → 日期解析
            if (trimmed.matches("-?\\d+")) {
                long ts = Long.parseLong(trimmed);
                // 自动判断秒 / 毫秒
                timestampMillis = ts < 1_000_000_000_000L ? ts * 1000 : ts;
            } else {
                var date = DateUtil.parse(trimmed);
                timestampMillis = date.getTime();
            }

            Instant instant = Instant.ofEpochMilli(timestampMillis);
            ZoneId zone = ZoneId.systemDefault();
            ZonedDateTime local = instant.atZone(zone);
            ZonedDateTime utc = instant.atZone(ZoneOffset.UTC);

            DateTimeFormatter dtf       = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            DateTimeFormatter dtfSlash  = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
            DateTimeFormatter dtfCN     = DateTimeFormatter.ofPattern("yyyy年M月d日 HH:mm:ss");
            DateTimeFormatter df        = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter dfSlash   = DateTimeFormatter.ofPattern("yyyy/MM/dd");
            DateTimeFormatter tf        = DateTimeFormatter.ofPattern("HH:mm:ss");
            DateTimeFormatter isoFmt    = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            DateTimeFormatter isoFull   = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
            DateTimeFormatter rfc2822   = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);
            DateTimeFormatter ymdCompact = DateTimeFormatter.ofPattern("yyyyMMdd");
            DateTimeFormatter md        = DateTimeFormatter.ofPattern("M月d日");
            DateTimeFormatter hmsCompact = DateTimeFormatter.ofPattern("HHmmss");
            DateTimeFormatter weekdayShort = DateTimeFormatter.ofPattern("E", Locale.CHINESE);

            long tsSec = timestampMillis / 1000;

            result.put("timestamp_second",    tsSec);
            result.put("timestamp_millis",    timestampMillis);
            result.put("timestamp_nano",      timestampMillis * 1_000_000L);
            result.put("datetime",            local.format(dtf));
            result.put("datetime_slash",      local.format(dtfSlash));
            result.put("datetime_cn",         local.format(dtfCN));
            result.put("date",                local.format(df));
            result.put("date_slash",          local.format(dfSlash));
            result.put("date_compact",        local.format(ymdCompact));
            result.put("time",                local.format(tf));
            result.put("time_compact",        local.format(hmsCompact));
            result.put("year",                local.getYear());
            result.put("month",               local.getMonthValue());
            result.put("day",                 local.getDayOfMonth());
            result.put("hour",                local.getHour());
            result.put("minute",              local.getMinute());
            result.put("second",              local.getSecond());
            result.put("day_of_week",         local.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.CHINESE));
            result.put("day_of_week_short",   local.format(weekdayShort));
            result.put("month_day",           local.format(md));
            result.put("iso8601",             local.format(isoFmt));
            result.put("iso8601_full",        local.format(isoFull));
            result.put("rfc2822",             local.format(rfc2822));
            result.put("utc",                 utc.format(dtf));
            result.put("utc_iso",             utc.format(isoFull));
            result.put("utc_offset",          local.getOffset().toString());
            result.put("timezone",            zone.toString());

        } catch (Exception e) {
            result.put("error", "输入格式错误，请输入有效的时间戳（秒/毫秒）或日期时间（如 2024-01-01 12:00:00）");
        }
        return result;
    }

    /**
     * 进制转换
     */
    public Map<String, Object> radix(String input, int fromRadix) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            long decimal = Long.parseLong(input.trim(), fromRadix);
            result.put("input", input);
            result.put("from_radix", fromRadix);
            result.put("decimal", String.valueOf(decimal));
            result.put("binary", Long.toBinaryString(decimal));
            result.put("octal", Long.toOctalString(decimal));
            result.put("hex", Long.toHexString(decimal).toUpperCase());
        } catch (Exception e) {
            result.put("error", "转换失败，请检查输入和进制");
        }
        return result;
    }

    /**
     * 大小写风格转换
     */
    public Map<String, String> caseConvert(String input, String style) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("input", input);
        result.put("style", style);
        try {
            String output = switch (style) {
                case "upper" -> input.toUpperCase();
                case "lower" -> input.toLowerCase();
                case "camel" -> toCamelCase(input);
                case "snake" -> toSnakeCase(input);
                case "kebab" -> toKebabCase(input);
                case "constant" -> toConstantCase(input);
                case "pascal" -> toPascalCase(input);
                default -> input;
            };
            result.put("output", output);
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * 颜色转换 HEX/RGB/HSL
     */
    public Map<String, Object> colorConvert(String input) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("input", input);
        try {
            input = input.trim();
            if (input.startsWith("#")) {
                int[] rgb = parseHexColor(input);
                putColorFormats(result, rgb[0], rgb[1], rgb[2]);
            } else if (input.toLowerCase().startsWith("rgb")) {
                int[] rgb = parseRgbColor(input);
                putColorFormats(result, rgb[0], rgb[1], rgb[2]);
            } else if (input.toLowerCase().startsWith("hsl")) {
                int[] rgb = hslToRgb(input);
                putColorFormats(result, rgb[0], rgb[1], rgb[2]);
            }
        } catch (Exception e) {
            result.put("error", "颜色格式错误，支持 #RGB、#RRGGBB、rgb(r,g,b) 或 hsl(h,s%,l%)");
        }
        return result;
    }

    private String toCamelCase(String input) {
        List<String> words = splitWords(input);
        if (words.isEmpty()) return "";
        StringBuilder sb = new StringBuilder(words.get(0).toLowerCase());
        for (int i = 1; i < words.size(); i++) {
            sb.append(StrUtil.upperFirst(words.get(i).toLowerCase()));
        }
        return sb.toString();
    }

    private String toSnakeCase(String input) {
        return String.join("_", splitWords(input)).toLowerCase();
    }

    private String toKebabCase(String input) {
        return String.join("-", splitWords(input)).toLowerCase();
    }

    private String toConstantCase(String input) {
        return toSnakeCase(input).toUpperCase();
    }

    private String toPascalCase(String input) {
        StringBuilder sb = new StringBuilder();
        for (String word : splitWords(input)) {
            sb.append(StrUtil.upperFirst(word.toLowerCase()));
        }
        return sb.toString();
    }

    private List<String> splitWords(String input) {
        if (input == null) return Collections.emptyList();
        String normalized = input
                .replaceAll("([a-z0-9])([A-Z])", "$1 $2")
                .replaceAll("([A-Z]+)([A-Z][a-z])", "$1 $2")
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}]+", " ")
                .trim();
        if (normalized.isEmpty()) return Collections.emptyList();
        return Arrays.asList(normalized.split("\\s+"));
    }

    private int[] parseHexColor(String input) {
        String hex = input.replace("#", "").trim();
        if (hex.length() == 3) {
            hex = "" + hex.charAt(0) + hex.charAt(0)
                    + hex.charAt(1) + hex.charAt(1)
                    + hex.charAt(2) + hex.charAt(2);
        }
        if (!hex.matches("[0-9a-fA-F]{6}")) {
            throw new IllegalArgumentException("Invalid HEX color");
        }
        return new int[]{
                Integer.parseInt(hex.substring(0, 2), 16),
                Integer.parseInt(hex.substring(2, 4), 16),
                Integer.parseInt(hex.substring(4, 6), 16)
        };
    }

    private int[] parseRgbColor(String input) {
        String[] parts = input.replaceAll("(?i)rgba?\\(", "")
                .replace(")", "")
                .split(",");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Invalid RGB color");
        }
        return new int[]{
                clampColor(Integer.parseInt(parts[0].trim())),
                clampColor(Integer.parseInt(parts[1].trim())),
                clampColor(Integer.parseInt(parts[2].trim()))
        };
    }

    private int[] hslToRgb(String input) {
        String[] parts = input.replaceAll("(?i)hsla?\\(", "")
                .replace(")", "")
                .replace("%", "")
                .split(",");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Invalid HSL color");
        }
        double h = Double.parseDouble(parts[0].trim()) % 360;
        if (h < 0) h += 360;
        double s = Double.parseDouble(parts[1].trim()) / 100.0;
        double l = Double.parseDouble(parts[2].trim()) / 100.0;

        double c = (1 - Math.abs(2 * l - 1)) * s;
        double x = c * (1 - Math.abs((h / 60.0) % 2 - 1));
        double m = l - c / 2;
        double r1, g1, b1;
        if (h < 60) {
            r1 = c; g1 = x; b1 = 0;
        } else if (h < 120) {
            r1 = x; g1 = c; b1 = 0;
        } else if (h < 180) {
            r1 = 0; g1 = c; b1 = x;
        } else if (h < 240) {
            r1 = 0; g1 = x; b1 = c;
        } else if (h < 300) {
            r1 = x; g1 = 0; b1 = c;
        } else {
            r1 = c; g1 = 0; b1 = x;
        }
        return new int[]{
                clampColor((int) Math.round((r1 + m) * 255)),
                clampColor((int) Math.round((g1 + m) * 255)),
                clampColor((int) Math.round((b1 + m) * 255))
        };
    }

    private void putColorFormats(Map<String, Object> result, int r, int g, int b) {
        result.put("hex", String.format("#%02X%02X%02X", r, g, b));
        result.put("rgb", String.format("rgb(%d, %d, %d)", r, g, b));
        result.put("rgba", String.format("rgba(%d, %d, %d, 1)", r, g, b));
        result.put("hsl", rgbToHsl(r, g, b));
    }

    private String rgbToHsl(int r, int g, int b) {
        double rd = r / 255.0;
        double gd = g / 255.0;
        double bd = b / 255.0;
        double max = Math.max(rd, Math.max(gd, bd));
        double min = Math.min(rd, Math.min(gd, bd));
        double h;
        double s;
        double l = (max + min) / 2.0;
        if (max == min) {
            h = 0;
            s = 0;
        } else {
            double d = max - min;
            s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min);
            if (max == rd) {
                h = ((gd - bd) / d + (gd < bd ? 6 : 0)) * 60;
            } else if (max == gd) {
                h = ((bd - rd) / d + 2) * 60;
            } else {
                h = ((rd - gd) / d + 4) * 60;
            }
        }
        return String.format("hsl(%d, %d%%, %d%%)", Math.round(h), Math.round(s * 100), Math.round(l * 100));
    }

    private int clampColor(int value) {
        return Math.max(0, Math.min(255, value));
    }

    /**
     * Unicode 编解码
     */
    public Map<String, String> unicodeConvert(String input, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        result.put("input", input);
        try {
            if ("encode".equals(mode)) {
                StringBuilder sb = new StringBuilder();
                for (char c : input.toCharArray()) {
                    if (c > 127) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
                result.put("output", sb.toString());
            } else {
                StringBuilder sb = new StringBuilder();
                int i = 0;
                while (i < input.length()) {
                    if (i + 5 < input.length() && input.charAt(i) == '\\' && input.charAt(i + 1) == 'u') {
                        String hex = input.substring(i + 2, i + 6);
                        sb.append((char) Integer.parseInt(hex, 16));
                        i += 6;
                    } else {
                        sb.append(input.charAt(i));
                        i++;
                    }
                }
                result.put("output", sb.toString());
            }
        } catch (Exception e) {
            result.put("error", "Unicode 转换失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * Excel 转 JSON
     * @param file  上传的 Excel 文件 (.xlsx / .xls)
     * @param mode  "array" - 所有行转为一个 JSON 数组; "objects" - 每行转为一个 JSON 对象
     */
    public Map<String, Object> excelToJson(MultipartFile file, String mode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", mode);

        if (file == null || file.isEmpty()) {
            result.put("error", "请选择要上传的 Excel 文件");
            result.put("errorCode", "EMPTY_FILE");
            return result;
        }

        String filename = file.getOriginalFilename();
        result.put("fileName", filename);

        if (filename != null) {
            String lower = filename.toLowerCase();
            if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
                result.put("error", "不支持的文件格式，请上传 .xlsx 或 .xls 文件");
                result.put("errorCode", "INVALID_FORMAT");
                return result;
            }
        }

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            int sheetCount = workbook.getNumberOfSheets();
            result.put("sheetCount", sheetCount);
            result.put("sheetName", workbook.getSheetName(0));

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getLastRowNum() < 1) {
                result.put("error", "Excel 文件为空或没有数据行");
                result.put("errorCode", "EMPTY_SHEET");
                return result;
            }

            // 读取表头（第一行）
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                result.put("error", "Excel 文件第一行为空，无法获取表头");
                result.put("errorCode", "NO_HEADER");
                return result;
            }

            List<String> headers = new ArrayList<>();
            List<String> emptyHeaderCols = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String header = getCellStringValue(cell);
                if (header.isEmpty()) {
                    // 用 Excel 列字母作为默认列名
                    header = getColumnLetter(i);
                    emptyHeaderCols.add(header);
                }
                headers.add(header);
            }

            // 如果有空表头，记录警告
            if (!emptyHeaderCols.isEmpty()) {
                result.put("warning", "检测到第 1 行的 " + emptyHeaderCols.size()
                        + " 个空表头（" + String.join(", ", emptyHeaderCols) + "），已自动命名为列字母");
            }

            int rowCount = 0;
            int skippedRows = 0;
            List<String> warnings = new ArrayList<>();

            if ("array".equals(mode)) {
                // 模式一：所有行转为一个 JSON 数组
                List<Map<String, Object>> list = new ArrayList<>();
                for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null || isRowEmpty(row)) {
                        skippedRows++;
                        continue;
                    }
                    Map<String, Object> obj = new LinkedHashMap<>();
                    try {
                        for (int c = 0; c < headers.size(); c++) {
                            Cell cell = row.getCell(c);
                            try {
                                obj.put(headers.get(c), getCellValue(cell));
                            } catch (Exception cellEx) {
                                String colLetter = getColumnLetter(c);
                                warnings.add("第 " + (r + 1) + " 行 " + colLetter + " 列（" + headers.get(c)
                                        + "）解析异常: " + cellEx.getMessage());
                                obj.put(headers.get(c), "[解析错误]");
                            }
                        }
                    } catch (Exception rowEx) {
                        warnings.add("第 " + (r + 1) + " 行整体解析异常: " + rowEx.getMessage());
                        continue;
                    }
                    list.add(obj);
                    rowCount++;
                }
                result.put("output", list);
            } else {
                // 模式二：每行转为一个 JSON 对象（key 为行号）
                Map<String, Map<String, Object>> objects = new LinkedHashMap<>();
                for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null || isRowEmpty(row)) {
                        skippedRows++;
                        continue;
                    }
                    Map<String, Object> obj = new LinkedHashMap<>();
                    String rowKey = "row_" + (r + 1);
                    try {
                        for (int c = 0; c < headers.size(); c++) {
                            Cell cell = row.getCell(c);
                            try {
                                obj.put(headers.get(c), getCellValue(cell));
                            } catch (Exception cellEx) {
                                String colLetter = getColumnLetter(c);
                                warnings.add("第 " + (r + 1) + " 行 " + colLetter + " 列（" + headers.get(c)
                                        + "）解析异常: " + cellEx.getMessage());
                                obj.put(headers.get(c), "[解析错误]");
                            }
                        }
                    } catch (Exception rowEx) {
                        warnings.add("第 " + (r + 1) + " 行整体解析异常: " + rowEx.getMessage());
                        continue;
                    }
                    objects.put(rowKey, obj);
                    rowCount++;
                }
                result.put("output", objects);
            }

            result.put("rowCount", rowCount);
            result.put("columnCount", headers.size());
            result.put("headers", headers);
            result.put("skippedRows", skippedRows);
            if (!warnings.isEmpty()) {
                result.put("warnings", warnings);
            }

        } catch (Exception e) {
            String msg = e.getMessage();
            if ((msg != null && msg.contains("OLE2")) || (msg != null && msg.contains("NotOLE2FileException"))) {
                result.put("error", "文件格式错误：请确保上传的是真正的 Excel 文件（.xlsx / .xls），而非其他格式的文件");
            } else if (msg != null && msg.contains("EmptyFileException")) {
                result.put("error", "文件为空，请上传包含数据的 Excel 文件");
            } else if (msg != null && msg.contains("IOException") && msg.contains("ZIP")) {
                result.put("error", "Excel 文件已损坏或格式不正确，请重新导出后再上传");
            } else {
                result.put("error", "Excel 解析失败: " + (msg != null ? msg : "未知错误"));
            }
            result.put("errorCode", "PARSE_ERROR");
        }

        return result;
    }

    /**
     * 生成 Excel 转 JSON 的模板文件
     */
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("示例数据");
            sheet.setColumnWidth(0, 3500);
            sheet.setColumnWidth(1, 2500);
            sheet.setColumnWidth(2, 4500);
            sheet.setColumnWidth(3, 5000);

            // 样式：表头加粗
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

            // 数据行
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

            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("生成模板文件失败: " + e.getMessage(), e);
        }
    }

    /**
     * 将列索引转换为 Excel 列字母（0 → A, 1 → B, ...）
     */
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
     * 读取单元格的原始值（保留数字/布尔类型，不强制转字符串）
     */
    private Object getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> {
                if (org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString().replace("T", " ");
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield (long) val;
                }
                yield val;
            }
            case BOOLEAN -> cell.getBooleanCellValue();
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield cell.getNumericCellValue();
                }
            }
            default -> "";
        };
    }

    /**
     * 读取单元格的字符串值（用于表头）
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    /**
     * 判断行是否为空
     */
    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellStringValue(cell);
                if (!val.isEmpty()) return false;
            }
        }
        return true;
    }

    // ==================== JSON ↔ YAML 转换 ====================

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
    private final org.yaml.snakeyaml.Yaml yaml = new org.yaml.snakeyaml.Yaml();

    /**
     * JSON → YAML 转换
     */
    public Map<String, Object> jsonToYaml(String input) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            // 解析 JSON
            Object jsonObj = objectMapper.readValue(input, Object.class);
            // 转为 YAML
            String yamlOutput = yaml.dumpAsMap(jsonObj instanceof Map ? (Map<?, ?>) jsonObj : jsonObj);
            result.put("output", yamlOutput);
            result.put("type", "yaml");
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            result.put("error", "JSON 解析失败: " + e.getOriginalMessage());
            result.put("errorType", "json");
        } catch (Exception e) {
            result.put("error", "转换失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * YAML → JSON 转换
     */
    public Map<String, Object> yamlToJson(String input) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            // 解析 YAML
            Object yamlObj = yaml.load(input);
            if (yamlObj == null) {
                result.put("error", "YAML 内容为空或格式不正确");
                result.put("errorType", "yaml");
                return result;
            }
            // 转为 JSON
            String jsonOutput = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(yamlObj);
            result.put("output", jsonOutput);
            result.put("type", "json");
        } catch (org.yaml.snakeyaml.error.YAMLException e) {
            result.put("error", "YAML 解析失败: " + e.getMessage());
            result.put("errorType", "yaml");
        } catch (Exception e) {
            result.put("error", "转换失败: " + e.getMessage());
        }
        return result;
    }
}
