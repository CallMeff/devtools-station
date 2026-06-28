package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户反馈实体
 */
@Data
@TableName("dt_feedback")
public class Feedback {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 反馈类型: suggestion/bug/experience/other */
    private String type;

    /** 反馈标题 */
    private String title;

    /** 反馈内容 */
    private String content;

    /** 提交用户ID（未登录为null） */
    private Long userId;

    /** 用户联系方式（可选） */
    private String contact;

    /** 处理状态: pending/processing/resolved/closed */
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
