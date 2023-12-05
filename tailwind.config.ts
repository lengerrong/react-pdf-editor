/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/index.css",
    "./src/lib/PDFEditor.module.css",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "pdf-toolbar": "#f7f7f7",
        "pdf-content": "#e6e6e6",
        "pdf-button": "#dddddd",
        "pdf-input": "#F2F4FE",
      },
    },
  },
  plugins: []
}
