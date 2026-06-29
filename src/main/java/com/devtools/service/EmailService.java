package com.devtools.service;

import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.entity.EmailVerification;
import com.devtools.mapper.EmailVerificationMapper;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.function.BiConsumer;

/**
 * 邮件发送服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailVerificationMapper verificationMapper;

    @Value("${spring.mail.username}")
    private String from;

    @Value("${app.mail.mock:false}")
    private boolean mockMail;

    /** 验证码有效期（分钟） */
    private static final int CODE_EXPIRE_MINUTES = 5;
    /** 同一邮箱发送间隔（秒） */
    private static final int SEND_INTERVAL_SECONDS = 60;

    /**
     * 发送注册验证码
     */
    public String sendRegisterCode(String email) {
        return sendVerificationCode(email, "register", this::sendEmail, "注册");
    }

    /**
     * 校验注册验证码
     * @return true=验证通过, false=验证码错误或已过期
     */
    public boolean verifyRegisterCode(String email, String code) {
        EmailVerification verification = verificationMapper.selectOne(
                new LambdaQueryWrapper<EmailVerification>()
                        .eq(EmailVerification::getEmail, email)
                        .eq(EmailVerification::getPurpose, "register")
                        .eq(EmailVerification::getVerified, 0)
                        .orderByDesc(EmailVerification::getCreatedAt)
                        .last("LIMIT 1")
        );

        if (verification == null) {
            return false;
        }

        // 检查是否过期
        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        // 检查验证码是否匹配
        if (!verification.getCode().equals(code)) {
            return false;
        }

        // 标记为已验证
        verification.setVerified(1);
        verificationMapper.updateById(verification);

        return true;
    }

    /**
     * 发送重置密码验证码
     */
    public String sendResetCode(String email) {
        return sendVerificationCode(email, "reset-password", this::sendResetEmail, "重置密码");
    }

    /**
     * 校验重置密码验证码
     */
    public boolean verifyResetCode(String email, String code) {
        EmailVerification verification = verificationMapper.selectOne(
                new LambdaQueryWrapper<EmailVerification>()
                        .eq(EmailVerification::getEmail, email)
                        .eq(EmailVerification::getPurpose, "reset-password")
                        .eq(EmailVerification::getVerified, 0)
                        .orderByDesc(EmailVerification::getCreatedAt)
                        .last("LIMIT 1")
        );

        if (verification == null) {
            return false;
        }

        // 检查是否过期
        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        // 检查验证码是否匹配
        if (!verification.getCode().equals(code)) {
            return false;
        }

        // 标记为已验证
        verification.setVerified(1);
        verificationMapper.updateById(verification);

        return true;
    }

    /**
     * 发送邮件
     */
    private void sendEmail(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("DevTools Station - 注册验证码");

            String content = buildEmailContent(code);
            helper.setText(content, true);

            mailSender.send(message);
            log.info("验证码邮件已发送至: {}", to);
        } catch (Exception e) {
            log.error("邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败，请稍后重试");
        }
    }

    /**
     * 构建邮件内容（注册用）
     */
    private String buildEmailContent(String code) {
        return """
                <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;border-radius:12px;color:#e2e8f0;">
                    <div style="text-align:center;margin-bottom:28px;">
                        <h1 style="color:#818cf8;font-size:24px;margin:0 0 4px;">DevTools Station</h1>
                        <p style="color:#94a3b8;font-size:14px;margin:0;">一站式开发者在线工具箱</p>
                    </div>
                    <div style="background:#1e293b;border-radius:8px;padding:24px;margin-bottom:24px;">
                        <p style="font-size:15px;margin:0 0 12px;color:#cbd5e1;">您好！</p>
                        <p style="font-size:15px;margin:0 0 8px;color:#cbd5e1;">您正在注册 <strong style="color:#818cf8;">DevTools Station</strong> 开发者工具箱账号。</p>
                        <p style="font-size:15px;margin:0 0 24px;color:#cbd5e1;">您的验证码为：</p>
                        <div style="text-align:center;margin-bottom:24px;">
                            <span style="display:inline-block;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px 40px;font-size:32px;font-weight:700;letter-spacing:8px;color:#a5b4fc;font-family:'Courier New',monospace;">%s</span>
                        </div>
                        <p style="font-size:13px;color:#94a3b8;margin:0 0 4px;">验证码 %d 分钟内有效，请勿泄露给他人。</p>
                        <p style="font-size:13px;color:#94a3b8;margin:0;">填入验证码后即可完成注册并登录。</p>
                    </div>
                    <div style="text-align:center;font-size:12px;color:#64748b;">
                        <p style="margin:0 0 4px;">此邮件由系统自动发送，请勿回复。</p>
                        <p style="margin:0;">如非本人操作，请忽略此邮件。</p>
                    </div>
                </div>
                """.formatted(code, CODE_EXPIRE_MINUTES);
    }

    /**
     * 发送重置密码邮件
     */
    private void sendResetEmail(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("DevTools Station - 重置密码");

            String content = buildResetEmailContent(code);
            helper.setText(content, true);

            mailSender.send(message);
            log.info("重置密码邮件已发送至: {}", to);
        } catch (Exception e) {
            log.error("重置密码邮件发送失败: {}", e.getMessage(), e);
            throw new RuntimeException("邮件发送失败，请稍后重试");
        }
    }

    /**
     * 构建重置密码邮件内容
     */
    private String buildResetEmailContent(String code) {
        return """
                <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;border-radius:12px;color:#e2e8f0;">
                    <div style="text-align:center;margin-bottom:28px;">
                        <h1 style="color:#818cf8;font-size:24px;margin:0 0 4px;">DevTools Station</h1>
                        <p style="color:#94a3b8;font-size:14px;margin:0;">一站式开发者在线工具箱</p>
                    </div>
                    <div style="background:#1e293b;border-radius:8px;padding:24px;margin-bottom:24px;">
                        <p style="font-size:15px;margin:0 0 12px;color:#cbd5e1;">您好！</p>
                        <p style="font-size:15px;margin:0 0 8px;color:#cbd5e1;">您正在为 <strong style="color:#818cf8;">DevTools Station</strong> 账号申请重置密码。</p>
                        <p style="font-size:15px;margin:0 0 24px;color:#cbd5e1;">您的验证码为：</p>
                        <div style="text-align:center;margin-bottom:24px;">
                            <span style="display:inline-block;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px 40px;font-size:32px;font-weight:700;letter-spacing:8px;color:#a5b4fc;font-family:'Courier New',monospace;">%s</span>
                        </div>
                        <p style="font-size:13px;color:#94a3b8;margin:0 0 4px;">验证码 %d 分钟内有效，请勿泄露给他人。</p>
                        <p style="font-size:13px;color:#94a3b8;margin:0;">填入验证码后即可设置新密码。</p>
                    </div>
                    <div style="background:#422a00;border-radius:8px;padding:16px;margin-bottom:24px;">
                        <p style="font-size:13px;color:#fbbf24;margin:0;"><strong>⚠ 安全提示：</strong>如果您没有申请重置密码，请忽略此邮件，您的账号是安全的。</p>
                    </div>
                    <div style="text-align:center;font-size:12px;color:#64748b;">
                        <p style="margin:0 0 4px;">此邮件由系统自动发送，请勿回复。</p>
                        <p style="margin:0;">如非本人操作，请忽略此邮件。</p>
                    </div>
                </div>
                """.formatted(code, CODE_EXPIRE_MINUTES);
    }

    /**
     * 检查发送频率限制
     */
    private void checkSendInterval(String email, String purpose) {
        EmailVerification last = verificationMapper.selectOne(
                new LambdaQueryWrapper<EmailVerification>()
                        .eq(EmailVerification::getEmail, email)
                        .eq(EmailVerification::getPurpose, purpose)
                        .orderByDesc(EmailVerification::getCreatedAt)
                        .last("LIMIT 1")
        );

        if (last != null) {
            LocalDateTime nextAllowed = last.getCreatedAt().plusSeconds(SEND_INTERVAL_SECONDS);
            if (LocalDateTime.now().isBefore(nextAllowed)) {
                long waitSeconds = java.time.Duration.between(LocalDateTime.now(), nextAllowed).getSeconds();
                throw new RuntimeException("请 " + waitSeconds + " 秒后再发送验证码");
            }
        }
    }

    private String sendVerificationCode(String email, String purpose, BiConsumer<String, String> sender, String label) {
        checkSendInterval(email, purpose);

        String code = RandomUtil.randomNumbers(6);
        if (mockMail) {
            saveVerification(email, code, purpose);
            log.warn("邮件 mock 模式已启用，{}验证码已生成: email={}, code={}", label, maskEmail(email), code);
            return code;
        }

        sender.accept(email, code);
        saveVerification(email, code, purpose);
        return null;
    }

    private void saveVerification(String email, String code, String purpose) {
        EmailVerification verification = new EmailVerification();
        verification.setEmail(email);
        verification.setCode(code);
        verification.setPurpose(purpose);
        verification.setVerified(0);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRE_MINUTES));
        verificationMapper.insert(verification);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int at = email.indexOf('@');
        String name = email.substring(0, at);
        String domain = email.substring(at);
        if (name.length() <= 2) {
            return name.charAt(0) + "***" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + domain;
    }
}
