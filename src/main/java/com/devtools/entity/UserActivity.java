package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户操作日志
 */
@Data
@TableName("dt_user_activity")
public class UserActivity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String action;
    private String target;
    private String detail;
    private String ipAddress;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
