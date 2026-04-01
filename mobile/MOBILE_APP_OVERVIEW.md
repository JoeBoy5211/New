# CaterConnect Premium - Mobile App Overview

A professional, high-end mobile application built for the CaterConnect ecosystem, providing a premium experience for browsing catering services, managing bookings, and discovering culinary inspirations.

## 🚀 Technology Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 52) with React Native
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: Native StyleSheet with a custom Design System
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Data Fetching**: [@tanstack/react-query](https://tanstack.com/query/latest)
- **Network**: [Axios](https://axios-http.com/)
- **State Management**: React Context API (Auth)
- **Persistence**: `expo-secure-store`

## ✨ Core Features

### 1. Premium Authentication Experience
- **Secure Login & Registration**: Clean, modern UI with field validation and password visibility toggling.
- **Session Management**: Persistent authentication using encrypted storage (`expo-secure-store`).
- **Dynamic Routing**: Automatic redirection based on authentication state (guards for `/auth` and `/(tabs)`).

### 2. Discover & Explore (Home)
- **Curated Recommendations**: Featured caterers with high-resolution imagery and elegant cards.
- **Cuisine Specialties**: Horizontal category browsing for quick access to specific culinary styles.
- **Smart Search**: Real-time search and filtering for premium catering services.

### 3. Premium Feed
- **Visual Storytelling**: High-quality media feed for promotions and culinary highlights.
- **Interactive Posts**: Like, comment, and share functionality with a TikTok-style immersive layout.
- **Direct Engagement**: Seamless follow system for favorite catering brands.

### 4. Personal Concierge (Profile)
- **Account Management**: Comprehensive user profile with avatar support.
- **Booking History**: Access to "Event Bookings" and "Saved Caterers".
- **App Preferences**: Toggle between sophisticated Light and Dark modes.

## 📁 Project Structure

```text
mobile/
├── app/                  # File-based routing (Expo Router)
│   ├── (tabs)/           # Main tab-based navigation
│   ├── auth/             # Authentication screens
│   └── _layout.tsx       # Root layout & navigation guards
├── assets/               # Local fonts and static images
├── components/           # Reusable UI components
│   ├── ui/               # Primary design system (Buttons, Inputs, etc.)
│   └── useColorScheme.ts # Robust theming hook
├── constants/            # Design tokens and Color palettes
├── src/
│   ├── api/              # API client & request interceptors
│   └── context/          # Global state (AuthContext)
└── app.json              # Expo configuration
```

## 🛠️ Development & Connectivity

### Dynamic API Integration
The app uses an intelligent API client that automatically detects your development machine's IP address. This enables seamless testing on physical devices via Expo Go without manual configuration:

- **Web**: Connects to `localhost:3000`
- **Emulator**: Connects to `10.0.2.2:3000`
- **Physical Device**: Dynamically extracts the host IP from the Expo Manifest.

### Reliability Features
- **Request Timeouts**: 10-second timeout on all network calls to prevent interface hanging.
- **Development CORS**: Backend compatibility for any local network IP in development mode.

## 🎨 Theme & Design System

The app implements a "Premium Burgundy & Champagne" aesthetic:
- **Burgundy (#682733)**: Primary tint and brand identity.
- **Champagne Gold (#F5EDDA)**: Secondary accent for a luxury feel.
- **Typography**: Uses Serif-based headers (Georgia/Serif) for a sophisticated editorial look.

## 🏁 Getting Started

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npx expo start
   ```

3. **Run on Device**:
   - Open the **Expo Go** app on your iOS/Android device.
   - Scan the QR code from the terminal.
   - Ensure your phone and computer are on the same Wi-Fi network.

---
*Created for the CaterConnect Professional Suite.*
