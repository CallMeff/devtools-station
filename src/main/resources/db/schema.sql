-- DevTools Station - H2 内存数据库建表语句
CREATE TABLE IF NOT EXISTS dt_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '🔧',
    sort_order INT DEFAULT 0,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dt_tool (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    route VARCHAR(200),
    icon VARCHAR(50) DEFAULT '🛠️',
    description VARCHAR(1000),
    keywords VARCHAR(500),
    api_path VARCHAR(200),
    status TINYINT DEFAULT 1,
    is_hot TINYINT DEFAULT 0,
    is_new TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    use_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES dt_category(id)
);

CREATE TABLE IF NOT EXISTS dt_tool_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tool_id BIGINT,
    tool_name VARCHAR(200),
    user_id BIGINT DEFAULT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    input_size INT DEFAULT 0,
    duration_ms BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dt_favorite (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tool_id BIGINT NOT NULL,
    user_key VARCHAR(100) NOT NULL,
    user_id BIGINT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES dt_tool(id)
);

CREATE TABLE IF NOT EXISTS dt_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) DEFAULT '',
    password_hash VARCHAR(256) DEFAULT '',
    salt VARCHAR(64) DEFAULT '',
    nickname VARCHAR(64) DEFAULT '',
    avatar VARCHAR(256) DEFAULT '',
    points INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    last_login_at TIMESTAMP DEFAULT NULL,
    last_login_ip VARCHAR(64) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dt_user_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(256) NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    ip_address VARCHAR(64) DEFAULT '',
    user_agent VARCHAR(512) DEFAULT '',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dt_user_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    theme VARCHAR(32) DEFAULT 'dark',
    language VARCHAR(16) DEFAULT 'zh-CN',
    recent_tools TEXT DEFAULT NULL,
    favorite_tools TEXT DEFAULT NULL,
    input_history TEXT DEFAULT NULL,
    ui_preferences TEXT DEFAULT NULL,
    custom_config TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dt_user_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(64) NOT NULL,
    target VARCHAR(256) DEFAULT '',
    detail TEXT DEFAULT NULL,
    ip_address VARCHAR(64) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 微信扫码登录状态表
CREATE TABLE IF NOT EXISTS dt_wx_qr_state (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket VARCHAR(64) NOT NULL COMMENT '二维码唯一标识',
    status VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT 'pending/scanned/confirmed/expired/cancelled',
    user_id BIGINT DEFAULT NULL COMMENT '扫码用户ID',
    scan_code VARCHAR(32) NOT NULL COMMENT '扫码验证码',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户反馈表
CREATE TABLE IF NOT EXISTS dt_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(32) DEFAULT 'other' COMMENT '反馈类型: suggestion/bug/experience/other',
    title VARCHAR(256) NOT NULL COMMENT '反馈标题',
    content TEXT NOT NULL COMMENT '反馈内容',
    user_id BIGINT DEFAULT NULL COMMENT '提交用户ID',
    contact VARCHAR(128) DEFAULT NULL COMMENT '联系方式',
    status VARCHAR(32) DEFAULT 'pending' COMMENT '处理状态: pending/processing/resolved/closed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户页面皮肤表
CREATE TABLE IF NOT EXISTS dt_user_skin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    skin_image MEDIUMTEXT DEFAULT NULL COMMENT 'Base64皮肤图片',
    opacity DOUBLE DEFAULT 0.15 COMMENT '不透明度 0.05-1.0',
    fit_mode VARCHAR(16) DEFAULT 'cover' COMMENT '填充模式',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES dt_user(id)
);

-- 主题商店 - 主题定义表
CREATE TABLE IF NOT EXISTS dt_theme_store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    theme_key VARCHAR(64) NOT NULL COMMENT '主题 key（对应 CSS 类名 theme-xxx）',
    name VARCHAR(64) NOT NULL COMMENT '主题显示名称',
    description VARCHAR(256) DEFAULT '' COMMENT '描述',
    icon VARCHAR(16) DEFAULT '' COMMENT 'emoji 图标',
    price INT DEFAULT 0 COMMENT '价格（积分）',
    category VARCHAR(16) DEFAULT 'free' COMMENT '分类: free/premium',
    accent_color VARCHAR(16) DEFAULT '' COMMENT '强调色',
    bg_primary VARCHAR(16) DEFAULT '' COMMENT '背景主色',
    preview_colors VARCHAR(512) DEFAULT '' COMMENT '预览色块 JSON',
    sort_order INT DEFAULT 0 COMMENT '排序',
    enabled TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户已购主题表
CREATE TABLE IF NOT EXISTS dt_user_theme (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    theme_id BIGINT NOT NULL COMMENT '主题ID',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
    FOREIGN KEY (user_id) REFERENCES dt_user(id),
    FOREIGN KEY (theme_id) REFERENCES dt_theme_store(id)
);

-- 邮箱验证码表
CREATE TABLE IF NOT EXISTS dt_email_verification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(128) NOT NULL COMMENT '目标邮箱',
    code VARCHAR(8) NOT NULL COMMENT '6位验证码',
    purpose VARCHAR(32) NOT NULL DEFAULT 'register' COMMENT '用途: register/password_reset',
    verified TINYINT DEFAULT 0 COMMENT '是否已验证: 0=未验证, 1=已验证',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose)
);
