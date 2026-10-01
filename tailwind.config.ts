import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          DEFAULT: "#0077B6",
          50: "#E6F4FA",
          100: "#CCE9F5",
          200: "#99D3EB",
          300: "#66BDE1",
          400: "#33A7D7",
          500: "#0077B6",
          600: "#005F92",
          700: "#00476D",
          800: "#003049",
          900: "#001824",
        },
        cyan: {
          DEFAULT: "#00B4D8",
        },
        accent: {
          DEFAULT: "#2ECC71",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
