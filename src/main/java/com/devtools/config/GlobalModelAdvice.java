package com.devtools.config;

import com.devtools.entity.Category;
import com.devtools.service.ToolService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.List;

/**
 * 全局模板属性注入
 * 将服务端配置值和公共数据暴露给所有 Thymeleaf 模板
 */
@ControllerAdvice
@RequiredArgsConstructor
public class GlobalModelAdvice {

    private final ToolService toolService;

    @Value("${app.security.password-min-length:8}")
    private int passwordMinLength;

    @ModelAttribute("passwordMinLength")
    public int passwordMinLength() {
        return passwordMinLength;
    }

    /**
     * 所有页面共享的分类数据（避免每个 Controller 方法重复查询）
     */
    @ModelAttribute("categories")
    public List<Category> categories() {
        return toolService.getCategoriesWithTools();
    }
}
