-- DevTools Station - MySQL 数据库建表语句
-- 数据库: devtools_station (自动创建)

CREATE TABLE IF NOT EXISTS `dt_category` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(100) NOT NULL,
    `icon`        VARCHAR(50)  DEFAULT '🔧',
    `sort_order`  INT          DEFAULT 0,
    `description` VARCHAR(500),
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`     TINYINT      DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dt_tool` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT       NOT NULL,
    `name`        VARCHAR(200) NOT NULL,
    `route`       VARCHAR(200),
    `icon`        VARCHAR(50)  DEFAULT '🛠️',
    `description` VARCHAR(1000),
    `keywords`    VARCHAR(500),
    `api_path`    VARCHAR(200),
    `status`      TINYINT      DEFAULT 1,
    `is_hot`      TINYINT      DEFAULT 0,
    `is_new`      TINYINT      DEFAULT 0,
    `sort_order`  INT          DEFAULT 0,
    `use_count`   BIGINT       DEFAULT 0,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`     TINYINT      DEFAULT 0,
    UNIQUE KEY `uk_route` (`route`),
    INDEX `idx_category_id` (`category_id`),
    FOREIGN KEY (`category_id`) REFERENCES `dt_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dt_tool_usage` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tool_id`     BIGINT,
    `tool_name`   VARCHAR(200),
    `user_id`     BIGINT       DEFAULT NULL,
    `ip_address`  VARCHAR(50),
    `user_agent`  VARCHAR(500),
    `input_size`  INT          DEFAULT 0,
    `duration_ms` BIGINT       DEFAULT 0,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dt_favorite` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tool_id`     BIGINT       NOT NULL,
    `user_key`    VARCHAR(100) NOT NULL,
    `user_id`     BIGINT       DEFAULT NULL,
    `sort_order`  INT          DEFAULT 0,
    `pos_x`       DOUBLE       DEFAULT NULL COMMENT '桌面X坐标(百分比0~1)',
    `pos_y`       DOUBLE       DEFAULT NULL COMMENT '桌面Y坐标(百分比0~1)',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`tool_id`) REFERENCES `dt_tool`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 为已有表添加位置列（兼容旧数据库；如已存在则 ignore）
ALTER TABLE `dt_favorite` ADD `pos_x` DOUBLE DEFAULT NULL COMMENT '桌面X坐标(百分比0~1)';
ALTER TABLE `dt_favorite` ADD `pos_y` DOUBLE DEFAULT NULL COMMENT '桌面Y坐标(百分比0~1)';

