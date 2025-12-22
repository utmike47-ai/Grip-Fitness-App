/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // MJG Fitness Brand Colors - Dark Theme
          'mjg-bg-primary': '#0a0a0a', // Dark textured background
          'mjg-bg-secondary': '#1a1a1a', // Secondary dark
          'mjg-card': '#FFFFFF', // White cards for content
          'mjg-text-primary': '#FFFFFF', // White text on dark background
          'mjg-text-secondary': '#666666', // Gray for secondary text
          'mjg-text-card': '#2d2d2d', // Dark text inside white cards
          'mjg-accent': '#1a1a1a', // Dark accent
          'mjg-border': '#333333', // Dark borders
          'mjg-border-card': '#E5E5E5', // Light borders for white cards
          'mjg-success': '#10b981',
          'mjg-error': '#ef4444',
          // Legacy colors (for backward compatibility during transition)
          'grip-primary': '#1a1a1a',
          'grip-secondary': '#E5E5E5', 
          'grip-accent': '#1a1a1a',
          'grip-dark': '#2d2d2d',
          'grip-light': '#0a0a0a',
        },
        fontFamily: {
          'poppins': ['Poppins', 'sans-serif'],
          // Legacy fonts (for backward compatibility)
          'montserrat': ['Poppins', 'sans-serif'],
          'inter': ['Poppins', 'sans-serif'],
        },
        borderRadius: {
          'mjg': '12px', // Updated to 12px for cards
        },
        boxShadow: {
          'mjg': '0 8px 24px rgba(0, 0, 0, 0.4)', // Strong shadow for cards on dark background
          'mjg-lg': '0 12px 32px rgba(0, 0, 0, 0.5)', // Larger shadow for hover states
          'mjg-xl': '0 16px 48px rgba(0, 0, 0, 0.6)', // Extra large shadow
        }
      },
    },
    plugins: [],
  }