# Android APK Build Guide for Google Play

This guide will help you build an APK file from your React app using Capacitor, which you can then publish to Google Play Store.

## 🚀 Choose Your Build Method

### Option 1: Lightweight CLI Build (Recommended - No Android Studio)

**Perfect if:** Your PC can't handle Android Studio (~1GB+) or you prefer command-line tools.

- ✅ Only ~100MB Android SDK download (vs ~1GB+ for Android Studio)
- ✅ Faster builds, no IDE overhead
- ✅ Same APK/AAB output as Android Studio
- ✅ Can be automated for CI/CD

**Quick Start:**
1. Follow: [`ANDROID_SDK_LIGHTWEIGHT_SETUP.md`](ANDROID_SDK_LIGHTWEIGHT_SETUP.md) - Install minimal Android SDK
2. Follow: [`BUILD_APK_CLI.md`](BUILD_APK_CLI.md) - Build APK via command line
3. Create keystore: [`scripts/generate-keystore.md`](scripts/generate-keystore.md) - For release builds

**Build commands:**
```bash
npm run cap:build:android:debug    # Debug APK
npm run cap:build:android:release  # Release APK
npm run cap:build:android:aab     # Android App Bundle
```

### Option 2: Android Studio (Full IDE)

**Perfect if:** You want a visual IDE, debugging tools, and emulator.

- ⚠️ Requires ~1GB+ download
- ✅ Visual interface for Android development
- ✅ Built-in emulator for testing
- ✅ Advanced debugging tools

**Continue below** for Android Studio setup instructions.

---

## 📋 Prerequisites