CREATE TABLE IF NOT EXISTS `dt_user` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `username`      VARCHAR(64)  NOT NULL,
    `email`         VARCHAR(128) DEFAULT '',
    `password_hash` VARCHAR(256) DEFAULT '',
    `salt`          VARCHAR(64)  DEFAULT '',
    `nickname`      VARCHAR(64)  DEFAULT '',
    `avatar`        VARCHAR(256) DEFAULT '',
    `status`        TINYINT      DEFAULT 1,
    `last_login_at` DATETIME     DEFAULT NULL,
    `last_login_ip` VARCHAR(64)  DEFAULT '',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`       TINYINT      DEFAULT 0,
    `points`        INT          DEFAULT 6 COMMENT '用户积分，默认6分',
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dt_user_session` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`       BIGINT       NOT NULL,
    `token`         VARCHAR(256) NOT NULL,
    `token_hash`    VARCHAR(128) NOT NULL,
    `ip_address`    VARCHAR(64)  DEFAULT '',
    `user_agent`    VARCHAR(512) DEFAULT '',
    `expires_at`    DATETIME     NOT NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dt_user_settings` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`          BIGINT       NOT NULL,
    `theme`            VARCHAR(32)  DEFAULT 'dark',
    `language`         VARCHAR(16)  DEFAULT 'zh-CN',
    `recent_tools`     TEXT         DEFAULT NULL,
    `favorite_tools`   TEXT         DEFAULT NULL,
    `input_history`    TEXT         DEFAULT NULL,
    `ui_preferences`   TEXT         DEFAULT NULL,
    `custom_config`    TEXT         DEFAULT NULL,
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dt_user_activity` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`       BIGINT       NOT NULL,
    `action`        VARCHAR(64)  NOT NULL,
    `target`        VARCHAR(256) DEFAULT '',
    `detail`        TEXT         DEFAULT NULL,
    `ip_address`    VARCHAR(64)  DEFAULT '',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 微信扫码登录状态表
CREATE TABLE IF NOT EXISTS `dt_wx_qr_state` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `ticket`        VARCHAR(64)  NOT NULL COMMENT '二维码唯一标识',
    `status`        VARCHAR(16)  NOT NULL DEFAULT 'pending' COMMENT 'pending/scanned/confirmed/expired/cancelled',
    `user_id`       BIGINT       DEFAULT NULL COMMENT '扫码用户ID',
    `scan_code`     VARCHAR(32)  NOT NULL COMMENT '扫码验证码',
    `expires_at`    DATETIME     NOT NULL COMMENT '过期时间',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户反馈表
CREATE TABLE IF NOT EXISTS `dt_feedback` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `type`          VARCHAR(32)  DEFAULT 'other' COMMENT '反馈类型',
    `title`         VARCHAR(256) NOT NULL COMMENT '反馈标题',
    `content`       TEXT         NOT NULL COMMENT '反馈内容',
    `user_id`       BIGINT       DEFAULT NULL COMMENT '提交用户ID',
    `contact`       VARCHAR(128) DEFAULT NULL COMMENT '联系方式',
    `status`        VARCHAR(32)  DEFAULT 'pending' COMMENT '处理状态',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户页面皮肤表
CREATE TABLE IF NOT EXISTS `dt_user_skin` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`          BIGINT       NOT NULL COMMENT '用户ID',
    `skin_image`       MEDIUMTEXT   DEFAULT NULL COMMENT 'Base64皮肤图片',
    `skin_media_type`  VARCHAR(16)  DEFAULT 'image' COMMENT '媒体类型: image/video',
    `skin_video`       VARCHAR(512) DEFAULT NULL COMMENT '视频文件路径',
    `opacity`          DOUBLE       DEFAULT 0.15 COMMENT '不透明度',
    `fit_mode`         VARCHAR(16)  DEFAULT 'cover' COMMENT '填充模式',
    `skin_zoom`        DOUBLE       DEFAULT 100 COMMENT '缩放百分比',
    `skin_pos_x`       DOUBLE       DEFAULT 50 COMMENT '背景位置X百分比',
    `skin_pos_y`       DOUBLE       DEFAULT 50 COMMENT '背景位置Y百分比',
    `skin_repeat`      VARCHAR(16)  DEFAULT 'no-repeat' COMMENT '重复模式',
    `video_muted`      TINYINT      DEFAULT 1 COMMENT '视频是否静音',
    `video_loop`       TINYINT      DEFAULT 1 COMMENT '视频是否循环',
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_skin_user_id` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `dt_user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 主题商店表
CREATE TABLE IF NOT EXISTS `dt_theme_store` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `theme_key`       VARCHAR(64)  NOT NULL COMMENT '主题key',
    `name`            VARCHAR(128) NOT NULL COMMENT '主题名称',
    `description`     VARCHAR(256) COMMENT '主题描述',
    `icon`            VARCHAR(16)  DEFAULT '🎨' COMMENT '图标',
    `price`           INT          DEFAULT 6 COMMENT '积分价格',
    `category`        VARCHAR(16)  DEFAULT 'premium' COMMENT '分类',
    `accent_color`    VARCHAR(16) COMMENT '强调色',
    `bg_primary`      VARCHAR(16) COMMENT '背景主色',
    `preview_colors`  VARCHAR(256) COMMENT '预览色块',
    `sort_order`      INT          DEFAULT 0 COMMENT '排序',
    `enabled`         TINYINT      DEFAULT 1 COMMENT '是否启用',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_theme_key` (`theme_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户已购主题表
CREATE TABLE IF NOT EXISTS `dt_user_theme` (
    `id`            BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`       BIGINT   NOT NULL COMMENT '用户ID',
    `theme_id`      BIGINT   NOT NULL COMMENT '主题ID',
    `purchased_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
    UNIQUE KEY `uk_user_theme` (`user_id`, `theme_id`),
    FOREIGN KEY (`user_id`) REFERENCES `dt_user`(`id`),
    FOREIGN KEY (`theme_id`) REFERENCES `dt_theme_store`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 邮箱验证码表
CREATE TABLE IF NOT EXISTS `dt_email_verification` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `email`         VARCHAR(128) NOT NULL COMMENT '目标邮箱',
    `code`          VARCHAR(8)   NOT NULL COMMENT '验证码',
    `purpose`       VARCHAR(32)  NOT NULL DEFAULT 'register' COMMENT '用途',
    `verified`      TINYINT      DEFAULT 0 COMMENT '是否已验证',
    `expires_at`    DATETIME     NOT NULL COMMENT '过期时间',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email_purpose` (`email`, `purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
