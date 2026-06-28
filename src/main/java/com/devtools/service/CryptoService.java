package com.devtools.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.SecureUtil;
import cn.hutool.crypto.digest.DigestAlgorithm;
import cn.hutool.crypto.digest.Digester;
import cn.hutool.crypto.digest.HMac;
import cn.hutool.crypto.digest.HmacAlgorithm;
import org.springframework.stereotype.Service;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 加解密服务
 */
@Service
public class CryptoService {

    /**
     * 计算哈希值
     */
    public Map<String, String> hash(String input, String algorithm) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("input", input);
        result.put("algorithm", algorithm.toUpperCase());
        try {
            Digester digester = switch (algorithm.toLowerCase()) {
                case "md5" -> new Digester(DigestAlgorithm.MD5);
                case "sha1", "sha-1" -> new Digester(DigestAlgorithm.SHA1);
                case "sha256", "sha-256" -> new Digester(DigestAlgorithm.SHA256);
                case "sha512", "sha-512" -> new Digester(DigestAlgorithm.SHA512);
                default -> throw new IllegalArgumentException("不支持的算法: " + algorithm);
            };
            result.put("hash", digester.digestHex(input));
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * Base64 编码/解码
     */
    public Map<String, String> base64(String input, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        try {
            if ("encode".equals(mode)) {
                result.put("input", input);
                result.put("output", cn.hutool.core.codec.Base64.encode(input));
            } else {
                result.put("input", input);
                result.put("output", cn.hutool.core.codec.Base64.decodeStr(input));
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * URL 编码/解码
     */
    public Map<String, String> urlCode(String input, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        try {
            if ("encode".equals(mode)) {
                result.put("input", input);
                result.put("output", URLEncoder.encode(input, java.nio.charset.StandardCharsets.UTF_8));
            } else {
                result.put("input", input);
                result.put("output", URLDecoder.decode(input, java.nio.charset.StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * AES 加解密
     */
    public Map<String, String> aes(String input, String key, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        try {
            if (StrUtil.isBlank(key) || key.length() < 16) {
                result.put("error", "密钥长度至少16个字符");
                return result;
            }
            String fixedKey = StrUtil.fillAfter(key, '0', 16);
            if ("encrypt".equals(mode)) {
                result.put("input", input);
                result.put("output", SecureUtil.aes(fixedKey.getBytes()).encryptBase64(input));
            } else {
                result.put("input", input);
                result.put("output", SecureUtil.aes(fixedKey.getBytes()).decryptStr(input));
            }
        } catch (Exception e) {
            result.put("error", "解密失败，请检查密钥和密文是否正确");
        }
        return result;
    }

    /**
     * BCrypt 密码哈希
     */
    public Map<String, String> bcrypt(String input, String mode, String hash) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        try {
            if ("hash".equals(mode)) {
                result.put("input", input);
                result.put("output", org.mindrot.jbcrypt.BCrypt.hashpw(input, org.mindrot.jbcrypt.BCrypt.gensalt(12)));
            } else {
                result.put("input", input);
                boolean match = org.mindrot.jbcrypt.BCrypt.checkpw(input, hash);
                result.put("match", String.valueOf(match));
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }

    /**
     * HMAC 消息认证码
     */
    public Map<String, String> hmac(String input, String key, String algorithm) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("input", input);
        result.put("algorithm", algorithm);
        try {
            HmacAlgorithm algo = switch (algorithm) {
                case "HmacMD5" -> HmacAlgorithm.HmacMD5;
                case "HmacSHA1" -> HmacAlgorithm.HmacSHA1;
                case "HmacSHA256" -> HmacAlgorithm.HmacSHA256;
                case "HmacSHA512" -> HmacAlgorithm.HmacSHA512;
                default -> HmacAlgorithm.HmacSHA256;
            };
            HMac mac = new HMac(algo, key.getBytes(StandardCharsets.UTF_8));
            result.put("hash", mac.digestHex(input));
        } catch (Exception e) {
            result.put("error", "HMAC 签名失败: " + e.getMessage());
        }
        return result;
    }
}
