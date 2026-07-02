package com.devtools.config;

import com.devtools.service.ThemeStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 应用启动时初始化主题商店数据
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ThemeStoreInitializer implements ApplicationRunner {

    private final ThemeStoreService themeStoreService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            themeStoreService.initThemeStoreData();
        } catch (Exception e) {
            log.warn("主题商店数据初始化失败（可能表尚未创建，H2 内存库首次启动时正常）: {}", e.getMessage());
        }
    }
}
