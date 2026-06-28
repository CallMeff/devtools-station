package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户收藏
 */
@Data
@TableName("dt_favorite")
public class Favorite {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String userKey;
    private Long toolId;
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
