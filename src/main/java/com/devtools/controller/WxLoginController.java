package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.WxLoginService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.Map;

/**
 * 微信扫码登录 API
 */
@RestController
@RequestMapping("/api/auth/wx")
@RequiredArgsConstructor
public class WxLoginController {

    private final WxLoginService wxLoginService;

    /**
     * 生成扫码登录二维码
     * GET /api/auth/wx/qrcode
     */
    @GetMapping("/qrcode")
    public Result<Map<String, Object>> getQrCode(HttpServletRequest request) {
        try {
            // 构建基础 URL：优先使用局域网 IP（手机扫码需要访问 PC）
            String host = request.getHeader("Host");
            if (host == null || host.isEmpty()) {
                host = request.getServerName() + ":" + request.getServerPort();
            }

            // 如果 host 是 localhost 或 127.0.0.1，尝试替换为局域网 IP
            if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
                String lanIp = getLanIp();
                if (lanIp != null) {
                    // 保留端口号
                    String port = ":" + request.getServerPort();
                    host = lanIp + port;
                }
            }

            String scheme = request.getScheme();
            String baseUrl = scheme + "://" + host;

            Map<String, Object> result = wxLoginService.generateQrCode(baseUrl);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(500, "生成二维码失败: " + e.getMessage());
        }
    }

    /**
     * 获取本机局域网 IPv4 地址
     */
    private String getLanIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (ni.isLoopback() || !ni.isUp()) continue;
                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof java.net.Inet4Address && !addr.isLoopbackAddress()) {
                        String ip = addr.getHostAddress();
                        // 排除虚拟网卡（如 VirtualBox、VMware 等）
                        if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
                            return ip;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * 轮询检查二维码状态
     * GET /api/auth/wx/check?ticket=xxx
     */
    @GetMapping("/check")
    public Result<Map<String, Object>> checkStatus(@RequestParam String ticket) {
        try {
            Map<String, Object> result = wxLoginService.checkQrState(ticket);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(500, "检查状态失败: " + e.getMessage());
        }
    }

    /**
     * 扫码验证页面（用户在手机上点开）
     * GET /api/auth/wx/verify?ticket=xxx&code=xxx
     * 返回一个简单的确认页面
     */
    @GetMapping("/verify")
    public String verifyPage(@RequestParam String ticket,
                             @RequestParam String code) {
        return buildVerifyPage(ticket, code);
    }

    /**
     * 扫码后确认登录
     * POST /api/auth/wx/confirm
     */
    @PostMapping("/confirm")
    public Result<Map<String, Object>> confirmLogin(@RequestBody Map<String, String> body) {
        try {
            String ticket = body.get("ticket");
            String userIdStr = body.get("userId");

            if (ticket == null || userIdStr == null) {
                return Result.error(400, "参数错误");
            }

            Long userId = Long.parseLong(userIdStr);
            Map<String, Object> result = wxLoginService.confirmLogin(ticket, userId);
            if (Boolean.TRUE.equals(result.get("success"))) {
                return Result.success(result);
            } else {
                return Result.error(400, (String) result.get("message"));
            }
        } catch (Exception e) {
            return Result.error(500, "确认登录失败: " + e.getMessage());
        }
    }

    /**
     * 扫码确认登录
     * 先标记为已扫码，自动创建微信用户
     */
    @PostMapping("/scan")
    public Result<Map<String, Object>> scan(@RequestBody Map<String, String> body) {
        try {
            String ticket = body.get("ticket");
            String code = body.get("code");

            if (ticket == null || code == null) {
                return Result.error(400, "参数错误");
            }

            Map<String, Object> result = wxLoginService.verifyScan(ticket, code);
            if (Boolean.TRUE.equals(result.get("success"))) {
                return Result.success(result);
            } else {
                return Result.error(400, (String) result.get("message"));
            }
        } catch (Exception e) {
            return Result.error(500, "扫码失败: " + e.getMessage());
        }
    }

    /**
     * 生成微信扫码确认页面 HTML
     * 这是用户手机扫码后打开的页面
     */
    private String buildVerifyPage(String ticket, String code) {
        // 安全转义，防止 XSS
        String safeTicket = escapeJs(ticket);
        String safeCode = escapeJs(code);
        return "<!DOCTYPE html>\n"
                + "<html lang=\"zh-CN\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n"
                + "    <title>DevTools Station - 确认登录</title>\n"
                + "    <style>\n"
                + "        * { margin: 0; padding: 0; box-sizing: border-box; }\n"
                + "        body {\n"
                + "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n"
                + "            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);\n"
                + "            min-height: 100vh;\n"
                + "            display: flex;\n"
                + "            align-items: center;\n"
                + "            justify-content: center;\n"
                + "            padding: 20px;\n"
                + "        }\n"
                + "        .verify-card {\n"
                + "            background: #1e1e32;\n"
                + "            border-radius: 20px;\n"
                + "            padding: 40px 32px;\n"
                + "            width: 100%;\n"
                + "            max-width: 360px;\n"
                + "            text-align: center;\n"
                + "            box-shadow: 0 20px 60px rgba(0,0,0,0.5);\n"
                + "            border: 1px solid rgba(255,255,255,0.08);\n"
                + "        }\n"
                + "        .verify-icon {\n"
                + "            width: 72px;\n"
                + "            height: 72px;\n"
                + "            border-radius: 50%;\n"
                + "            background: linear-gradient(135deg, #6366f1, #8b5cf6);\n"
                + "            margin: 0 auto 20px;\n"
                + "            display: flex;\n"
                + "            align-items: center;\n"
                + "            justify-content: center;\n"
                + "            box-shadow: 0 8px 32px rgba(99,102,241,0.3);\n"
                + "        }\n"
                + "        .verify-title {\n"
                + "            font-size: 20px;\n"
                + "            font-weight: 700;\n"
                + "            color: #e5e7eb;\n"
                + "            margin-bottom: 8px;\n"
                + "        }\n"
                + "        .verify-subtitle {\n"
                + "            font-size: 14px;\n"
                + "            color: #9ca3af;\n"
                + "            margin-bottom: 32px;\n"
                + "            line-height: 1.5;\n"
                + "        }\n"
                + "        .verify-btn {\n"
                + "            display: block;\n"
                + "            width: 100%;\n"
                + "            padding: 14px;\n"
                + "            border: none;\n"
                + "            border-radius: 14px;\n"
                + "            background: linear-gradient(135deg, #6366f1, #8b5cf6);\n"
                + "            color: #fff;\n"
                + "            font-size: 16px;\n"
                + "            font-weight: 600;\n"
                + "            cursor: pointer;\n"
                + "            transition: all 0.25s;\n"
                + "            box-shadow: 0 4px 16px rgba(99,102,241,0.3);\n"
                + "        }\n"
                + "        .verify-btn:active {\n"
                + "            transform: scale(0.97);\n"
                + "        }\n"
                + "        .verify-btn.loading {\n"
                + "            opacity: 0.7;\n"
                + "            pointer-events: none;\n"
                + "        }\n"
                + "        .verify-cancel {\n"
                + "            margin-top: 16px;\n"
                + "            padding: 10px;\n"
                + "            border: none;\n"
                + "            background: transparent;\n"
                + "            color: #6b7280;\n"
                + "            font-size: 14px;\n"
                + "            cursor: pointer;\n"
                + "        }\n"
                + "        .verify-msg {\n"
                + "            margin-top: 20px;\n"
                + "            font-size: 14px;\n"
                + "            color: #10b981;\n"
                + "            font-weight: 500;\n"
                + "            display: none;\n"
                + "        }\n"
                + "        .verify-msg.error {\n"
                + "            color: #f87171;\n"
                + "            display: block;\n"
                + "        }\n"
                + "        .verify-footer {\n"
                + "            margin-top: 28px;\n"
                + "            font-size: 12px;\n"
                + "            color: #4b5563;\n"
                + "        }\n"
                + "    </style>\n"
                + "</head>\n"
                + "<body>\n"
                + "    <div class=\"verify-card\">\n"
                + "        <div class=\"verify-icon\" id=\"verifyIcon\">\n"
                + "            <svg width=\"36\" height=\"36\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\">\n"
                + "                <path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\"/>\n"
                + "                <polyline points=\"10 17 15 12 10 7\"/>\n"
                + "                <line x1=\"15\" y1=\"12\" x2=\"3\" y2=\"12\"/>\n"
                + "            </svg>\n"
                + "        </div>\n"
                + "        <h2 class=\"verify-title\" id=\"verifyTitle\">正在确认登录...</h2>\n"
                + "        <p class=\"verify-subtitle\" id=\"verifySubtitle\">请稍候，正在为您自动完成登录<br>DevTools Station</p>\n"
                + "        <div class=\"verify-msg\" id=\"verifyMsg\"></div>\n"
                + "        <div class=\"verify-footer\">DevTools Station · 安全登录</div>\n"
                + "    </div>\n"
                + "    <script>\n"
                + "        var TICKET = '" + safeTicket + "';\n"
                + "        var CODE = '" + safeCode + "';\n"
                + "\n"
                + "        // 页面加载后自动执行扫码+确认登录\n"
                + "        function autoLogin() {\n"
                + "            fetch('/api/auth/wx/scan', {\n"
                + "                method: 'POST',\n"
                + "                headers: { 'Content-Type': 'application/json' },\n"
                + "                body: JSON.stringify({ ticket: TICKET, code: CODE })\n"
                + "            }).then(function(r) { return r.json(); }).then(function(res) {\n"
                + "                if (res.code === 200 && res.data && res.data.success) {\n"
                + "                    var userId = res.data.userId;\n"
                + "                    return fetch('/api/auth/wx/confirm', {\n"
                + "                        method: 'POST',\n"
                + "                        headers: { 'Content-Type': 'application/json' },\n"
                + "                        body: JSON.stringify({ ticket: TICKET, userId: String(userId) })\n"
                + "                    }).then(function(r) { return r.json(); });\n"
                + "                } else {\n"
                + "                    throw new Error(res.message || '扫码失败');\n"
                + "                }\n"
                + "            }).then(function(res) {\n"
                + "                if (res.code === 200 && res.data && res.data.success) {\n"
                + "                    document.getElementById('verifyIcon').innerHTML = '<svg width=\"36\" height=\"36\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\"><polyline points=\"20 6 9 17 4 12\"/></svg>';\n"
                + "                    document.getElementById('verifyTitle').textContent = '登录成功！';\n"
                + "                    document.getElementById('verifySubtitle').textContent = 'PC端将自动跳转，请返回电脑查看';\n"
                + "                    document.getElementById('verifyMsg').textContent = '✅ 登录成功';\n"
                + "                    document.getElementById('verifyMsg').style.display = 'block';\n"
                + "                    document.getElementById('verifyMsg').style.color = '#10b981';\n"
                + "                } else {\n"
                + "                    throw new Error(res.message || '确认失败');\n"
                + "                }\n"
                + "            }).catch(function(err) {\n"
                + "                document.getElementById('verifyTitle').textContent = '登录失败';\n"
                + "                document.getElementById('verifySubtitle').textContent = '请返回PC端重新获取二维码';\n"
                + "                document.getElementById('verifyMsg').textContent = '❌ ' + (err.message || '未知错误');\n"
                + "                document.getElementById('verifyMsg').style.display = 'block';\n"
                + "                document.getElementById('verifyMsg').style.color = '#f87171';\n"
                + "            });\n"
                + "        }\n"
                + "\n"
                + "        autoLogin();\n"
                + "    </script>\n"
                + "</body>\n"
                + "</html>";
    }

    /**
     * 对注入 JS 字符串字面量的值做简单转义
     */
    private String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
