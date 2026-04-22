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
        michelin: {
          red: "#E4002B",
          gold: "#C9AA71",
        },
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
}
export default config
