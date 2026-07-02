package com.devtools.controller;

import com.devtools.entity.Category;
import com.devtools.entity.Tool;
import com.devtools.service.ToolService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

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
     * 首页
     */
    @GetMapping("/")
    public String index(Model model) {
        List<Tool> allTools = toolService.searchTools(null);
        List<Tool> hotTools = toolService.getHotTools(8);

        // 按分类组织工具
        Map<Long, List<Tool>> toolMap = allTools.stream()
                .collect(Collectors.groupingBy(Tool::getCategoryId));

        model.addAttribute("toolMap", toolMap);
        model.addAttribute("hotTools", hotTools);
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
            if (route.contains("/fun/emoji")) return "emoji-picker";
            if (route.contains("/text/line-ops")) return "line-ops";
            if (route.contains("/text/naming-case")) return "naming-case";
            if (route.contains("/devtools/gitignore")) return "gitignore-gen";
            if (route.contains("/devtools/docker-compose")) return "docker-compose-gen";
            if (route.contains("/text/regex-visual")) return "regex-visual";
            if (route.contains("/network/curl-builder")) return "curl-builder";
            if (route.contains("/chart/mermaid-live")) return "mermaid-live";
            if (route.contains("/format/json-schema")) return "json-schema-gen";
            if (route.contains("/devtools/license-chooser")) return "license-chooser";
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
