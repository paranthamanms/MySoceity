#!/usr/bin/env pwsh
# -----------------------------------------------------------------------------
# start-mobile.ps1 - NammaSociety One-Go Launcher
# Usage:
#   .\start-mobile.ps1                         # Starts web services + mobile
#   .\start-mobile.ps1 -LiveReload            # Starts web services + live-reload mobile
#   .\start-mobile.ps1 -PreferLocalWeb        # Skip Docker and use local startup script
#   .\start-mobile.ps1 -BuildWeb              # Build web/backend before local startup
#   .\start-mobile.ps1 -SkipWebServices       # Mobile only
#   .\start-mobile.ps1 -SkipLogcat            # Do not tail logcat at the end
# -----------------------------------------------------------------------------
param(
    [switch]$LiveReload,
    [switch]$PreferLocalWeb,
    [switch]$BuildWeb,
    [switch]$SkipWebServices,
    [switch]$SkipLogcat
)

$ErrorActionPreference = 'Stop'

$SDK  = 'C:\Android\Sdk'
$ADB  = "$SDK\platform-tools\adb.exe"
$EMU  = "$SDK\emulator\emulator.exe"
$AVD  = 'NammaSociety_API34'
$PKG  = 'com.nammasociety.app'
$ROOT = 'C:\AMP\Projects\MySoceity'
$APP  = 'C:\AMP\Projects\MySoceity\frontend\mobile-app'

# Set SDK env vars for this session
$env:ANDROID_HOME     = $SDK
$env:ANDROID_SDK_ROOT = $SDK
$env:PATH             = "$SDK\platform-tools;$SDK\emulator;$SDK\cmdline-tools\latest\bin;" + $env:PATH

Write-Host "`nNammaSociety One-Go Launcher" -ForegroundColor Cyan
Write-Host "    Mode: $(if ($LiveReload) { 'LIVE-RELOAD' } else { 'NORMAL' })`n" -ForegroundColor Yellow

