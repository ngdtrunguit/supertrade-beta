// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" }
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" }
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "slide-out-to-top": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" }
        },
        "slide-out-to-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" }
        },
        "slide-out-to-bottom": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" }
        },
        "slide-out-to-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" }
        }
      },
      animation: {
        "in": "fade-in 0.2s ease-in-out",
        "out": "fade-out 0.2s ease-in-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-in-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-in-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-in-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-in-out",
        "slide-out-to-top": "slide-out-to-top 0.3s ease-in-out",
        "slide-out-to-right": "slide-out-to-right 0.3s ease-in-out",
        "slide-out-to-bottom": "slide-out-to-bottom 0.3s ease-in-out",
        "slide-out-to-left": "slide-out-to-left 0.3s ease-in-out"
      }
    },
  },
  plugins: [],
}