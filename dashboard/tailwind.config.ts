import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#1a1b26",
        primary: "#4a6fa5",
        accent: "#2c4a6e",
        secondary: "#60a5fa",
        destructive: "#8b4049",
        success: "#5a8a72",
        warning: "#b8860b",
      },
    },
  },
  plugins: [],
}
export default config
