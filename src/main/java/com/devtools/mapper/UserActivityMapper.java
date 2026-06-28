package com.devtools.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.devtools.entity.UserActivity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserActivityMapper extends BaseMapper<UserActivity> {
}
