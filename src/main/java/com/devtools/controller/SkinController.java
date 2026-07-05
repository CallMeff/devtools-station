package com.devtools.controller;

import com.devtools.common.Result;
import com.devtools.entity.User;
import com.devtools.service.AuthService;
import com.devtools.service.UserSkinService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/**
 * 页面皮肤 API
 */
@RestController
@RequestMapping("/api/skin")
@RequiredArgsConstructor
public class SkinController {

    private final AuthService authService;
    private final UserSkinService skinService;

    private static final Path VIDEO_DIR = Paths.get("uploads/videos");

    private User requireAuth(String token) {
        if (token == null || token.isEmpty()) {
            throw new RuntimeException("未登录");
        }
        User user = authService.validateToken(token);
        if (user == null) {
            throw new RuntimeException("登录已过期");
        }
        return user;
    }

    /**
     * 获取当前皮肤
     */
    @GetMapping
    public Result<Map<String, Object>> getSkin(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            return Result.success(skinService.getSkin(user.getId()));
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 保存皮肤（图片/视频元数据）
     */
    @PostMapping
    public Result<Void> saveSkin(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, Object> body) {
        try {
            User user = requireAuth(token);
            String skinImage = (String) body.get("skinImage");
            String skinMediaType = (String) body.getOrDefault("skinMediaType", "image");
            String skinVideo = (String) body.get("skinVideo");
            Double opacity = body.get("opacity") != null
                    ? ((Number) body.get("opacity")).doubleValue() : 0.15;
            String fitMode = (String) body.getOrDefault("fitMode", "cover");
            Double skinZoom = body.get("skinZoom") != null
                    ? ((Number) body.get("skinZoom")).doubleValue() : 100.0;
            Double skinPosX = body.get("skinPosX") != null
                    ? ((Number) body.get("skinPosX")).doubleValue() : 50.0;
            Double skinPosY = body.get("skinPosY") != null
                    ? ((Number) body.get("skinPosY")).doubleValue() : 50.0;
            String skinRepeat = (String) body.getOrDefault("skinRepeat", "no-repeat");
            Boolean videoMuted = body.get("videoMuted") != null
                    ? (Boolean) body.get("videoMuted") : true;
            Boolean videoLoop = body.get("videoLoop") != null
                    ? (Boolean) body.get("videoLoop") : true;

            skinService.saveSkin(user.getId(), skinImage, opacity,
                    fitMode, skinZoom, skinPosX, skinPosY, skinRepeat,
                    skinMediaType, skinVideo, videoMuted, videoLoop);
            return Result.success("皮肤已保存", null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 上传视频文件（登录用户）
     */
    @PostMapping("/video/upload")
    public Result<Map<String, String>> uploadVideo(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestParam("file") MultipartFile file) {
        try {
            User user = requireAuth(token);
            if (file.isEmpty()) {
                return Result.error(400, "文件为空");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("video/")) {
                return Result.error(400, "仅支持视频格式 (MP4/WebM/MOV)");
            }

            // 限制 50MB
            if (file.getSize() > 50 * 1024 * 1024) {
                return Result.error(400, "视频文件不能超过 50MB");
            }

            // 确保目录存在
            Files.createDirectories(VIDEO_DIR);

            // 保存文件
            String ext = ".mp4";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = user.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path targetPath = VIDEO_DIR.resolve(filename);
            file.transferTo(targetPath.toFile());

            String videoUrl = "/api/skin/video/" + filename;
            return Result.success("视频上传成功", Map.of("videoUrl", videoUrl));

        } catch (IOException e) {
            return Result.error(500, "文件保存失败: " + e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    /**
     * 播放已上传的视频
     */
    @GetMapping("/video/{filename}")
    public ResponseEntity<Resource> serveVideo(@PathVariable String filename) {
        try {
            Path filePath = VIDEO_DIR.resolve(filename).normalize();
            if (!Files.exists(filePath) || !filePath.startsWith(VIDEO_DIR)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "video/mp4";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 删除皮肤
     */
    @DeleteMapping
    public Result<Void> deleteSkin(
            @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        try {
            User user = requireAuth(token);
            // 获取旧记录并清理视频文件
            Map<String, Object> old = skinService.getSkin(user.getId());
            if (old.containsKey("skinVideo") && old.get("skinVideo") != null) {
                String videoPath = (String) old.get("skinVideo");
                String filename = videoPath.substring(videoPath.lastIndexOf("/") + 1);
                Path filePath = VIDEO_DIR.resolve(filename);
                Files.deleteIfExists(filePath);
            }
            skinService.deleteSkin(user.getId());
            return Result.success("皮肤已移除", null);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        } catch (IOException e) {
            // 文件删除失败不阻塞
            skinService.deleteSkin(requireAuth(token).getId());
            return Result.success("皮肤已移除", null);
        }
    }
}
