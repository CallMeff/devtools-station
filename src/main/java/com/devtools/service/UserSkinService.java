package com.devtools.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.UserSkin;
import com.devtools.mapper.UserSkinMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户页面皮肤服务
 */
@Service
@RequiredArgsConstructor
public class UserSkinService {

    private final UserSkinMapper skinMapper;

    /**
     * 获取用户皮肤设置
     */
    public Map<String, Object> getSkin(Long userId) {
        UserSkin skin = skinMapper.selectOne(new LambdaQueryWrapper<UserSkin>()
                .eq(UserSkin::getUserId, userId));
        Map<String, Object> result = new HashMap<>();
        if (skin != null && (skin.getSkinImage() != null || skin.getSkinVideo() != null)) {
            result.put("skinMediaType", skin.getSkinMediaType() != null ? skin.getSkinMediaType() : "image");
            result.put("skinImage", skin.getSkinImage());
            result.put("skinVideo", skin.getSkinVideo());
            result.put("opacity", skin.getOpacity() != null ? skin.getOpacity() : 0.15);
            result.put("fitMode", skin.getFitMode() != null ? skin.getFitMode() : "cover");
            result.put("skinZoom", skin.getSkinZoom() != null ? skin.getSkinZoom() : 100.0);
            result.put("skinPosX", skin.getSkinPosX() != null ? skin.getSkinPosX() : 50.0);
            result.put("skinPosY", skin.getSkinPosY() != null ? skin.getSkinPosY() : 50.0);
            result.put("skinRepeat", skin.getSkinRepeat() != null ? skin.getSkinRepeat() : "no-repeat");
            result.put("videoMuted", skin.getVideoMuted() != null ? skin.getVideoMuted() : true);
            result.put("videoLoop", skin.getVideoLoop() != null ? skin.getVideoLoop() : true);
        }
        return result;
    }

    /**
     * 保存/更新皮肤（图片模式）
     */
    public void saveSkin(Long userId, String skinImage, Double opacity) {
        saveSkin(userId, skinImage, opacity, null, null, null, null, null,
                "image", null, null, null);
    }

    /**
     * 保存/更新皮肤（完整参数）
     */
    public void saveSkin(Long userId, String skinImage, Double opacity,
                         String fitMode, Double skinZoom,
                         Double skinPosX, Double skinPosY, String skinRepeat) {
        saveSkin(userId, skinImage, opacity, fitMode, skinZoom, skinPosX, skinPosY, skinRepeat,
                "image", null, null, null);
    }

    /**
     * 保存/更新皮肤（完整参数含视频）
     */
    public void saveSkin(Long userId, String skinImage, Double opacity,
                         String fitMode, Double skinZoom,
                         Double skinPosX, Double skinPosY, String skinRepeat,
                         String skinMediaType, String skinVideo,
                         Boolean videoMuted, Boolean videoLoop) {
        UserSkin skin = skinMapper.selectOne(new LambdaQueryWrapper<UserSkin>()
                .eq(UserSkin::getUserId, userId));
        if (skin == null) {
            skin = new UserSkin();
            skin.setUserId(userId);
        }
        skin.setSkinImage(skinImage);
        skin.setSkinMediaType(skinMediaType != null ? skinMediaType : "image");
        skin.setSkinVideo(skinVideo);
        skin.setOpacity(opacity != null ? Math.max(0.05, Math.min(1.0, opacity)) : 0.15);
        skin.setFitMode(fitMode != null ? fitMode : "cover");
        skin.setSkinZoom(skinZoom != null ? Math.max(10.0, Math.min(500.0, skinZoom)) : 100.0);
        skin.setSkinPosX(skinPosX != null ? Math.max(0.0, Math.min(100.0, skinPosX)) : 50.0);
        skin.setSkinPosY(skinPosY != null ? Math.max(0.0, Math.min(100.0, skinPosY)) : 50.0);
        skin.setSkinRepeat(skinRepeat != null ? skinRepeat : "no-repeat");
        skin.setVideoMuted(videoMuted != null ? videoMuted : true);
        skin.setVideoLoop(videoLoop != null ? videoLoop : true);

        if (skin.getId() == null) {
            skinMapper.insert(skin);
        } else {
            skinMapper.updateById(skin);
        }
    }

    /**
     * 删除皮肤
     */
    public void deleteSkin(Long userId) {
        skinMapper.delete(new LambdaQueryWrapper<UserSkin>()
                .eq(UserSkin::getUserId, userId));
    }
}
