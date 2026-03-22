# Start Jenkins Server with Required Configuration
# This script starts Jenkins with local Git checkout enabled

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   STARTING JENKINS SERVER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Jenkins WAR exists
$jenkinsWar = "C:\AMP\Projects\MySoceity\jenkins.war"
if (-not (Test-Path $jenkinsWar)) {
    Write-Host "❌ ERROR: jenkins.war not found at:" -ForegroundColor Red
    Write-Host "   $jenkinsWar`n" -ForegroundColor White
    Write-Host "Download Jenkins with:" -ForegroundColor Yellow
    Write-Host "   Invoke-WebRequest -Uri 'https://get.jenkins.io/war-stable/latest/jenkins.war' -OutFile '$jenkinsWar'`n" -ForegroundColor Cyan
    exit 1
}

# Check if Jenkins is already running
$jenkinsRunning = netstat -ano 2>$null | Select-String ":8080" | Select-String "LISTENING"
if ($jenkinsRunning) {
    Write-Host "⚠️  Jenkins is already running on port 8080" -ForegroundColor Yellow
    Write-Host "`nDo you want to restart it? (Y/N): " -NoNewline -ForegroundColor White
    $response = Read-Host
    
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "`n✅ Jenkins is already running at http://localhost:8080`n" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "`nStopping existing Jenkins..." -ForegroundColor Yellow
    Get-Process java -ErrorAction SilentlyContinue | Where-Object { 
        $_.Path -like "*java*" 
    } | ForEach-Object {
        $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        if ($cmdLine -like "*jenkins.war*") {
            Stop-Process -Id $_.Id -Force
        }
    }
    Start-Sleep -Seconds 3
    Write-Host "✅ Stopped existing Jenkins`n" -ForegroundColor Green
}

Write-Host "📋 Jenkins Configuration:" -ForegroundColor White
Write-Host "   Port: 8080" -ForegroundColor Gray
Write-Host "   Local Git Checkout: ENABLED" -ForegroundColor Gray
Write-Host "   Home Directory: $env:USERPROFILE\.jenkins`n" -ForegroundColor Gray

Write-Host "🚀 Starting Jenkins server..." -ForegroundColor Yellow
Write-Host "   This window will show Jenkins logs" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop Jenkins`n" -ForegroundColor Gray

Write-Host "⏳ Please wait 30-60 seconds for Jenkins to fully start..." -ForegroundColor Cyan
Write-Host "`n========================================`n" -ForegroundColor Cyan

# Start Jenkins with required system property
# -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true allows using local Git repos
cd C:\AMP\Projects\MySoceity
java -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true -jar jenkins.war --httpPort=8080
