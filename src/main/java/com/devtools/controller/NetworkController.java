package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.common.WebUtils;
import com.devtools.service.CryptoService;
import com.devtools.service.NetworkService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
        String ip = WebUtils.getClientIp(request);
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

    /**
     * 批量发送 HTTP 请求（上传 Excel 作为请求数据源）
     */
    @PostMapping("/batch-http")
    public Result<Map<String, Object>> batchHttp(
            @RequestParam("file") MultipartFile file,
            @RequestParam("url") String url,
            @RequestParam(defaultValue = "POST") String method,
            @RequestParam(defaultValue = "") String headers,
            @RequestParam(defaultValue = "one_per_row") String sendMode) {
        return Result.success(networkService.batchHttpRequest(file, url, method, headers, sendMode));
    }

    /**
     * 批量 HTTP 测试回显接口 —— 供本地测试使用
     * 支持单 JSON 对象（逐行模式）和 JSON 数组（一次性模式）
     * 直接回显接收到的数据，方便验证批量请求工具是否正常工作
     */
    @PostMapping("/batch-http/test")
    public Result<Map<String, Object>> batchHttpTest(@RequestBody Object body) {
        if (body instanceof java.util.List) {
            return Result.success(networkService.echoTestRequestArray(body));
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> map = (Map<String, Object>) body;
        return Result.success(networkService.echoTestRequest(map));
    }

    /**
     * 下载批量 HTTP 请求的 Excel 模板文件
     */
    @GetMapping("/batch-http/template")
    public ResponseEntity<byte[]> downloadBatchHttpTemplate() {
        byte[] data = networkService.generateBatchHttpTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment",
                URLEncoder.encode("批量HTTP请求模板.xlsx", StandardCharsets.UTF_8)
                        .replace("+", "%20"));
        headers.setContentLength(data.length);

        return ResponseEntity.ok().headers(headers).body(data);
    }
}
