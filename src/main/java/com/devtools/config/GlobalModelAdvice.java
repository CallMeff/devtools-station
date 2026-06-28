package com.devtools.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * 全局模板属性注入
 * 将服务端配置值暴露给所有 Thymeleaf 模板
 */
@ControllerAdvice
public class GlobalModelAdvice {

    @Value("${app.security.password-min-length:8}")
    private int passwordMinLength;

    @ModelAttribute("passwordMinLength")
    public int passwordMinLength() {
        return passwordMinLength;
    }
}
