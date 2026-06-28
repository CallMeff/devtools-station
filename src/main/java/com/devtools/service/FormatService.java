package com.devtools.service;

import cn.hutool.json.JSONUtil;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 格式化服务
 */
@Service
public class FormatService {

    /**
     * JSON 格式化/压缩/校验
     */
    public Map<String, Object> jsonFormat(String input, String mode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", mode);

        // 空输入校验
        if (input == null || input.trim().isEmpty()) {
            result.put("valid", false);
            result.put("error", "请输入 JSON 文本");
            result.put("errorCode", "EMPTY_INPUT");
            return result;
        }

        try {
            Object parsed = JSONUtil.parse(input);
            if ("format".equals(mode)) {
                result.put("output", JSONUtil.toJsonPrettyStr(parsed));
                result.put("valid", true);
            } else if ("minify".equals(mode)) {
                result.put("output", JSONUtil.toJsonStr(parsed));
                result.put("valid", true);
            } else {
                result.put("valid", true);
                result.put("message", "JSON 格式正确");
            }
        } catch (Exception e) {
            result.put("valid", false);
            String errMsg = e.getMessage();
            // 提取更友好的错误信息
            if (errMsg != null) {
                if (errMsg.contains("Unexpected token")) {
                    result.put("error", "JSON 格式错误：存在非法的字符或标记");
                } else if (errMsg.contains("EOF") || errMsg.contains("end of input") || errMsg.contains("Unexpected end")) {
                    result.put("error", "JSON 格式错误：输入不完整，缺少结束标记");
                } else if (errMsg.contains("not match")) {
                    result.put("error", "JSON 格式错误：括号、引号等符号不匹配");
                } else {
                    result.put("error", "JSON 格式错误：" + errMsg);
                }
            } else {
                result.put("error", "JSON 格式错误：无法解析输入内容");
            }
        }
        return result;
    }

    /**
     * SQL 格式化（简单实现）
     */
    public Map<String, Object> sqlFormat(String input) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String formatted = formatSql(input);
            result.put("output", formatted);
        } catch (Exception e) {
            result.put("error", "SQL 格式化失败: " + e.getMessage());
        }
        return result;
    }

    private String formatSql(String sql) {
        // 简单SQL格式化：关键字换行+缩进
        String[] keywords = {"SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY",
                "GROUP BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES",
                "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE",
                "DROP TABLE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
                "OUTER JOIN", "ON", "UNION", "AS", "IN", "NOT IN", "BETWEEN",
                "LIKE", "IS NULL", "IS NOT NULL", "EXISTS"};

        sql = sql.replaceAll("\\s+", " ").trim();
        for (String kw : keywords) {
            sql = sql.replaceAll("(?i)\\b" + kw.replace(" ", "\\s+") + "\\b", "\n" + kw + " ");
        }
        // 清理多余空白
        return sql.replaceAll("\\n\\s*\\n", "\n").trim();
    }

    /**
     * CSS 格式化
     */
    public Map<String, Object> cssFormat(String input, String mode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", mode);
        try {
            if ("format".equals(mode)) {
                result.put("output", formatCss(input));
            } else {
                result.put("output", minifyCss(input));
            }
        } catch (Exception e) {
            result.put("error", "CSS 格式化失败: " + e.getMessage());
        }
        return result;
    }

    private String formatCss(String css) {
        css = css.replaceAll("\\s*\\{\\s*", " {\n    ");
        css = css.replaceAll("\\s*;\\s*", ";\n    ");
        css = css.replaceAll("\\s*}\\s*", "\n}\n\n");
        css = css.replaceAll("\\s*:\\s*", ": ");
        return css.replaceAll("\\n\\s*\\n", "\n").trim();
    }

    private String minifyCss(String css) {
        return css.replaceAll("/\\*[^*]*\\*+(?:[^/*][^*]*\\*+)*/", "") // 移除注释
                .replaceAll("\\s+", " ")
                .replaceAll("\\s*\\{\\s*", "{")
                .replaceAll("\\s*}\\s*", "}")
                .replaceAll("\\s*;\\s*", ";")
                .replaceAll("\\s*:\\s*", ":")
                .trim();
    }

    /**
     * HTML 格式化/压缩
     */
    public Map<String, Object> htmlFormat(String input, String mode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", mode);
        try {
            if ("format".equals(mode)) {
                result.put("output", formatHtml(input));
            } else {
                result.put("output", minifyHtml(input));
            }
        } catch (Exception e) {
            result.put("error", "HTML 格式化失败: " + e.getMessage());
        }
        return result;
    }

    private String formatHtml(String html) {
        StringBuilder out = new StringBuilder();
        int indent = 0;
        boolean inTag = false;
        boolean inPre = false;
        for (int i = 0; i < html.length(); i++) {
            char c = html.charAt(i);
            if (c == '<' && !inPre) {
                if (!inTag) {
                    out.append('\n');
                    for (int j = 0; j < indent; j++) out.append("    ");
                }
                inTag = true;
            }
            out.append(c);
            if (c == '>' && !inPre) {
                inTag = false;
                String tagContent = html.substring(html.lastIndexOf('<', i) + 1, i);
                boolean isClosing = tagContent.startsWith("/");
                boolean isSelfClosing = tagContent.endsWith("/");
                if (isClosing) indent = Math.max(0, indent - 1);
                if (!isClosing && !isSelfClosing && !tagContent.startsWith("!") && !tagContent.startsWith("?")) {
                    indent++;
                }
            }
        }
        return out.toString().replaceAll("\\n\\s*\\n", "\n").trim();
    }

    private String minifyHtml(String html) {
        return html.replaceAll("<!--[\\s\\S]*?-->", "")
                .replaceAll("\\s+", " ")
                .replaceAll(">\\s+<", "><")
                .trim();
    }

    /**
     * XML 格式化/压缩
     */
    public Map<String, Object> xmlFormat(String input, String mode) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", mode != null ? mode : "format");
        try {
            if ("minify".equals(mode)) {
                result.put("output", minifyXml(input));
            } else {
                result.put("output", formatXml(input));
            }
        } catch (Exception e) {
            result.put("error", "XML 格式化失败: " + e.getMessage());
        }
        return result;
    }

    private String formatXml(String xml) {
        StringBuilder out = new StringBuilder();
        int indent = 0;
        boolean inTag = false;
        boolean inContent = false;
        for (int i = 0; i < xml.length(); i++) {
            char c = xml.charAt(i);
            if (c == '<') {
                if (inContent && out.charAt(out.length() - 1) != '\n') {
                    out.append('\n');
                }
                inTag = true;
                inContent = false;
                out.append('\n');
                for (int j = 0; j < indent; j++) out.append("    ");
                out.append(c);
            } else if (c == '>' && inTag) {
                out.append(c);
                inTag = false;
                inContent = true;
            } else if (c == '/' && i + 1 < xml.length() && xml.charAt(i + 1) == '>' && inTag) {
                out.append("/>");
                i++;
                inTag = false;
                inContent = true;
            } else {
                out.append(c);
            }
        }
        return out.toString().replaceAll("\\n\\s*\\n", "\n").trim();
    }

    private String minifyXml(String xml) {
        return xml.replaceAll("<!--[\\s\\S]*?-->", "")
                .replaceAll("\\s+", " ")
                .replaceAll(">\\s+<", "><")
                .trim();
    }
}
