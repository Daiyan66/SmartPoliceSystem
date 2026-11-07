import daisyui from 'daisyui';

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
          900: '#0B1325',
          800: '#14213D',
          700: '#1D3557',
          600: '#457B9D',
          gold: '#D4AF37',
          saffron: '#FF9933',
          khaki: '#C2B280',
          green: '#138808',
        }
      }
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: ["bumblebee", "light"],
    darkTheme: false,
  },
}
