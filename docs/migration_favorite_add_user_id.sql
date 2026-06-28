-- 为 dt_favorite 表添加 user_id 列，支持登录用户的收藏功能
ALTER TABLE dt_favorite ADD COLUMN user_id BIGINT DEFAULT NULL AFTER id;
CREATE INDEX idx_favorite_user_id ON dt_favorite(user_id);
CREATE INDEX idx_favorite_user_tool ON dt_favorite(user_id, tool_id);
