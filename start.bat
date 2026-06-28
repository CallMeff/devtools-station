@echo off
title DevTools Station - 便携版
cd /d "%~dp0"
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║       DevTools Station - 便携版                   ║
echo ║       数据存储在: data\devtools.mv.db             ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo 正在启动服务...
echo 访问地址: http://localhost:8088
echo API文档:  http://localhost:8088/doc.html
echo.
start "" javaw -Xmx512m -Xms256m -Dfile.encoding=UTF-8 -jar "%~dp0target\devtools-station-1.0.0.jar" --spring.profiles.active=portable
echo.
echo 服务已在后台启动！
echo 浏览器访问 http://localhost:8088 即可使用。
echo.
pause