# 1) Start web services (build + run) unless skipped.
if (-not $SkipWebServices) {
    Set-Location $ROOT
    $webStarted = $false

    if (-not $PreferLocalWeb) {
        Write-Host "  Starting web services with Docker Compose (build + recreate)..." -ForegroundColor Green
        docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            docker compose up -d --build --force-recreate --remove-orphans
            if ($LASTEXITCODE -eq 0) {
                $webStarted = $true
                Write-Host "  Web services started via Docker. Web URL: http://localhost" -ForegroundColor Green
            } else {
                Write-Warning "Docker Compose startup failed. Falling back to local startup script."
            }
        } else {
            Write-Warning "Docker daemon is not ready. Falling back to local startup script."
        }
    }

    if (-not $webStarted) {
        if ($BuildWeb) {
            Write-Host "  Building web/backend artifacts (npm run build-all)..." -ForegroundColor Green
            npm run build-all
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Web build failed. Fix build errors and rerun."
                exit 1
            }
        }

        Write-Host "  Starting local web services (backend + frontend MFEs)..." -ForegroundColor Green

        # ── Backend: start auth-service and user-service ──────────────────────
        Write-Host "  Starting auth-service (port 8001)..." -ForegroundColor Green
        Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT\backend\auth-service'; java -jar target/auth-service-1.0.0.jar"
        Start-Sleep -Seconds 3

        Write-Host "  Starting user-service (port 8002)..." -ForegroundColor Green
        Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT\backend\user-service'; java -jar target/user-service-1.0.0.jar"

        # Wait for backend to be healthy before starting frontend
        Write-Host "  Waiting for backend services to become healthy..." -ForegroundColor DarkYellow
        $backendReady = $false
        for ($bi = 0; $bi -lt 60; $bi++) {
            try {
                $ar = Invoke-WebRequest -Uri 'http://localhost:8001/actuator/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
                $ur = Invoke-WebRequest -Uri 'http://localhost:8002/actuator/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
                if ($ar.StatusCode -eq 200 -and $ur.StatusCode -eq 200) { $backendReady = $true; break }
            } catch {}
            Start-Sleep -Seconds 3
        }
        if ($backendReady) {
            Write-Host "  Backend services healthy." -ForegroundColor Green
        } else {
            Write-Warning "Backend health check timed out. Continuing — check service windows for errors."
        }

        # ── Frontend: all 4 MFEs ───────────────────────────────────────────────
        Write-Host "  Starting host-app      (port 4200)..." -ForegroundColor Green
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT\frontend\host-app'; npm start"
        Start-Sleep -Seconds 2

        Write-Host "  Starting login-mfe     (port 4201)..." -ForegroundColor Green
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT\frontend\login-mfe'; npm run start:direct"
        Start-Sleep -Seconds 2

        Write-Host "  Starting register-mfe  (port 4202)..." -ForegroundColor Green
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT\frontend\register-mfe'; npm start"
        Start-Sleep -Seconds 2

        Write-Host "  Starting dashboard-mfe (port 4203)..." -ForegroundColor Green
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT\frontend\dashboard-mfe'; npm run start:direct"

        Write-Host "  Waiting for frontend MFEs to become available..." -ForegroundColor DarkYellow
        $frontendPorts = @(4200, 4201, 4202, 4203)
        $frontendReady = $false
        for ($fi = 0; $fi -lt 450; $fi++) {
            $listeningCount = 0
            foreach ($port in $frontendPorts) {
                if (netstat -ano 2>$null | Select-String ":$port\s" | Select-String 'LISTENING') {
                    $listeningCount++
                }
            }

            if ($listeningCount -eq $frontendPorts.Count) {
                $frontendReady = $true
                break
            }

            Start-Sleep -Seconds 2
        }

        if ($frontendReady) {
            Write-Host "  Frontend MFEs are listening on all required ports." -ForegroundColor Green
        } else {
            Write-Warning "Frontend MFEs are still compiling. Continuing, but login/dashboard navigation may fail until they finish."
        }

        $services = @(
            @{ Name = 'auth-service';   Port = 8001 },
            @{ Name = 'user-service';   Port = 8002 },
            @{ Name = 'host-app';       Port = 4200 },
            @{ Name = 'login-mfe';      Port = 4201 },
            @{ Name = 'register-mfe';   Port = 4202 },
            @{ Name = 'dashboard-mfe';  Port = 4203 }
        )
        Write-Host ""
        Write-Host "  ┌── Service Status ─────────────────────────────────┐" -ForegroundColor Cyan
        foreach ($entry in $services) {
            if (netstat -ano 2>$null | Select-String ":$($entry.Port)\s" | Select-String 'LISTENING') {
                Write-Host "  │  Port $($entry.Port)  $($entry.Name.PadRight(15)) LISTENING" -ForegroundColor Green
            } else {
                Write-Host "  │  Port $($entry.Port)  $($entry.Name.PadRight(15)) NOT YET (check window)" -ForegroundColor Yellow
            }
        }
        Write-Host "  └───────────────────────────────────────────────────┘" -ForegroundColor Cyan
        Write-Host "  Web app: http://localhost:4200" -ForegroundColor Cyan
    }
}

# 2) Start emulator if not running.
$emuRunning = & $ADB devices | Select-String 'emulator-\d+\s+device'
if (-not $emuRunning) {
    Write-Host "  ▶ Starting emulator ($AVD)..." -ForegroundColor Green
    Start-Process -FilePath $EMU -ArgumentList "-avd $AVD"

    Write-Host "  ⏳ Waiting for emulator to boot..." -ForegroundColor DarkYellow
    $booted = $false
    for ($i = 0; $i -lt 180; $i++) {
        $d = & $ADB devices
        if ($d -match 'emulator-\d+\s+device') {
            $anim = & $ADB -s emulator-5554 shell getprop init.svc.bootanim 2>$null
            if ($anim -match 'stopped') { $booted = $true; break }
        }
        Start-Sleep -Seconds 2
    }
    if (-not $booted) { Write-Error "Emulator did not boot in time."; exit 1 }
    Write-Host "  ✔ Emulator ready." -ForegroundColor Green
} else {
    Write-Host "  ✔ Emulator already running." -ForegroundColor Green
}

