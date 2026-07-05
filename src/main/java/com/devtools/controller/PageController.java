package com.devtools.controller;

import com.devtools.entity.Category;
import com.devtools.entity.Tool;
import com.devtools.service.ToolService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 页面路由控制器
 */
@Controller
public class PageController {

    private final ToolService toolService;

    @Value("${app.security.password-min-length:8}")
    private int passwordMinLength;

    public PageController(ToolService toolService) {
        this.toolService = toolService;
    }

    /**
     * 首页 - 桌面风格
     */
    @GetMapping("/")
    public String index(Model model) {
        List<Tool> allTools = toolService.searchTools(null);

        // 序列化所有工具为 JSON（供前端工具商店使用）
        try {
            ObjectMapper mapper = new ObjectMapper();
            // 构建精简的工具列表（只传前端需要的字段）
            List<Map<String, Object>> toolsList = allTools.stream().map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", t.getId());
                m.put("name", t.getName());
                m.put("icon", t.getIcon());
                m.put("route", t.getRoute());
                m.put("description", t.getDescription());
                m.put("categoryId", t.getCategoryId());
                m.put("isNew", t.getIsNew());
                m.put("isHot", t.getIsHot());
                m.put("keywords", t.getKeywords());
                return m;
            }).collect(Collectors.toList());

