import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f4ecd8",
        ink: "#2b2622",
        line: "#c9b98e",
        rust: "#a8402f",
        kraft: "#d8c39a"
      },
      fontFamily: {
        hand: ["'Segoe Print'", "'Comic Sans MS'", "cursive"]
      },
      boxShadow: {
        cardboard: "0 2px 0 rgba(43,38,34,0.15), 0 8px 16px -8px rgba(43,38,34,0.35)"
      }
    }
  },
  plugins: []
};

export default config;
