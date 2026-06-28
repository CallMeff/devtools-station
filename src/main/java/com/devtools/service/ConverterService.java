package com.devtools.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.StrUtil;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

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
                case "camel" -> StrUtil.toCamelCase(input);
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
                // HEX -> RGB
                String hex = input.replace("#", "");
                int r = Integer.parseInt(hex.substring(0, 2), 16);
                int g = Integer.parseInt(hex.substring(2, 4), 16);
                int b = Integer.parseInt(hex.substring(4, 6), 16);
                result.put("hex", input);
                result.put("rgb", String.format("rgb(%d, %d, %d)", r, g, b));
                result.put("rgba", String.format("rgba(%d, %d, %d, 1)", r, g, b));
            } else if (input.contains("rgb")) {
                // RGB -> HEX
                String nums = input.replaceAll("[^0-9,]", "");
                String[] parts = nums.split(",");
                int r = Integer.parseInt(parts[0].trim());
                int g = Integer.parseInt(parts[1].trim());
                int b = Integer.parseInt(parts[2].trim());
                result.put("rgb", String.format("rgb(%d, %d, %d)", r, g, b));
                result.put("hex", String.format("#%02X%02X%02X", r, g, b));
            }
        } catch (Exception e) {
            result.put("error", "颜色格式错误，支持 #RRGGBB 或 rgb(r,g,b)");
        }
        return result;
    }

    private String toSnakeCase(String input) {
        return StrUtil.toUnderlineCase(input);
    }

    private String toKebabCase(String input) {
        return input.replaceAll("([a-z])([A-Z])", "$1-$2")
                .replaceAll("[_\\s]+", "-")
                .toLowerCase();
    }

    private String toConstantCase(String input) {
        return toSnakeCase(input).toUpperCase();
    }

    private String toPascalCase(String input) {
        String camel = StrUtil.toCamelCase(input);
        return StrUtil.upperFirst(camel);
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
}