            // 分类列表
            List<Category> categories = toolService.getCategoriesWithTools();
            List<Map<String, Object>> catList = categories.stream().map(c -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", c.getId());
                m.put("name", c.getName());
                m.put("icon", c.getIcon());
                return m;
            }).collect(Collectors.toList());

            model.addAttribute("allToolsJson", mapper.writeValueAsString(toolsList));
            model.addAttribute("categoriesJson", mapper.writeValueAsString(catList));
        } catch (Exception e) {
            model.addAttribute("allToolsJson", "[]");
            model.addAttribute("categoriesJson", "[]");
        }

        model.addAttribute("totalTools", allTools.size());
        return "index";
    }

    /**
     * 静态页面路由 — categories 由 GlobalModelAdvice 统一注入
     */
    @GetMapping("/about")
    public String about() {
        return "about";
    }

    @GetMapping("/guide")
    public String guide() {
        return "guide";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
        model.addAttribute("passwordMinLength", passwordMinLength);
        return "profile";
    }

    @GetMapping("/feedback")
    public String feedback() {
        return "feedback";
    }

    @GetMapping("/changelog")
    public String changelog() {
        return "changelog";
    }

    @GetMapping("/theme-store")
    public String themeStore() {
        return "theme-store";
    }

    @GetMapping("/doc.html")
    public String doc() {
        return "doc";
    }

    /**
     * 修复 favicon.ico 返回 500 错误：重定向到 SVG favicon
     */
    @GetMapping("/favicon.ico")
    public String favicon() {
        return "redirect:/favicon.svg";
    }

    /**
     * 工具页面 - 支持多级路由如 /tools/crypto/md5
     * 统一入口：检查 apiPath 是否为 LOCAL_ONLY，决定使用自定义模板或标准工具模板
     */
    @GetMapping("/tools/**")
    public String tool(HttpServletRequest request, Model model) {
        String route = request.getRequestURI();
        List<Tool> allTools = toolService.searchTools(null);
        Tool currentTool = allTools.stream()
                .filter(t -> route.equals(t.getRoute()))
                .findFirst().orElse(null);

        if (currentTool == null) {
            return "error/404";
        }

        // LOCAL_ONLY 工具使用自定义独立模板
        if ("LOCAL_ONLY".equals(currentTool.getApiPath())) {
            model.addAttribute("tool", currentTool);
            // 根据路由映射模板名
            if (route.contains("/github/")) return "github-trending";
            if (route.contains("/chart/")) return "drawio-diagram";
            if (route.contains("/editor/markdown")) return "markdown-editor";
            if (route.contains("/editor/monaco")) return "monaco-editor";
            if (route.contains("/image/compress")) return "image-compress";
            if (route.contains("/image/convert")) return "image-convert";
            if (route.contains("/image/palette")) return "color-palette";
            if (route.contains("/fun/2048")) return "game-2048";
            if (route.contains("/fun/snake")) return "game-snake";
            if (route.contains("/fun/spinner")) return "wheel-spinner";
            if (route.contains("/fun/kaomoji")) return "kaomoji-generator";
            if (route.contains("/fun/workday-money")) return "workday-money";
            if (route.contains("/fun/daily-tracker")) return "daily-tracker";
            if (route.contains("/fun/emoji")) return "emoji-picker";
            if (route.contains("/fun/horoscope")) return "horoscope";
            if (route.contains("/fun/pixel-art")) return "pixel-art";
            if (route.contains("/fun/countdown")) return "countdown";
            if (route.contains("/fun/cp-name")) return "cp-name-gen";
            if (route.contains("/fun/secret-card")) return "secret-card";
            if (route.contains("/fun/pomodoro")) return "pomodoro-timer";
            if (route.contains("/fun/desktop-pet")) return "desktop-pet";
            if (route.contains("/fun/mbti")) return "mbti-test";
            if (route.contains("/fun/white-noise")) return "white-noise";
            if (route.contains("/fun/wish-list")) return "wish-list";
            if (route.contains("/fun/bestie-quiz")) return "bestie-quiz";
            if (route.contains("/fun/bookshelf")) return "bookshelf";
            if (route.contains("/fun/intermittent-fasting")) return "intermittent-fasting";
            if (route.contains("/fun/color-sense")) return "color-sense";
            if (route.contains("/fun/outfit-palette")) return "outfit-palette";
            if (route.contains("/fun/mood-diary")) return "mood-diary";
            if (route.contains("/fun/water-reminder")) return "water-reminder";
            if (route.contains("/fun/bff-quiz")) return "bff-quiz";
            if (route.contains("/fun/word-cloud")) return "word-cloud";
            if (route.contains("/fun/cute-notes")) return "cute-notes";
            if (route.contains("/fun/birthday-card")) return "birthday-card";
            if (route.contains("/fun/gradient-text")) return "gradient-text";
            if (route.contains("/fun/mini-checklist")) return "mini-checklist";
            if (route.contains("/text/line-ops")) return "line-ops";
            if (route.contains("/text/naming-case")) return "naming-case";
            if (route.contains("/devtools/gitignore")) return "gitignore-gen";
            if (route.contains("/devtools/docker-compose")) return "docker-compose-gen";
            if (route.contains("/text/regex-visual")) return "regex-visual";
            if (route.contains("/network/curl-builder")) return "curl-builder";
            if (route.contains("/chart/mermaid-live")) return "mermaid-live";
            if (route.contains("/format/json-schema")) return "json-schema-gen";
            if (route.contains("/devtools/license-chooser")) return "license-chooser";
            if (route.contains("/image/css-gradient")) return "css-gradient-gen";
            if (route.contains("/devtools/git-commit")) return "git-commit-gen";
            if (route.contains("/devtools/env-generator")) return "env-generator";
            if (route.contains("/format/json-ts-interface")) return "json-ts-gen";
            if (route.contains("/crypto/file-hash")) return "file-hash";
            if (route.contains("/devtools/json-sql-ddl")) return "json-sql-ddl";
            if (route.contains("/devtools/sri-hash")) return "sri-hash-gen";
            if (route.contains("/network/cidr-calc")) return "cidr-calculator";
            if (route.contains("/converter/date-calc")) return "date-calculator";
            return "docs-search";
        }

        // 获取父分类
        Category category = toolService.getCategoriesWithTools().stream()
                .filter(c -> c.getId().equals(currentTool.getCategoryId()))
                .findFirst().orElse(null);

        List<Tool> sameCategoryTools = allTools.stream()
                .filter(t -> t.getCategoryId().equals(currentTool.getCategoryId()))
                .collect(Collectors.toList());

        model.addAttribute("tool", currentTool);
        model.addAttribute("category", category);
        model.addAttribute("relatedTools", sameCategoryTools);
        return "tool";
    }
}
