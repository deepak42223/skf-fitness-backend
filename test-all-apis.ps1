# SKF FITNESS - Complete API Test Script
# Tests all backend API endpoints

$baseUrl = "http://localhost:3000/api"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "TEST: $Name" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✓ PASS: $Name" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Gray
        $response | ConvertTo-Json -Depth 5
        
        $script:testResults += [PSCustomObject]@{
            Test = $Name
            Status = "PASS"
            Method = $Method
            Endpoint = $Url
        }
        
        return $response
    }
    catch {
        Write-Host "✗ FAIL: $Name" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        
        $script:testResults += [PSCustomObject]@{
            Test = $Name
            Status = "FAIL"
            Method = $Method
            Endpoint = $Url
            Error = $_.Exception.Message
        }
        
        return $null
    }
}

Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║         SKF FITNESS - API TESTING SUITE                  ║
║         Testing all backend endpoints                     ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

# ═══════════════════════════════════════════════════════════
# 1. MEMBERSHIP MODULE
# ═══════════════════════════════════════════════════════════

$plans = Test-Endpoint `
    -Name "GET Membership Plans" `
    -Method "GET" `
    -Url "$baseUrl/membership/plans"

# ═══════════════════════════════════════════════════════════
# 2. CONTACT MODULE
# ═══════════════════════════════════════════════════════════

$contactData = @{
    name = "Test User"
    email = "test@example.com"
    phone = "9876543210"
    message = "This is a test message from API testing"
}

$contact = Test-Endpoint `
    -Name "POST Contact Form" `
    -Method "POST" `
    -Url "$baseUrl/contact" `
    -Body $contactData

# ═══════════════════════════════════════════════════════════
# 3. MEMBERS MODULE - Registration
# ═══════════════════════════════════════════════════════════

$randomEmail = "john.test$(Get-Random)@example.com"
$memberData = @{
    name = "John Doe"
    email = $randomEmail
    password = "Test123456"
    phone = "9876543210"
    membershipPlan = "basic"
}

$newMember = Test-Endpoint `
    -Name "POST Register New Member" `
    -Method "POST" `
    -Url "$baseUrl/members" `
    -Body $memberData

# ═══════════════════════════════════════════════════════════
# 4. AUTH MODULE - Login
# ═══════════════════════════════════════════════════════════

if ($newMember) {
    $loginData = @{
        email = $randomEmail
        password = "Test123456"
    }
    
    $loginResponse = Test-Endpoint `
        -Name "POST Login" `
        -Method "POST" `
        -Url "$baseUrl/auth/login" `
        -Body $loginData
    
    $token = $loginResponse.access_token
    $userId = $loginResponse.user.id
}
else {
    # Try with existing credentials
    $loginData = @{
        email = "admin@skffitness.com"
        password = "admin123"
    }
    
    $loginResponse = Test-Endpoint `
        -Name "POST Login (Fallback)" `
        -Method "POST" `
        -Url "$baseUrl/auth/login" `
        -Body $loginData
    
    if ($loginResponse) {
        $token = $loginResponse.access_token
        $userId = $loginResponse.user.id
    }
}

# ═══════════════════════════════════════════════════════════
# 5. PROFILE MODULE (Requires Authentication)
# ═══════════════════════════════════════════════════════════

if ($token) {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    # Get Profile
    $profile = Test-Endpoint `
        -Name "GET User Profile" `
        -Method "GET" `
        -Url "$baseUrl/profile/$userId" `
        -Headers $authHeaders
    
    # Update Profile
    $updateData = @{
        age = 28
        gender = "male"
        height = 175
        weight = 75
        goal = "Build Muscle"
    }
    
    $updatedProfile = Test-Endpoint `
        -Name "PATCH Update Profile" `
        -Method "PATCH" `
        -Url "$baseUrl/profile/$userId" `
        -Body $updateData `
        -Headers $authHeaders
    
    # Get Stats
    $stats = Test-Endpoint `
        -Name "GET Profile Stats" `
        -Method "GET" `
        -Url "$baseUrl/profile/$userId/stats" `
        -Headers $authHeaders
    
    # Check In
    $checkin = Test-Endpoint `
        -Name "POST Check In" `
        -Method "POST" `
        -Url "$baseUrl/profile/$userId/checkin" `
        -Headers $authHeaders
    
    # Check Out
    Start-Sleep -Seconds 2
    $checkout = Test-Endpoint `
        -Name "POST Check Out" `
        -Method "POST" `
        -Url "$baseUrl/profile/$userId/checkout" `
        -Headers $authHeaders
    
    # Get Attendance
    $attendance = Test-Endpoint `
        -Name "GET Attendance Records" `
        -Method "GET" `
        -Url "$baseUrl/profile/$userId/attendance" `
        -Headers $authHeaders
    
    # Add Progress
    $progressData = @{
        date = (Get-Date).ToString("yyyy-MM-dd")
        weight = 74.5
        bodyFat = 18.5
        muscleMass = 35.2
        notes = "Feeling great after workout!"
    }
    
    $progress = Test-Endpoint `
        -Name "POST Add Progress" `
        -Method "POST" `
        -Url "$baseUrl/profile/$userId/progress" `
        -Body $progressData `
        -Headers $authHeaders
    
    # Get Progress History
    $progressHistory = Test-Endpoint `
        -Name "GET Progress History" `
        -Method "GET" `
        -Url "$baseUrl/profile/$userId/progress" `
        -Headers $authHeaders
}

# ═══════════════════════════════════════════════════════════
# 6. MEMBERS MODULE - Get All Members (Admin)
# ═══════════════════════════════════════════════════════════

if ($token) {
    $members = Test-Endpoint `
        -Name "GET All Members" `
        -Method "GET" `
        -Url "$baseUrl/members" `
        -Headers $authHeaders
    
    $memberStats = Test-Endpoint `
        -Name "GET Member Stats" `
        -Method "GET" `
        -Url "$baseUrl/members/stats" `
        -Headers $authHeaders
}

# ═══════════════════════════════════════════════════════════
# 7. ADMIN MODULE (Requires Admin Role)
# ═══════════════════════════════════════════════════════════

if ($token -and $loginResponse.user.role -eq "admin") {
    $dashboard = Test-Endpoint `
        -Name "GET Admin Dashboard" `
        -Method "GET" `
        -Url "$baseUrl/admin/dashboard" `
        -Headers $authHeaders
    
    $adminMembers = Test-Endpoint `
        -Name "GET Admin Members List" `
        -Method "GET" `
        -Url "$baseUrl/admin/members" `
        -Headers $authHeaders
    
    $adminStats = Test-Endpoint `
        -Name "GET Admin Stats" `
        -Method "GET" `
        -Url "$baseUrl/admin/stats" `
        -Headers $authHeaders
    
    $messages = Test-Endpoint `
        -Name "GET Contact Messages" `
        -Method "GET" `
        -Url "$baseUrl/admin/messages" `
        -Headers $authHeaders
}

# ═══════════════════════════════════════════════════════════
# 8. AUTH MODULE - Password Reset Flow
# ═══════════════════════════════════════════════════════════

$forgotData = @{
    email = $randomEmail
}

$forgot = Test-Endpoint `
    -Name "POST Forgot Password" `
    -Method "POST" `
    -Url "$baseUrl/auth/forgot-password" `
    -Body $forgotData

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════

Write-Host "`n`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    TEST SUMMARY                          ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passed/$total)*100, 2))%" -ForegroundColor Cyan

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "DETAILED RESULTS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$testResults | Format-Table -AutoSize

# Save results to file
$testResults | Export-Csv -Path "api-test-results.csv" -NoTypeInformation
Write-Host "`nResults saved to: api-test-results.csv" -ForegroundColor Green

Write-Host "`n✓ API Testing Complete!" -ForegroundColor Green
