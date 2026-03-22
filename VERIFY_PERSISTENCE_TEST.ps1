# Verify Database Persistence - Test Script
# Run this to verify that data actually persists after restart

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Database Persistence Verification Test            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8002"

Write-Host "Phase 1: Checking BEFORE Restart..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

try {
    $usersBefore = Invoke-RestMethod -Uri "$baseUrl/api/admin/all-users" -Method Get
    $userCountBefore = $usersBefore.count
    Write-Host "  Users in database: $userCountBefore" -ForegroundColor Cyan
    
    $paymentsBefore = Invoke-RestMethod -Uri "$baseUrl/api/user/payments/debug/all" -Method Get
    $paymentCountBefore = $paymentsBefore.allPayments.Count
    Write-Host "  Payments in database: $paymentCountBefore" -ForegroundColor Cyan
    
    $societiesBefore = Invoke-RestMethod -Uri "$baseUrl/api/societies" -Method Get
    $societyCountBefore = $societiesBefore.Count
    Write-Host "  Societies in database: $societyCountBefore" -ForegroundColor Cyan
    
    if ($userCountBefore -eq 0 -and $paymentCountBefore -eq 0 -and $societyCountBefore -eq 0) {
        Write-Host "`n⚠️  No data found! Please create some test data first." -ForegroundColor Yellow
        Write-Host "   Run: .\SETUP_TEST_DATA.ps1" -ForegroundColor Gray
        Write-Host "   Or use the bulk upload feature in the dashboard`n" -ForegroundColor Gray
        exit
    }
    
} catch {
    Write-Host "  ✗ Error connecting to services: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Make sure services are running!" -ForegroundColor Yellow
    exit
}

Write-Host "`nPhase 2: Restarting Services..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

# Stop services
Write-Host "  Stopping backend services..." -ForegroundColor Gray
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start services
Write-Host "  Starting user-service..." -ForegroundColor Gray
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoExit', '-Command', "cd 'C:\AMP\Projects\MySoceity\backend\user-service'; java -jar target/user-service-1.0.0.jar"

Write-Host "  Starting auth-service..." -ForegroundColor Gray
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoExit', '-Command', "cd 'C:\AMP\Projects\MySoceity\backend\auth-service'; java -jar target/auth-service-1.0.0.jar"

Write-Host "  Waiting 30 seconds for services to start..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host "`nPhase 3: Checking AFTER Restart..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

$maxRetries = 5
$retryCount = 0
$servicesUp = $false

while ($retryCount -lt $maxRetries -and !$servicesUp) {
    try {
        $usersAfter = Invoke-RestMethod -Uri "$baseUrl/api/admin/all-users" -Method Get -TimeoutSec 5
        $servicesUp = $true
    } catch {
        $retryCount++
        Write-Host "  Waiting for services... retry $retryCount/$maxRetries" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

if (!$servicesUp) {
    Write-Host "  ✗ Services did not start properly. Please check logs." -ForegroundColor Red
    exit
}

try {
    $usersAfter = Invoke-RestMethod -Uri "$baseUrl/api/admin/all-users" -Method Get
    $userCountAfter = $usersAfter.count
    
    $paymentsAfter = Invoke-RestMethod -Uri "$baseUrl/api/user/payments/debug/all" -Method Get
    $paymentCountAfter = $paymentsAfter.allPayments.Count
    
    $societiesAfter = Invoke-RestMethod -Uri "$baseUrl/api/societies" -Method Get
    $societyCountAfter = $societiesAfter.Count
    
    Write-Host "  Users in database: $userCountAfter" -ForegroundColor Cyan
    Write-Host "  Payments in database: $paymentCountAfter" -ForegroundColor Cyan
    Write-Host "  Societies in database: $societyCountAfter" -ForegroundColor Cyan
    
} catch {
    Write-Host "  ✗ Error checking data: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host "`nPhase 4: Results..." -ForegroundColor Yellow
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Gray

Write-Host "`nComparison:" -ForegroundColor Cyan
Write-Host "                    Before  →  After" -ForegroundColor Gray
Write-Host "  Users:            $userCountBefore  →  $userCountAfter" -ForegroundColor White
Write-Host "  Payments:         $paymentCountBefore  →  $paymentCountAfter" -ForegroundColor White
Write-Host "  Societies:        $societyCountBefore  →  $societyCountAfter" -ForegroundColor White

Write-Host "`nVerdict:" -ForegroundColor Cyan

$allMatch = ($userCountBefore -eq $userCountAfter) -and 
            ($paymentCountBefore -eq $paymentCountAfter) -and 
            ($societyCountBefore -eq $societyCountAfter)

if ($allMatch) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ SUCCESS! All data PERSISTED after restart!            ║" -ForegroundColor Green
    Write-Host "║     Database persistence is working correctly! 🎉         ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
} else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ✗ FAILURE! Data was lost after restart!                  ║" -ForegroundColor Red
    Write-Host "║     There may be an issue with database persistence       ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Red
}
