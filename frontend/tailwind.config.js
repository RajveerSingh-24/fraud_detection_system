/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#020617",
          card: "rgba(15, 23, 42, 0.55)",
          accent: "#06b6d4",
          danger: "#ef4444",
          warn: "#f59e0b",
          safe: "#22c55e",
        },
      },
      boxShadow: {
        glow: "0 0 35px rgba(6, 182, 212, 0.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
