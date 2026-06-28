package com.devtools.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.devtools.entity.Tool;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ToolMapper extends BaseMapper<Tool> {
}
