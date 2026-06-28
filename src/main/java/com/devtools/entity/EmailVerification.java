package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 邮箱验证码
 */
@Data
@TableName("dt_email_verification")
public class EmailVerification {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String email;
    private String code;
    private String purpose;

    /** 是否已验证: 0=未验证, 1=已验证 */
    private Integer verified;

    private LocalDateTime expiresAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
