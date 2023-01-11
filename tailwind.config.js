/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    fontFamily: {
      sans: ["'Inter'", "sans-serif"],
      serif: ["Times", "serif"],
    },
    colors: {
      primary: "#2A7A6C",
      "primary-dark": "#1F5B51",
      white: "#FFFFFF",
      grey: {
        10: "#F4F4F4",
        20: "#E0E0E0",
        30: "#C6C6C6",
        40: "#A8A8A8",
        50: "#8D8D8D",
        60: "#6F6F6F",
        70: "#525252",
        80: "#393939",
        90: "#262626",
        100: "#161616",
      },
    },
  },
  plugins: [],
}
