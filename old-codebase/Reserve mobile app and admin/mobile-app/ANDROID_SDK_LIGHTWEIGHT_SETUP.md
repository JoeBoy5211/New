# Lightweight Android SDK Setup (No Android Studio)

This guide helps you install only the Android SDK command-line tools needed to build APKs, without the heavy Android Studio IDE (~1GB+). Total download: ~100MB.

## Prerequisites

- **Java JDK 17** - Download from [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/#java17)
- **Windows/Linux/macOS** - This guide covers all platforms

## Step 1: Download Android SDK Command-line Tools

### Option A: Direct Download (Recommended)

1. Visit: https://developer.android.com/studio#command-tools
2. Scroll to "Command line tools only"
3. Download for your platform:
   - **Windows**: `commandlinetools-win-11076708_latest.zip` (or latest)
   - **macOS**: `commandlinetools-mac-11076708_latest.zip` (or latest)
   - **Linux**: `commandlinetools-linux-11076708_latest.zip` (or latest)

### Option B: Direct Links (Latest Version)

- **Windows**: https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
- **macOS**: https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip
- **Linux**: https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

**Note**: Version numbers may change. Check the official page for latest links.

## Step 2: Install Android SDK

### Windows

1. **Create SDK directory**:
   ```powershell
   mkdir C:\Android\sdk
   cd C:\Android\sdk
   ```

2. **Extract command-line tools**:
   - Extract the downloaded ZIP file
   - You should see a `cmdline-tools` folder
   - Move contents to: `C:\Android\sdk\cmdline-tools\latest\`
   - Structure should be: `C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat`

3. **Install required packages**:
   ```powershell
   cd C:\Android\sdk\cmdline-tools\latest\bin
   .\sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```
   Accept licenses when prompted (type `y`)

### macOS/Linux

1. **Create SDK directory**:
   ```bash
   mkdir -p ~/Android/sdk
   cd ~/Android/sdk
   ```

2. **Extract command-line tools**:
   ```bash
   unzip ~/Downloads/commandlinetools-*-latest.zip
   mkdir -p cmdline-tools/latest
   mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
   ```

3. **Install required packages**:
   ```bash
   cd ~/Android/sdk/cmdline-tools/latest/bin
   ./sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```
   Accept licenses when prompted (type `y`)

## Step 3: Set Environment Variables

### Windows

1. **Open System Properties**:
   - Press `Win + R`
   - Type `sysdm.cpl` and press Enter
   - Click "Environment Variables"

2. **Add ANDROID_HOME**:
   - Under "System variables", click "New"
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Android\sdk`
   - Click OK

3. **Update PATH**:
   - Select "Path" in System variables
   - Click "Edit"
   - Click "New" and add:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\cmdline-tools\latest\bin`
     - `%ANDROID_HOME%\build-tools\34.0.0`
   - Click OK on all dialogs

4. **Restart Command Prompt/PowerShell** for changes to take effect

### macOS/Linux

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

## Step 4: Verify Installation

Open a new terminal/command prompt and run:

```bash
adb version
```

You should see something like:
```
Android Debug Bridge version 1.0.41
```

Also verify:
```bash
sdkmanager --version
```

## Step 5: Install Additional Packages (If Needed)

If you encounter build errors, you may need additional packages:

```bash
# Windows
cd C:\Android\sdk\cmdline-tools\latest\bin
.\sdkmanager.bat "platforms;android-33" "platforms;android-32" "build-tools;33.0.2"

# macOS/Linux
cd ~/Android/sdk/cmdline-tools/latest/bin
./sdkmanager "platforms;android-33" "platforms;android-32" "build-tools;33.0.2"
```

## Troubleshooting

### "sdkmanager: command not found"
- Verify PATH includes `cmdline-tools/latest/bin`
- Restart terminal after setting environment variables
- On Windows, use full path: `C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat`

### "adb: command not found"
- Verify PATH includes `platform-tools`
- Check `ANDROID_HOME` is set correctly
- Restart terminal

### "Java not found"
- Install Java JDK 17
- Set `JAVA_HOME` environment variable:
  - Windows: `C:\Program Files\Java\jdk-17`
  - macOS/Linux: `/usr/lib/jvm/java-17-openjdk` (or your JDK path)

### License Acceptance Issues
```bash
# Accept all licenses
sdkmanager --licenses
```
Type `y` for each license prompt.

## What's Installed

- **platform-tools** (~10MB) - Contains `adb`, `fastboot`
- **platforms;android-34** (~50MB) - Android API level 34
- **build-tools;34.0.0** (~40MB) - Build tools for compiling

**Total**: ~100MB vs ~1GB+ for full Android Studio

## Next Steps

After completing this setup:
1. Verify Java JDK 17 is installed: `java -version`
2. Follow `BUILD_APK_CLI.md` to build your first APK
3. Create a keystore for release builds (see keystore guide)

## Alternative: Use Docker (Advanced)

If you prefer containerized builds:

```bash
docker run --rm -v $(pwd):/app -w /app android-build-image
```

This requires creating a Docker image with Android SDK, but keeps your system clean.

---

**Need Help?** Check Capacitor documentation or Android SDK command-line tools docs.
