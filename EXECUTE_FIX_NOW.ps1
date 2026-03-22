# ================================================================
# EXECUTE PHONE NUMBER FIX - Direct Database Update
# ================================================================
# This script executes the SQL updates directly without requiring DBeaver
# Run this from PowerShell: .\EXECUTE_FIX_NOW.ps1

Write-Host "`n=== FIXING PHONE NUMBERS IN DATABASE ===" -ForegroundColor Cyan
Write-Host "This will add phone number 9176787766 to paranthamanms user`n" -ForegroundColor Yellow

# Database connection details
$server = "localhost"
$port = "5432"
$database = "postgres"
$username = "postgres"
$password = "Chennai@2006"

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $password

# Try to find psql.exe in common PostgreSQL installation paths
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
    "C:\PostgreSQL\*\bin\psql.exe"
)

$psqlExe = $null
foreach ($path in $psqlPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psqlExe = $found.FullName
        Write-Host "Found PostgreSQL at: $psqlExe" -ForegroundColor Green
        break
    }
}

if ($psqlExe) {
    Write-Host "`nExecuting SQL updates..." -ForegroundColor Cyan
    
    # Execute each update individually
    Write-Host "`n1. Updating paranthamanms user..." -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "UPDATE users SET phone_number = '9176787766' WHERE username = 'paranthamanms';" 2>&1
    
    Write-Host "`n2. Updating admin user..." -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "UPDATE users SET phone_number = '916887766', email = 'NammaSociety.notifications@gmail.com' WHERE username = 'admin';" 2>&1
    
    Write-Host "`n3. Updating societyadmin user..." -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "UPDATE users SET phone_number = '916887766', email = 'NammaSociety.notifications@gmail.com' WHERE username = 'societyadmin';" 2>&1
    
    Write-Host "`n4. Updating testuser..." -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "UPDATE users SET phone_number = '9988776655' WHERE username = 'testuser';" 2>&1
    
    Write-Host "`n5. Updating resident1..." -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "UPDATE users SET phone_number = '9876543210' WHERE username = 'resident1';" 2>&1
    
    Write-Host "`n6. Syncing to user_profiles..." -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "UPDATE user_profiles up SET phone_number = u.phone_number, email = u.email FROM users u WHERE up.user_id = u.id;" 2>&1
    
    Write-Host "`n=== VERIFICATION ===" -ForegroundColor Cyan
    Write-Host "`nChecking paranthamanms user:" -ForegroundColor Yellow
    & $psqlExe -U $username -d $database -h $server -p $port -c "SELECT username, phone_number, email FROM users WHERE username = 'paranthamanms';" 2>&1
    
    Write-Host "`n" -ForegroundColor Green
    Write-Host "=== UPDATE COMPLETE ===" -ForegroundColor Green
    Write-Host "`nYou can now test mobile login:" -ForegroundColor Cyan
    Write-Host "  1. Go to http://localhost:4201" -ForegroundColor White
    Write-Host "  2. Click 'Mobile & OTP' tab" -ForegroundColor White
    Write-Host "  3. Enter: 9176787766" -ForegroundColor White
    Write-Host "  4. Click 'Send OTP'" -ForegroundColor White
    Write-Host "  5. Enter OTP from SMS" -ForegroundColor White
    Write-Host "  6. Click 'Login'`n" -ForegroundColor White
    
} else {
    Write-Host "`n ERROR: PostgreSQL psql.exe not found!" -ForegroundColor Red
    Write-Host "`nPlease do ONE of the following:" -ForegroundColor Yellow
    Write-Host "`nOPTION 1: Use DBeaver (Recommended)" -ForegroundColor Cyan
    Write-Host "  1. Open DBeaver" -ForegroundColor White
    Write-Host "  2. Connect to PostgreSQL (localhost:5432, postgres, Chennai@2006)" -ForegroundColor White
    Write-Host "  3. Open SQL Editor (Ctrl+])" -ForegroundColor White
    Write-Host "  4. Copy and paste this SQL:" -ForegroundColor White
    Write-Host ""
    Write-Host "     UPDATE users SET phone_number = '9176787766' WHERE username = 'paranthamanms';" -ForegroundColor Gray
    Write-Host "     UPDATE user_profiles up SET phone_number = u.phone_number FROM users u WHERE up.user_id = u.id;" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  5. Execute (Ctrl+Enter)" -ForegroundColor White
    Write-Host "`nOPTION 2: Manual SQL via any PostgreSQL client" -ForegroundColor Cyan
    Write-Host "  Run the commands shown above in any PostgreSQL tool`n" -ForegroundColor White
    
    Write-Host "`nOPTION 3: Install PostgreSQL command-line tools" -ForegroundColor Cyan
    Write-Host "  - Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  - Install and run this script again`n" -ForegroundColor White
}

# Clean up environment variable
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

