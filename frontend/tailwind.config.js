/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#f7f8fb",
        line: "#e4e7ee"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

