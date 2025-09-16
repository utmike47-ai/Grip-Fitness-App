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
        }
      },
    },
    plugins: [],
  }