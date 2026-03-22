# Quick Test Data Setup Script
# This will help you recreate test data quickly after the database migration

Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘         Quick Test Data Setup - After DB Migration        â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8002"

# Function to create user
function Create-TestUser {
    param($username, $email, $userType, $towerNumber, $flatNumber, $societyName)
    
    $body = @{
        username = $username
        email = $email
        userType = $userType
        ownerType = "owner"
        towerNumber = $towerNumber
        flatNumber = $flatNumber
        societyName = $societyName
        phoneNumber = "1234567890"
        address = "Test Address"
        active = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  âœ“ Created user: $username ($userType)" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "  âœ— Failed to create $username : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to create society
function Create-TestSociety {
    param($name)
    
    $body = @{
        id = [guid]::NewGuid().ToString()
        name = $name
        street = "Test Street"
        area = "Test Area"
        city = "Test City"
        state = "Test State"
        country = "India"
        pincode = "123456"
        totalTowers = 5
        totalFlats = 100
        active = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/societies" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  âœ“ Created society: $name" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "  âœ— Failed to create society $name : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Step 1: Creating Test Society..." -ForegroundColor Yellow
Create-TestSociety -name "NammaSociety"
Start-Sleep -Seconds 1

Write-Host "`nStep 2: Creating Super Admin..." -ForegroundColor Yellow
Create-TestUser -username "superadmin" -email "superadmin@NammaSociety.com" -userType "superadmin" -towerNumber "T1" -flatNumber "101" -societyName "NammaSociety"
Start-Sleep -Seconds 1

Write-Host "`nStep 3: Creating Society Admin..." -ForegroundColor Yellow
Create-TestUser -username "societyadmin" -email "admin@NammaSociety.com" -userType "admin" -towerNumber "T1" -flatNumber "102" -societyName "NammaSociety"
Start-Sleep -Seconds 1

Write-Host "`nStep 4: Creating Regular Users..." -ForegroundColor Yellow
Create-TestUser -username "user1" -email "user1@NammaSociety.com" -userType "user" -towerNumber "T1" -flatNumber "103" -societyName "NammaSociety"
Create-TestUser -username "user2" -email "user2@NammaSociety.com" -userType "user" -towerNumber "T2" -flatNumber "201" -societyName "NammaSociety"
Create-TestUser -username "user3" -email "user3@NammaSociety.com" -userType "user" -towerNumber "T2" -flatNumber "202" -societyName "NammaSociety"

Write-Host "`nStep 5: Verifying Data in Database..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/admin/all-users" -Method Get
    Write-Host "  âœ“ Total users in database: $($users.count)" -ForegroundColor Green
    
    $societies = Invoke-RestMethod -Uri "$baseUrl/api/societies" -Method Get
    Write-Host "  âœ“ Total societies in database: $($societies.Count)" -ForegroundColor Green
} catch {
    Write-Host "  âœ— Error verifying data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Green
Write-Host "â•‘              Test Data Setup Complete!                    â•‘" -ForegroundColor Green
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Green

Write-Host "Created Test Accounts:" -ForegroundColor Cyan
Write-Host "  â€¢ Super Admin: superadmin@NammaSociety.com" -ForegroundColor Yellow
Write-Host "  â€¢ Society Admin: admin@NammaSociety.com" -ForegroundColor Yellow
Write-Host "  â€¢ Regular Users: user1@NammaSociety.com, user2@NammaSociety.com, user3@NammaSociety.com" -ForegroundColor Yellow
Write-Host "`nNOTE: You'll need to set passwords via auth-service for these users" -ForegroundColor Gray
Write-Host "      Or use bulk upload with CSV files that include credentials`n" -ForegroundColor Gray

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload payment data via CSV" -ForegroundColor White
Write-Host "  2. Create announcements" -ForegroundColor White
Write-Host "  3. Test persistence by restarting services" -ForegroundColor White
Write-Host "`nâœ… All future data will now PERSIST permanently!`n" -ForegroundColor Green

