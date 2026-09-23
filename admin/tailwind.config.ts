import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Geist", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        border: "#E5E2DE",
        "border-subtle": "#EEECE8",
        input: "#E5E2DE",
        ring: "#74263A",
        background: "#F4F3F1",
        foreground: "#181716",
        "foreground-secondary": "#5F5C59",
        "foreground-muted": "#8A8783",
        surface: "#FFFFFF",
        "surface-subtle": "#FBFAF8",
        "surface-elevated": "#FFFFFF",
        primary: {
          DEFAULT: "#74263A",
          hover: "#61202F",
          subtle: "#F4E8EC",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#EFECE8",
          foreground: "#181716",
        },
        destructive: {
          DEFAULT: "#C24141",
          subtle: "#FCECEC",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#EFECE8",
          foreground: "#5F5C59",
        },
        accent: {
          DEFAULT: "#F4E8EC",
          foreground: "#74263A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#181716",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#181716",
        },
        sidebar: {
          DEFAULT: "#FAF9F7",
          surface: "#FFFFFF",
          foreground: "#3A3836",
          muted: "#6E6A66",
          label: "#A8A29E",
          active: "#FFFFFF",
          "active-foreground": "#181716",
          border: "#E5E2DE",
          hover: "#ECE9E5",
          ring: "#74263A",
        },
        success: {
          DEFAULT: "#16845B",
          subtle: "#E9F6F0",
        },
        warning: {
          DEFAULT: "#B7791F",
          subtle: "#FFF5DF",
        },
        info: {
          DEFAULT: "#4D6B8A",
          subtle: "#EEF3F8",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "14px",
        pill: "999px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(23,23,23,0.06)",
        float: "0 8px 30px -6px rgba(23,23,23,0.12)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.18s ease-out",
        "accordion-up": "accordion-up 0.18s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
