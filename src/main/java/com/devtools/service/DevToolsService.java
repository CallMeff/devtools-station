package com.devtools.service;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 开发工具服务
 */
@Service
public class DevToolsService {

    /**
     * Cron 表达式解析
     */
    public Map<String, Object> parseCron(String expression) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String[] parts = expression.trim().split("\\s+");
            if (parts.length < 6) {
                result.put("error", "Cron 表达式需要6个字段（秒 分 时 日 月 周）");
                return result;
            }

            Map<String, String> fields = new LinkedHashMap<>();
            fields.put("second", parts[0]);
            fields.put("minute", parts[1]);
            fields.put("hour", parts[2]);
            fields.put("day_of_month", parts[3]);
            fields.put("month", parts[4]);
            fields.put("day_of_week", parts[5]);

            result.put("expression", expression);
            result.put("fields", fields);
            result.put("description", describeCron(parts));

            // 生成下次执行时间示例
            result.put("next_executions", generateNextExecutions(expression, 5));

        } catch (Exception e) {
            result.put("error", "Cron 表达式解析失败: " + e.getMessage());
        }
        return result;
    }

    private String describeCron(String[] parts) {
        StringBuilder desc = new StringBuilder();
        String minute = parts[1], hour = parts[2], day = parts[3], month = parts[4], week = parts[5];

        if ("*".equals(minute) && "*".equals(hour) && "*".equals(day) && "*".equals(month) && "*".equals(week)) {
            desc.append("每秒执行");
        } else if (!"*".equals(minute) && "*".equals(hour)) {
            desc.append("每小时第").append(minute).append("分钟执行");
        } else if (!"*".equals(minute) && !"*".equals(hour)) {
            desc.append("每天 ").append(hour).append(":").append(String.format("%02d", Integer.parseInt(minute))).append(" 执行");
        }

        if (!"*".equals(week) && !"?".equals(week)) {
            desc.append("，仅在周").append(week).append("执行");
        }
        if (!"*".equals(month)) {
            desc.append("，仅在").append(month).append("月执行");
        }

        return desc.toString();
    }

    private List<String> generateNextExecutions(String expression, int count) {
        // 简单实现：返回示例说明
        return List.of(
                "具体执行时间取决于当前系统时间和Cron规则",
                "例如: 0 0 12 * * ? → 每天中午12:00执行",
                "例如: 0 */5 * * * ? → 每5分钟执行"
        );
    }

    /**
     * Git 常用命令参考
     */
    public Map<String, Object> gitCheatsheet() {
        List<Map<String, String>> commands = List.of(
                Map.of("command", "git init", "desc", "初始化仓库"),
                Map.of("command", "git clone <url>", "desc", "克隆仓库"),
                Map.of("command", "git add .", "desc", "暂存所有更改"),
                Map.of("command", "git commit -m \"msg\"", "desc", "提交更改"),
                Map.of("command", "git push origin main", "desc", "推送到远程"),
                Map.of("command", "git pull", "desc", "拉取远程更新"),
                Map.of("command", "git branch -a", "desc", "查看所有分支"),
                Map.of("command", "git checkout -b <name>", "desc", "创建并切换分支"),
                Map.of("command", "git merge <branch>", "desc", "合并分支"),
                Map.of("command", "git rebase <branch>", "desc", "变基操作"),
                Map.of("command", "git stash", "desc", "暂存工作区"),
                Map.of("command", "git stash pop", "desc", "恢复暂存"),
                Map.of("command", "git log --oneline", "desc", "简洁提交日志"),
                Map.of("command", "git reset --soft HEAD~1", "desc", "撤销最近提交(保留更改)"),
                Map.of("command", "git reset --hard HEAD~1", "desc", "撤销最近提交(丢弃更改)"),
                Map.of("command", "git remote -v", "desc", "查看远程仓库"),
                Map.of("command", "git diff", "desc", "查看工作区差异"),
                Map.of("command", "git status", "desc", "查看工作区状态"),
                Map.of("command", "git tag v1.0.0", "desc", "创建标签"),
                Map.of("command", "git cherry-pick <hash>", "desc", "拣选提交")
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("commands", commands);
        return result;
    }

    /**
     * MIME 类型查询
     */
    public Map<String, Object> mimeTypes() {
        Map<String, String> mimeMap = new LinkedHashMap<>();
        mimeMap.put(".html", "text/html");
        mimeMap.put(".css", "text/css");
        mimeMap.put(".js", "application/javascript");
        mimeMap.put(".json", "application/json");
        mimeMap.put(".xml", "application/xml");
        mimeMap.put(".png", "image/png");
        mimeMap.put(".jpg", "image/jpeg");
        mimeMap.put(".jpeg", "image/jpeg");
        mimeMap.put(".gif", "image/gif");
        mimeMap.put(".svg", "image/svg+xml");
        mimeMap.put(".webp", "image/webp");
        mimeMap.put(".ico", "image/x-icon");
        mimeMap.put(".mp3", "audio/mpeg");
        mimeMap.put(".mp4", "video/mp4");
        mimeMap.put(".webm", "video/webm");
        mimeMap.put(".pdf", "application/pdf");
        mimeMap.put(".zip", "application/zip");
        mimeMap.put(".tar", "application/x-tar");
        mimeMap.put(".gz", "application/gzip");
        mimeMap.put(".txt", "text/plain");
        mimeMap.put(".csv", "text/csv");
        mimeMap.put(".md", "text/markdown");
        mimeMap.put(".woff", "font/woff");
        mimeMap.put(".woff2", "font/woff2");
        mimeMap.put(".ttf", "font/ttf");
        mimeMap.put(".wasm", "application/wasm");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mime_types", mimeMap);
        return result;
    }
}
