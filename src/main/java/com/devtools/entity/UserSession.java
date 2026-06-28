package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户会话（Token）
 */
@Data
@TableName("dt_user_session")
public class UserSession {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String token;
    private String tokenHash;
    private String ipAddress;
    private String userAgent;

    private LocalDateTime expiresAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
