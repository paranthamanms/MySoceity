# Payment CSV Validator
# This script validates your CSV format before uploading to the system

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Payment CSV Validator                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Ask for CSV file path
$defaultPath = "C:\AMP\Projects\MySoceity\payment_template.csv"
$csvPath = Read-Host "Enter path to your CSV file (default: $defaultPath)"
if ([string]::IsNullOrWhiteSpace($csvPath)) {
    $csvPath = $defaultPath
}

# Check if file exists
if (!(Test-Path $csvPath)) {
    Write-Host "`n✗ File not found: $csvPath" -ForegroundColor Red
    Write-Host "  Please check the path and try again.`n" -ForegroundColor Yellow
    exit
}

Write-Host "`n✓ File found" -ForegroundColor Green

# Get file info
$fileInfo = Get-Item $csvPath
Write-Host "  File: $($fileInfo.Name)" -ForegroundColor Gray
Write-Host "  Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
Write-Host "  Modified: $($fileInfo.LastWriteTime)" -ForegroundColor Gray

# Read file content
try {
    $lines = Get-Content $csvPath
    $totalLines = $lines.Count
    Write-Host "  Lines: $totalLines" -ForegroundColor Gray
} catch {
    Write-Host "`n✗ Error reading file: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Validation checks
$errors = @()
$warnings = @()
$passedChecks = 0
$totalChecks = 0

# Check 1: File not empty
$totalChecks++
Write-Host "`nCheck 1: File not empty..." -ForegroundColor Yellow
if ($totalLines -gt 1) {
    Write-Host "  ✓ PASS - File has $totalLines lines" -ForegroundColor Green
    $passedChecks++
} else {
    Write-Host "  ✗ FAIL - File is empty or has only headers" -ForegroundColor Red
    $errors += "File must contain at least 1 data row (plus header row)"
}

# Check 2: Check for BOM
$totalChecks++
Write-Host "`nCheck 2: Checking encoding (BOM)..." -ForegroundColor Yellow
$bytes = [System.IO.File]::ReadAllBytes($csvPath)
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "  ⚠ WARNING - File has UTF-8 BOM" -ForegroundColor Yellow
    $warnings += "File has UTF-8 BOM which may cause issues. Recommended to remove it."
} else {
    Write-Host "  ✓ PASS - No BOM detected" -ForegroundColor Green
    $passedChecks++
}

# Check 3: Validate headers
$totalChecks++
Write-Host "`nCheck 3: Validating headers..." -ForegroundColor Yellow
$headerLine = $lines[0]
$headers = $headerLine -split "," | ForEach-Object { $_.Trim() }
$requiredHeaders = @("towerNumber", "flatNumber", "quarterName", "quarterPeriod", "amount", "dueDate", "status")
$optionalHeaders = @("societyName")

$missingHeaders = @()
$headersLowercase = $headers | ForEach-Object { $_.ToLower() }

foreach ($required in $requiredHeaders) {
    if ($headersLowercase -notcontains $required.ToLower()) {
        $missingHeaders += $required
    }
}

if ($missingHeaders.Count -eq 0) {
    Write-Host "  ✓ PASS - All required headers present" -ForegroundColor Green
    Write-Host "    Headers found:" -ForegroundColor Gray
    $headers | ForEach-Object { 
        $isOptional = $optionalHeaders -contains $_
        $color = if ($isOptional) { "DarkGray" } else { "Gray" }
        $suffix = if ($isOptional) { " (optional)" } else { "" }
        Write-Host "      • $_$suffix" -ForegroundColor $color
    }
    $passedChecks++
} else {
    Write-Host "  ✗ FAIL - Missing required headers" -ForegroundColor Red
    Write-Host "    Missing:" -ForegroundColor Yellow
    $missingHeaders | ForEach-Object { Write-Host "      • $_" -ForegroundColor Red }
    $errors += "Missing required headers: $($missingHeaders -join ', ')"
}

# Check 4: Validate data rows
$totalChecks++
Write-Host "`nCheck 4: Validating data rows..." -ForegroundColor Yellow
$dataLines = $lines | Select-Object -Skip 1
$dataRowCount = $dataLines.Count
$validRows = 0
$invalidRows = @()

for ($i = 0; $i -lt $dataLines.Count; $i++) {
    $lineNum = $i + 2  # +2 because line 1 is header and we're 0-indexed
    $line = $dataLines[$i]
    
    if ([string]::IsNullOrWhiteSpace($line)) {
        continue
    }
    
    $fields = $line -split "," | ForEach-Object { $_.Trim() }
    
    # Check field count
    if ($fields.Count -lt $requiredHeaders.Count) {
        $invalidRows += "Line $lineNum: Insufficient columns ($($fields.Count) found, $($requiredHeaders.Count) required)"
        continue
    }
    
    # Check for empty required fields
    $hasEmptyFields = $false
    for ($j = 0; $j -lt [Math]::Min($requiredHeaders.Count, $fields.Count); $j++) {
        if ([string]::IsNullOrWhiteSpace($fields[$j])) {
            $invalidRows += "Line $lineNum: Empty field in column '$($requiredHeaders[$j])'"
            $hasEmptyFields = $true
            break
        }
    }
    
    if (!$hasEmptyFields) {
        $validRows++
    }
}

