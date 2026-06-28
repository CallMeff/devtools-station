package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户设置
 */
@Data
@TableName("dt_user_settings")
public class UserSettings {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String theme;
    private String language;
    private String recentTools;
    private String favoriteTools;
    private String inputHistory;
    private String uiPreferences;
    private String customConfig;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
