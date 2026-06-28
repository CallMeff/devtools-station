package com.devtools.service;

import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.User;
import com.devtools.entity.UserSession;
import com.devtools.entity.UserSettings;
import com.devtools.entity.WxQrState;
import com.devtools.mapper.UserMapper;
import com.devtools.mapper.UserSessionMapper;
import com.devtools.mapper.UserSettingsMapper;
import com.devtools.mapper.WxQrStateMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageConfig;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 微信扫码登录服务
 *
 * 流程：
 * 1. 前端请求生成二维码 → 后端生成 ticket + 二维码(含验证URL) → 返回二维码base64图片
 * 2. 前端轮询 /api/auth/wx/check?ticket=xxx
 * 3. 用户扫码访问验证URL → 后端标记 scanned → 前端提示"已扫码"
 * 4. 用户在验证页点确认 → 后端标记 confirmed + 生成token → 前端拿到token完成登录
 *
 * 对接真实微信开放平台时，将 generateQrCode() 中的二维码内容替换为微信 OAuth URL 即可。
 */
@Service
@RequiredArgsConstructor
public class WxLoginService {

    private final WxQrStateMapper qrStateMapper;
    private final UserMapper userMapper;
    private final UserSessionMapper sessionMapper;
    private final UserSettingsMapper settingsMapper;
    private final AuthService authService;

    private static final int QR_EXPIRE_MINUTES = 5;
    private static final int QR_SIZE = 260;

    /**
     * 生成扫码登录二维码
     */
    public Map<String, Object> generateQrCode(String baseUrl) {
        String ticket = RandomUtil.randomString(32);
        String scanCode = RandomUtil.randomString(16);

        // 保存状态
        WxQrState state = new WxQrState();
        state.setTicket(ticket);
        state.setStatus("pending");
        state.setScanCode(scanCode);
        state.setExpiresAt(LocalDateTime.now().plusMinutes(QR_EXPIRE_MINUTES));
        qrStateMapper.insert(state);

        // 构建扫码验证 URL
        String verifyUrl = baseUrl + "/api/auth/wx/verify?ticket=" + ticket + "&code=" + scanCode;

        try {
            // 使用 Google ZXing 生成二维码
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
            hints.put(EncodeHintType.MARGIN, 2);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(verifyUrl, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);

            MatrixToImageConfig config = new MatrixToImageConfig(0xFF000000, 0xFFFFFFFF);
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix, config);

            // 添加微信风格的中心图标
            addWxLogo(qrImage);

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", bos);
            String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(bos.toByteArray());

            Map<String, Object> result = new HashMap<>();
            result.put("ticket", ticket);
            result.put("qrUrl", base64);
            result.put("expiresIn", QR_EXPIRE_MINUTES * 60);
            return result;
        } catch (Exception e) {
            // 降级：返回在线生成二维码的 URL
            try {
                String encodedUrl = java.net.URLEncoder.encode(verifyUrl, "UTF-8");
                Map<String, Object> result = new HashMap<>();
                result.put("ticket", ticket);
                result.put("qrUrl", "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + encodedUrl);
                result.put("expiresIn", QR_EXPIRE_MINUTES * 60);
                return result;
            } catch (Exception ex) {
                Map<String, Object> result = new HashMap<>();
                result.put("ticket", ticket);
                result.put("qrUrl", "");
                result.put("expiresIn", QR_EXPIRE_MINUTES * 60);
                return result;
            }
        }
    }

