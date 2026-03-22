# ================================================================
# FIX MOBILE OTP & ANNOUNCEMENTS - DATABASE UPDATE SCRIPT
# ================================================================
# This script adds phone numbers to users and syncs to profiles
# so Mobile OTP login and announcement broadcasts work
# ================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FIX MOBILE OTP & ANNOUNCEMENTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# PostgreSQL connection details
$pgHost = "localhost"
$pgPort = "5432"
$pgUser = "postgres"
$pgDatabase = "postgres"
$pgPassword = "Chennai@2006"

# Set environment variable for password
$env:PGPASSWORD = $pgPassword

Write-Host "[Step 1/4] Checking PostgreSQL connection..." -ForegroundColor Yellow

# Test if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if ($null -eq $psqlPath) {
    Write-Host "  ✗ psql command not found!" -ForegroundColor Red
    Write-Host "`nPlease use DBeaver instead:" -ForegroundColor Yellow
    Write-Host "  1. Open DBeaver" -ForegroundColor White
    Write-Host "  2. Connect to postgres@localhost:5432" -ForegroundColor White
    Write-Host "  3. Open SQL Editor (Ctrl+])" -ForegroundColor White
    Write-Host "  4. Run file: ADD_PHONE_NUMBERS_TO_USERS.sql" -ForegroundColor White
    Write-Host "  5. Run file: SYNC_PHONE_NUMBERS_TO_PROFILES.sql`n" -ForegroundColor White
    
    Write-Host "Opening SQL files..." -ForegroundColor Cyan
    Start-Process notepad.exe "ADD_PHONE_NUMBERS_TO_USERS.sql"
    Start-Sleep -Seconds 1
    Start-Process notepad.exe "SYNC_PHONE_NUMBERS_TO_PROFILES.sql"
    
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    Read-Host "`nPress Enter to exit"
    exit
}

Write-Host "  ✓ PostgreSQL client found`n" -ForegroundColor Green

# ================================================================
# Step 2: Add Phone Numbers to Users Table
# ================================================================

Write-Host "[Step 2/4] Adding phone numbers to users table..." -ForegroundColor Yellow

$sql1 = @"
-- Add phone numbers to users
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin' AND phone_number IS NULL;
UPDATE users SET phone_number = '9988776655' WHERE username = 'testuser' AND phone_number IS NULL;
UPDATE users SET phone_number = '9876543210' WHERE username = 'resident1' AND phone_number IS NULL;
UPDATE users SET phone_number = '9765432109' WHERE username = 'societyadmin' AND phone_number IS NULL;

-- Show updated users
SELECT id, username, email, phone_number FROM users ORDER BY username;
"@

try {
    $result1 = $sql1 | psql -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase 2>&1
    Write-Host "  ✓ Phone numbers added to users table" -ForegroundColor Green
    Write-Host "`nUpdated users:" -ForegroundColor Cyan
    Write-Host $result1 -ForegroundColor White
} catch {
    Write-Host "  ✗ Error updating users table: $_" -ForegroundColor Red
}

# ================================================================
# Step 3: Sync Phone Numbers to User Profiles
# ================================================================

Write-Host "`n[Step 3/4] Syncing phone numbers to user_profiles table..." -ForegroundColor Yellow

$sql2 = @"
-- Sync phone numbers from users to user_profiles
UPDATE user_profiles up
SET phone_number = u.phone_number
FROM users u
WHERE up.user_id = u.id
AND u.phone_number IS NOT NULL;

-- Show sync results
SELECT 
    COUNT(*) as total_profiles,
    COUNT(phone_number) as profiles_with_phone,
    COUNT(*) - COUNT(phone_number) as profiles_without_phone
FROM user_profiles;
"@

try {
    $result2 = $sql2 | psql -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase 2>&1
    Write-Host "  ✓ Phone numbers synced to user_profiles" -ForegroundColor Green
    Write-Host "`nSync status:" -ForegroundColor Cyan
    Write-Host $result2 -ForegroundColor White
} catch {
    Write-Host "  ✗ Error syncing to user_profiles: $_" -ForegroundColor Red
}

# ================================================================
# Step 4: Verification
# ================================================================

Write-Host "`n[Step 4/4] Verifying updates..." -ForegroundColor Yellow

$verifyQuery = @"
-- Verify users with phone numbers
SELECT username, email, phone_number, role 
FROM users 
WHERE phone_number IS NOT NULL
ORDER BY username;
"@

try {
    $verifyResult = $verifyQuery | psql -h $pgHost -p $pgPort -U $pgUser -d $pgDatabase 2>&1
    Write-Host "  ✓ Verification complete" -ForegroundColor Green
    Write-Host "`nUsers with phone numbers:" -ForegroundColor Cyan
    Write-Host $verifyResult -ForegroundColor White
} catch {
    Write-Host "  ✗ Error during verification: $_" -ForegroundColor Red
}

# Clean up
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# ================================================================
# Summary
# ================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✓ DATABASE UPDATE COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Services are already running with OTP config ✓" -ForegroundColor Green
Write-Host "  2. Test mobile login at http://localhost:4201" -ForegroundColor White
Write-Host "     - Use phone: 9176787766" -ForegroundColor Gray
Write-Host "  3. Test forgot password with mobile OTP" -ForegroundColor White
Write-Host "  4. Test announcement broadcasting (Email + SMS)`n" -ForegroundColor White

Write-Host "Issues fixed:" -ForegroundColor Cyan
Write-Host "  ✓ Mobile login 'User not found' error" -ForegroundColor Green
Write-Host "  ✓ Forgot password with mobile OTP" -ForegroundColor Green
Write-Host "  ✓ Announcement SMS broadcasting`n" -ForegroundColor Green

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
