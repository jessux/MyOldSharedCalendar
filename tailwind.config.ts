import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fffdf9",
        ink: "#172522",
        line: "#d9e3dd",
        rust: "#e36f51",
        kraft: "#dce9e2"
      },
      fontFamily: {
        hand: ["'Segoe Print'", "'Comic Sans MS'", "cursive"]
      },
      boxShadow: {
        cardboard: "0 2px 0 rgba(23,37,34,0.06), 0 12px 24px -10px rgba(40,78,68,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
