module.exports = {
  purge: {
    content: ['./src/**/*.{html,js,vue}', './public/index.html'],
    safelist: [
      {
        pattern: /(bg|border)-(green|blue|yellow|red|purple|pink|teal|indigo|orange|lime|cyan|fuchsia|amber|violet|rose|gray)-(100|200|300|400|500)/,
        variants: ['hover', 'focus'],
      }
    ]
  },
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