if ($invalidRows.Count -eq 0) {
    Write-Host "  ✓ PASS - All $validRows data rows are valid" -ForegroundColor Green
    $passedChecks++
} else {
    Write-Host "  ⚠ WARNING - $($invalidRows.Count) rows have issues" -ForegroundColor Yellow
    Write-Host "    Valid rows: $validRows" -ForegroundColor Green
    Write-Host "    Problematic rows:" -ForegroundColor Yellow
    $invalidRows | Select-Object -First 5 | ForEach-Object { 
        Write-Host "      • $_" -ForegroundColor Red 
    }
    if ($invalidRows.Count -gt 5) {
        Write-Host "      ... and $($invalidRows.Count - 5) more" -ForegroundColor DarkGray
    }
    $warnings += "$($invalidRows.Count) data rows have validation issues"
}

# Check 5: Validate date format (sample first 5 rows)
$totalChecks++
Write-Host "`nCheck 5: Validating date formats (sampling)..." -ForegroundColor Yellow
$dueDateIndex = $headers.ToLower().IndexOf("duedate")
if ($dueDateIndex -ge 0) {
    $dateSamples = $dataLines | Select-Object -First 5 | ForEach-Object {
        $fields = $_ -split ","
        if ($dueDateIndex -lt $fields.Count) { $fields[$dueDateIndex].Trim() }
    }
    
    $invalidDates = @()
    foreach ($dateStr in $dateSamples) {
        if ([string]::IsNullOrWhiteSpace($dateStr)) { continue }
        
        $validFormat = $false
        # Try YYYY-MM-DD
        if ($dateStr -match '^\d{4}-\d{2}-\d{2}$') { $validFormat = $true }
        # Try DD-MM-YYYY
        if ($dateStr -match '^\d{2}-\d{2}-\d{4}$') { $validFormat = $true }
        # Try DD/MM/YYYY
        if ($dateStr -match '^\d{2}/\d{2}/\d{4}$') { $validFormat = $true }
        # Try YYYY/MM/DD
        if ($dateStr -match '^\d{4}/\d{2}/\d{2}$') { $validFormat = $true }
        
        if (!$validFormat) {
            $invalidDates += $dateStr
        }
    }
    
    if ($invalidDates.Count -eq 0) {
        Write-Host "  ✓ PASS - Date formats look good (sampled)" -ForegroundColor Green
        Write-Host "    Sample dates:" -ForegroundColor Gray
        $dateSamples | Select-Object -First 3 | ForEach-Object { 
            Write-Host "      • $_" -ForegroundColor Gray 
        }
        $passedChecks++
    } else {
        Write-Host "  ⚠ WARNING - Some dates may have invalid format" -ForegroundColor Yellow
        Write-Host "    Invalid dates found:" -ForegroundColor Yellow
        $invalidDates | ForEach-Object { Write-Host "      • $_" -ForegroundColor Red }
        $warnings += "Some dates may not match expected formats (YYYY-MM-DD, DD-MM-YYYY, etc.)"
    }
} else {
    Write-Host "  ⚠ SKIP - dueDate column not found" -ForegroundColor Yellow
}

# Check 6: Validate status values
$totalChecks++
Write-Host "`nCheck 6: Validating status values..." -ForegroundColor Yellow
$statusIndex = $headers.ToLower().IndexOf("status")
if ($statusIndex -ge 0) {
    $statusValues = $dataLines | ForEach-Object {
        $fields = $_ -split ","
        if ($statusIndex -lt $fields.Count) { $fields[$statusIndex].Trim().ToLower() }
    } | Where-Object { $_ -ne "" } | Select-Object -Unique
    
    $invalidStatuses = $statusValues | Where-Object { $_ -notin @("paid", "pending") }
    
    if ($invalidStatuses.Count -eq 0) {
        Write-Host "  ✓ PASS - All status values are valid ('paid' or 'pending')" -ForegroundColor Green
        Write-Host "    Status values found: $($statusValues -join ', ')" -ForegroundColor Gray
        $passedChecks++
    } else {
        Write-Host "  ⚠ WARNING - Some status values are not 'paid' or 'pending'" -ForegroundColor Yellow
        Write-Host "    Invalid values: $($invalidStatuses -join ', ')" -ForegroundColor Red
        $warnings += "Status values should be 'paid' or 'pending' (found: $($invalidStatuses -join ', '))"
    }
} else {
    Write-Host "  ⚠ SKIP - status column not found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`nValidation Summary:" -ForegroundColor Cyan
Write-Host "  Checks passed: $passedChecks / $totalChecks" -ForegroundColor $(if ($passedChecks -eq $totalChecks) { 'Green' } else { 'Yellow' })
Write-Host "  Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "  Warnings: $($warnings.Count)" -ForegroundColor $(if ($warnings.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "  Valid data rows: $validRows" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host "`n✗ ERRORS (must fix):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  • $_" -ForegroundColor Red }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠ WARNINGS (recommended to fix):" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  • $_" -ForegroundColor Yellow }
}

# Final verdict
Write-Host "`n" -NoNewline
if ($errors.Count -eq 0) {
    if ($warnings.Count -eq 0) {
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  ✅ CSV IS VALID! Ready to upload!                        ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host "`nYou can now upload this CSV via:" -ForegroundColor Cyan
        Write-Host "  http://localhost:4203 → Payment Management → Upload`n" -ForegroundColor White
    } else {
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║  ⚠ CSV IS USABLE but has warnings                        ║" -ForegroundColor Yellow
        Write-Host "║    Consider fixing warnings for best results              ║" -ForegroundColor Yellow
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        Write-Host "`nThe CSV should work, but fixing warnings is recommended.`n" -ForegroundColor White
    }
} else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ✗ CSV HAS ERRORS - Must fix before uploading             ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host "`nPlease fix the errors listed above before uploading.`n" -ForegroundColor Yellow
}