### For CLI Build (Option 1):
1. **Node.js** (v18 or higher) - Already installed ✅
2. **Java JDK 17** - Download from [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/#java17)
3. **Android SDK Command-line Tools** - See [`ANDROID_SDK_LIGHTWEIGHT_SETUP.md`](ANDROID_SDK_LIGHTWEIGHT_SETUP.md)
4. **Google Play Developer Account** - $25 one-time fee at [Google Play Console](https://play.google.com/console)

### For Android Studio (Option 2):
1. **Node.js** (v18 or higher) - Already installed ✅
2. **Java JDK 17** - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or [OpenJDK](https://adoptium.net/)
3. **Android Studio** - Download from [Android Studio](https://developer.android.com/studio)
4. **Google Play Developer Account** - $25 one-time fee at [Google Play Console](https://play.google.com/console)

## 🚀 Step-by-Step Setup (Android Studio Method)

> **Note**: If you're using the CLI method, skip to the "Building APK Files" section below or follow [`BUILD_APK_CLI.md`](BUILD_APK_CLI.md) instead.

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- Capacitor Core & CLI
- Capacitor Android platform
- PWA plugin (already configured)

### Step 2: Initialize Capacitor (First Time Only)

```bash
npx cap init
```

When prompted:
- **App name**: `CaterConnect`
- **App ID**: `com.caterconnect.app` (or your custom domain)
- **Web dir**: `dist`

**Note**: The `capacitor.config.ts` file is already created, so you can skip this if the file exists.

### Step 3: Add Android Platform

```bash
npm run cap:add:android
```

Or manually:
```bash
npx cap add android
```

This creates the `android/` folder with native Android project files.

### Step 4: Install Android Studio

1. Download [Android Studio](https://developer.android.com/studio)
2. Install Android Studio
3. Open Android Studio → **More Actions** → **SDK Manager**
4. Install:
   - **Android SDK Platform 34** (or latest)
   - **Android SDK Build-Tools**
   - **Android SDK Command-line Tools**
   - **Android Emulator** (optional, for testing)

### Step 5: Set Environment Variables

Add to your system environment variables:

**Windows:**
```bash
# Add to System Environment Variables
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

**macOS/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

### Step 6: Build Your Web App

```bash
npm run build
```

This creates the `dist/` folder with your production build.

### Step 7: Sync Capacitor

```bash
npm run cap:sync
```

This copies your web assets to the Android project.

### Step 8: Open in Android Studio

```bash
npm run cap:android
```

Or manually:
```bash
npx cap open android
```

Android Studio will open with your project.

---

## 📦 Building APK Files

### Using Command Line (Lightweight - No Android Studio)

If you've set up the lightweight Android SDK (see [`ANDROID_SDK_LIGHTWEIGHT_SETUP.md`](ANDROID_SDK_LIGHTWEIGHT_SETUP.md)):

**Debug APK:**
```bash
npm run cap:build:android:debug
```

**Release APK:**
```bash
# Set environment variables first (see BUILD_APK_CLI.md)
npm run cap:build:android:release
```

**Android App Bundle (AAB):**
```bash
npm run cap:build:android:aab
```

See [`BUILD_APK_CLI.md`](BUILD_APK_CLI.md) for detailed CLI build instructions.

### Using Android Studio (Full IDE)

### Option A: Build APK in Android Studio (Recommended)

1. **Open Android Studio** (via `npm run cap:android`)

2. **Wait for Gradle Sync** (may take a few minutes first time)

3. **Create Signing Key** (for release builds):
   - Go to **Build** → **Generate Signed Bundle / APK**
   - Select **APK**
   - Click **Create new...** to create a keystore
   - Fill in:
     - **Key store path**: Choose location (save securely!)
     - **Password**: Create strong password
     - **Key alias**: `caterconnect`
     - **Validity**: 25 years (recommended)
   - **Save these credentials securely!** You'll need them for updates.

4. **Build Debug APK** (for testing):
   - Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete
   - APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

5. **Build Release APK** (for Google Play):
   - Click **Build** → **Generate Signed Bundle / APK**
   - Select **APK**
   - Select your keystore
   - Enter passwords
   - Select **release** build variant
   - Click **Finish**
   - APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Option B: Build APK via Command Line

#### Debug APK:
```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

**Note**: For release builds, you need to configure signing first (see below).

## 🔐 Configure Release Signing

### Method 1: Using Android Studio (Easiest)

1. Open Android Studio
2. Go to **File** → **Project Structure** → **Modules** → **app** → **Signing**
3. Add signing config:
   - **Store File**: Path to your keystore
   - **Store Password**: Your keystore password
   - **Key Alias**: `caterconnect`
   - **Key Password**: Your key password

### Method 2: Manual Configuration

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('path/to/your/keystore.jks')
            storePassword 'your-store-password'
            keyAlias 'caterconnect'
            keyPassword 'your-key-password'
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

**⚠️ Security Warning**: Never commit keystore files or passwords to Git!

## 📱 Testing Your APK

### On Physical Device:

1. **Enable Developer Options**:
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
   - Go back → **Developer Options**
   - Enable **USB Debugging**

2. **Install APK**:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

   Or transfer APK to phone and install manually.

### On Emulator:

1. Open Android Studio
2. Click **Device Manager**
3. Create/Start an emulator
4. Drag APK onto emulator or use `adb install`

## 🚀 Publishing to Google Play

### Step 1: Create Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete account setup

### Step 2: Create App Listing

1. Click **Create app**
2. Fill in:
   - **App name**: CaterConnect
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Complete all required

### Step 3: Prepare App Bundle (Recommended)

Google Play prefers **AAB** (Android App Bundle) over APK:

1. In Android Studio: **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Use your release signing config
4. Build the bundle
5. Location: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Upload to Google Play

1. Go to **Production** → **Create new release**
2. Upload your **AAB** file (or APK)
3. Add **Release notes**
4. Click **Review release**

### Step 5: Complete Store Listing

Fill in:
- **App icon** (512x512 PNG)
- **Feature graphic** (1024x500 PNG)
- **Screenshots** (at least 2, various sizes)
- **Description**
- **Privacy Policy URL** (required)
- **Content rating**

### Step 6: Submit for Review

1. Complete all required sections
2. Click **Submit for review**
3. Wait 1-3 days for approval

## 🔄 Updating Your App

After making changes:

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Update version** in `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           versionCode 2  // Increment by 1
           versionName "1.0.1"  // Match package.json
       }
   }
   ```

3. **Build and sync**:
   ```bash
   npm run build
   npm run cap:sync
   ```

4. **Build new APK/AAB** and upload to Play Console

## 📝 Important Files

- `capacitor.config.ts` - Capacitor configuration
- `android/app/build.gradle` - Android build configuration
- `android/app/src/main/AndroidManifest.xml` - Android app manifest
- `android/app/src/main/res/` - Android resources (icons, splash screens)

## 🛠️ Troubleshooting

### "Command not found: adb"
- Install Android SDK Platform Tools
- Add to PATH (see Step 5)

### "Gradle sync failed"
- Check internet connection
- Try: **File** → **Invalidate Caches / Restart**
- Check Android Studio SDK settings

### "Build failed"
- Check Java version: `java -version` (should be 17)
- Clean build: `cd android && ./gradlew clean`
- Rebuild: `npm run cap:sync`

### "App crashes on launch"
- Check Android Studio Logcat for errors
- Verify `webDir` in `capacitor.config.ts` points to `dist`
- Ensure `npm run build` completed successfully

### "APK too large"
- Enable ProGuard/R8 minification in `build.gradle`
- Use Android App Bundle (AAB) instead of APK
- Optimize images and assets

## 📚 Additional Resources

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android Build Guide](https://developer.android.com/studio/build)

## ✅ Quick Checklist

- [ ] Install Android Studio
- [ ] Set ANDROID_HOME environment variable
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run cap:add:android`
- [ ] Run `npm run cap:sync`
- [ ] Open Android Studio
- [ ] Create signing key
- [ ] Build release APK/AAB
- [ ] Test on device
- [ ] Create Google Play account
- [ ] Upload to Play Console
- [ ] Complete store listing
- [ ] Submit for review

---

**Need Help?** Check Capacitor documentation or Android Studio's built-in help.
