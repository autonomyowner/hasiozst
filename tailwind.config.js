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
        // Palette sourced from mindshiftarabia.com
        primary: "#1A4B5F",
        "primary-dark": "#123847",
        background: "#F8F4ED",
        card: "#FFFFFF",
        surface: "#F2EAD9",
        "text-primary": "#0D1A12",
        "text-secondary": "#5F6E63",
        sage: "#8A9B7A",
        "sage-soft": "#B9C9A8",
        gold: "#F5E6A3",
        success: "#1F9D55",
        error: "#DC2626",
        "badge-new": "#8B5CF6",
        border: "#E3DBCA",
        "pill-inactive": "rgba(26,75,95,0.08)",
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
