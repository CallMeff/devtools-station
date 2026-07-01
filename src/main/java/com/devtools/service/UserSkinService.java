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
        if (skin != null && skin.getSkinImage() != null) {
            result.put("skinImage", skin.getSkinImage());
            result.put("opacity", skin.getOpacity() != null ? skin.getOpacity() : 0.15);
            result.put("fitMode", skin.getFitMode() != null ? skin.getFitMode() : "cover");
        }
        return result;
    }

    /**
     * 保存/更新皮肤
     */
    public void saveSkin(Long userId, String skinImage, Double opacity) {
        UserSkin skin = skinMapper.selectOne(new LambdaQueryWrapper<UserSkin>()
                .eq(UserSkin::getUserId, userId));
        if (skin == null) {
            skin = new UserSkin();
            skin.setUserId(userId);
        }
        skin.setSkinImage(skinImage);
        skin.setOpacity(opacity != null ? Math.max(0.05, Math.min(1.0, opacity)) : 0.15);
        skin.setFitMode("cover");

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