# 3) Build and deploy mobile app.
Set-Location $APP

if ($LiveReload) {
    # Start ng serve in background
    Write-Host "  ▶ Starting Angular dev server (port 4400)..." -ForegroundColor Green
    $devServer = Start-Process -FilePath 'cmd' `
        -ArgumentList '/c npm start -- --host=0.0.0.0 --port=4400 --disable-host-check' `
        -PassThru -WindowStyle Minimized

    Write-Host "  ⏳ Waiting for dev server to compile..." -ForegroundColor DarkYellow
    $ready = $false
    for ($i = 0; $i -lt 120; $i++) {
        try {
            $r = Invoke-WebRequest -Uri 'http://localhost:4400' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
        Start-Sleep -Seconds 2
    }
    if (-not $ready) { Write-Warning "Dev server may not be ready yet but continuing..." }

    # Patch capacitor config for live-reload
    $env:CAPACITOR_LIVE_RELOAD = '1'
    Write-Host "  ▶ Syncing Capacitor (live-reload URL: http://10.0.2.2:4400)..." -ForegroundColor Green
    npx cap sync android

    # Install and launch
    Write-Host "  ▶ Building & installing debug APK..." -ForegroundColor Green
    Push-Location android
    .\gradlew assembleDebug --quiet
    Pop-Location

    $APK = "android\app\build\outputs\apk\debug\app-debug.apk"
    & $ADB -s emulator-5554 uninstall $PKG 2>$null
    & $ADB -s emulator-5554 install -r $APK

    Write-Host "  ▶ Launching app..." -ForegroundColor Green
    & $ADB -s emulator-5554 shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 | Out-Null

    Write-Host "`n  App running in LIVE-RELOAD mode." -ForegroundColor Cyan
    Write-Host "     Edit src/ files and the emulator will auto-refresh.`n" -ForegroundColor DarkCyan

    if (-not $SkipLogcat) {
        # Tail logcat for this app
        $appPid = (& $ADB -s emulator-5554 shell pidof $PKG).Trim()
        Write-Host "  Logcat (filtered to $PKG) - Ctrl+C to stop:`n" -ForegroundColor Magenta
        & $ADB -s emulator-5554 logcat --pid=$appPid -v time
    }

} else {
    Write-Host "  ▶ Building app..." -ForegroundColor Green
    npm run build

    Write-Host "  ▶ Syncing Capacitor..." -ForegroundColor Green
    npx cap sync android

    Push-Location android
    Write-Host "  ▶ Compiling APK..." -ForegroundColor Green
    .\gradlew assembleDebug --quiet
    Pop-Location

    $APK = "android\app\build\outputs\apk\debug\app-debug.apk"
    Write-Host "  ▶ Installing APK..." -ForegroundColor Green
    & $ADB -s emulator-5554 uninstall $PKG 2>$null
    & $ADB -s emulator-5554 install -r $APK

    Write-Host "  ▶ Launching app..." -ForegroundColor Green
    & $ADB -s emulator-5554 shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 | Out-Null

    Write-Host "`n  App launched on emulator. PID: $(& $ADB -s emulator-5554 shell pidof $PKG)" -ForegroundColor Cyan

    if (-not $SkipLogcat) {
        # Tail logcat for this app
        $appPid = (& $ADB -s emulator-5554 shell pidof $PKG).Trim()
        Write-Host "  Logcat (filtered to $PKG) - Ctrl+C to stop:`n" -ForegroundColor Magenta
        & $ADB -s emulator-5554 logcat --pid=$appPid -v time
    }
}
