# Mobile E2E Status

## Completed in this workspace

- Web production build succeeds with `npx ng build --configuration production`
- Capacitor Android platform has been added
- Capacitor iOS platform has been added
- Capacitor assets and plugin metadata have been synced to both native projects with `npx cap sync`
- JDK 21 was installed at `C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot`

## Verified commands

```powershell
Set-Location "C:\AMP\Projects\MySoceity\frontend\mobile-app"
npx ng build --configuration production
npx cap sync
npx cap ls
```

## Current Android blocker

The Android native project is valid, but this machine does not have an Android SDK installed.
The Gradle build now fails at SDK discovery, not at app code compilation.

Observed failure:

```text
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in android/local.properties.
```

## Android next steps on this Windows machine

1. Install Android Studio from `winget install -e --id Google.AndroidStudio --accept-source-agreements --accept-package-agreements`
2. Open Android Studio once and install:
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
3. Set one of these:
   - `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`
   - `android/local.properties` with `sdk.dir=C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk`
4. Use JDK 21 for Gradle:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
Set-Location "C:\AMP\Projects\MySoceity\frontend\mobile-app\android"
.\gradlew.bat assembleDebug
```

5. Or open the native project directly:

```powershell
Set-Location "C:\AMP\Projects\MySoceity\frontend\mobile-app"
npx cap open android
```

## iOS status

The iOS Capacitor project has been created and synced successfully in `ios/App`.
A real iOS build cannot be completed on Windows because Xcode is required.
This machine does not have `xcodebuild` available.

## iOS next steps on a macOS machine

1. Copy or clone this same repository to macOS
2. Install Xcode and Cocoa tooling as needed
3. From `frontend/mobile-app`, run:

```bash
npm install
npx ng build --configuration production
npx cap sync ios
npx cap open ios
```

4. Build and run from Xcode on a simulator or device

## Useful paths

- Web app root: `C:\AMP\Projects\MySoceity\frontend\mobile-app`
- Android project: `C:\AMP\Projects\MySoceity\frontend\mobile-app\android`
- iOS project: `C:\AMP\Projects\MySoceity\frontend\mobile-app\ios\App`
