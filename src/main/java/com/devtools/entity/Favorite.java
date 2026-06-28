package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户收藏（我的常用工具）
 */
@Data
@TableName("dt_favorite")
public class Favorite {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录用户 ID（与 dt_user.id 关联） */
    private Long userId;

    /** 匿名用户标识（未登录用户使用，预留） */
    private String userKey;

    /** 工具 ID */
    private Long toolId;

    /** 排序权重（越小越靠前） */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
