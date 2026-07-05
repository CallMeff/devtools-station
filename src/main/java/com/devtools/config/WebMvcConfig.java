package com.devtools.config;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.codebuddy.upload-dir:./data/pets-custom}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Spring Boot 3.x: 显式声明静态资源路径，避免默认映射失效
        registry.addResourceHandler("/css/**", "/js/**", "/img/**", "/favicon.svg", "/favicon.ico")
                .addResourceLocations("classpath:/static/css/", "classpath:/static/js/",
                        "classpath:/static/img/", "classpath:/static/");
        // 自定义宠物上传图片映射（支持相对路径解析为绝对路径）
        String resolvedDir = uploadDir;
        java.nio.file.Path dirPath = java.nio.file.Paths.get(uploadDir);
        if (!dirPath.isAbsolute()) {
            resolvedDir = java.nio.file.Paths.get(System.getProperty("user.dir"), uploadDir)
                    .normalize().toAbsolutePath().toString();
        }
        registry.addResourceHandler("/pets-custom/**")
                .addResourceLocations("file:" + resolvedDir + "/");
    }
}
