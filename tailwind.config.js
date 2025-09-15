const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  safelist: ['ProseMirror'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        heading: ['var(--font-heading)'],
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
