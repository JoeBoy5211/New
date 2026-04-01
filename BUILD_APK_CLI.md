# Building Android APK via Command Line (No Android Studio)

This guide shows you how to build Android APK files using only command-line tools, without Android Studio.

## Prerequisites

Before starting, ensure you have:

- ✅ **Java JDK 17** installed and **JAVA_HOME** set (see below)
- ✅ **Android SDK Command-line Tools** installed (see `ANDROID_SDK_LIGHTWEIGHT_SETUP.md`)
- ✅ **Node.js** installed (`node -version`)
- ✅ **Capacitor dependencies** installed (`npm install`)

## Setting Up Java (Required – Fixes "JAVA_HOME is not set")

Gradle (used to build the APK) needs **Java JDK 17** and the **JAVA_HOME** environment variable. If you see `JAVA_HOME is not set` or `no 'java' command could be found`, follow these steps.

### 1. Install Java JDK 17

- **Windows**: Download from [Adoptium (Eclipse Temurin)](https://adoptium.net/temurin/releases/?version=17&os=windows) – choose **JDK**, **x64**, **.msi** installer.
- **macOS**: `brew install openjdk@17` or download from [Adoptium](https://adoptium.net/).
- **Linux**: `sudo apt install openjdk-17-jdk` (Ubuntu/Debian) or equivalent.

After installation, note the JDK folder (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot` on Windows).

### 2. Set JAVA_HOME and PATH

**Windows (PowerShell – current session only):**
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```
Replace the path with your actual JDK 17 install path.

**Windows (permanent – System Environment Variables):**
1. Press `Win + R`, type `sysdm.cpl`, press Enter.
2. **Advanced** → **Environment Variables**.
3. Under **System variables**, click **New**:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot` (your JDK path).
4. Edit **Path**, add: `%JAVA_HOME%\bin`.
5. OK all dialogs. **Close and reopen** your terminal/IDE.

**macOS / Linux (add to `~/.bashrc` or `~/.zshrc`):**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "/usr/lib/jvm/java-17-openjdk")
export PATH="$JAVA_HOME/bin:$PATH"
```
Then run: `source ~/.bashrc` (or `source ~/.zshrc`).

### 3. Verify

In a **new** terminal:

```bash
java -version
echo %JAVA_HOME%
```

- `java -version` should show version 17.
- `echo %JAVA_HOME%` (Windows) or `echo $JAVA_HOME` (macOS/Linux) should print your JDK path.

If this works, run the build again:

```bash
npm run cap:build:android:debug
```

## Quick Start

### 1. Build Your Web App

```bash
npm run build
```

This creates the `dist/` folder with your production build.

### 2. Add Android Platform (First Time Only)

```bash
npm run cap:add:android
```

This creates the `android/` folder with native Android project files.

### 3. Sync Capacitor

```bash
npm run cap:sync
```

This copies your web assets to the Android project and ensures everything is up to date.

### 4. Build APK

#### Debug APK (For Testing)

```bash
npm run cap:build:android:debug
```

Or manually:
```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK (For Google Play)

**First, create a keystore** (see keystore guide below), then:

```bash
npm run cap:build:android:release
```

Or manually with signing:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

#### Android App Bundle (AAB - Recommended for Play Store)

```bash
npm run cap:build:android:aab
```

Or manually:
```bash
cd android
./gradlew bundleRelease
```

AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

## Creating a Keystore for Release Builds

### Using keytool (Comes with Java JDK)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore caterconnect-release.keystore -alias caterconnect -keyalg RSA -keysize 2048 -validity 10000
```

**Important Information to Provide:**
- **Keystore password**: Create a strong password (save securely!)
- **Key password**: Can be same as keystore password
- **Name**: Your name or organization
- **Organizational Unit**: Optional
- **Organization**: Your company name
- **City**: Your city
- **State**: Your state/province
- **Country Code**: Two-letter code (e.g., US, ET, IN)

**Security Notes:**
- ⚠️ **Never commit keystore to Git** - Add to `.gitignore`
- ⚠️ **Backup keystore securely** - You'll need it for app updates
- ⚠️ **Store passwords securely** - Use a password manager

### Store Keystore Securely

1. **Move keystore to secure location**:
   ```bash
   mkdir -p ~/.android/keystores
   mv caterconnect-release.keystore ~/.android/keystores/
   ```

2. **Add to .gitignore**:
   ```
   *.keystore
   *.jks
   .android/keystores/
   ```

## Configuring Signing for Release Builds

### Method 1: Using Capacitor Config (Recommended)

Update `capacitor.config.ts`:

```typescript
android: {
  buildOptions: {
    keystorePath: process.env.ANDROID_KEYSTORE_PATH || 'path/to/your/keystore.keystore',
    keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD || 'your-keystore-password',
    keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS || 'caterconnect',
    keystoreAliasPassword: process.env.ANDROID_KEYSTORE_ALIAS_PASSWORD || 'your-key-password'
  }
}
```

Then use environment variables (more secure):

**Windows:**
```powershell
$env:ANDROID_KEYSTORE_PATH="C:\Users\YourName\.android\keystores\caterconnect-release.keystore"
$env:ANDROID_KEYSTORE_PASSWORD="your-password"
$env:ANDROID_KEYSTORE_ALIAS="caterconnect"
$env:ANDROID_KEYSTORE_ALIAS_PASSWORD="your-password"
```

**macOS/Linux:**
```bash
export ANDROID_KEYSTORE_PATH="$HOME/.android/keystores/caterconnect-release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-password"
export ANDROID_KEYSTORE_ALIAS="caterconnect"
export ANDROID_KEYSTORE_ALIAS_PASSWORD="your-password"
```

### Method 2: Manual Gradle Configuration

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "path/to/keystore.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: "your-password"
            keyAlias System.getenv("ANDROID_KEYSTORE_ALIAS") ?: "caterconnect"
            keyPassword System.getenv("ANDROID_KEYSTORE_ALIAS_PASSWORD") ?: "your-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

## Complete Build Workflow

### For Testing (Debug Build)

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npm run cap:sync

# 3. Build debug APK
npm run cap:build:android:debug

# 4. Install on device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### For Production (Release Build)

```bash
# 1. Set environment variables (see above)
export ANDROID_KEYSTORE_PATH="..."
export ANDROID_KEYSTORE_PASSWORD="..."
export ANDROID_KEYSTORE_ALIAS="caterconnect"
export ANDROID_KEYSTORE_ALIAS_PASSWORD="..."

# 2. Build web app
npm run build

# 3. Sync to Android
npm run cap:sync

# 4. Build release APK or AAB
npm run cap:build:android:release  # For APK
# OR
npm run cap:build:android:aab      # For AAB (recommended)

# 5. Find your build
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

## Testing Your APK

### On Physical Device via USB

1. **Enable USB Debugging**:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect device and install**:
   ```bash
   adb devices                    # Verify device is connected
   adb install app-debug.apk     # Install debug APK
   ```

### Transfer APK to Device

1. Build APK
2. Transfer `app-debug.apk` to your phone (email, cloud storage, etc.)
3. On phone: Settings → Security → Enable "Install from Unknown Sources"
4. Tap APK file to install

## Updating Your App

When you make changes:

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Update version** in `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           versionCode 2        // Increment by 1
           versionName "1.0.1"  // Match package.json
       }
   }
   ```

3. **Rebuild**:
   ```bash
   npm run build
   npm run cap:sync
   npm run cap:build:android:release
   ```

## Troubleshooting

### "Gradle sync failed"
- Check internet connection (Gradle downloads dependencies)
- Verify Android SDK is installed: `echo $ANDROID_HOME` (or `echo %ANDROID_HOME%` on Windows)
- Try: `cd android && ./gradlew clean`

### "SDK location not found"
- Set `ANDROID_HOME` environment variable
- Create `android/local.properties`:
  ```
  sdk.dir=C:\\Android\\sdk
  ```
  (Use forward slashes on macOS/Linux: `sdk.dir=/Users/YourName/Android/sdk`)

### "JAVA_HOME is not set" or "no 'java' command could be found"
- **Fix**: Follow the **Setting Up Java** section at the top of this guide.
- Install JDK 17, set `JAVA_HOME` to the JDK folder, and add `%JAVA_HOME%\bin` (or `$JAVA_HOME/bin`) to PATH.
- Close and reopen your terminal (and Cursor/IDE) after changing environment variables.

### "Java version mismatch"
- Verify Java 17: `java -version`
- Set `JAVA_HOME` environment variable to your JDK 17 install path

### "Build failed: signing config"
- Verify keystore path is correct
- Check keystore passwords are correct
- Ensure keystore file exists

### "Command not found: adb"
- Verify `platform-tools` is in PATH
- Check `ANDROID_HOME` is set correctly
- Restart terminal after setting environment variables

### Build Takes Too Long
- First build downloads Gradle and dependencies (~5-10 minutes)
- Subsequent builds are faster (~1-2 minutes)
- Use `--offline` flag if you have cached dependencies: `./gradlew assembleRelease --offline`

## Advanced: Using Capacitor Build Command

Capacitor 6+ supports direct build commands:

```bash
# Build with options
npx cap build android \
  --androidreleasetype=APK \
  --keystorepath=path/to/keystore.keystore \
  --keystorepass=password \
  --keystorealias=caterconnect \
  --keystorealiaspass=password
```

## Next Steps

- ✅ Test your APK on a device
- ✅ Upload AAB to Google Play Console
- ✅ Complete store listing
- ✅ Submit for review

See `ANDROID_BUILD_GUIDE.md` for Google Play submission details.

---

**Need Help?** Check Capacitor CLI docs: https://capacitorjs.com/docs/cli/commands/build
