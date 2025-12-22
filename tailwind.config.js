/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Bold Gym Vibes Color Palette
          'gym-primary': '#ff6b35', // Deep Orange
          'gym-secondary': '#2d3142', // Charcoal
          'gym-accent': '#00d9ff', // Electric Blue
          'gym-bg-dark': '#1a1d2e', // Dark Navy
          'gym-card': '#252b42', // Lighter Navy
          'gym-text-dark': '#2d3142', // Charcoal
          'gym-text-light': '#ffffff', // White
          'gym-success': '#10b981', // Green
          'gym-error': '#ef4444', // Red
          'gym-gray': '#9ca3af', // Light gray for inactive
          // Legacy support
          'grip-primary': '#ff6b35',
          'grip-secondary': '#2d3142',
          'grip-accent': '#00d9ff',
          'grip-dark': '#2d3142',
          'grip-light': '#1a1d2e',
        },
        fontFamily: {
          'poppins': ['Poppins', 'sans-serif'],
          'montserrat': ['Poppins', 'sans-serif'], // Legacy support
          'inter': ['Poppins', 'sans-serif'], // Legacy support
        },
        borderRadius: {
          'grip': '8px',
          'gym': '8px',
        },
        boxShadow: {
          'grip': '0 4px 20px rgba(0, 0, 0, 0.3)',
          'gym': '0 4px 20px rgba(0, 0, 0, 0.3)',
          'gym-lg': '0 8px 30px rgba(0, 0, 0, 0.4)',
        }
      },
    },
    plugins: [],
  }