// Caternet mobile design tokens — 2026 marketplace redesign
// Source of truth: mobile/ui-designs/catering_app_mobile_ui_implementation_guide.md
export const colors = {
  background: "#FAF8F3",
  surface: "#FFFFFF",
  surfaceAlt: "#F6FBF7",
  primary: "#16A34A",
  primaryDark: "#087443",
  primarySoft: "#EFFAF2",
  // Guide aliases
  lightGreen: "#DCFCE7",
  softGreen: "#EFFAF2",
  text: "#172126",
  textMuted: "#64727A",
  textFaint: "#8A959B",
  border: "#E5E2D9",
  danger: "#DC3B2F",
  dangerBg: "#FEE2E2",
  success: "#16A34A",
  successBg: "#DCFCE7",
  successDark: "#16803C",
  warning: "#D97706",
  warningBg: "#FEF3C7",
  info: "#2563EB",
  infoBg: "#DBEAFE",
  star: "#16A34A",
  starGold: "#E8B923",
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.45)",
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };

export const font = {
  display: 26,
  hero: 34,
  title: 22,
  cardTitle: 18,
  subtitle: 16,
  body: 15,
  small: 13,
  caption: 12,
};

export const shadow = {
  card: {
    shadowColor: "#14281E",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  } as const,
};
