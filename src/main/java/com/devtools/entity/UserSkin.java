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

    /** Base64 编码的皮肤图片（image 模式） */
    private String skinImage;

    /** 媒体类型：image / video */
    private String skinMediaType;

    /** 视频文件路径（video 模式，相对路径） */
    private String skinVideo;

    /** 不透明度 0.0-1.0，默认 0.15 */
    private Double opacity;

    /** 填充模式：cover / contain / stretch / tile / tile-x / tile-y */
    private String fitMode;

    /** 缩放百分比，默认 100 (仅 original / tile 模式生效) */
    private Double skinZoom;

    /** 背景位置 X 百分比，默认 50 (居中) */
    private Double skinPosX;

    /** 背景位置 Y 百分比，默认 50 (居中) */
    private Double skinPosY;

    /** 重复模式：no-repeat / repeat / repeat-x / repeat-y */
    private String skinRepeat;

    /** 视频是否静音，默认 true */
    private Boolean videoMuted;

    /** 视频是否循环，默认 true */
    private Boolean videoLoop;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
