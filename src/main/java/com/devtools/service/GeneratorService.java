package com.devtools.service;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.*;

/**
 * 生成器服务
 */
@Service
public class GeneratorService {

    /**
     * UUID 批量生成
     */
    public Map<String, Object> uuid(int count, boolean upperCase, boolean noDash) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<String> uuids = new ArrayList<>();
        for (int i = 0; i < Math.min(count, 100); i++) {
            String uuid = UUID.randomUUID().toString();
            if (noDash) uuid = uuid.replace("-", "");
            if (upperCase) uuid = uuid.toUpperCase();
            uuids.add(uuid);
        }
        result.put("count", count);
        result.put("uuids", uuids);
        return result;
    }

    /**
     * 随机密码生成
     */
    public Map<String, Object> password(int length, boolean hasUpper, boolean hasLower,
                                         boolean hasDigit, boolean hasSpecial) {
        Map<String, Object> result = new LinkedHashMap<>();
        String upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerChars = "abcdefghijklmnopqrstuvwxyz";
        String digitChars = "0123456789";
        String specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        StringBuilder charPool = new StringBuilder();
        List<String> required = new ArrayList<>();
        if (hasUpper) { charPool.append(upperChars); required.add(upperChars); }
        if (hasLower) { charPool.append(lowerChars); required.add(lowerChars); }
        if (hasDigit) { charPool.append(digitChars); required.add(digitChars); }
        if (hasSpecial) { charPool.append(specialChars); required.add(specialChars); }

        if (charPool.isEmpty()) {
            charPool.append(lowerChars).append(digitChars).append(upperChars).append(specialChars);
            required.add(lowerChars);
            required.add(digitChars);
            required.add(upperChars);
            required.add(specialChars);
        }

        // 确保每种类型至少有一个
        StringBuilder password = new StringBuilder();
        for (String pool : required) {
            password.append(pool.charAt(RandomUtil.randomInt(0, pool.length())));
        }
        while (password.length() < length) {
            password.append(charPool.charAt(RandomUtil.randomInt(0, charPool.length())));
        }
        // 打乱顺序
        char[] chars = password.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RandomUtil.randomInt(0, i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        result.put("password", new String(chars));
        result.put("length", length);
        return result;
    }

    /**
     * 随机数/随机字符串生成
     */
    public Map<String, Object> random(String type, int min, int max, int count, int length) {
        Map<String, Object> result = new LinkedHashMap<>();
        if ("number".equals(type)) {
            List<Integer> numbers = new ArrayList<>();
            for (int i = 0; i < Math.min(count, 100); i++) {
                numbers.add(RandomUtil.randomInt(min, max + 1));
            }
            result.put("numbers", numbers);
        } else {
            List<String> strings = new ArrayList<>();
            for (int i = 0; i < Math.min(count, 100); i++) {
                strings.add(RandomUtil.randomString(length));
            }
            result.put("strings", strings);
        }
        return result;
    }

    /**
     * Lorem Ipsum 生成
     */
    public Map<String, Object> lorem(int paragraphs, int sentencesPerParagraph) {
        String[] LOREM_WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
                "tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis " +
                "nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis " +
                "aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat " +
                "nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui " +
                "officia deserunt mollit anim id est laborum").split(" ");

        Map<String, Object> result = new LinkedHashMap<>();
        StringBuilder text = new StringBuilder();
        Random rnd = new Random();

        for (int p = 0; p < paragraphs; p++) {
            if (p > 0) text.append("\n\n");
            for (int s = 0; s < sentencesPerParagraph; s++) {
                if (s > 0) text.append(" ");
                int wordCount = rnd.nextInt(10) + 5;
                for (int w = 0; w < wordCount; w++) {
                    if (w > 0) text.append(" ");
                    String word = LOREM_WORDS[rnd.nextInt(LOREM_WORDS.length)];
                    if (w == 0) word = StrUtil.upperFirst(word);
                    text.append(word);
                }
                text.append(".");
            }
        }
        result.put("text", text.toString());
        result.put("paragraphs", paragraphs);
        return result;
    }

    /**
     * 二维码生成（返回 Base64 图片）
     */
    public Map<String, Object> qrcode(String text, int size) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            int s = Math.min(Math.max(size, 100), 1000);
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 1);

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, s, s, hints);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());

            result.put("qrcode", base64);
            result.put("size", s);
            result.put("text", text);
        } catch (Exception e) {
            result.put("error", "二维码生成失败: " + e.getMessage());
        }
        return result;
    }
}
