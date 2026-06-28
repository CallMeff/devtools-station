-- ============================================
-- DevTools Station 数据更新脚本 v1.1
-- 新增：用户系统（注册/登录/偏好设置）
-- 日期：2026-06-19
-- ============================================

USE `devtools_station`;

-- ============================================
-- 5. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_user` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`      VARCHAR(64)  NOT NULL COMMENT '用户名',
    `email`         VARCHAR(128) DEFAULT '' COMMENT '邮箱',
    `password_hash` VARCHAR(256) DEFAULT '' COMMENT 'BCrypt密码哈希（微信用户为空）',
    `salt`          VARCHAR(64)  DEFAULT '' COMMENT '密码盐值（微信用户为空）',
    `nickname`      VARCHAR(64)  DEFAULT '' COMMENT '昵称',
    `avatar`        VARCHAR(256) DEFAULT '' COMMENT '头像URL',
    `status`        TINYINT      DEFAULT 1 COMMENT '状态(0-禁用,1-正常)',
    `last_login_at` DATETIME     DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip` VARCHAR(64)  DEFAULT '' COMMENT '最后登录IP',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`       TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 6. 用户会话表（Token管理）
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_user_session` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '用户ID',
    `token`         VARCHAR(256) NOT NULL COMMENT '会话Token（AES加密存储）',
    `token_hash`    VARCHAR(128) NOT NULL COMMENT 'Token哈希（SHA-256，用于快速查找）',
    `ip_address`    VARCHAR(64)  DEFAULT '' COMMENT '登录IP',
    `user_agent`    VARCHAR(512) DEFAULT '' COMMENT '浏览器UA',
    `expires_at`    DATETIME     NOT NULL COMMENT '过期时间',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- ============================================
-- 7. 用户设置表（主题/偏好/使用习惯）
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_user_settings` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`          BIGINT       NOT NULL COMMENT '用户ID',
    `theme`            VARCHAR(32)  DEFAULT 'dark' COMMENT '主题(dark/light/anime)',
    `language`         VARCHAR(16)  DEFAULT 'zh-CN' COMMENT '语言偏好',
    `recent_tools`     TEXT         DEFAULT NULL COMMENT '最近使用的工具(JSON数组，最多20个)',
    `favorite_tools`   TEXT         DEFAULT NULL COMMENT '收藏的工具ID(JSON数组)',
    `input_history`    MEDIUMTEXT   DEFAULT NULL COMMENT '输入历史(JSON对象，按工具路由存储最近5条)',
    `ui_preferences`   TEXT         DEFAULT NULL COMMENT 'UI偏好设置(JSON: 字体大小/布局等)',
    `custom_config`    TEXT         DEFAULT NULL COMMENT '自定义配置(JSON，扩展用)',
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- ============================================
-- 8. 用户操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_user_activity` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '用户ID',
    `action`        VARCHAR(64)  NOT NULL COMMENT '操作类型(login/logout/tool_use/settings_change等)',
    `target`        VARCHAR(256) DEFAULT '' COMMENT '操作目标(工具路由等)',
    `detail`        TEXT         DEFAULT NULL COMMENT '操作详情(JSON)',
    `ip_address`    VARCHAR(64)  DEFAULT '' COMMENT '操作IP',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_action` (`user_id`, `action`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志表';

-- ============================================
-- 9. 微信扫码登录状态表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_wx_qr_state` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `ticket`        VARCHAR(64)  NOT NULL COMMENT '二维码唯一标识',
    `status`        VARCHAR(16)  NOT NULL DEFAULT 'pending' COMMENT '状态: pending/scanned/confirmed/expired/cancelled',
    `user_id`       BIGINT       DEFAULT NULL COMMENT '扫码用户ID',
    `scan_code`     VARCHAR(32)  NOT NULL COMMENT '扫码验证码',
    `expires_at`    DATETIME     NOT NULL COMMENT '过期时间',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ticket` (`ticket`),
    KEY `idx_status` (`status`),
    KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信扫码登录状态表';

-- ============================================
-- 修改现有表：收藏表增加 user_id 字段（兼容已登录用户）
-- ============================================
ALTER TABLE `dt_favorite`
    ADD COLUMN `user_id` BIGINT DEFAULT NULL COMMENT '登录用户ID(NULL为匿名用户)' AFTER `user_key`,
    ADD KEY `idx_user_id` (`user_id`);

-- ============================================
-- 修改现有表：使用记录表增加 user_id 字段
-- ============================================
ALTER TABLE `dt_tool_usage`
    ADD COLUMN `user_id` BIGINT DEFAULT NULL COMMENT '用户ID(NULL为匿名)' AFTER `tool_name`,
    ADD KEY `idx_usage_user_id` (`user_id`);
