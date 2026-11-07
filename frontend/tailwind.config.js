/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          900: '#0B1325', // Deep Navy Midnight
          800: '#14213D', // Station Command Blue
          700: '#1D3557', // Duty Blue
          600: '#457B9D',
          gold: '#D4AF37', // Police Crest Gold
          saffron: '#FF9933', // National Flag Saffron
          khaki: '#C2B280', // Police Uniform Khaki
          green: '#138808', // Indian Green
        }
      }
    },
  },
  plugins: [],
}
