package com.devtools.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * JWT 调试器服务 - 解析 JWT Token 的 header / payload / 签名信息
 * 不做签名验证（仅用于调试学习）
 */
@Service
public class JwtService {

    private static final ObjectMapper mapper = new ObjectMapper();

    public Map<String, Object> decode(String token) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("raw", token);

        try {
            String[] parts = token.trim().split("\\.");
            if (parts.length < 2) {
                result.put("error", "不是有效的 JWT Token（应包含 header.payload.signature 三部分）");
                return result;
            }

            // 解析 Header
            try {
                String headerJson = new String(base64UrlDecode(parts[0]), StandardCharsets.UTF_8);
                @SuppressWarnings("unchecked")
                Map<String, Object> header = mapper.readValue(headerJson, Map.class);
                result.put("header", header);
                result.put("header_raw", headerJson);
            } catch (Exception e) {
                result.put("header_error", "Header 解析失败: " + e.getMessage());
            }

            // 解析 Payload
            try {
                String payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
                @SuppressWarnings("unchecked")
                Map<String, Object> payload = mapper.readValue(payloadJson, Map.class);
                result.put("payload", payload);
                result.put("payload_raw", payloadJson);

                // 解析时间戳字段
                parseTimeFields(payload, result);

            } catch (Exception e) {
                result.put("payload_error", "Payload 解析失败: " + e.getMessage());
            }

            // 签名信息
            if (parts.length > 2) {
                result.put("signature_present", true);
                result.put("signature", parts[2]);
                // 截断显示
                String sig = parts[2];
                result.put("signature_short", sig.length() > 20 ? sig.substring(0, 20) + "..." : sig);
                result.put("algorithm", inferAlgorithm(result));
            } else {
                result.put("signature_present", false);
            }

            // Token 状态
            result.put("status", determineStatus(result));

        } catch (Exception e) {
            result.put("error", "JWT 解析异常: " + e.getMessage());
        }

        return result;
    }

    private String inferAlgorithm(Map<String, Object> result) {
        @SuppressWarnings("unchecked")
        Map<String, Object> header = (Map<String, Object>) result.get("header");
        if (header != null && header.containsKey("alg")) {
            return "签名算法: " + header.get("alg");
        }
        return "未知算法";
    }

    private void parseTimeFields(Map<String, Object> payload, Map<String, Object> result) {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        List<Map<String, String>> timeFields = new ArrayList<>();
        String[] keys = {"iat", "exp", "nbf", "auth_time"};
        String[] names = {"签发时间 (iat)", "过期时间 (exp)", "生效时间 (nbf)", "认证时间 (auth_time)"};

        for (int i = 0; i < keys.length; i++) {
            if (payload.containsKey(keys[i])) {
                Object val = payload.get(keys[i]);
                long epoch;
                if (val instanceof Number) {
                    epoch = ((Number) val).longValue();
                } else {
                    try { epoch = Long.parseLong(val.toString()); }
                    catch (NumberFormatException e) { continue; }
                }

                // JWT 标准时间戳是秒级
                if (epoch < 1_000_000_000_000L) {
                    epoch *= 1000;
                }
                Instant instant = Instant.ofEpochMilli(epoch);
                LocalDateTime dt = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());

                Map<String, String> field = new LinkedHashMap<>();
                field.put("name", names[i]);
                field.put("value", dt.format(dtf));
                field.put("epoch_seconds", String.valueOf(epoch / 1000));
                timeFields.add(field);
            }
        }

        if (!timeFields.isEmpty()) {
            result.put("time_fields", timeFields);

            // 检查是否过期
            if (payload.containsKey("exp")) {
                Object expVal = payload.get("exp");
                long expSec = (expVal instanceof Number) ? ((Number) expVal).longValue() : Long.parseLong(expVal.toString());
                boolean expired = Instant.now().getEpochSecond() > expSec;
                result.put("is_expired", expired);
            }
        }
    }

    private String determineStatus(Map<String, Object> result) {
        if (result.containsKey("error") || result.containsKey("header_error") || result.containsKey("payload_error")) {
            return "解析失败";
        }
        Boolean expired = (Boolean) result.get("is_expired");
        if (expired != null && expired) {
            return "Token 已过期";
        }
        return "Token 格式有效（未验证签名）";
    }

    /**
     * Base64Url 解码（兼容标准 Base64）
     */
    private byte[] base64UrlDecode(String input) {
        // URL-safe Base64 → Standard Base64
        String base64 = input.replace('-', '+').replace('_', '/');
        // 补齐 padding
        switch (base64.length() % 4) {
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }
        return Base64.getDecoder().decode(base64);
    }
}
