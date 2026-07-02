package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户已购主题
 */
@Data
@TableName("dt_user_theme")
public class UserTheme {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long themeId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime purchasedAt;
}
