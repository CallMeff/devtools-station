package com.devtools.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 数据库迁移 - 启动时自动执行 DDL 变更
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DatabaseMigration {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        // 检查 dt_favorite 表是否有 user_id 列，没有则添加
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dt_favorite' AND COLUMN_NAME = 'user_id'",
                Integer.class
            );
            if (count != null && count == 0) {
                jdbcTemplate.execute("ALTER TABLE dt_favorite ADD COLUMN user_id BIGINT DEFAULT NULL");
                log.info("数据库迁移: dt_favorite 添加 user_id 列成功");
            } else {
                log.info("数据库迁移: user_id 列已存在，跳过");
            }
        } catch (Exception e) {
            log.warn("数据库迁移: 检查/添加 user_id 列异常: {}", e.getMessage());
        }

        // 修复 user_key 列允许为 NULL（已登录用户不需要 user_key）
        try {
            jdbcTemplate.execute("ALTER TABLE dt_favorite MODIFY COLUMN user_key VARCHAR(128) DEFAULT ''");
            log.info("数据库迁移: dt_favorite.user_key 已修改为可空");
        } catch (Exception e) {
            log.warn("数据库迁移: 修改 user_key 列异常（可能已修改）: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("CREATE INDEX idx_favorite_user_id ON dt_favorite(user_id)");
        } catch (Exception e) { /* 索引已存在忽略 */ }

        try {
            jdbcTemplate.execute("CREATE INDEX idx_favorite_user_tool ON dt_favorite(user_id, tool_id)");
        } catch (Exception e) { /* 索引已存在忽略 */ }

        // 给 dt_user 添加 points 列
        addColumnIfNotExists("dt_user", "points", "INT DEFAULT 0");

        // 创建 dt_theme_store 表
        createTableIfNotExists("dt_theme_store",
            "CREATE TABLE dt_theme_store (" +
            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
            "theme_key VARCHAR(64) NOT NULL, " +
            "name VARCHAR(64) NOT NULL, " +
            "description VARCHAR(256) DEFAULT '', " +
            "icon VARCHAR(16) DEFAULT '', " +
            "price INT DEFAULT 0, " +
            "category VARCHAR(16) DEFAULT 'free', " +
            "accent_color VARCHAR(16) DEFAULT '', " +
            "bg_primary VARCHAR(16) DEFAULT '', " +
            "preview_colors VARCHAR(512) DEFAULT '', " +
            "sort_order INT DEFAULT 0, " +
            "enabled TINYINT DEFAULT 1, " +
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
            ")"
        );

        // 创建 dt_user_theme 表
        createTableIfNotExists("dt_user_theme",
            "CREATE TABLE dt_user_theme (" +
            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
            "user_id BIGINT NOT NULL, " +
            "theme_id BIGINT NOT NULL, " +
            "purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
            "FOREIGN KEY (user_id) REFERENCES dt_user(id), " +
            "FOREIGN KEY (theme_id) REFERENCES dt_theme_store(id)" +
            ")"
        );
    }

    private void addColumnIfNotExists(String tableName, String columnName, String columnDef) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, tableName, columnName
            );
            if (count != null && count == 0) {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDef);
                log.info("数据库迁移: {}.{} 添加成功", tableName, columnName);
            } else {
                log.info("数据库迁移: {}.{} 已存在，跳过", tableName, columnName);
            }
        } catch (Exception e) {
            log.warn("数据库迁移: 添加 {}.{} 异常: {}", tableName, columnName, e.getMessage());
        }
    }

    private void createTableIfNotExists(String tableName, String createSql) {
        try {
            jdbcTemplate.execute(createSql);
            log.info("数据库迁移: {} 表创建成功", tableName);
        } catch (Exception e) {
            log.warn("数据库迁移: {} 表创建异常（可能已存在）: {}", tableName, e.getMessage());
        }
    }
}
