import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf7f0",
        ink: "#2b2622",
        line: "#d9d2c3"
      },
      fontFamily: {
        hand: ["'Segoe Print'", "'Comic Sans MS'", "cursive"]
      }
    }
  },
  plugins: []
};

export default config;
