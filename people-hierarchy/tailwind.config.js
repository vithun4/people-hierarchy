module.exports = {
  purge: {
    content: ['./src/**/*.{html,js,vue}', './public/index.html'], // Adjust this based on your project
    safelist: [
      {
        pattern: /(bg|border)-(green|blue|yellow|red|purple|pink|teal|indigo|orange|lime|cyan|fuchsia|amber|violet|rose)-(100|200|300|400|500)/,
        variants: ['hover', 'focus'], // Optional: to include hover/focus variants if needed
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
