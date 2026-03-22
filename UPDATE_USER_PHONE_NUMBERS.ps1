# ============================================================
# UPDATE EXISTING USERS WITH PHONE NUMBERS
# ============================================================
# This script adds phone numbers to existing users for OTP login testing
# Run this after auth-service is running

Write-Host "`n📱 Adding Phone Numbers to Existing Users" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# SQL to update users with phone numbers
$sqlScript = @"
-- Update admin user with phone number
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';

-- Update test users (if they exist)
UPDATE users SET phone_number = '9176787767' WHERE username = 'john.doe';
UPDATE users SET phone_number = '9176787768' WHERE username = 'jane.smith';
UPDATE users SET phone_number = '9176787769' WHERE username = 'test.user';

-- Show updated users
SELECT id, username, email, phone_number, user_type, active FROM users;
"@

# Save SQL script
$sqlScript | Out-File -FilePath "update_phone_numbers.sql" -Encoding UTF8

Write-Host "`n✅ SQL script created: update_phone_numbers.sql`n" -ForegroundColor Green

Write-Host "To execute this script:`n" -ForegroundColor Yellow
Write-Host "Option 1: Using psql command-line" -ForegroundColor White
Write-Host "  psql -U postgres -d postgres -f update_phone_numbers.sql`n" -ForegroundColor Gray

Write-Host "Option 2: Using pgAdmin" -ForegroundColor White
Write-Host "  1. Open pgAdmin and connect to PostgreSQL" -ForegroundColor Gray
Write-Host "  2. Select 'postgres' database" -ForegroundColor Gray
Write-Host "  3. Click SQL Query Tool" -ForegroundColor Gray
Write-Host "  4. Copy and run the SQL from update_phone_numbers.sql`n" -ForegroundColor Gray

Write-Host "Option 3: Direct execution with PowerShell" -ForegroundColor White
Write-Host "  Run: psql -U postgres -d postgres -c `"UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';`"`n" -ForegroundColor Gray

Write-Host "`nDefault Phone Numbers Added:" -ForegroundColor Yellow
Write-Host "  admin       → 9176787766" -ForegroundColor Green
Write-Host "  john.doe    → 9176787767" -ForegroundColor Green
Write-Host "  jane.smith  → 9176787768" -ForegroundColor Green
Write-Host "  test.user   → 9176787769`n" -ForegroundColor Green

Write-Host "⚠️  Note: For production, use actual phone numbers for SMS delivery`n" -ForegroundColor Yellow

# Option to execute directly if PostgreSQL is installed
$response = Read-Host "Do you want to execute this SQL now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`n📊 Executing SQL...`n" -ForegroundColor Cyan
    
    $env:PGPASSWORD = "Chennai@2006"
    
    try {
        psql -U postgres -d postgres -f update_phone_numbers.sql
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Phone numbers updated successfully!`n" -ForegroundColor Green
            Write-Host "You can now test mobile/OTP login with:" -ForegroundColor Yellow
            Write-Host "  Mobile: 9176787766" -ForegroundColor Green
            Write-Host "  User: admin`n" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Failed to execute SQL. Please run manually.`n" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "`n❌ Error: $_`n" -ForegroundColor Red
        Write-Host "Please ensure PostgreSQL is installed and in PATH.`n" -ForegroundColor Yellow
        Write-Host "Or run the SQL manually using pgAdmin.`n" -ForegroundColor Yellow
    }
    finally {
        Remove-Item Env:\PGPASSWORD
    }
} else {
    Write-Host "`n📝 SQL script saved. Run it manually when ready.`n" -ForegroundColor Yellow
}

Write-Host "============================================================`n" -ForegroundColor Cyan
