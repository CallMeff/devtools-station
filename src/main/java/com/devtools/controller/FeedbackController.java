package com.devtools.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.devtools.common.Result;
import com.devtools.entity.Feedback;
import com.devtools.entity.User;
import com.devtools.mapper.FeedbackMapper;
import com.devtools.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户反馈 API
 */
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackMapper feedbackMapper;
    private final AuthService authService;

    /**
     * 提交反馈
     */
    @PostMapping
    public Result<Void> submit(@RequestBody Map<String, String> body,
                                @RequestHeader(value = "X-Auth-Token", required = false) String token) {
        String type = body.get("type");
        String title = body.get("title");
        String content = body.get("content");

        if (title == null || title.trim().isEmpty()) {
            return Result.error(400, "标题不能为空");
        }
        if (title.trim().length() < 2) {
            return Result.error(400, "标题至少2个字符");
        }
        if (content == null || content.trim().isEmpty()) {
            return Result.error(400, "内容不能为空");
        }
        if (content.trim().length() < 10) {
            return Result.error(400, "内容至少10个字符");
        }

        Feedback feedback = new Feedback();
        feedback.setType(type != null ? type : "other");
        feedback.setTitle(title.trim());
        feedback.setContent(content.trim());
        feedback.setStatus("pending");

        // 如果已登录，关联用户
        if (token != null && !token.isEmpty()) {
            User user = authService.validateToken(token);
            if (user != null) {
                feedback.setUserId(user.getId());
            }
        }

        feedbackMapper.insert(feedback);
        return Result.success("感谢你的反馈！", null);
    }
}
