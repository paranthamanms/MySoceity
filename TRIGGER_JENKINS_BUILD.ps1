# TRIGGER_JENKINS_BUILD.ps1
# Script to trigger and monitor Jenkins build for NammaSociety-Pipeline

Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘   NammaSociety Jenkins Build Trigger         â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Cyan

# Open Jenkins in browser
Write-Host "1. Opening Jenkins in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:8080/job/NammaSociety-Pipeline/"
Start-Sleep -Seconds 3

Write-Host "2. Triggering build..." -ForegroundColor Yellow
Write-Host "   (Click 'Build Now' in the browser that just opened)" -ForegroundColor White

# Wait for user to trigger
Write-Host "`nâ³ Waiting 10 seconds for you to click 'Build Now'..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check for new builds
Write-Host "`n3. Checking for new build..." -ForegroundColor Yellow
$buildsDir = "$env:USERPROFILE\.jenkins\jobs\NammaSociety-Pipeline\builds"
$builds = Get-ChildItem $buildsDir -Directory | Where-Object { $_.Name -match '^\d+$' } | Sort-Object { [int]$_.Name }

if ($builds) {
    $latestBuild = $builds[-1].Name
    Write-Host "âœ… Latest build: #$latestBuild" -ForegroundColor Green
    
    $logFile = "$buildsDir\$latestBuild\log"
    
    Write-Host "`n4. Monitoring build progress..." -ForegroundColor Yellow
    Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Cyan
    
    # Monitor the build
    $maxWait = 300  # 5 minutes
    $waited = 0
    $building = $true
    
    while ($building -and $waited -lt $maxWait) {
        if (Test-Path $logFile) {
            $logContent = Get-Content $logFile -Raw
            
            # Check if build finished
            if ($logContent -match "Finished: (SUCCESS|FAILURE|ABORTED)") {
                $result = $matches[1]
                $building = $false
                
                Write-Host "`nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Cyan
                if ($result -eq "SUCCESS") {
                    Write-Host "âœ… BUILD SUCCESSFUL!" -ForegroundColor Green
                    Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`n" -ForegroundColor Cyan
                    
                    Write-Host "ðŸ“¦ Artifacts Created:" -ForegroundColor Magenta
                    Write-Host "  â€¢ backend/auth-service/target/auth-service-1.0.0.jar" -ForegroundColor White
                    Write-Host "  â€¢ backend/user-service/target/user-service-1.0.0.jar" -ForegroundColor White
                    Write-Host "  â€¢ frontend/login-mfe/dist/" -ForegroundColor White
                    Write-Host "  â€¢ frontend/dashboard-mfe/dist/" -ForegroundColor White
                    Write-Host "  â€¢ frontend/register-mfe/dist/" -ForegroundColor White
                    Write-Host "  â€¢ frontend/host-app/dist/" -ForegroundColor White
                    
                } elseif ($result -eq "FAILURE") {
                    Write-Host "âŒ BUILD FAILED!" -ForegroundColor Red
                    Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`n" -ForegroundColor Cyan
                    
                    Write-Host "Last 30 lines of log:" -ForegroundColor Yellow
                    Get-Content $logFile -Tail 30 | ForEach-Object {
                        if ($_ -match "ERROR|FAILED") {
                            Write-Host $_ -ForegroundColor Red
                        } else {
                            Write-Host $_ -ForegroundColor Gray
                        }
                    }
                }
                
                Write-Host "`nðŸŒ View full logs at:" -ForegroundColor Cyan
                Write-Host "   http://localhost:8080/job/NammaSociety-Pipeline/$latestBuild/console" -ForegroundColor White
                
            } else {
                # Still building - show progress
                $lines = $logContent -split "`n"
                $lastLine = $lines[-2..-1] | Where-Object { $_ -match '\S' } | Select-Object -First 1
                if ($lastLine) {
                    Write-Host "." -NoNewline -ForegroundColor Cyan
                }
            }
        }
        
        Start-Sleep -Seconds 5
        $waited += 5
    }
    
    if ($waited -ge $maxWait) {
        Write-Host "`nâš ï¸ Build is taking longer than expected (>5 minutes)" -ForegroundColor Yellow
        Write-Host "Check Jenkins UI for current status" -ForegroundColor White
    }
    
} else {
    Write-Host "âš ï¸ No builds found. Make sure you clicked 'Build Now'" -ForegroundColor Yellow
}

Write-Host "`nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

