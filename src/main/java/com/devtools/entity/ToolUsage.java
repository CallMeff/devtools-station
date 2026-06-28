package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工具使用记录
 */
@Data
@TableName("dt_tool_usage")
public class ToolUsage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long toolId;
    private String toolName;
    private String ipAddress;
    private String userAgent;
    private Integer inputSize;
    private Long durationMs;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
