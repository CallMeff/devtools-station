# ============================================================================
# DevTools Station - Windows 安装包一键打包脚本
# 用法: 右键 → "使用 PowerShell 运行"  或  PowerShell 中执行 .\package-windows.ps1
# 前置: JDK 17+ (JAVA_HOME), Maven 3.6+
# 产出: installer\DevToolsStation-1.0.0.exe  (~80MB, 自带JRE, 免安装Java)
# ============================================================================

$ErrorActionPreference = "Stop"
$host.UI.RawUI.WindowTitle = "DevTools Station 打包中..."

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     DevTools Station - Windows 安装包打包工具      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ======================== 0. 环境检查 ========================
Write-Host "[0/4] 环境检查..." -ForegroundColor Yellow

# JDK
$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
    $javaCmd = (Get-Command java -ErrorAction SilentlyContinue).Source
    if ($javaCmd) {
        $javaHome = Split-Path (Split-Path $javaCmd -Parent) -Parent
    }
}
if (-not $javaHome) {
    Write-Host "[X] 未找到 JDK！请安装 JDK 17+ 并设置 JAVA_HOME" -ForegroundColor Red
    pause; exit 1
}
$javaExe = "$javaHome\bin\java.exe"
$javaVer = & $javaExe -version 2>&1 | Select-String "version" | ForEach-Object { $_ -replace '.*version "([^"]+)".*', '$1' }
Write-Host "  [√] JDK: $javaHome  (版本 $javaVer)" -ForegroundColor Green

# Maven
$mvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
if (-not $mvnCmd) {
    Write-Host "[X] 未找到 Maven！请安装 Maven 3.6+ 并加入 PATH" -ForegroundColor Red
    pause; exit 1
}
Write-Host "  [√] Maven: $($mvnCmd.Source)" -ForegroundColor Green

# jpackage
$jpkg = "$javaHome\bin\jpackage.exe"
if (-not (Test-Path $jpkg)) {
    Write-Host "[X] 未找到 jpackage (需要 JDK 14+)" -ForegroundColor Red
    pause; exit 1
}

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

# ======================== 1. 编译项目 ========================
Write-Host "`n[1/4] 编译项目 (mvn package -DskipTests)..." -ForegroundColor Yellow
mvn clean package -DskipTests -q 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    # 静默模式失败则用普通模式重试
    mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Maven 构建失败" -ForegroundColor Red
        pause; exit 1
    }
}

$jarFile = Get-ChildItem "target\*.jar" | Where-Object { $_.Name -notmatch "sources|javadoc" } | Sort-Object Length -Descending | Select-Object -First 1
if (-not $jarFile) {
    Write-Host "[X] 找不到构建产物 jar 文件" -ForegroundColor Red
    pause; exit 1
}
Write-Host "  [√] 构建完成: $($jarFile.Name) ($([math]::Round($jarFile.Length/1MB,1)) MB)" -ForegroundColor Green

# ======================== 2. 裁剪 JRE ========================
Write-Host "`n[2/4] 用 jlink 裁剪定制 JRE..." -ForegroundColor Yellow
$jreDir = "target\bundled-jre"
if (Test-Path $jreDir) { Remove-Item -Recurse -Force $jreDir }

$modules = @(
    "java.base","java.compiler","java.datatransfer","java.desktop",
    "java.instrument","java.logging","java.management","java.management.rmi",
    "java.naming","java.net.http","java.prefs","java.rmi","java.scripting",
    "java.se","java.security.jgss","java.security.sasl","java.sql",
    "java.sql.rowset","java.transaction.xa","java.xml","java.xml.crypto",
    "jdk.unsupported","jdk.crypto.ec","jdk.httpserver","jdk.management",
    "jdk.management.agent","jdk.naming.dns","jdk.localedata",
    "jdk.charsets","jdk.zipfs"
) -join ","

$jlink = "$javaHome\bin\jlink.exe"
& $jlink --no-header-files --no-man-pages --compress=2 --strip-debug `
    --add-modules $modules --output $jreDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] jlink 失败，回退到完整 JDK..." -ForegroundColor DarkYellow
    # 回退：直接复制整个 JDK
    Copy-Item -Recurse $javaHome $jreDir
}
$jreSize = (Get-ChildItem $jreDir -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host "  [√] JRE 就绪 ($([math]::Round($jreSize/1MB,1)) MB)" -ForegroundColor Green

# ======================== 3. jpackage 打包 ========================
Write-Host "`n[3/4] jpackage 打包 Windows EXE 安装包..." -ForegroundColor Yellow

$installerDir = "installer"
if (Test-Path $installerDir) { Remove-Item -Recurse -Force $installerDir }
New-Item -ItemType Directory -Force $installerDir | Out-Null

