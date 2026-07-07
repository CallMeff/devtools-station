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

        // 修复 user_key="" 导致的跨用户唯一键冲突
        // 将已有记录的 user_key 更新为对应的 user_id 字符串
        try {
            int updated = jdbcTemplate.update(
                "UPDATE dt_favorite SET user_key = CONCAT('u_', user_id) WHERE (user_key = '' OR user_key IS NULL) AND user_id IS NOT NULL"
            );
            if (updated > 0) {
                log.info("数据库迁移: 已修复 {} 条 user_key 冲突记录", updated);
            }
        } catch (Exception e) {
            log.warn("数据库迁移: 修复 user_key 冲突记录异常: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("CREATE INDEX idx_favorite_user_id ON dt_favorite(user_id)");
        } catch (Exception e) { /* 索引已存在忽略 */ }

        try {
            jdbcTemplate.execute("CREATE INDEX idx_favorite_user_tool ON dt_favorite(user_id, tool_id)");
        } catch (Exception e) { /* 索引已存在忽略 */ }

        // ========== 主题商店迁移 ==========

        // 1. dt_user 添加 points 列
        try {
            Integer pointsCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dt_user' AND COLUMN_NAME = 'points'",
                Integer.class
            );
            if (pointsCount != null && pointsCount == 0) {
                jdbcTemplate.execute("ALTER TABLE dt_user ADD COLUMN points INT DEFAULT 6 COMMENT '用户积分'");
                // 现有用户默认给6积分
                jdbcTemplate.execute("UPDATE dt_user SET points = 6 WHERE points IS NULL");
                log.info("数据库迁移: dt_user 添加 points 列成功，已为现有用户分配默认积分");
            }
        } catch (Exception e) {
            log.warn("数据库迁移: 添加 points 列异常: {}", e.getMessage());
        }

        // 2. 创建 dt_theme_store 表
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS dt_theme_store (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                "theme_key VARCHAR(64) NOT NULL UNIQUE COMMENT '主题key'," +
                "name VARCHAR(128) NOT NULL COMMENT '主题名称'," +
                "description VARCHAR(256) COMMENT '主题描述'," +
                "icon VARCHAR(16) DEFAULT '🎨' COMMENT 'emoji图标'," +
                "price INT DEFAULT 6 COMMENT '积分价格'," +
                "category VARCHAR(16) DEFAULT 'premium' COMMENT '分类: free/premium'," +
                "accent_color VARCHAR(16) COMMENT '强调色'," +
                "bg_primary VARCHAR(16) COMMENT '背景主色'," +
                "preview_colors VARCHAR(256) COMMENT '预览色块'," +
                "sort_order INT DEFAULT 0 COMMENT '排序'," +
                "enabled TINYINT DEFAULT 1 COMMENT '是否启用'," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")"
            );
            log.info("数据库迁移: dt_theme_store 表创建/确认成功");
        } catch (Exception e) {
            log.warn("数据库迁移: 创建 dt_theme_store 表异常: {}", e.getMessage());
        }

        // 3. 创建 dt_user_theme 表
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS dt_user_theme (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                "user_id BIGINT NOT NULL COMMENT '用户ID'," +
                "theme_id BIGINT NOT NULL COMMENT '主题ID'," +
                "purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间'," +
                "FOREIGN KEY (user_id) REFERENCES dt_user(id)," +
                "FOREIGN KEY (theme_id) REFERENCES dt_theme_store(id)," +
                "UNIQUE KEY uk_user_theme (user_id, theme_id)" +
                ")"
            );
            log.info("数据库迁移: dt_user_theme 表创建/确认成功");
        } catch (Exception e) {
            log.warn("数据库迁移: 创建 dt_user_theme 表异常: {}", e.getMessage());
        }
    }
}
