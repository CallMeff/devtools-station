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

        try {
            jdbcTemplate.execute("CREATE INDEX idx_favorite_user_id ON dt_favorite(user_id)");
        } catch (Exception e) { /* 索引已存在忽略 */ }

        try {
            jdbcTemplate.execute("CREATE INDEX idx_favorite_user_tool ON dt_favorite(user_id, tool_id)");
        } catch (Exception e) { /* 索引已存在忽略 */ }
    }
}
