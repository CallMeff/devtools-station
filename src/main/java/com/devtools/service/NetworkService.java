package com.devtools.service;

import cn.hutool.core.util.StrUtil;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 网络工具服务
 */
@Service
public class NetworkService {

    /**
     * UserAgent 解析（简易版）
     */
    public Map<String, Object> parseUA(String ua) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("raw", ua);

        ua = ua.toLowerCase();

        // 操作系统
        if (ua.contains("windows nt 10")) result.put("os", "Windows 10/11");
        else if (ua.contains("windows nt 6.3")) result.put("os", "Windows 8.1");
        else if (ua.contains("windows nt 6.1")) result.put("os", "Windows 7");
        else if (ua.contains("mac os x")) result.put("os", "macOS");
        else if (ua.contains("linux")) result.put("os", "Linux");
        else if (ua.contains("android")) result.put("os", "Android");
        else if (ua.contains("iphone") || ua.contains("ipad")) result.put("os", "iOS");
        else result.put("os", "Unknown");

        // 浏览器
        if (ua.contains("edg/")) result.put("browser", "Microsoft Edge");
        else if (ua.contains("chrome/") && !ua.contains("edg/")) result.put("browser", "Google Chrome");
        else if (ua.contains("safari/") && !ua.contains("chrome")) result.put("browser", "Apple Safari");
        else if (ua.contains("firefox/")) result.put("browser", "Mozilla Firefox");
        else if (ua.contains("opr/") || ua.contains("opera")) result.put("browser", "Opera");
        else result.put("browser", "Unknown");

        // 设备类型
        if (ua.contains("mobile")) result.put("device", "Mobile");
        else if (ua.contains("tablet") || ua.contains("ipad")) result.put("device", "Tablet");
        else result.put("device", "Desktop");

        // 浏览器引擎
        if (ua.contains("webkit")) result.put("engine", "WebKit/Blink");
        else if (ua.contains("gecko")) result.put("engine", "Gecko");
        else result.put("engine", "Unknown");

        return result;
    }

    /**
     * IP 信息（基于请求获取客户端IP）
     */
    public Map<String, Object> getClientIpInfo(String ip, String userAgent) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ip", ip);
        result.put("user_agent", userAgent);

        // 判断IP类型
        if (ip.contains(":")) {
            result.put("ip_version", "IPv6");
        } else {
            result.put("ip_version", "IPv4");
        }

        // 判断是否为内网IP
        result.put("is_private", isPrivateIp(ip));
        result.put("is_loopback", "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip));

        return result;
    }

    private boolean isPrivateIp(String ip) {
        if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
        if (ip.startsWith("172.")) {
            try {
                int second = Integer.parseInt(ip.split("\\.")[1]);
                return second >= 16 && second <= 31;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    /**
     * HTTP 状态码参考
     */
    public Map<String, Object> httpStatusCodes() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("categories", new Object[]{
                Map.of("name", "1xx 信息", "codes", new Object[]{
                        Map.of("code", 100, "name", "Continue", "desc", "继续请求"),
                        Map.of("code", 101, "name", "Switching Protocols", "desc", "切换协议"),
                }),
                Map.of("name", "2xx 成功", "codes", new Object[]{
                        Map.of("code", 200, "name", "OK", "desc", "请求成功"),
                        Map.of("code", 201, "name", "Created", "desc", "已创建"),
                        Map.of("code", 204, "name", "No Content", "desc", "无内容"),
                }),
                Map.of("name", "3xx 重定向", "codes", new Object[]{
                        Map.of("code", 301, "name", "Moved Permanently", "desc", "永久移动"),
                        Map.of("code", 302, "name", "Found", "desc", "临时移动"),
                        Map.of("code", 304, "name", "Not Modified", "desc", "未修改"),
                }),
                Map.of("name", "4xx 客户端错误", "codes", new Object[]{
                        Map.of("code", 400, "name", "Bad Request", "desc", "错误请求"),
                        Map.of("code", 401, "name", "Unauthorized", "desc", "未授权"),
                        Map.of("code", 403, "name", "Forbidden", "desc", "禁止访问"),
                        Map.of("code", 404, "name", "Not Found", "desc", "未找到"),
                        Map.of("code", 405, "name", "Method Not Allowed", "desc", "方法不允许"),
                        Map.of("code", 429, "name", "Too Many Requests", "desc", "请求过多"),
                }),
                Map.of("name", "5xx 服务端错误", "codes", new Object[]{
                        Map.of("code", 500, "name", "Internal Server Error", "desc", "服务器内部错误"),
                        Map.of("code", 502, "name", "Bad Gateway", "desc", "网关错误"),
                        Map.of("code", 503, "name", "Service Unavailable", "desc", "服务不可用"),
                }),
        });
        return result;
    }
}
