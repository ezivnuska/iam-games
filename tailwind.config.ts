/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          blue: {
            400: "#2589FE",
            500: "#0070F3",
            600: "#2F6FEB",
          },
        },
        keyframes: {
          "fade-in": {
            "0%": { opacity: "0", transform: "translateY(20px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
        },
        animation: {
          "fade-in": "fade-in 0.6s ease-out",
        },
        maxWidth: {
          'content': '600px',
        },
        screens: {
          'portrait': { 'raw': '(orientation: portrait)' },
          'landscape': { 'raw': '(orientation: landscape)' },
        },
      },
    },
    plugins: [require("@tailwindcss/forms")],
};
