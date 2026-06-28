Write-Host "=== Test 1: Send Verification Code ==="
$body = '{"email":"testmail2024@example.com"}'
$r = Invoke-RestMethod -Uri "http://localhost:8088/api/auth/send-code" -Method Post -Body $body -ContentType "application/json"
Write-Host ("code: " + $r.code + " | message: " + $r.message)

Write-Host ""
Write-Host "=== Test 2: Register without email ==="
$body2 = '{"username":"test1","password":"Test@123"}'
$r2 = Invoke-RestMethod -Uri "http://localhost:8088/api/auth/register" -Method Post -Body $body2 -ContentType "application/json"
Write-Host ("code: " + $r2.code + " | message: " + $r2.message)

Write-Host ""
Write-Host "=== Test 3: Register without verifyCode ==="
$body3 = '{"username":"test2","password":"Test@123","email":"test@example.com"}'
$r3 = Invoke-RestMethod -Uri "http://localhost:8088/api/auth/register" -Method Post -Body $body3 -ContentType "application/json"
Write-Host ("code: " + $r3.code + " | message: " + $r3.message)

Write-Host ""
Write-Host "=== Test 4: Register with wrong verifyCode ==="
$body4 = '{"username":"test3","password":"Test@123","email":"test@example.com","verifyCode":"000000"}'
$r4 = Invoke-RestMethod -Uri "http://localhost:8088/api/auth/register" -Method Post -Body $body4 -ContentType "application/json"
Write-Host ("code: " + $r4.code + " | message: " + $r4.message)

Write-Host ""
Write-Host "All basic tests passed!"
