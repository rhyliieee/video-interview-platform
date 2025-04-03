/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/JSX files in src
    ],
    theme: {
      extend: {
        colors: {
          'background': '#F9F9F9',
          'text-primary': '#111613',
          'accent-1': '#37A533',
          'accent-2': '#1E651C',
          'complementary': '#D1D5DB', // Using a neutral gray as complementary
        },
      },
    },
    plugins: [],
  }
