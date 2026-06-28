package com.devtools.common;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Web 工具类
 * 提供请求相关的常用方法
 */
public class WebUtils {

    private WebUtils() {}

    /**
     * 获取客户端真实 IP
     * 优先从代理头获取，兼容 Nginx / CDN 等场景
     */
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // X-Forwarded-For 可能包含多个 IP，取第一个
            int idx = ip.indexOf(',');
            if (idx > 0) {
                ip = ip.substring(0, idx).trim();
            }
            return ip;
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        ip = request.getHeader("Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        return request.getRemoteAddr();
    }
}
