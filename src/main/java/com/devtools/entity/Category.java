package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工具分类实体
 */
@Data
@TableName("dt_category")
public class Category {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;
    private String icon;
    private Integer sortOrder;
    private String description;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
