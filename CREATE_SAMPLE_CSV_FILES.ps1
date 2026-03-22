# Sample CSV Files for Testing

Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘           Creating Sample CSV Files for Testing           â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Cyan

$csvDir = "C:\AMP\Projects\MySoceity\test-data-csv"

# Create directory if it doesn't exist
if (!(Test-Path $csvDir)) {
    New-Item -ItemType Directory -Path $csvDir | Out-Null
    Write-Host "âœ“ Created directory: $csvDir" -ForegroundColor Green
}

# Sample Users CSV
$usersCSV = @"
username,email,userType,ownerType,towerNumber,flatNumber,phoneNumber,address,societyName
john.doe,john.doe@NammaSociety.com,user,owner,T1,101,9876543210,Flat 101 Tower 1,NammaSociety
jane.smith,jane.smith@NammaSociety.com,user,owner,T1,102,9876543211,Flat 102 Tower 1,NammaSociety
bob.wilson,bob.wilson@NammaSociety.com,user,tenant,T2,201,9876543212,Flat 201 Tower 2,NammaSociety
alice.brown,alice.brown@NammaSociety.com,user,owner,T2,202,9876543213,Flat 202 Tower 2,NammaSociety
david.jones,david.jones@NammaSociety.com,user,owner,T3,301,9876543214,Flat 301 Tower 3,NammaSociety
"@

$usersCSV | Out-File -FilePath "$csvDir\sample_users.csv" -Encoding UTF8
Write-Host "âœ“ Created: sample_users.csv (5 users)" -ForegroundColor Green

# Sample Payments CSV (with societyName column!)
$paymentsCSV = @"
towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status,societyName
T1,101,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending,NammaSociety
T1,102,Q1-2026,Jan-Mar 2026,5000,2026-03-31,paid,NammaSociety
T2,201,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending,NammaSociety
T2,202,Q1-2026,Jan-Mar 2026,5000,2026-03-31,paid,NammaSociety
T3,301,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending,NammaSociety
T1,101,Q2-2026,Apr-Jun 2026,5000,2026-06-30,pending,NammaSociety
T1,102,Q2-2026,Apr-Jun 2026,5000,2026-06-30,pending,NammaSociety
T2,201,Q2-2026,Apr-Jun 2026,5000,2026-06-30,pending,NammaSociety
T2,202,Q2-2026,Apr-Jun 2026,5000,2026-06-30,pending,NammaSociety
T3,301,Q2-2026,Apr-Jun 2026,5000,2026-06-30,pending,NammaSociety
"@

$paymentsCSV | Out-File -FilePath "$csvDir\sample_payments.csv" -Encoding UTF8
Write-Host "âœ“ Created: sample_payments.csv (10 payment records)" -ForegroundColor Green

# Sample Society CSV
$societyCSV = @"
name,street,area,city,state,country,pincode,totalTowers,totalFlats
NammaSociety,Green Park Avenue,Sector 12,Mumbai,Maharashtra,India,400001,5,100
GreenFields Society,MG Road,Whitefield,Bangalore,Karnataka,India,560066,3,60
Sunshine Apartments,Anna Salai,T Nagar,Chennai,Tamil Nadu,India,600017,4,80
"@

$societyCSV | Out-File -FilePath "$csvDir\sample_societies.csv" -Encoding UTF8
Write-Host "âœ“ Created: sample_societies.csv (3 societies)" -ForegroundColor Green

Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Green
Write-Host "â•‘            Sample CSV Files Created Successfully!         â•‘" -ForegroundColor Green
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Green

Write-Host "CSV Files Location:" -ForegroundColor Cyan
Write-Host "  ðŸ“ $csvDir" -ForegroundColor Yellow
Write-Host "`nFiles Created:" -ForegroundColor Cyan
Write-Host "  â€¢ sample_users.csv (5 users)" -ForegroundColor White
Write-Host "  â€¢ sample_payments.csv (10 payments with societyName)" -ForegroundColor White
Write-Host "  â€¢ sample_societies.csv (3 societies)" -ForegroundColor White

Write-Host "`nHow to Use:" -ForegroundColor Cyan
Write-Host "  1. Login to your dashboard at http://localhost:4203" -ForegroundColor White
Write-Host "  2. Go to User Management â†’ Bulk Upload â†’ Select sample_users.csv" -ForegroundColor White
Write-Host "  3. Go to Payment Management â†’ Bulk Upload â†’ Select sample_payments.csv" -ForegroundColor White
Write-Host "  4. Go to Society Management â†’ Bulk Upload â†’ Select sample_societies.csv" -ForegroundColor White

Write-Host "`nâœ… Now you can quickly populate test data via UI!`n" -ForegroundColor Green

