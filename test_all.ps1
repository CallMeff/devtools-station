# DevTools Station Full Test Suite v2
$base = "http://localhost:8088"
$pass = 0
$fail = 0
$totalTime = [System.Diagnostics.Stopwatch]::StartNew()

function Test-PostForm {
    param($name, $path, $fields)
    try {
        $r = Invoke-RestMethod -Uri "$base$path" -Method POST -Body $fields -ContentType "application/x-www-form-urlencoded" -TimeoutSec 15
        $ok = ($r.code -eq 200) -or ($r.code -eq 0) -or ($null -ne $r.data)
        if ($ok) { $script:pass++; $status = "PASS" } else { $script:fail++; $status = "FAIL" }
        $json = $r | ConvertTo-Json -Depth 2 -Compress
        $short = $json.Substring(0, [Math]::Min(160, $json.Length))
        Write-Host "  $status $name => $short"
    } catch {
        $script:fail++
        $err = $_.Exception.Message
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "  FAIL $name => $body"
        } catch {
            Write-Host "  FAIL $name => $err"
        }
    }
}

function Test-PostJson {
    param($name, $path, $body, $extraHeaders)
    $headers = @{ "Content-Type" = "application/json" }
    if ($extraHeaders) { foreach ($k in $extraHeaders.Keys) { $headers[$k] = $extraHeaders[$k] } }
    try {
        $r = Invoke-RestMethod -Uri "$base$path" -Method POST -Body $body -Headers $headers -TimeoutSec 15
        $ok = ($r.code -eq 200) -or ($r.code -eq 0) -or ($null -ne $r.data)
        if ($ok) { $script:pass++; $status = "PASS" } else { $script:fail++; $status = "FAIL" }
        $json = $r | ConvertTo-Json -Depth 2 -Compress
        $short = $json.Substring(0, [Math]::Min(160, $json.Length))
        Write-Host "  $status $name => $short"
    } catch {
        $script:fail++
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "  FAIL $name => $body"
        } catch {
            Write-Host "  FAIL $name => $($_.Exception.Message)"
        }
    }
}

function Test-Get {
    param($name, $path, $extraHeaders)
    $headers = @{}
    if ($extraHeaders) { foreach ($k in $extraHeaders.Keys) { $headers[$k] = $extraHeaders[$k] } }
    try {
        $r = Invoke-RestMethod -Uri "$base$path" -Method GET -Headers $headers -TimeoutSec 15
        $ok = ($r.code -eq 200) -or ($r.code -eq 0) -or ($null -ne $r.data)
        if ($ok) { $script:pass++; $status = "PASS" } else { $script:fail++; $status = "FAIL" }
        $json = $r | ConvertTo-Json -Depth 2 -Compress
        $short = $json.Substring(0, [Math]::Min(160, $json.Length))
        Write-Host "  $status $name => $short"
    } catch {
        $script:fail++
        Write-Host "  FAIL $name => $($_.Exception.Message)"
    }
}