    /**
     * 在二维码中间添加微信风格图标
     */
    private void addWxLogo(BufferedImage image) {
        try {
            int size = image.getWidth();
            int logoSize = size / 5;
            int x = (size - logoSize) / 2;
            int y = (size - logoSize) / 2;

            Graphics2D g2 = image.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            // 白色圆角背景
            g2.setColor(Color.WHITE);
            g2.fill(new RoundRectangle2D.Float(x - 5, y - 5, logoSize + 10, logoSize + 10, 10, 10));

            // 绿色圆形
            g2.setColor(new Color(7, 193, 96));
            g2.fillOval(x + 2, y + 2, logoSize - 4, logoSize - 4);

            // 白色对勾
            g2.setColor(Color.WHITE);
            g2.setStroke(new BasicStroke(3.5f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            int cx = x + logoSize / 2;
            int cy = y + logoSize / 2;
            g2.drawLine(cx - 10, cy, cx - 2, cy + 8);
            g2.drawLine(cx - 2, cy + 8, cx + 10, cy - 8);

            g2.dispose();
        } catch (Exception e) {
            // 图标绘制失败，二维码仍可使用
        }
    }

    /**
     * 轮询检查二维码状态
     */
    public Map<String, Object> checkQrState(String ticket) {
        WxQrState state = qrStateMapper.selectOne(new LambdaQueryWrapper<WxQrState>()
                .eq(WxQrState::getTicket, ticket));

        Map<String, Object> result = new HashMap<>();

        if (state == null) {
            result.put("status", "expired");
            return result;
        }

        // 检查是否过期
        if (state.getExpiresAt().isBefore(LocalDateTime.now()) && !"confirmed".equals(state.getStatus())) {
            state.setStatus("expired");
            qrStateMapper.updateById(state);
            result.put("status", "expired");
            return result;
        }

        result.put("status", state.getStatus());

        // 如果已确认，生成登录 token（一次性消费）
        if ("confirmed".equals(state.getStatus()) && state.getUserId() != null) {
            // 先删除记录防止重复消费
            qrStateMapper.deleteById(state.getId());

            User user = userMapper.selectById(state.getUserId());
            if (user != null) {
                String token = authService.createSession(user.getId());
                result.put("token", token);
                result.put("id", user.getId());
                result.put("username", user.getUsername());
                result.put("nickname", user.getNickname());
                result.put("email", user.getEmail());
                result.put("avatar", user.getAvatar());

                // 加载设置
                UserSettings settings = settingsMapper.selectOne(new LambdaQueryWrapper<UserSettings>()
                        .eq(UserSettings::getUserId, user.getId()));
                if (settings != null) {
                    result.put("theme", settings.getTheme());
                    result.put("language", settings.getLanguage());
                }
            }
        }

        return result;
    }

    /**
     * 验证扫码请求
     */
    public Map<String, Object> verifyScan(String ticket, String code) {
        WxQrState state = qrStateMapper.selectOne(new LambdaQueryWrapper<WxQrState>()
                .eq(WxQrState::getTicket, ticket));

        Map<String, Object> result = new HashMap<>();

        if (state == null) {
            result.put("success", false);
            result.put("message", "二维码不存在或已过期");
            return result;
        }

        if (state.getExpiresAt().isBefore(LocalDateTime.now())) {
            result.put("success", false);
            result.put("message", "二维码已过期，请刷新");
            return result;
        }

        if (!"pending".equals(state.getStatus())) {
            result.put("success", false);
            result.put("message", "二维码已被使用");
            return result;
        }

        if (!code.equals(state.getScanCode())) {
            result.put("success", false);
            result.put("message", "验证码错误");
            return result;
        }

        // 自动创建/查找微信扫码用户
        String wxUsername = "wx_" + ticket.substring(0, 12);
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, wxUsername));
        if (user == null) {
            user = new User();
            user.setUsername(wxUsername);
            user.setNickname("微信用户" + ticket.substring(0, 6));
            user.setPasswordHash("");
            user.setSalt("");
            user.setStatus(1);
            userMapper.insert(user);

            // 创建默认设置
            UserSettings settings = new UserSettings();
            settings.setUserId(user.getId());
            settings.setTheme("dark");
            settings.setLanguage("zh-CN");
            settingsMapper.insert(settings);
        }

        state.setStatus("scanned");
        state.setUserId(user.getId());
        qrStateMapper.updateById(state);

        result.put("success", true);
        result.put("message", "扫码成功，请确认登录");
        result.put("userId", user.getId());
        return result;
    }

    /**
     * 确认登录
     */
    public Map<String, Object> confirmLogin(String ticket, Long userId) {
        WxQrState state = qrStateMapper.selectOne(new LambdaQueryWrapper<WxQrState>()
                .eq(WxQrState::getTicket, ticket));

        Map<String, Object> result = new HashMap<>();

        if (state == null) {
            result.put("success", false);
            result.put("message", "二维码不存在或已过期");
            return result;
        }

        if (!"scanned".equals(state.getStatus())) {
            result.put("success", false);
            result.put("message", "请先扫描二维码");
            return result;
        }

        if (!userId.equals(state.getUserId())) {
            result.put("success", false);
            result.put("message", "验证失败");
            return result;
        }

        state.setStatus("confirmed");
        qrStateMapper.updateById(state);

        result.put("success", true);
        result.put("message", "登录成功");
        return result;
    }

    /**
     * 清理过期二维码（可定时调用）
     */
    public void cleanExpired() {
        qrStateMapper.delete(new LambdaQueryWrapper<WxQrState>()
                .lt(WxQrState::getExpiresAt, LocalDateTime.now()));
    }
}
