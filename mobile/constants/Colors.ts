// ── CaterConnect Design Tokens ─────────────────────────────────────────────
// Matches web frontend palette exactly
// Web CSS: hsl(345, 45%, 28%) = #682733 (primary/burgundy)
// Web CSS: hsl(40, 65%, 55%)  = #CC8533 (gold accent)
// Web CSS: hsl(30, 25%, 98%)  = #FAF9F6 (cream background)

export const BRAND = {
  burgundy: '#682733',       // Primary — matches web hsl(var(--primary))
  burgundyLight: '#8B3A48',  // Hover / gradient end
  burgundyDark: '#4D1D27',   // Deeper, for gradient starts
  champagne: '#F5EDDA',      // Secondary accent — hsl(40, 45%, 88%)
  gold: '#CC8533',           // Accent gold — hsl(40, 65%, 55%)
  goldDark: '#A36826',       // Darker gold for press states
  goldLight: '#E6B873',      // Lighter gold for dark mode
  cream: '#FDFCFB',          // Background — hsl(30, 25%, 98%)
  creamDark: '#F5F2F0',      // Muted background
  charcoal: '#2E2A27',       // Dark text — hsl(20, 15%, 20%)
  charcoalLight: '#4A4440',  // Secondary dark text
  white: '#FFFFFF',
  burgundyVibrant: '#D64E66', // Web dark mode primary HSL(345, 50%, 55%)
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
};

export const LIGHT = {
  background: '#FDFCFB',       // Cream — matches web background
  surface: '#F5F2F0',          // Slightly deeper cream for nested surfaces
  card: '#FFFFFF',
  text: '#2E2A27',             // Charcoal
  textSecondary: '#6B6560',    // Muted text
  textMuted: '#9CA3A0',        // Very muted
  tint: '#682733',             // Burgundy primary
  tintLight: '#F5EDDA',        // Champagne — matches web secondary
  tintXLight: '#FDF5EC',       // Very light champagne for hover states
  accent: '#CC8533',           // Gold
  accentLight: '#F5EDDA',      // Light gold background
  border: '#E5E0D8',           // Subtle border
  borderStrong: '#C9C2B8',     // Stronger border
  inputBg: '#F5F2EE',
  shadow: 'rgba(46, 42, 39, 0.08)',
  shadowMd: 'rgba(46, 42, 39, 0.12)',
  overlay: 'rgba(46, 42, 39, 0.5)',
  // Tab bar
  tabIconDefault: '#9CA3A0',
  tabIconSelected: '#682733',
  tabBar: '#FFFFFF',
  // Status colors
  success: '#16A34A',
  successBg: '#DCFCE7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#D97706',
  warningBg: '#FEF9C3',
};

export const DARK = {
  background: '#1A1918',        // Matches web hsl(20, 15%, 10%)
  surface: '#22201E',           // Slightly lighter surface
  card: '#282624',              // Card surface (was #222019)
  text: '#FAF9F6',              // Cream text
  textSecondary: '#B5AFA9',     // Muted text
  textMuted: '#706A65',         // Very muted
  tint: '#D64E66',             // Light burgundy for dark mode contrast
  tintLight: '#3D3430',         // Dark tint background
  tintXLight: '#2E2A27',        // Very dark tint background
  accent: '#E6B873',            // Lighter gold for dark mode
  accentLight: '#3A3020',       // Dark gold background
  border: '#302C2A',            // Subtle border
  borderStrong: '#4A4440',      // Stronger border
  inputBg: '#2A2825',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowMd: 'rgba(0, 0, 0, 0.6)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  // Tab bar
  tabIconDefault: '#706A65',
  tabIconSelected: '#F5EDDA',
  tabBar: '#22201E',
  // Status colors
  success: '#4ADE80',
  successBg: '#14532D',
  error: '#F87171',
  errorBg: '#7F1D1D',
  warning: '#FCD34D',
  warningBg: '#78350F',
};

// ── Spacing System ──────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Border Radius System ────────────────────────────────────────────────────
export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 100,
};

// ── Typography Scale ────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  // Display / headings — matches web Playfair Display
  displayFont: 'Georgia',   // iOS fallback for Playfair Display
  bodyFont: undefined,      // System default (matches Inter on iOS/Android)

  // Size scale
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 32,
};

// ── Shadow Presets ──────────────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2E2A27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Legacy export for backwards compat with existing useColorScheme() pattern
const Colors = {
  light: {
    text: LIGHT.text,
    background: LIGHT.background,
    tint: LIGHT.tint,
    tabIconDefault: LIGHT.tabIconDefault,
    tabIconSelected: LIGHT.tabIconSelected,
    secondary: LIGHT.tintLight,
    accent: LIGHT.accent,
    card: LIGHT.card,
    border: LIGHT.border,
    muted: LIGHT.inputBg,
    surface: LIGHT.surface,
    textSecondary: LIGHT.textSecondary,
    textMuted: LIGHT.textMuted,
    shadow: LIGHT.shadow,
  },
  dark: {
    text: DARK.text,
    background: DARK.background,
    tint: DARK.tint,
    tabIconDefault: DARK.tabIconDefault,
    tabIconSelected: DARK.tabIconSelected,
    secondary: DARK.tintLight,
    accent: DARK.accent,
    card: DARK.card,
    border: DARK.border,
    muted: DARK.inputBg,
    surface: DARK.surface,
    textSecondary: DARK.textSecondary,
    textMuted: DARK.textMuted,
    shadow: DARK.shadow,
  },
};

export default Colors;
