#!/bin/zsh
# ============================================================
# Android SDK Setup for macOS - NammaSociety Mobile Build
# ============================================================

echo "🔧 Installing Android SDK tools for macOS..."
echo "=================================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Java (required for Android SDK)
echo ""
echo "1️⃣  Installing OpenJDK 21..."
brew install openjdk@21
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# Export JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
echo "export JAVA_HOME=$(/usr/libexec/java_home -v 21)" >> ~/.zshrc

# Install Android SDK
echo ""
echo "2️⃣  Installing Android SDK Command-line Tools..."
brew install android-commandlinetools

# Create Android SDK directory
ANDROID_HOME=$HOME/Library/Android/sdk
mkdir -p $ANDROID_HOME

# Add to shell profile
echo "" >> ~/.zshrc
echo "# Android SDK Configuration" >> ~/.zshrc
echo "export ANDROID_HOME=$ANDROID_HOME" >> ~/.zshrc
echo "export PATH=\$PATH:$ANDROID_HOME/cmdline-tools/latest/bin" >> ~/.zshrc
echo "export PATH=\$PATH:$ANDROID_HOME/platform-tools" >> ~/.zshrc
echo "export PATH=\$PATH:$ANDROID_HOME/emulator" >> ~/.zshrc

# Reload shell profile
source ~/.zshrc

# Accept Android SDK licenses
echo ""
echo "3️⃣  Accepting Android SDK Licenses..."
yes | sdkmanager --licenses

# Install required SDK components
echo ""
echo "4️⃣  Installing Android SDK Platforms and Tools..."
sdkmanager "platforms;android-35"
sdkmanager "build-tools;35.0.0"
sdkmanager "system-images;android-35;google_apis;arm64-v8a"
sdkmanager "emulator"
sdkmanager "platform-tools"

# Create Android Virtual Device
echo ""
echo "5️⃣  Creating Android Virtual Device (AVD)..."
echo "no" | avdmanager create avd \
  -n "NammaSociety_Emulator" \
  -k "system-images;android-35;google_apis;arm64-v8a" \
  -d "Nexus 6P" \
  --force

echo ""
echo "✅ Android SDK setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart terminal or run: source ~/.zshrc"
echo "2. Verify setup: adb --version && emulator -list-avds"
echo "3. Start emulator: emulator -avd NammaSociety_Emulator"
echo "4. Deploy mobile app to emulator with: cd frontend/mobile-app && npx cap run android"
echo ""
