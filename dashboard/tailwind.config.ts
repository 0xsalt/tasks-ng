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
        primary: "#2e7de9",
        accent: "#1e40af",
        secondary: "#60a5fa",
        destructive: "#dc2626",
        success: "#33b579",
        warning: "#f0a020",
      },
    },
  },
  plugins: [],
}
export default config
