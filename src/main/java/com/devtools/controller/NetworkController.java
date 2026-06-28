package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.CryptoService;
import com.devtools.service.NetworkService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 网络工具 API
 */
@RestController
@RequestMapping("/api/tools/network")
public class NetworkController {

    private final NetworkService networkService;
    private final CryptoService cryptoService;

    public NetworkController(NetworkService networkService, CryptoService cryptoService) {
        this.networkService = networkService;
        this.cryptoService = cryptoService;
    }

    @PostMapping("/ua")
    public Result<Map<String, Object>> parseUA(@RequestParam String ua) {
        return Result.success(networkService.parseUA(ua));
    }

    @GetMapping("/ip")
    public Result<Map<String, Object>> clientIp(HttpServletRequest request) {
        String ip = getClientIp(request);
        String ua = request.getHeader("User-Agent");
        return Result.success(networkService.getClientIpInfo(ip, ua));
    }

    @GetMapping("/httpstatus")
    public Result<Map<String, Object>> httpStatus() {
        return Result.success(networkService.httpStatusCodes());
    }

    @PostMapping("/url")
    public Result<Map<String, String>> urlEncode(@RequestParam String input,
                                                   @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(cryptoService.urlCode(input, mode));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
