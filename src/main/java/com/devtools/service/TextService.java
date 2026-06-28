package com.devtools.service;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 文本处理服务
 */
@Service
public class TextService {

    /**
     * 文本差异对比（LCS 行级对齐 + 智能合并修改行）
     */
    public Map<String, Object> diff(String text1, String text2) {
        Map<String, Object> result = new LinkedHashMap<>();
        // 使用 split 兼容所有 JDK 版本，\\R 匹配所有换行符
        List<String> lines1 = Arrays.asList(text1.split("\\R", -1));
        List<String> lines2 = Arrays.asList(text2.split("\\R", -1));

        int m = lines1.size();
        int n = lines2.size();

        // 去掉末尾空行（split(-1) 会在尾部产生空串）
        if (m > 0 && lines1.get(m - 1).isEmpty()) {
            lines1 = lines1.subList(0, m - 1);
            m = m - 1;
        }
        if (n > 0 && lines2.get(n - 1).isEmpty()) {
            lines2 = lines2.subList(0, n - 1);
            n = n - 1;
        }

        // ====== 1. LCS DP 表 ======
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (lines1.get(i - 1).equals(lines2.get(j - 1))) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // ====== 2. 回溯构建原始 diff（仅有 same / removed / added） ======
        List<Map<String, Object>> rawDiff = new ArrayList<>();
        int i = m;
        int j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && lines1.get(i - 1).equals(lines2.get(j - 1))) {
                Map<String, Object> d = new LinkedHashMap<>();
                d.put("type", "same");
                d.put("content", lines1.get(i - 1));
                rawDiff.add(d);
                i--;
                j--;
            } else if (j > 0 && (i == 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                Map<String, Object> d = new LinkedHashMap<>();
                d.put("type", "added");
                d.put("content", lines2.get(j - 1));
                rawDiff.add(d);
                j--;
            } else if (i > 0) {
                Map<String, Object> d = new LinkedHashMap<>();
                d.put("type", "removed");
                d.put("content", lines1.get(i - 1));
                rawDiff.add(d);
                i--;
            }
        }
        Collections.reverse(rawDiff);

        // ====== 3. 智能合并相邻的 removed + added → changed ======
        List<Map<String, Object>> diffLines = new ArrayList<>();
        for (int k = 0; k < rawDiff.size(); k++) {
            Map<String, Object> cur = rawDiff.get(k);

            if ("removed".equals(cur.get("type")) && k + 1 < rawDiff.size()
                    && "added".equals(rawDiff.get(k + 1).get("type"))) {
                // 相邻 removed + added → 合并为 changed（字符级 diff）
                Map<String, Object> merged = new LinkedHashMap<>();
                merged.put("type", "changed");
                merged.put("old", cur.get("content"));
                merged.put("new", rawDiff.get(k + 1).get("content"));
                diffLines.add(merged);
                k++; // 跳过下一个
            } else {
                diffLines.add(cur);
            }
        }

        result.put("diffs", diffLines);
        result.put("total_lines", diffLines.size());
        long changedCount = 0;
        for (Map<String, Object> d : diffLines) {
            if (!"same".equals(d.get("type"))) {
                changedCount++;
            }
        }
        result.put("changed_lines", changedCount);
        return result;
    }

    /**
     * 正则测试
     */
    public Map<String, Object> regex(String pattern, String text, String flags) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            int flagBits = 0;
            if (flags != null) {
                if (flags.contains("i")) flagBits |= Pattern.CASE_INSENSITIVE;
                if (flags.contains("m")) flagBits |= Pattern.MULTILINE;
                if (flags.contains("s")) flagBits |= Pattern.DOTALL;
            }
            Pattern p = Pattern.compile(pattern, flagBits);
            Matcher m = p.matcher(text);

            result.put("pattern", pattern);
            result.put("is_match", m.find());
            m.reset();

            List<Map<String, Object>> matches = new ArrayList<>();
            while (m.find()) {
                Map<String, Object> match = new LinkedHashMap<>();
                match.put("index", m.start());
                match.put("length", m.end() - m.start());
                match.put("match", m.group());
                List<String> groups = new ArrayList<>();
                for (int i = 1; i <= m.groupCount(); i++) {
                    groups.add(m.group(i));
                }
                if (!groups.isEmpty()) match.put("groups", groups);
                matches.add(match);
            }
            result.put("match_count", matches.size());
            result.put("matches", matches);
        } catch (Exception e) {
            result.put("error", "正则表达式错误: " + e.getMessage());
        }
        return result;
    }

    /**
     * 字数统计
     */
    public Map<String, Object> count(String text) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("characters", text.length());
        result.put("characters_no_space", text.replaceAll("\\s", "").length());
        result.put("words", text.trim().isEmpty() ? 0 : text.trim().split("\\s+").length);
        result.put("lines", text.lines().count());
        result.put("bytes", text.getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
        return result;
    }

    /**
     * 文本去重
     */
    public Map<String, Object> unique(String text, boolean sort) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<String> lines = text.lines()
                .map(String::trim)
                .filter(StrUtil::isNotBlank)
                .distinct()
                .collect(Collectors.toList());

        if (sort) {
            CollUtil.sort(lines, String::compareTo);
        }

        result.put("output", String.join("\n", lines));
        result.put("unique_count", lines.size());
        return result;
    }
}
