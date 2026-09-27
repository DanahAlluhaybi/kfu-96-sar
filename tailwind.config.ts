import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // from the club's 2026 identity guide
        pine: {
          50: "#EEF7F8",
          100: "#D8EEF0",
          200: "#B0DEE1",
          300: "#7FC9CE",
          400: "#56B8BE",
          500: "#3AABB1",
          600: "#2A8C92",
          700: "#1B6A6E",
          800: "#11494C",
          900: "#0B3437",
          950: "#072426",
        },
        gold: {
          50: "#FDF6E0",
          100: "#FAEAB5",
          300: "#F0C84F",
          500: "#E7B113",
          600: "#C4930B",
          700: "#946E06",
        },
        ink: {
          DEFAULT: "#0E1011",
          900: "#0E1011",
          700: "#33383A",
          500: "#5E676A",
          400: "#7C8588",
          300: "#A9B3B6",
        },
        mist: {
          DEFAULT: "#D5E0E4",
          50: "#F2F6F7",
          100: "#E6EDF0",
          200: "#D5E0E4",
          300: "#BFCED3",
        },
        // only used for the big 96
        saudi: { DEFAULT: "#006C35", 600: "#0A7F42" },
        stone: { DEFAULT: "#9FB1B7" },
        navy: { DEFAULT: "#111B32" },
        sand: { DEFAULT: "#F2F6F7" },
      },
      fontFamily: {
        // thmanyah fonts, see globals.css
        sans: ["var(--font-text)"],
        display: ["var(--font-display)"],
        digital: ["var(--font-digital)"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12,63,65,0.04), 0 8px 24px -12px rgba(12,63,65,0.12)",
        lift: "0 2px 4px rgba(12,63,65,0.05), 0 18px 40px -18px rgba(12,63,65,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "twinkle": {
          "0%,100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(0.9) rotate(8deg)", opacity: "0.85" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "num-in": {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.96)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
        "stage-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "draw-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "pulse-dot": {
          "0%": { boxShadow: "0 0 0 0 rgba(80,167,174,0.55)" },
          "100%": { boxShadow: "0 0 0 10px rgba(80,167,174,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 480ms cubic-bezier(.2,.7,.2,1) both",
        pop: "pop 420ms cubic-bezier(.2,.8,.2,1) both",
        twinkle: "twinkle 4.5s ease-in-out infinite",
        "pulse-dot": "pulse-dot 1.6s ease-out infinite",
        rise: "rise 560ms cubic-bezier(.2,.7,.2,1) both",
        "num-in": "num-in 620ms cubic-bezier(.16,.84,.3,1) both",
        "stage-in": "stage-in 420ms cubic-bezier(.2,.7,.2,1) both",
        "draw-x": "draw-x 700ms cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
