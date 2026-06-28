package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 微信扫码登录状态表
 * 存储扫码登录的临时状态，用于前端轮询
 */
@Data
@TableName("dt_wx_qr_state")
public class WxQrState {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 二维码唯一标识 */
    private String ticket;

    /** 二维码状态: pending(等待扫码) / scanned(已扫码) / confirmed(已确认) / expired(已过期) / cancelled(已取消) */
    private String status;

    /** 扫码用户ID（扫码后填入） */
    private Long userId;

    /** 扫码时的临时code（用于安全校验） */
    private String scanCode;

    /** 过期时间（5分钟） */
    private LocalDateTime expiresAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
