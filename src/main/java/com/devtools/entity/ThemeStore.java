package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * 主题商店 - 主题定义表
 */
@Data
@TableName("dt_theme_store")
public class ThemeStore {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 主题 key（对应 CSS 类名 theme-xxx） */
    private String themeKey;

    /** 主题显示名称 */
    private String name;

    /** 描述 */
    private String description;

    /** emoji 图标 */
    private String icon;

    /** 价格（积分） */
    private Integer price;

    /** 分类：free/premium */
    private String category;

    /** 强调色 */
    private String accentColor;

    /** 背景主色 */
    private String bgPrimary;

    /** 预览色块 JSON：渐变用到的关键色值 */
    private String previewColors;

    /** 排序 */
    private Integer sortOrder;

    /** 是否启用 */
    private Integer enabled;

    @TableField(fill = FieldFill.INSERT)
    private java.time.LocalDateTime createdAt;
}
