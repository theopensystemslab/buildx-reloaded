/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2A7A6C",
        "primary-dark": "#1F5B51",
        white: {
          DEFAULT: "#FFFFFF", // 100% opaque white
          10: "rgba(255, 255, 255, 0.1)",
          20: "rgba(255, 255, 255, 0.2)",
          30: "rgba(255, 255, 255, 0.3)",
          40: "rgba(255, 255, 255, 0.4)",
          50: "rgba(255, 255, 255, 0.5)",
          60: "rgba(255, 255, 255, 0.6)",
          70: "rgba(255, 255, 255, 0.7)",
          80: "rgba(255, 255, 255, 0.8)",
          90: "rgba(255, 255, 255, 0.9)",
        },
        black: {
          DEFAULT: "#000000", // 100% opaque black
          10: "rgba(0, 0, 0, 0.1)",
          20: "rgba(0, 0, 0, 0.2)",
          30: "rgba(0, 0, 0, 0.3)",
          40: "rgba(0, 0, 0, 0.4)",
          50: "rgba(0, 0, 0, 0.5)",
          60: "rgba(0, 0, 0, 0.6)",
          70: "rgba(0, 0, 0, 0.7)",
          80: "rgba(0, 0, 0, 0.8)",
          90: "rgba(0, 0, 0, 0.9)",
        },

        "light-grey": {
          1: "#DBDBDB",
          2: "#ECECEC",
          3: "#F0F0F0",
        },
        "dark-grey": "#9D9D9D",
        "mid-grey": {
          1: "#B4B4B4",
          2: "#CDCDCD",
        },
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
        building: {
          1: "#FAFF00",
          2: "#FDFFAD",
          3: "#E2FFA4",
          4: "#C1F3A2",
          5: "#C8F0CF",
          6: "#B2EEDF",
          7: "#C4EFF6",
          8: "#C7E6F8",
          9: "#C3DAF4",
          10: "#CABAEC",
          11: "#BAC2EC",
          12: "#F3C3F4",
          13: "#FCBDDF",
          14: "#FD6D6D",
          15: "#BFBFBF",
        },
      },
    },
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      serif: ["Times", "serif"],
    },
  },
  plugins: [],
}
