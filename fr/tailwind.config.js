/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html', // Procura em todos os arquivos .html na raiz
    './**/*.html', // Procura em todos os arquivos .html em subpastas
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}