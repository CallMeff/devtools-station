package com.devtools;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * DevTools Station - 开发者在线工具箱
 * 参考 it-tools / MikuTools / cursor.com 设计风格
 */
@SpringBootApplication
public class DevToolsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevToolsApplication.class, args);
        System.out.println("""
                
                ╔══════════════════════════════════════════════╗
                ║        🛠️  DevTools Station 启动成功!        ║
                ║        访问: http://localhost:8088            ║
                ║        API文档: http://localhost:8088/doc.html ║
                ╚══════════════════════════════════════════════╝
                """);
    }
}
