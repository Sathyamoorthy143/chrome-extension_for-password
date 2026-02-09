# Test SecureSync Backend Endpoints

Write-Host "=== Testing SecureSync Backend ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✅ Health Check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}

# Test 2: Signup with Hints
Write-Host "`n2. Testing Signup with Password Hints..." -ForegroundColor Yellow
try {
    $signupBody = @{
        email = "testuser@example.com"
        password = "TestPass123!"
        passwordHint = "My favorite color"
        masterPasswordHint = "First pet name"
    } | ConvertTo-Json

    $signup = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ Signup Successful!" -ForegroundColor Green
    Write-Host "   Email: $($signup.user.email)" -ForegroundColor Gray
    $global:accessToken = $signup.accessToken
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  User already exists (expected if testing multiple times)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Signup Failed: $_" -ForegroundColor Red
    }
}

# Test 3: Login
Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "testuser@example.com"
        password = "TestPass123!"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    $global:accessToken = $login.accessToken
} catch {
    Write-Host "❌ Login Failed: $_" -ForegroundColor Red
}

# Test 4: Forgot Password (Get Hints)
Write-Host "`n4. Testing Forgot Password (Get Hints)..." -ForegroundColor Yellow
try {
    $forgotBody = @{
        email = "testuser@example.com"
    } | ConvertTo-Json

    $hints = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password" -Method POST -Body $forgotBody -ContentType "application/json"
    Write-Host "✅ Password Hints Retrieved!" -ForegroundColor Green
    Write-Host "   Password Hint: $($hints.passwordHint)" -ForegroundColor Gray
    Write-Host "   Master Password Hint: $($hints.masterPasswordHint)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Forgot Password Failed: $_" -ForegroundColor Red
}

# Test 5: Debug Endpoint (if logged in)
if ($global:accessToken) {
    Write-Host "`n5. Testing Debug Endpoint..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $($global:accessToken)"
        }
        $debug = Invoke-RestMethod -Uri "http://localhost:3000/api/sync/debug/data" -Method GET -Headers $headers
        Write-Host "✅ Debug Data Retrieved!" -ForegroundColor Green
        Write-Host "   Email: $($debug.email)" -ForegroundColor Gray
        Write-Host "   Password Count: $($debug.passwordCount)" -ForegroundColor Gray
        Write-Host "   Bookmark Count: $($debug.bookmarkCount)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Debug Endpoint Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
