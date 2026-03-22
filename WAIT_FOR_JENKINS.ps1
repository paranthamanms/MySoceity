# Jenkins Startup Monitor
# This script waits for Jenkins to be fully ready

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   JENKINS STARTUP MONITOR" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Checking Jenkins status..." -ForegroundColor Yellow

$maxWaitMinutes = 5
$maxAttempts = $maxWaitMinutes * 12  # Check every 5 seconds
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    $elapsed = [math]::Round($attempt * 5 / 60, 1)
    
    try {
        # Try to connect to Jenkins
        $response = Invoke-WebRequest -Uri "http://localhost:8080/login" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "   JENKINS IS READY!" -ForegroundColor Green
            Write-Host "========================================`n" -ForegroundColor Green
            
            Write-Host "âœ… Jenkins Dashboard:" -ForegroundColor White
            Write-Host "   http://localhost:8080`n" -ForegroundColor Cyan
            
            Write-Host "âœ… NammaSociety Pipeline Job:" -ForegroundColor White
            Write-Host "   http://localhost:8080/job/NammaSociety-Pipeline/`n" -ForegroundColor Cyan
            
            Write-Host "Opening pipeline in browser..." -ForegroundColor Yellow
            Start-Process "http://localhost:8080/job/NammaSociety-Pipeline/"
            
            Write-Host "`nâœ… You can now trigger Build #7" -ForegroundColor Green
            Write-Host "   Click 'Build Now' in the left sidebar`n" -ForegroundColor White
            
            exit 0
        }
    }
    catch {
        # Jenkins not ready yet
        $dots = "." * (($attempt % 4) + 1)
        $spaces = " " * (4 - (($attempt % 4) + 1))
        Write-Host "`râ³ Waiting for Jenkins to start$dots$spaces (${elapsed}m elapsed)" -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

Write-Host "`n`nâš ï¸ Timeout after $maxWaitMinutes minutes" -ForegroundColor Red
Write-Host "`nJenkins process status:" -ForegroundColor Yellow
$jenkinsPort = netstat -ano 2>$null | Select-String ":8080" | Select-String "LISTENING"
if ($jenkinsPort) {
    Write-Host "âœ… Jenkins process is running on port 8080" -ForegroundColor Green
    Write-Host "`nTry accessing manually:" -ForegroundColor White
    Write-Host "  http://localhost:8080" -ForegroundColor Cyan
    Write-Host "`nOr check Jenkins terminal for errors" -ForegroundColor Yellow
} else {
    Write-Host "âŒ Jenkins is not running on port 8080" -ForegroundColor Red
    Write-Host "`nStart Jenkins with:" -ForegroundColor White
    Write-Host "  java -jar jenkins.war --httpPort=8080" -ForegroundColor Cyan
}

