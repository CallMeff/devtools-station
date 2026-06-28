package com.devtools.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.devtools.entity.EmailVerification;
import org.apache.ibatis.annotations.Mapper;

/**
 * 邮箱验证码 Mapper
 */
@Mapper
public interface EmailVerificationMapper extends BaseMapper<EmailVerification> {
}
