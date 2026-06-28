package com.devtools.controller;

import com.devtools.entity.Category;
import com.devtools.entity.Tool;
import com.devtools.service.ToolService;
import jakarta.servlet.http.HttpServletRequest;
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

    public PageController(ToolService toolService) {
        this.toolService = toolService;
    }

    /**
     * 首页
     */
    @GetMapping("/")
    public String index(Model model) {
        List<Category> categories = toolService.getCategoriesWithTools();
        List<Tool> allTools = toolService.searchTools(null);
        List<Tool> hotTools = toolService.getHotTools(8);

        // 按分类组织工具
        Map<Long, List<Tool>> toolMap = allTools.stream()
                .collect(Collectors.groupingBy(Tool::getCategoryId));

        model.addAttribute("categories", categories);
        model.addAttribute("toolMap", toolMap);
        model.addAttribute("hotTools", hotTools);
        model.addAttribute("totalTools", allTools.size());
        return "index";
    }

    /**
     * 静态页面路由
     */
    @GetMapping("/about")
    public String about(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
        return "about";
    }

    @GetMapping("/guide")
    public String guide(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
        return "guide";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
        return "profile";
    }

    @GetMapping("/feedback")
    public String feedback(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
        return "feedback";
    }

    @GetMapping("/changelog")
    public String changelog(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
        return "changelog";
    }

    @GetMapping("/doc.html")
    public String doc(Model model) {
        model.addAttribute("categories", toolService.getCategoriesWithTools());
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

        // 获取父分类
        Category category = toolService.getCategoriesWithTools().stream()
                .filter(c -> c.getId().equals(currentTool.getCategoryId()))
                .findFirst().orElse(null);

        List<Tool> sameCategoryTools = allTools.stream()
                .filter(t -> t.getCategoryId().equals(currentTool.getCategoryId()))
                .collect(Collectors.toList());

        model.addAttribute("categories", toolService.getCategoriesWithTools());
        model.addAttribute("tool", currentTool);
        model.addAttribute("category", category);
        model.addAttribute("relatedTools", sameCategoryTools);
        return "tool";
    }
}
