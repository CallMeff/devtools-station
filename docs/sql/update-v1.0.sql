-- ============================================
-- DevTools Station 数据更新脚本 v1.0
-- 用于增量更新工具数据
-- ============================================

USE `devtools_station`;

-- 示例：新增一个工具
-- INSERT INTO `dt_tool` (`category_id`, `name`, `route`, `icon`, `description`, `keywords`, `api_path`, `status`, `is_hot`, `is_new`, `sort_order`)
-- VALUES (1, '新工具名', '/tools/new-tool', '🆕', '工具描述', 'keyword1,keyword2', '/api/tools/xxx', 1, 0, 1, 99);

-- 示例：更新工具状态
-- UPDATE `dt_tool` SET `status` = 0 WHERE `route` = '/tools/old-tool';

-- 示例：设置热门工具
-- UPDATE `dt_tool` SET `is_hot` = 1 WHERE `id` IN (1, 2, 3);
