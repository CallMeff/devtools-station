package com.devtools.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // 开发环境允许 localhost，生产环境应通过环境变量限制
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://localhost:*"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        // 注册 WASM MIME 类型（OCR 引擎需要加载 .wasm 文件）
        configurer.mediaType("wasm", MediaType.valueOf("application/wasm"));
        configurer.mediaType("gz", MediaType.valueOf("application/gzip"));
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 确保静态资源映射到 classpath:/static/ 下的 favicon.svg
        registry.addResourceHandler("/favicon.svg")
                .addResourceLocations("classpath:/static/");
    }
}
