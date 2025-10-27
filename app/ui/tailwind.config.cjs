/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F8F5E0",
        ink: "#3C2F2F",
        accentGold: "#D4C4A6",
        glow: "#F8DE7E",
        shadowVeil: "rgba(24,16,12,0.85)"
      },
      fontFamily: {
        display: ["\"Celtic Dragon\"", "\"Cinzel\"", "serif"],
        serif: ["\"EB Garamond\"", "\"Crimson Text\"", "serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      backgroundImage: {
        parchment:
          "radial-gradient(circle at top left, rgba(244,237,210,0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(206,186,140,0.3), transparent 45%)"
      },
      boxShadow: {
        codex: "0 25px 50px -12px rgba(24,16,12,0.35)"
      }
    }
  },
  plugins: []
};
