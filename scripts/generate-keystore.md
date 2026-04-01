# Keystore Generation Guide

This guide explains how to create a signing keystore for Android release builds.

## Why You Need a Keystore

Android requires all apps to be signed with a cryptographic key before they can be installed. For release builds (Google Play Store), you need a keystore file that will be used to sign your APK/AAB.

**Important**: Once you publish an app to Google Play with a keystore, you MUST use the same keystore for all future updates. If you lose it, you cannot update your app!

## Prerequisites

- Java JDK 17 installed (`java -version`)
- `keytool` command available (comes with JDK)

## Creating a Keystore

### Method 1: Interactive (Recommended)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore caterconnect-release.keystore -alias caterconnect -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
1. **Keystore password**: Create a strong password (save it securely!)
2. **Re-enter password**: Confirm the password
3. **First and last name**: Your name or organization name
4. **Organizational unit**: Optional (e.g., "Development")
5. **Organization**: Your company name (e.g., "CaterConnect")
6. **City**: Your city
7. **State/Province**: Your state or province
8. **Country code**: Two-letter code (e.g., US, ET, IN, GB)
9. **Confirm information**: Type `yes`
10. **Key password**: Press Enter to use same as keystore password (recommended)

### Method 2: Non-Interactive (For Scripts)

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore caterconnect-release.keystore \
  -alias caterconnect \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "your-keystore-password" \
  -keypass "your-key-password" \
  -dname "CN=CaterConnect, OU=Development, O=CaterConnect, L=City, ST=State, C=US"
```

Replace:
- `your-keystore-password` - Your keystore password
- `your-key-password` - Your key password (can be same)
- `CN`, `OU`, `O`, `L`, `ST`, `C` - Your organization details

## Keystore Information

- **File**: `caterconnect-release.keystore`
- **Alias**: `caterconnect` (identifier within the keystore)
- **Validity**: 10000 days (~27 years) - recommended for long-term apps
- **Algorithm**: RSA 2048-bit - secure and widely supported

## Storing Your Keystore Securely

### 1. Create Secure Directory

**Windows:**
```powershell
mkdir C:\Users\YourName\.android\keystores
move caterconnect-release.keystore C:\Users\YourName\.android\keystores\
```

**macOS/Linux:**
```bash
mkdir -p ~/.android/keystores
mv caterconnect-release.keystore ~/.android/keystores/
```

### 2. Set Permissions (macOS/Linux)

```bash
chmod 600 ~/.android/keystores/caterconnect-release.keystore
```

### 3. Add to .gitignore

Ensure `.gitignore` includes:
```
*.keystore
*.jks
.android/keystores/
```

### 4. Backup Your Keystore

**CRITICAL**: Back up your keystore file and passwords:

1. **Copy keystore to secure location**:
   - External drive
   - Cloud storage (encrypted)
   - Password manager (for passwords)

2. **Store passwords securely**:
   - Use a password manager
   - Never store in code or config files
   - Share with trusted team members if needed

3. **Document keystore location**:
   - Create a secure note with:
     - Keystore file path
     - Keystore password
     - Key alias
     - Key password
     - Creation date

## Using Environment Variables

For security, use environment variables instead of hardcoding passwords:

### Windows (PowerShell)

```powershell
$env:ANDROID_KEYSTORE_PATH="C:\Users\YourName\.android\keystores\caterconnect-release.keystore"
$env:ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
$env:ANDROID_KEYSTORE_ALIAS="caterconnect"
$env:ANDROID_KEYSTORE_ALIAS_PASSWORD="your-key-password"
```

### Windows (Command Prompt)

```cmd
set ANDROID_KEYSTORE_PATH=C:\Users\YourName\.android\keystores\caterconnect-release.keystore
set ANDROID_KEYSTORE_PASSWORD=your-keystore-password
set ANDROID_KEYSTORE_ALIAS=caterconnect
set ANDROID_KEYSTORE_ALIAS_PASSWORD=your-key-password
```

### macOS/Linux

```bash
export ANDROID_KEYSTORE_PATH="$HOME/.android/keystores/caterconnect-release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export ANDROID_KEYSTORE_ALIAS="caterconnect"
export ANDROID_KEYSTORE_ALIAS_PASSWORD="your-key-password"
```

### Make Persistent (macOS/Linux)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Android Keystore (for release builds)
export ANDROID_KEYSTORE_PATH="$HOME/.android/keystores/caterconnect-release.keystore"
# Don't store password in shell config - set it manually when needed
```

## Verifying Your Keystore

Check keystore contents:

```bash
keytool -list -v -keystore caterconnect-release.keystore
```

Enter password when prompted. You should see:
- Keystore type: PKCS12
- Your alias: caterconnect
- Certificate details

## Troubleshooting

### "keytool: command not found"
- Verify Java JDK is installed: `java -version`
- Add JDK `bin` directory to PATH
- On Windows: Usually `C:\Program Files\Java\jdk-17\bin`
- On macOS/Linux: Usually `/usr/lib/jvm/java-17-openjdk/bin`

### "Keystore was tampered with, or password was incorrect"
- Verify password is correct
- Check for typos
- Ensure you're using the correct keystore file

### "Alias does not exist"
- List keystore aliases: `keytool -list -keystore caterconnect-release.keystore`
- Use the correct alias name

## Security Best Practices

1. ✅ **Use strong passwords** - At least 16 characters, mix of letters, numbers, symbols
2. ✅ **Never commit keystore to Git** - Already in `.gitignore`
3. ✅ **Backup securely** - Multiple secure locations
4. ✅ **Use environment variables** - Don't hardcode passwords
5. ✅ **Limit access** - Only share with trusted team members
6. ✅ **Document securely** - Store passwords in password manager
7. ✅ **Test before publishing** - Verify signing works with test build

## Next Steps

After creating your keystore:

1. ✅ Store it securely (see above)
2. ✅ Set environment variables
3. ✅ Test signing with a release build
4. ✅ Build APK/AAB for Google Play
5. ✅ Upload to Google Play Console

See `BUILD_APK_CLI.md` for building signed APKs.

---

**Remember**: Keep your keystore safe! You'll need it for every app update.
