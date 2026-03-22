# Payment CSV Template Generator
# This script creates a properly formatted payment CSV template WITHOUT BOM

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Payment CSV Template Generator                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Ask user for society name (optional)
$societyName = Read-Host "Enter society name (or press Enter to skip)"

# Sample payment data
$csvContent = if ($societyName) {
    @"
towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status,societyName
T1,101,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending,$societyName
T1,102,Q1-2026,Jan-Mar 2026,5000,2026-03-31,paid,$societyName
T1,103,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending,$societyName
T2,201,Q1-2026,Jan-Mar 2026,6000,2026-03-31,pending,$societyName
T2,202,Q1-2026,Jan-Mar 2026,6000,2026-03-31,pending,$societyName
T2,203,Q1-2026,Jan-Mar 2026,6000,2026-03-31,paid,$societyName
T3,301,Q1-2026,Jan-Mar 2026,7000,2026-03-31,pending,$societyName
T3,302,Q1-2026,Jan-Mar 2026,7000,2026-03-31,pending,$societyName
"@
} else {
    @"
towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status
T1,101,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending
T1,102,Q1-2026,Jan-Mar 2026,5000,2026-03-31,paid
T1,103,Q1-2026,Jan-Mar 2026,5000,2026-03-31,pending
T2,201,Q1-2026,Jan-Mar 2026,6000,2026-03-31,pending
T2,202,Q1-2026,Jan-Mar 2026,6000,2026-03-31,pending
T2,203,Q1-2026,Jan-Mar 2026,6000,2026-03-31,paid
T3,301,Q1-2026,Jan-Mar 2026,7000,2026-03-31,pending
T3,302,Q1-2026,Jan-Mar 2026,7000,2026-03-31,pending
"@
}

# Ask for output location
$defaultPath = "C:\AMP\Projects\MySoceity\payment_template.csv"
$outputPath = Read-Host "Enter output path (default: $defaultPath)"
if ([string]::IsNullOrWhiteSpace($outputPath)) {
    $outputPath = $defaultPath
}

# Create UTF-8 without BOM encoder
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

try {
    # Write file without BOM
    [System.IO.File]::WriteAllLines($outputPath, $csvContent, $utf8NoBom)
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green -BackgroundColor Black
    Write-Host "  Payment CSV template created at:" -ForegroundColor Cyan
    Write-Host "  $outputPath`n" -ForegroundColor Yellow
    
    # Display preview
    Write-Host "Preview (first 5 lines):" -ForegroundColor Cyan
    $lines = Get-Content $outputPath -TotalCount 5
    $lines | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    Write-Host "`nFile Details:" -ForegroundColor Cyan
    $fileInfo = Get-Item $outputPath
    Write-Host "  Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
    Write-Host "  Encoding: UTF-8 without BOM ✓" -ForegroundColor Green
    Write-Host "  Lines: $(($csvContent -split "`n").Length)" -ForegroundColor Gray
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Open the CSV file in a text editor (Notepad recommended)" -ForegroundColor White
    Write-Host "  2. Edit the data rows with your actual payment information" -ForegroundColor White
    Write-Host "  3. Keep the header row unchanged!" -ForegroundColor Yellow
    Write-Host "  4. Save the file" -ForegroundColor White
    Write-Host "  5. Upload via dashboard: http://localhost:4203`n" -ForegroundColor White
    
    Write-Host "CSV Format:" -ForegroundColor Cyan
    Write-Host "  • towerNumber: Tower/Building number (e.g., T1, Tower 1)" -ForegroundColor Gray
    Write-Host "  • flatNumber: Flat/Apartment number (e.g., 101, A12)" -ForegroundColor Gray
    Write-Host "  • quarterName: Quarter name (e.g., Q1-2026)" -ForegroundColor Gray
    Write-Host "  • quarterPeriod: Period text (e.g., Jan-Mar 2026)" -ForegroundColor Gray
    Write-Host "  • amount: Payment amount (number only, e.g., 5000)" -ForegroundColor Gray
    Write-Host "  • dueDate: Due date (YYYY-MM-DD or DD-MM-YYYY)" -ForegroundColor Gray
    Write-Host "  • status: Payment status ('pending' or 'paid')" -ForegroundColor Gray
    if ($societyName) {
        Write-Host "  • societyName: Society name (already filled)" -ForegroundColor Gray
    }
    
    Write-Host "`n✅ Template is ready to use!" -ForegroundColor Green
    
} catch {
    Write-Host "`n✗ ERROR creating CSV file:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Yellow
}
