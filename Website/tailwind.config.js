const withMT = require("@material-tailwind/react/utils/withMT");
const colors = require('tailwindcss/colors')

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors : {
      first: "#1B4D2B",
      second: "#568203",
      back:"#F4F1EB"

    },
    extend: {
      keyframes: {
        'slide-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'slide-left': 'slide-left 8s linear infinite',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
});