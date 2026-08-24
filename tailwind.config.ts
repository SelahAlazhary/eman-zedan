import type { Config } from "tailwindcss";

/**
 * نظام التصميم مبني على متغيرات CSS بصيغة HSL.
 * كل الألوان تُحقن من ThemeProvider وقت التشغيل (Royal Violet / Cyber Emerald / ...)
 * ما يسمح للوحة تحكم الأدمن بتغيير الهوية اللونية لحظياً بدون إعادة بناء.
 *
 * الصيغة: hsl(var(--primary) / <alpha-value>) تتيح استخدام /opacity مثل bg-primary/20
 */
const config: Config = {
  darkMode: ["class", '[data-layout="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        "card-foreground": "hsl(var(--card-foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        glow: "hsl(var(--glow) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
        squircle: "38% 62% 63% 37% / 41% 44% 56% 59%",
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--primary) / 0.25), 0 12px 40px -8px hsl(var(--glow) / 0.55)",
        "glow-lg": "0 0 60px -12px hsl(var(--glow) / 0.7)",
        soft: "0 1px 2px hsl(var(--foreground) / 0.04), 0 12px 32px -12px hsl(var(--foreground) / 0.12)",
        bento: "0 1px 0 hsl(var(--foreground) / 0.03), 0 20px 50px -24px hsl(var(--foreground) / 0.22)",
      },
      backgroundImage: {
        "mesh-primary":
          "radial-gradient(60% 60% at 20% 15%, hsl(var(--primary) / 0.35) 0%, transparent 60%), radial-gradient(50% 50% at 85% 25%, hsl(var(--accent) / 0.28) 0%, transparent 55%), radial-gradient(55% 55% at 60% 90%, hsl(var(--glow) / 0.25) 0%, transparent 60%)",
        "grid-fade":
          "linear-gradient(hsl(var(--border) / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.6) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        twinkle: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(1.25) rotate(18deg)", opacity: "0.7" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(1.9)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(-100%)" },
        },
        "skeleton-sweep": {
          "100%": { transform: "translateX(100%)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-height, auto)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        twinkle: "twinkle 2.4s ease-in-out infinite",
        "gradient-pan": "gradient-pan 6s ease infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