# 复制 jar 到干净目录
$inputDir = "target\pkg-input"
if (Test-Path $inputDir) { Remove-Item -Recurse -Force $inputDir }
New-Item -ItemType Directory -Force $inputDir | Out-Null
Copy-Item $jarFile.FullName $inputDir

# 生成图标 (纯色占位 - jpackage 需要 .ico)
$icoPath = "$inputDir\app.ico"
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(256,256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(64,158,255))
$font = New-Object System.Drawing.Font("Arial",72,[System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("DS",[System.Drawing.PointF]::new(28,60),$font,$brush)
$g.Dispose()
$bmp.Save($icoPath,[System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
# 将 png 转为 ico (简单的做法: 直接改扩展名, jpackage 也接受 png)
Rename-Item $icoPath "app-icon.png"
$icoPath = "$inputDir\app-icon.png"

# 执行 jpackage
$appName = "DevToolsStation"
$appVersion = "1.0.0"

& $jpkg `
    --type exe `
    --name $appName `
    --app-version $appVersion `
    --vendor "DevTools" `
    --description "一站式开发者在线工具箱 - 加解密/格式化/转换/生成" `
    --icon $icoPath `
    --input $inputDir `
    --main-jar $jarFile.Name `
    --main-class org.springframework.boot.loader.launch.JarLauncher `
    --runtime-image $jreDir `
    --dest $installerDir `
    --win-shortcut `
    --win-menu `
    --win-menu-group "DevTools" `
    --arguments "--spring.profiles.active=portable" `
    --java-options "-Xmx512m -Xms256m -Dfile.encoding=UTF-8" `
    --about-url "http://localhost:8088"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] jpackage 失败！错误码: $LASTEXITCODE" -ForegroundColor Red
    pause; exit 1
}

# ======================== 4. 完成 ========================
Write-Host "`n[4/4] 打包完成!" -ForegroundColor Yellow
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ 打包成功!                         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Get-ChildItem $installerDir -Filter "*.exe" | ForEach-Object {
    $sizeMB = [math]::Round($_.Length/1MB, 1)
    Write-Host "  📦 安装包: $($_.FullName)" -ForegroundColor White
    Write-Host "     大小: $sizeMB MB" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  💡 使用说明:" -ForegroundColor Cyan
Write-Host "     1. 把 DevToolsStation-1.0.0.exe 复制到任意 Windows 电脑" -ForegroundColor White
Write-Host "     2. 双击安装（开始菜单会创建快捷方式）" -ForegroundColor White
Write-Host "     3. 启动后浏览器访问 http://localhost:8088" -ForegroundColor White
Write-Host "     4. 数据保存在安装目录的 data/devtools.mv.db 文件中" -ForegroundColor White
Write-Host "     5. 不需要安装 Java 或 MySQL！" -ForegroundColor Green
Write-Host ""

# 同时生成便携版 zip (解压即用)
Write-Host "  📦 生成便携版 ZIP (解压即用)..." -ForegroundColor Yellow

$portableDir = "target\portable"
if (Test-Path $portableDir) { Remove-Item -Recurse -Force $portableDir }
New-Item -ItemType Directory -Force $portableDir | Out-Null

# 复制 jre
Copy-Item -Recurse $jreDir "$portableDir\runtime"
# 创建 app 目录
New-Item -ItemType Directory -Force "$portableDir\app" | Out-Null
Copy-Item $jarFile.FullName "$portableDir\app\devtools-station.jar"

# 创建 start.bat
@"
@echo off
title DevTools Station
cd /d "%~dp0"
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║       DevTools Station - 便携版启动中...          ║
echo ║       访问: http://localhost:8088                  ║
echo ╚══════════════════════════════════════════════════╝
echo.
start "" "%~dp0runtime\bin\javaw.exe" -Xmx512m -Xms256m -Dfile.encoding=UTF-8 -jar "%~dp0app\devtools-station.jar" --spring.profiles.active=portable
echo 服务已启动！浏览器访问 http://localhost:8088
echo 关闭此窗口不会停止服务。
echo.
pause
"@ | Out-File -FilePath "$portableDir\start.bat" -Encoding ASCII

# 创建 stop.bat
@"
@echo off
echo 正在停止 DevTools Station...
taskkill /f /im javaw.exe 2>nul
echo 已停止。
pause
"@ | Out-File -FilePath "$portableDir\stop.bat" -Encoding ASCII

# 打包 zip
$zipPath = "$installerDir\DevToolsStation-portable.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
Compress-Archive -Path "$portableDir\*" -DestinationPath $zipPath -Force
$zipSize = [math]::Round((Get-Item $zipPath).Length/1MB, 1)
Write-Host "  [√] 便携版: $zipPath ($zipSize MB)" -ForegroundColor Green
Write-Host "      解压后双击 start.bat 即可运行" -ForegroundColor DarkGray

Write-Host ""
Write-Host "全部完成！按任意键退出..." -ForegroundColor Cyan
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
