package com.devtools.controller;

import com.devtools.common.Result;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 桌面宠物 API 控制器
 * 提供宠物列表、详情、自定义图片上传（直接在网站桌面展示）
 */
@RestController
@RequestMapping("/api/desktop-pets")
public class DesktopPetController {

    private static final Logger log = LoggerFactory.getLogger(DesktopPetController.class);
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "webp", "svg");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Value("${app.codebuddy.upload-dir:./data/pets-custom}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        ensureUploadDir();
    }

    /** 将配置中的相对路径转为绝对路径，确保目录存在 */
    private void ensureUploadDir() {
        Path dir = Paths.get(uploadDir);
        if (!dir.isAbsolute()) {
            dir = Paths.get(System.getProperty("user.dir")).resolve(uploadDir);
        }
        try {
            if (Files.notExists(dir)) Files.createDirectories(dir);
            uploadDir = dir.normalize().toAbsolutePath().toString();
            log.info("Custom pet upload directory: {}", uploadDir);
        } catch (IOException e) {
            log.error("Failed to create upload directory: {}", e.getMessage());
        }
    }

    /**
     * 获取所有精选宠物列表（供画廊页面选择）
     */
    @GetMapping
    public Result<List<Map<String, Object>>> listPets() {
        return Result.success(getCuratedPets());
    }

    /**
     * 获取单个宠物详情
     */
    @GetMapping("/{petId}")
    public Result<Map<String, Object>> getPet(@PathVariable String petId) {
        return getCuratedPets().stream()
                .filter(p -> petId.equals(p.get("id")))
                .findFirst()
                .map(Result::success)
                .orElse(Result.error(404, "宠物不存在 🐾"));
    }

    /**
     * 上传自定义图片，生成专属桌面宠物
     * 图片保存后可直接在首页桌面上展示和互动
     */
    @PostMapping("/custom/upload")
    public Result<Map<String, Object>> uploadCustomPet(
            @RequestParam("image") MultipartFile file,
            @RequestParam(value = "name", defaultValue = "") String name,
            @RequestParam(value = "personality", defaultValue = "独一无二") String personality) {

        // 文件名安全检查
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return Result.error(400, "请选择一个图片文件");
        }

        // 扩展名校验
        String ext = getExtension(originalName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            return Result.error(400, "仅支持 PNG / JPG / GIF / WebP / SVG 格式");
        }

        // 大小校验
        if (file.getSize() > MAX_FILE_SIZE) {
            return Result.error(400, "图片大小不能超过 5MB");
        }

        try {
            // 确保上传目录存在
            Path uploadPath = Paths.get(uploadDir);
            if (Files.notExists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String safeName = "pet-" + timestamp + "-" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            Path targetPath = uploadPath.resolve(safeName);

            // 保存文件
            file.transferTo(targetPath.toFile());
            log.info("Custom pet image saved: {}", targetPath);

            // 构建宠物信息
            String petId = "custom-" + timestamp;
            String displayName = name.isBlank() ? "我的专属宠物" : name.trim();
            String petName = displayName.length() > 12 ? displayName.substring(0, 12) : displayName;
            String imageUrl = "/pets-custom/" + safeName;

            Map<String, Object> petInfo = new LinkedHashMap<>();
            petInfo.put("id", petId);
            petInfo.put("name", petName);
            petInfo.put("isCustom", true);
            petInfo.put("imageUrl", imageUrl);
            petInfo.put("emoji", "🖼️");
            petInfo.put("description", (name.isBlank() ? "你自己设计的" : name.trim()) + "，独一无二的桌面小伙伴！");
            petInfo.put("personality", personality.length() > 20 ? personality.substring(0, 20) : personality);
            petInfo.put("tags", "自定义,专属," + (name.isBlank() ? "个性" : name.trim()));
            petInfo.put("bgColor", "#f5f3ff");
            petInfo.put("accent", "#8b5cf6");
            petInfo.put("animations", "idle,waving,jumping");

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("pet", petInfo);
            result.put("message", "🎉 专属宠物创建成功！它已经出现在你的桌面上了~");

            return Result.success(result);

        } catch (IOException e) {
            log.error("Failed to save custom pet image: {}", e.getMessage());
            return Result.error(500, "图片保存失败，请稍后重试");
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1) : "";
    }

    // ========== 精选宠物数据 ==========

    private List<Map<String, Object>> getCuratedPets() {
        List<Map<String, Object>> pets = new ArrayList<>();

        pets.add(pet("mochi", "🍡", "麻薯小团子",
                "一只软萌的糯米团子精灵，喜欢在屏幕边缘滚来滚去，偶尔会变成草莓味~",
                "#fbcfe8", "#f472b6", "温柔治愈", "吃货呆萌",
                "https://codex-pets.net/api/pets/mochi/download?v=latest",
                "idle,waving,jumping,eating"));

        pets.add(pet("milky", "🐱", "奶盖小猫咪",
                "一只奶白色的小猫，最喜欢趴在窗口晒太阳。点击它会喵喵叫，有时候会追着自己的尾巴转圈~",
                "#fce7f3", "#ec4899", "慵懒优雅", "傲娇好奇",
                "https://codex-pets.net/api/pets/milky/download?v=latest",
                "idle,waving,jumping,sleeping,playing"));

        pets.add(pet("bubble", "🫧", "泡泡小海豚",
                "从海洋深处游来的小海豚，带着七彩泡泡。每当工作完成时会开心地跃出水面喷水花！",
                "#dbeafe", "#3b82f6", "活泼可爱", "乐观向上",
                "https://codex-pets.net/api/pets/bubble/download?v=latest",
                "idle,waving,jumping,swimming"));

        pets.add(pet("fluffy", "🐰", "棉花小兔兔",
                "耳朵会随着音乐摆动的小兔兔，最爱胡萝卜味的小饼干。生气时会背过身去不理你~",
                "#fef3c7", "#f59e0b", "软萌害羞", "小敏感",
                "https://codex-pets.net/api/pets/fluffy/download?v=latest",
                "idle,waving,jumping,angry"));

        pets.add(pet("starry", "⭐", "星星小狐狸",
                "一只会发光的小狐狸，尾巴尖上有一颗小星星。在夜晚特别明亮，会陪你一起熬夜写代码。",
                "#ede9fe", "#8b5cf6", "神秘温柔", "忠实伙伴",
                "https://codex-pets.net/api/pets/starry/download?v=latest",
                "idle,waving,jumping,glowing,sleeping"));

        pets.add(pet("pudding", "🍮", "布丁小仓鼠",
                "圆滚滚的小仓鼠，两颊永远塞满零食。跑轮子是它每天必做的运动，累了就会摊成一张鼠饼~",
                "#ffe4e6", "#e11d48", "精力充沛", "贪吃可爱",
                "https://codex-pets.net/api/pets/pudding/download?v=latest",
                "idle,waving,jumping,running,eating"));

        pets.add(pet("sakura", "🌸", "樱花小仙子",
                "从樱花树上诞生的精灵，身披粉色花瓣裙。春天时会在屏幕上洒下片片花瓣~",
                "#fff1f2", "#f43f5e", "优雅浪漫", "季节精灵",
                "https://codex-pets.net/api/pets/sakura/download?v=latest",
                "idle,waving,jumping,flowering"));

        pets.add(pet("coco", "🐶", "可可小柴犬",
                "一只永远在微笑的柴犬，喜欢摇尾巴和舔屏幕。看到 bug 时会歪头表示困惑，特别治愈！",
                "#fef7ed", "#ea580c", "忠诚友好", "微笑天使",
                "https://codex-pets.net/api/pets/coco/download?v=latest",
                "idle,waving,jumping,wagging,confused"));

        return pets;
    }

    private Map<String, Object> pet(String id, String emoji, String name,
                                     String description, String bgColor, String accent,
                                     String personality, String tags,
                                     String url, String animations) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", id);
        p.put("emoji", emoji);
        p.put("name", name);
        p.put("description", description);
        p.put("bgColor", bgColor);
        p.put("accent", accent);
        p.put("personality", personality);
        p.put("tags", tags);
        p.put("url", url);
        p.put("animations", animations);
        p.put("isCustom", false);
        return p;
    }
}
