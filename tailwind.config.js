/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFD400",
        background: "#000000",
        card: "#0C0C0C",
        surface: "#111111",
        "text-primary": "#FFFFFF",
        "text-secondary": "#898989",
        success: "#22C55E",
        error: "#EF4444",
        "badge-new": "#2866ED",
        "pill-inactive": "rgba(217,217,217,0.08)",
      },
      fontFamily: {
        mont: ["Montserrat_400Regular"],
        "mont-light": ["Montserrat_300Light"],
        "mont-extralight": ["Montserrat_200ExtraLight"],
        "mont-medium": ["Montserrat_500Medium"],
        "mont-semibold": ["Montserrat_600SemiBold"],
        "mont-bold": ["Montserrat_700Bold"],
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
