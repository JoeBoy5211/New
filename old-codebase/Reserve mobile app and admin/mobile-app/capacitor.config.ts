import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caterconnect.app',
  appName: 'CaterConnect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment for local development testing
    // url: 'http://localhost:8080',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8B4513',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  android: {
    buildOptions: {
      // Keystore configuration for release builds
      // Can be set via environment variables for security:
      // ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, etc.
      keystorePath: process.env.ANDROID_KEYSTORE_PATH || undefined,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD || undefined,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS || 'caterconnect',
      keystoreAliasPassword: process.env.ANDROID_KEYSTORE_ALIAS_PASSWORD || process.env.ANDROID_KEYSTORE_PASSWORD || undefined
    }
  }
};

export default config;
