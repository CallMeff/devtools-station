package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工具实体
 */
@Data
@TableName("dt_tool")
public class Tool {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long categoryId;
    private String name;
    private String route;
    private String icon;
    private String description;
    private String keywords;
    private String apiPath;
    private Integer status;
    private Integer isHot;
    private Integer isNew;
    private Integer sortOrder;
    private Long useCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
