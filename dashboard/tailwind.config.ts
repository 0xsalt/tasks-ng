import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#184e77",
        primary: "#1a759f",
        accent: "#1e6091",
        secondary: "#34a0a4",
        destructive: "#8b4049",
        success: "#76c893",
        warning: "#d9ed92",
      },
    },
  },
  plugins: [],
}
export default config
