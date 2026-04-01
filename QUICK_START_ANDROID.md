# Quick Start: Build Android APK for Google Play

This is a quick reference guide. For detailed instructions, see `ANDROID_BUILD_GUIDE.md`.

## 🚀 Quick Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Android Platform (First Time Only)
```bash
npm run cap:add:android
```

### 3. Build Web App
```bash
npm run build
```

### 4. Sync to Android
```bash
npm run cap:sync
```

### 5. Open in Android Studio
```bash
npm run cap:android
```

### 6. Build APK in Android Studio
- Wait for Gradle sync to complete
- **Build** → **Generate Signed Bundle / APK**
- Select **APK** (or **Android App Bundle** for Play Store)
- Create signing key (save securely!)
- Build release APK
- APK location: `android/app/build/outputs/apk/release/app-release.apk`

## 📋 Prerequisites Checklist

- [ ] Node.js installed
- [ ] Java JDK 17 installed
- [ ] Android Studio installed
- [ ] Android SDK configured
- [ ] Google Play Developer Account ($25)

## 🔄 After Making Code Changes

```bash
npm run build          # Build web app
npm run cap:sync       # Sync to Android
npm run cap:android    # Open Android Studio
# Then build APK in Android Studio
```

## 📱 Testing APK

### On Physical Device:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Or:
- Transfer APK to phone
- Enable "Install from Unknown Sources"
- Tap APK to install

## 🎯 Publishing to Google Play

1. Create account at [Google Play Console](https://play.google.com/console) ($25)
2. Create new app
3. Upload **AAB** file (preferred over APK)
4. Complete store listing
5. Submit for review

---

**Need more details?** See `ANDROID_BUILD_GUIDE.md` for complete instructions.
