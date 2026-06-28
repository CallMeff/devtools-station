-- ============================================
-- DevTools Station 数据库初始化脚本
-- 数据库: devtools_station
-- 版本: v1.1.0
-- 日期: 2026-06-19
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `devtools_station`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `devtools_station`;

-- ============================================
-- 1. 工具分类表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_category` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name`        VARCHAR(64)  NOT NULL COMMENT '分类名称',
    `icon`        VARCHAR(128) DEFAULT '' COMMENT '分类图标(SVG或icon类名)',
    `sort_order`  INT          DEFAULT 0 COMMENT '排序序号(越小越前)',
    `description` VARCHAR(256) DEFAULT '' COMMENT '分类描述',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT      DEFAULT 0 COMMENT '逻辑删除(0-否,1-是)',
    PRIMARY KEY (`id`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工具分类表';

-- ============================================
-- 2. 工具表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_tool` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `category_id` BIGINT       NOT NULL COMMENT '分类ID',
    `name`        VARCHAR(128) NOT NULL COMMENT '工具名称',
    `route`       VARCHAR(128) NOT NULL COMMENT '前端路由路径',
    `icon`        VARCHAR(128) DEFAULT '' COMMENT '工具图标',
    `description` VARCHAR(512) DEFAULT '' COMMENT '工具描述',
    `keywords`    VARCHAR(256) DEFAULT '' COMMENT '搜索关键词(逗号分隔)',
    `api_path`    VARCHAR(256) DEFAULT '' COMMENT '后端API路径',
    `status`      TINYINT      DEFAULT 1 COMMENT '状态(0-禁用,1-启用)',
    `is_hot`      TINYINT      DEFAULT 0 COMMENT '是否热门(0-否,1-是)',
    `is_new`      TINYINT      DEFAULT 0 COMMENT '是否新品(0-否,1-是)',
    `sort_order`  INT          DEFAULT 0 COMMENT '排序序号',
    `use_count`   BIGINT       DEFAULT 0 COMMENT '使用次数',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     TINYINT      DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status_sort` (`status`, `sort_order`),
    KEY `idx_route` (`route`),
    UNIQUE KEY `uk_route` (`route`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工具表';

-- ============================================
-- 3. 工具使用记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_tool_usage` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `tool_id`     BIGINT       NOT NULL COMMENT '工具ID',
    `tool_name`   VARCHAR(128) DEFAULT '' COMMENT '工具名称(冗余)',
    `ip_address`  VARCHAR(64)  DEFAULT '' COMMENT 'IP地址',
    `user_agent`  VARCHAR(512) DEFAULT '' COMMENT '浏览器UA',
    `input_size`  INT          DEFAULT 0 COMMENT '输入数据大小(字节)',
    `duration_ms` BIGINT       DEFAULT 0 COMMENT '处理耗时(毫秒)',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_tool_id` (`tool_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工具使用记录表';

-- ============================================
-- 4. 用户收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS `dt_favorite` (
    `id`          BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_key`    VARCHAR(128) NOT NULL COMMENT '用户标识(Cookie/Session)',
    `tool_id`     BIGINT   NOT NULL COMMENT '工具ID',
    `sort_order`  INT      DEFAULT 0 COMMENT '排序序号',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_key` (`user_key`),
    UNIQUE KEY `uk_user_tool` (`user_key`, `tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- ============================================
-- 初始化数据: 工具分类
-- ============================================
INSERT INTO `dt_category` (`id`, `name`, `icon`, `sort_order`, `description`) VALUES
(1,  '加解密',     '🔐', 1, '哈希计算、对称/非对称加密、编码解码'),
(2,  '格式化',     '📝', 2, 'JSON/XML/SQL/CSS 代码格式化与美化'),
(3,  '转换器',     '🔄', 3, '时间戳、进制、颜色、编码等数据转换'),
(4,  '生成器',     '⚡', 4, 'UUID、密码、二维码、随机数等生成工具'),
(5,  '文本处理',   '📄', 5, '文本对比、统计、正则测试、大小写转换'),
(6,  '网络工具',   '🌐', 6, 'IP查询、URL编解码、UserAgent解析'),
(7,  '图片工具',   '🖼️', 7, '图片压缩、格式转换、二维码生成与解析'),
(8,  '开发工具',   '💻', 8, 'Cron表达式、Base64、Git备忘、JSON编辑');

-- ============================================
-- 初始化数据: 工具列表
-- ============================================
INSERT INTO `dt_tool` (`category_id`, `name`, `route`, `icon`, `description`, `keywords`, `api_path`, `status`, `is_hot`, `is_new`, `sort_order`) VALUES
-- 加解密
(1, 'MD5 哈希',       '/tools/md5',       '🔑', '计算文本或文件的 MD5 哈希值',               'md5,hash,哈希,摘要',                '/api/tools/crypto/hash',        1, 1, 0, 1),
(1, 'SHA 哈希',       '/tools/sha',       '🔒', '支持 SHA-1/SHA-256/SHA-512 哈希计算',        'sha,hash,安全哈希',                  '/api/tools/crypto/hash',        1, 1, 0, 2),
(1, 'AES 加解密',     '/tools/aes',       '🛡️', 'AES 对称加密解密，支持多种模式',              'aes,加密,解密,对称',                 '/api/tools/crypto/aes',         1, 1, 0, 3),
(1, 'Base64 编解码',  '/tools/base64',    '📟', 'Base64 编码与解码转换',                       'base64,编码,解码',                   '/api/tools/crypto/base64',      1, 1, 0, 4),
(1, 'URL 编解码',     '/tools/urlcode',   '🔗', 'URL 编码(encodeURIComponent)与解码',         'url,encode,decode,编码',             '/api/tools/crypto/urlcode',     1, 0, 0, 5),
(1, 'BCrypt 密码',    '/tools/bcrypt',    '🔐', 'BCrypt 密码哈希生成与验证',                   'bcrypt,密码,哈希',                   '/api/tools/crypto/bcrypt',      1, 0, 1, 6),

-- 格式化
(2, 'JSON 格式化',    '/tools/json-fmt',  '📋', 'JSON 格式化/压缩/校验，树形可视化浏览',      'json,格式化,美化,压缩',              '/api/tools/format/json',        1, 1, 0, 1),
(2, 'SQL 格式化',     '/tools/sql-fmt',   '🗄️', 'SQL 语句格式化美化',                         'sql,格式化,美化',                    '/api/tools/format/sql',         1, 1, 0, 2),
(2, 'XML 格式化',     '/tools/xml-fmt',   '📰', 'XML 格式化与压缩',                            'xml,格式化,美化',                    '/api/tools/format/xml',         1, 0, 0, 3),
(2, 'CSS 格式化',     '/tools/css-fmt',   '🎨', 'CSS 样式代码格式化与压缩',                    'css,格式化,美化,压缩',               '/api/tools/format/css',         1, 0, 0, 4),

-- 转换器
(3, '时间戳转换',     '/tools/timestamp', '⏰', 'Unix时间戳与日期时间互转',                    'timestamp,时间戳,日期,unix',         '/api/tools/convert/timestamp',  1, 1, 0, 1),
(3, '进制转换',       '/tools/radix',     '🔢', '二进制/八进制/十进制/十六进制互转',          '进制,二进制,十六进制,转换',          '/api/tools/convert/radix',      1, 1, 0, 2),
(3, '颜色转换',       '/tools/color',     '🎯', 'HEX/RGB/HSL 颜色格式互转',                    '颜色,hex,rgb,hsl,转换',              '/api/tools/convert/color',      1, 0, 0, 3),
(3, 'Unicode 转换',   '/tools/unicode',   '🔤', 'Unicode 与中文互转',                          'unicode,中文,编码',                  '/api/tools/convert/unicode',    1, 0, 0, 4),
(3, '大小写转换',     '/tools/case',      '🔠', '大写/小写/驼峰/下划线/常量 命名风格转换',     'case,大小写,驼峰,下划线',            '/api/tools/convert/case',       1, 0, 0, 5),

-- 生成器
(4, 'UUID 生成',      '/tools/uuid',      '🆔', '批量生成 UUID v1/v4，支持多种格式',           'uuid,guid,唯一标识,生成',            '/api/tools/generate/uuid',      1, 1, 0, 1),
(4, '随机密码',       '/tools/password',  '🔏', '高强度随机密码生成器，可自定义规则',          'password,密码,随机,安全',            '/api/tools/generate/password',  1, 1, 0, 2),
(4, '二维码生成',     '/tools/qrcode',    '📱', '在线生成二维码，支持自定义颜色与Logo',        'qrcode,二维码,生成',                 '/api/tools/generate/qrcode',    1, 1, 0, 3),
(4, '随机数生成',     '/tools/random',    '🎲', '指定范围随机数/随机字符串批量生成',           'random,随机数,随机字符串',           '/api/tools/generate/random',    1, 0, 0, 4),
(4, 'Lorem Ipsum',   '/tools/lorem',      '📜', 'Lorem Ipsum 占位文本生成',                    'lorem,ipsum,占位,文本',              '/api/tools/generate/lorem',     1, 0, 0, 5),

-- 文本处理
(5, '文本对比',       '/tools/diff',      '🔍', '并排对比两段文本差异，高亮显示变更',          'diff,对比,差异,文本',                '/api/tools/text/diff',          1, 1, 0, 1),
(5, '正则测试',       '/tools/regex',     '🧩', '在线正则表达式测试与匹配',                    'regex,正则,测试,匹配',               '/api/tools/text/regex',         1, 1, 0, 2),
(5, '字数统计',       '/tools/count',     '📊', '统计文本字符数/单词数/行数',                  'count,字数,统计,字符',               '/api/tools/text/count',         1, 0, 0, 3),
(5, '文本去重',       '/tools/unique',    '📑', '按行文本去重，支持排序',                       'unique,去重,排序,行',                '/api/tools/text/unique',        1, 0, 0, 4),

-- 网络工具
(6, 'IP 查询',        '/tools/ip',        '🌍', '查询IP地址归属地、运营商信息',                'ip,查询,归属地,地址',                '/api/tools/network/ip',         1, 1, 0, 1),
(6, 'UserAgent解析',  '/tools/ua',        '🔎', '解析浏览器 UserAgent 字符串',                 'useragent,ua,浏览器,解析',           '/api/tools/network/ua',         1, 1, 0, 2),
(6, 'HTTP状态码',     '/tools/httpstatus','📡', 'HTTP 状态码速查表',                           'http,状态码,code',                   '/api/tools/network/httpstatus', 1, 0, 0, 3),

-- 图片工具
(7, '图片压缩',       '/tools/img-compress','🗜️', '在线图片压缩，支持PNG/JPEG/WebP',          'image,图片,压缩,png,jpg',            '/api/tools/image/compress',     1, 1, 0, 1),
(7, '图片转Base64',   '/tools/img-base64','🖼️', '图片文件转 Base64 编码',                      'image,base64,图片,编码',             '/api/tools/image/base64',       1, 0, 0, 2),

-- 开发工具
(8, 'Cron 表达式',    '/tools/cron',      '⏱️', 'Cron 表达式生成与解析，可视化预览执行计划',   'cron,定时,表达式,调度',              '/api/tools/dev/cron',           1, 1, 0, 1),
(8, 'Git 备忘',       '/tools/git',       '📚', 'Git 常用命令速查表',                          'git,命令,备忘,速查',                 '/api/tools/dev/git',            1, 1, 0, 2),
(8, 'JSON 编辑器',    '/tools/json-edit', '🗂️', '在线 JSON 编辑器，支持树形/代码双视图',       'json,编辑,树形,视图',                '/api/tools/dev/json-edit',      1, 0, 0, 3),
(8, 'MIME 类型查询',  '/tools/mime',      '📎', '文件扩展名对应 MIME Type 速查',               'mime,类型,文件,扩展名',              '/api/tools/dev/mime',           1, 0, 0, 4);

-- ============================================
-- v1.1 新增：用户系统
-- ============================================

-- 5. 用户表
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

-- 6. 用户会话表
CREATE TABLE IF NOT EXISTS `dt_user_session` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '用户ID',
    `token`         VARCHAR(256) NOT NULL COMMENT '会话Token（AES加密存储）',
    `token_hash`    VARCHAR(128) NOT NULL COMMENT 'Token哈希（SHA-256）',
    `ip_address`    VARCHAR(64)  DEFAULT '' COMMENT '登录IP',
    `user_agent`    VARCHAR(512) DEFAULT '' COMMENT '浏览器UA',
    `expires_at`    DATETIME     NOT NULL COMMENT '过期时间',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- 7. 用户设置表
CREATE TABLE IF NOT EXISTS `dt_user_settings` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`          BIGINT       NOT NULL COMMENT '用户ID',
    `theme`            VARCHAR(32)  DEFAULT 'dark' COMMENT '主题(dark/light/anime)',
    `language`         VARCHAR(16)  DEFAULT 'zh-CN' COMMENT '语言偏好',
    `recent_tools`     TEXT         DEFAULT NULL COMMENT '最近使用的工具(JSON)',
    `favorite_tools`   TEXT         DEFAULT NULL COMMENT '收藏的工具ID(JSON)',
    `input_history`    MEDIUMTEXT   DEFAULT NULL COMMENT '输入历史(JSON)',
    `ui_preferences`   TEXT         DEFAULT NULL COMMENT 'UI偏好设置(JSON)',
    `custom_config`    TEXT         DEFAULT NULL COMMENT '自定义配置(JSON)',
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- 8. 用户操作日志表
CREATE TABLE IF NOT EXISTS `dt_user_activity` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '用户ID',
    `action`        VARCHAR(64)  NOT NULL COMMENT '操作类型(login/logout/tool_use等)',
    `target`        VARCHAR(256) DEFAULT '' COMMENT '操作目标',
    `detail`        TEXT         DEFAULT NULL COMMENT '操作详情(JSON)',
    `ip_address`    VARCHAR(64)  DEFAULT '' COMMENT '操作IP',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_action` (`user_id`, `action`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志表';


-- 修改现有表：增加 user_id 字段
ALTER TABLE `dt_favorite` ADD COLUMN `user_id` BIGINT DEFAULT NULL COMMENT '登录用户ID' AFTER `user_key`;
ALTER TABLE `dt_tool_usage` ADD COLUMN `user_id` BIGINT DEFAULT NULL COMMENT '用户ID' AFTER `tool_name`;

-- 9. 微信扫码登录状态表
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
