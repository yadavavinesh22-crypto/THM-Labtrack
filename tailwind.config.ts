import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101827",
        brand: { 50: "#eff6ff", 100: "#dbeafe", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" }
      },
      boxShadow: { soft: "0 12px 40px rgba(15, 23, 42, .08)" }
    }
  },
  plugins: []
};
export default config;
