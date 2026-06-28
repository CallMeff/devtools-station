package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.service.CryptoService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 加解密 API
 */
@RestController
@RequestMapping("/api/tools/crypto")
public class CryptoController {

    private final CryptoService cryptoService;

    public CryptoController(CryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }

    @PostMapping("/hash")
    public Result<Map<String, String>> hash(@RequestParam String input,
                                             @RequestParam(defaultValue = "md5") String algorithm) {
        return Result.success(cryptoService.hash(input, algorithm));
    }

    @PostMapping("/base64")
    public Result<Map<String, String>> base64(@RequestParam String input,
                                               @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(cryptoService.base64(input, mode));
    }

    @PostMapping("/urlcode")
    public Result<Map<String, String>> urlCode(@RequestParam String input,
                                                @RequestParam(defaultValue = "encode") String mode) {
        return Result.success(cryptoService.urlCode(input, mode));
    }

    @PostMapping("/aes")
    public Result<Map<String, String>> aes(@RequestParam String input,
                                            @RequestParam String key,
                                            @RequestParam(defaultValue = "encrypt") String mode) {
        return Result.success(cryptoService.aes(input, key, mode));
    }

    @PostMapping("/bcrypt")
    public Result<Map<String, String>> bcrypt(@RequestParam String input,
                                               @RequestParam(defaultValue = "hash") String mode,
                                               @RequestParam(required = false) String hash) {
        return Result.success(cryptoService.bcrypt(input, mode, hash));
    }

    @PostMapping("/hmac")
    public Result<Map<String, String>> hmac(@RequestParam String input,
                                             @RequestParam String key,
                                             @RequestParam(defaultValue = "HmacSHA256") String algorithm) {
        return Result.success(cryptoService.hmac(input, key, algorithm));
    }
}
