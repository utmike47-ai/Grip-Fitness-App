/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'grip-primary': '#0F3B37',
          'grip-secondary': '#e3d8c5', 
          'grip-accent': '#B86450',
          'grip-dark': '#2d2d2d',
          'grip-light': '#F5F0E8',
        },
        fontFamily: {
          'montserrat': ['Montserrat', 'sans-serif'],
          'inter': ['Inter', 'sans-serif'],
        },
        borderRadius: {
          'grip': '8px',
        },
        boxShadow: {
          'grip': '0 2px 8px rgba(0, 0, 0, 0.1)',
        }
      },
    },
    plugins: [],
  }