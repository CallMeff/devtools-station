package com.devtools.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.devtools.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