function Test-Page {
    param($name, $path, $expect404 = $false)
    try {
        $r = Invoke-WebRequest -Uri "$base$path" -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($r.StatusCode -eq 200) { 
            $script:pass++; Write-Host "  PASS $name => 200 OK, $($r.Content.Length) bytes"
        } elseif ($expect404 -and $r.StatusCode -eq 404) {
            $script:pass++; Write-Host "  PASS $name => 404 (expected)"
        } else { 
            $script:fail++; Write-Host "  FAIL $name => $($r.StatusCode)"
        }
    } catch {
        if ($expect404 -and $_.Exception.Response.StatusCode -eq 404) {
            $script:pass++; Write-Host "  PASS $name => 404 (expected)"
        } else {
            $script:fail++; Write-Host "  FAIL $name => $($_.Exception.Message)"
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DevTools Station - Full Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ==================== 1. USER AUTH ====================
Write-Host "`n[1] User Auth System" -ForegroundColor Yellow
Write-Host "----------------------------------------"

$regBody = '{"username":"testuser2024","password":"Test@1234","email":"test@example.com"}'
$loginBody = '{"username":"testuser2024","password":"Test@1234"}'

Test-PostJson "Register" "/api/auth/register" $regBody
Test-PostJson "Duplicate Register" "/api/auth/register" $regBody
Test-PostJson "Login" "/api/auth/login" $loginBody

$token = $null
try {
    $lr = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    if ($lr.data.token) { $token = $lr.data.token }
} catch {}

Test-PostJson "Bad Password" "/api/auth/login" '{"username":"testuser2024","password":"wrong"}'

if ($token) {
    $h = @{ "X-Auth-Token" = $token }
    Test-Get "Token Check" "/api/auth/check" $h
    Test-Get "User Info (me)" "/api/auth/me" $h
    Test-Get "Invalid Token" "/api/auth/check" @{ "X-Auth-Token" = "bad-token-xyz" }
    Test-PostJson "Logout" "/api/auth/logout" "" $h
    Test-Get "Token After Logout" "/api/auth/check" $h
}

# ==================== 2. PAGE ROUTES ====================
Write-Host "`n[2] Page Routes" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-Page "Homepage /" "/"
Test-Page "About /about" "/about"
Test-Page "Guide /guide" "/guide"
Test-Page "Feedback /feedback" "/feedback"
Test-Page "Changelog /changelog" "/changelog"
Test-Page "404 Page /nonexist" "/nonexist" $true
Test-Page "Tool Page MD5" "/tools/crypto/md5" "/tools/crypto/md5"
Test-Page "Tool Page JSON" "/tools/format/json" "/tools/format/json"
Test-Page "Tool Page Cron" "/tools/devtools/cron" "/tools/devtools/cron"

# ==================== 3. TOOL SEARCH APIs ====================
Write-Host "`n[3] Tool Search APIs" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-Get "Categories" "/api/categories"
Test-Get "All Tools" "/api/tools"
Test-Get "Hot Tools" "/api/tools/hot?limit=5"
Test-Get "Search MD5" "/api/tools/search?q=MD5"
Test-Get "Search JSON" "/api/tools/search?q=JSON"

# ==================== 4. CRYPTO TOOLS ====================
Write-Host "`n[4] Crypto Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "MD5 Hash" "/api/tools/crypto/hash" @{input="hello"; algorithm="md5"}
Test-PostForm "SHA1 Hash" "/api/tools/crypto/hash" @{input="hello"; algorithm="sha1"}
Test-PostForm "SHA256 Hash" "/api/tools/crypto/hash" @{input="hello"; algorithm="sha256"}
Test-PostForm "SHA512 Hash" "/api/tools/crypto/hash" @{input="hello"; algorithm="sha512"}
Test-PostForm "Base64 Encode" "/api/tools/crypto/base64" @{input="hello world"; mode="encode"}
Test-PostForm "Base64 Decode" "/api/tools/crypto/base64" @{input="aGVsbG8gd29ybGQ="; mode="decode"}
Test-PostForm "URL Encode" "/api/tools/crypto/urlcode" @{input="hello world"; mode="encode"}
Test-PostForm "URL Decode" "/api/tools/crypto/urlcode" @{input="hello%20world"; mode="decode"}
Test-PostForm "AES Encrypt" "/api/tools/crypto/aes" @{input="secret"; key="mykey1234567890"; mode="encrypt"}
Test-PostForm "Bcrypt Hash" "/api/tools/crypto/bcrypt" @{input="mypassword"; mode="hash"}
Test-PostForm "HMAC-SHA256" "/api/tools/crypto/hmac" @{input="message"; key="secret"; algorithm="HmacSHA256"}

# ==================== 5. FORMAT TOOLS ====================
Write-Host "`n[5] Format Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "JSON Format" "/api/tools/format/json" @{input='{"name":"test","age":20}'; mode="format"}
Test-PostForm "JSON Minify" "/api/tools/format/json" @{input='{"name": "test"}'; mode="minify"}
Test-PostForm "JSON Validate" "/api/tools/format/json" @{input='{"name":"test"}'; mode="validate"}
Test-PostForm "JSON Invalid" "/api/tools/format/json" @{input='{name:test}'; mode="validate"}
Test-PostForm "SQL Format" "/api/tools/format/sql" @{input="select id,name from users where status=1 order by id desc"}
Test-PostForm "CSS Format" "/api/tools/format/css" @{input="body{margin:0;padding:0;color:red}"; mode="format"}
Test-PostForm "CSS Minify" "/api/tools/format/css" @{input="body { margin: 0; }"; mode="minify"}
Test-PostForm "HTML Format" "/api/tools/format/html" @{input="<div><p>hello</p></div>"; mode="format"}
Test-PostForm "HTML Minify" "/api/tools/format/html" @{input="<div>  <p>hello</p>  </div>"; mode="minify"}
Test-PostForm "XML Format" "/api/tools/format/xml" @{input='<root><item id="1">val</item></root>'; mode="format"}

# ==================== 6. CONVERTER TOOLS ====================
Write-Host "`n[6] Converter Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "Timestamp to Date" "/api/tools/convert/timestamp" @{input="1700000000"; mode="auto"}
Test-PostForm "Date to Timestamp" "/api/tools/convert/timestamp" @{input="2024-01-01 00:00:00"; mode="auto"}
Test-PostForm "Radix 10->16" "/api/tools/convert/radix" @{input="255"; fromRadix=10}
Test-PostForm "Radix 2->10" "/api/tools/convert/radix" @{input="11111111"; fromRadix=2}
Test-PostForm "Radix 16->10" "/api/tools/convert/radix" @{input="FF"; fromRadix=16}
Test-PostForm "Color Hex->RGB" "/api/tools/convert/color" @{input="#ff5733"}
Test-PostForm "Color RGB->Hex" "/api/tools/convert/color" @{input="rgb(255,87,51)"}
Test-PostForm "Case Upper" "/api/tools/convert/case" @{input="hello world"; style="upper"}
Test-PostForm "Case Lower" "/api/tools/convert/case" @{input="HELLO WORLD"; style="lower"}
Test-PostForm "Case Camel" "/api/tools/convert/case" @{input="hello_world_test"; style="camel"}
Test-PostForm "Case Snake" "/api/tools/convert/case" @{input="helloWorldTest"; style="snake"}
Test-PostForm "Unicode Encode" "/api/tools/convert/unicode" @{input="hello"; mode="encode"}
Test-PostForm "Unicode Decode" "/api/tools/convert/unicode" @{input="\u0068\u0065\u006c\u006c\u006f"; mode="decode"}

# ==================== 7. GENERATOR TOOLS ====================
Write-Host "`n[7] Generator Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "UUID x5" "/api/tools/generate/uuid" @{count=5; upperCase="false"; noDash="false"}
Test-PostForm "UUID Upper" "/api/tools/generate/uuid" @{count=3; upperCase="true"; noDash="true"}
Test-PostForm "Password Gen" "/api/tools/generate/password" @{length=16; hasUpper="true"; hasLower="true"; hasDigit="true"; hasSpecial="true"}
Test-PostForm "Password Digits" "/api/tools/generate/password" @{length=8; hasUpper="false"; hasLower="false"; hasDigit="true"; hasSpecial="false"}
Test-PostForm "Random Numbers" "/api/tools/generate/random" @{type="number"; min=1; max=100; count=5}
Test-PostForm "Random String" "/api/tools/generate/random" @{type="string"; length=10; count=3}
Test-PostForm "Lorem Ipsum" "/api/tools/generate/lorem" @{paragraphs=2; sentencesPerParagraph=3}
Test-PostForm "QR Code" "/api/tools/generate/qrcode" @{text="https://example.com"; size=200}

# ==================== 8. TEXT TOOLS ====================
Write-Host "`n[8] Text Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "Text Diff" "/api/tools/text/diff" @{text1="hello world`nline2"; text2="hello china`nline2`nline3"}
Test-PostForm "Regex Match" "/api/tools/text/regex" @{pattern="\d+"; text="abc123def456"; flags="g"}
Test-PostForm "Word Count" "/api/tools/text/count" @{text="Hello world! This is a test."}
Test-PostForm "Text Unique" "/api/tools/text/unique" @{text="a`nb`na`nc`nb`nd"; sort="true"}
Test-PostForm "Text Base64 Enc" "/api/tools/text/base64" @{input="Hello World"; mode="encode"}
Test-PostForm "Text Base64 Dec" "/api/tools/text/base64" @{input="SGVsbG8gV29ybGQ="; mode="decode"}

# ==================== 9. NETWORK TOOLS ====================
Write-Host "`n[9] Network Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-Get "IP Info" "/api/tools/network/ip"
Test-PostForm "UA Parse" "/api/tools/network/ua" @{ua="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"}
Test-Get "HTTP Status" "/api/tools/network/httpstatus"
Test-PostForm "Network URL Enc" "/api/tools/network/url" @{input="hello world"; mode="encode"}
Test-PostForm "Network URL Dec" "/api/tools/network/url" @{input="hello%20world"; mode="decode"}

# ==================== 10. DEV TOOLS ====================
Write-Host "`n[10] Developer Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "Cron */5" "/api/tools/dev/cron" @{expression="*/5 * * * *"}
Test-PostForm "Cron 9am Weekday" "/api/tools/dev/cron" @{expression="0 9 * * 1-5"}
Test-PostForm "Cron Invalid" "/api/tools/dev/cron" @{expression="invalid"}
Test-Get "Git Commands" "/api/tools/dev/git"
Test-Get "MIME Types" "/api/tools/dev/mime"

# ==================== 11. ENCODE TOOLS ====================
Write-Host "`n[11] Encode/Decode Tools" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Test-PostForm "Encode URL Enc" "/api/tools/encode/url" @{input="hello world"; mode="encode"}
Test-PostForm "Encode URL Dec" "/api/tools/encode/url" @{input="hello%20world"; mode="decode"}
Test-PostForm "HTML Entity Enc" "/api/tools/encode/html" @{input="<div>hello</div>"; mode="encode"}
Test-PostForm "HTML Entity Dec" "/api/tools/encode/html" @{input="&lt;div&gt;hello&lt;/div&gt;"; mode="decode"}
Test-PostForm "Morse Encode" "/api/tools/encode/morse" @{input="SOS"; mode="encode"}
Test-PostForm "Morse Decode" "/api/tools/encode/morse" @{input="... --- ..."; mode="decode"}

# ==================== 12. USER SETTINGS ====================
Write-Host "`n[12] User Settings (requires login)" -ForegroundColor Yellow
Write-Host "----------------------------------------"
try {
    $lr = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    if ($lr.data.token) {
        $t2 = $lr.data.token
        $h2 = @{ "X-Auth-Token" = $t2 }
        Test-Get "Get Settings" "/api/settings" $h2
        Test-PostJson "Update Settings" "/api/settings" '{"theme":"dark","language":"zh-CN"}' $h2
        Test-PostJson "Record Tool" "/api/settings/recent-tool" '{"toolRoute":"/tools/crypto/md5","toolName":"MD5"}' $h2
        Test-PostJson "Save History" "/api/settings/input-history" '{"toolRoute":"/tools/crypto/md5","input":"test"}' $h2
    }
} catch {}

# ==================== SUMMARY ====================
$totalTime.Stop()
$total = $pass + $fail
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed:  $pass / $total" -ForegroundColor Green
if ($fail -gt 0) {
    Write-Host "  Failed:  $fail / $total" -ForegroundColor Red
} else {
    Write-Host "  Failed:  0" -ForegroundColor Green
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
}
$rate = if ($total -gt 0) { [Math]::Round($pass/$total*100, 1) } else { 0 }
$color = if ($rate -ge 95) { "Green" } elseif ($rate -ge 80) { "Yellow" } else { "Red" }
Write-Host "  Rate:    $rate%" -ForegroundColor $color
Write-Host "  Time:    $([Math]::Round($totalTime.Elapsed.TotalSeconds, 1))s" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

$report = @"
DevTools Station Full Test Report
=================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Passed: $pass
Failed: $fail
Total: $total
Rate: $rate%
Time: $([Math]::Round($totalTime.Elapsed.TotalSeconds, 1))s
"@
$report | Out-File -FilePath "d:/workspace/devtools-station/test_report.txt" -Encoding UTF8
Write-Host "`nReport saved: test_report.txt" -ForegroundColor Gray
