package com.devtools.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * CodeBuddy API 服务 — 安全代理层
 * API 密钥仅存储在后端，绝不暴露给前端
 */
@Service
public class CodeBuddyService {

    private static final Logger log = LoggerFactory.getLogger(CodeBuddyService.class);
    private static final int CONNECT_TIMEOUT = 10;
    private static final int REQUEST_TIMEOUT = 30;

    @Value("${app.codebuddy.api-key}")
    private String apiKey;

    @Value("${app.codebuddy.base-url}")
    private String baseUrl;

    private final Gson gson = new Gson();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(CONNECT_TIMEOUT))
            .build();

    /**
     * 获取 API 密钥（仅内部使用）
     */
    public String getApiKey() {
        return apiKey;
    }

    /**
     * 获取 API 基础地址
     */
    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * GET 请求（带 API Key 认证）
     */
    public Map<String, Object> apiGet(String path) {
        return apiRequest("GET", path, null);
    }

    /**
     * POST 请求（带 API Key 认证）
     */
    public Map<String, Object> apiPost(String path, Map<String, Object> body) {
        return apiRequest("POST", path, body);
    }

    /**
     * 统一 HTTP 请求方法
     */
    private Map<String, Object> apiRequest(String method, String path, Map<String, Object> body) {
        Map<String, Object> result = new LinkedHashMap<>();
        long start = System.currentTimeMillis();

        try {
            String fullUrl = baseUrl + path;
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .timeout(Duration.ofSeconds(REQUEST_TIMEOUT))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json");

            HttpRequest.BodyPublisher bodyPublisher;
            if ("POST".equalsIgnoreCase(method) && body != null) {
                String jsonBody = gson.toJson(body);
                bodyPublisher = HttpRequest.BodyPublishers.ofString(jsonBody);
            } else {
                bodyPublisher = HttpRequest.BodyPublishers.noBody();
            }

            builder.method(method.toUpperCase(), bodyPublisher);
            HttpRequest request = builder.build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long elapsed = System.currentTimeMillis() - start;

            result.put("status", response.statusCode());
            result.put("time", elapsed);

            // 尝试解析 JSON
            try {
                Type mapType = new TypeToken<Map<String, Object>>() {}.getType();
                Map<String, Object> parsed = gson.fromJson(response.body(), mapType);
                result.put("data", parsed);
            } catch (Exception e) {
                result.put("data", response.body());
            }
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("CodeBuddy API request failed: {} {} — {}", method, path, e.getMessage());
            result.put("status", 0);
            result.put("time", elapsed);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 验证 API 密钥是否有效（健康检查）
     */
    public Map<String, Object> validateApiKey() {
        Map<String, Object> result = new LinkedHashMap<>();
        if (apiKey == null || apiKey.isEmpty()) {
            result.put("valid", false);
            result.put("message", "API Key 未配置");
            return result;
        }
        // 格式检查: ck_ 前缀
        result.put("valid", apiKey.startsWith("ck_"));
        result.put("masked", maskKey(apiKey));
        return result;
    }

    /**
     * 脱敏显示密钥（仅显示前后各 4 位）
     */
    private String maskKey(String key) {
        if (key == null || key.length() <= 10) return "****";
        return key.substring(0, 8) + "****" + key.substring(key.length() - 4);
    }
}
