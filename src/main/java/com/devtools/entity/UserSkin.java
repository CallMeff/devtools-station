package com.devtools.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户页面皮肤设置
 */
@Data
@TableName("dt_user_skin")
public class UserSkin {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** Base64 编码的皮肤图片 */
    private String skinImage;

    /** 不透明度 0.0-1.0，默认 0.15 */
    private Double opacity;

    /** 填充模式：cover / contain */
    private String fitMode;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
