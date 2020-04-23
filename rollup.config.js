'use strict';

const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');

const pkg = require('./package.json');

module.exports = {
  input: 'dist/index.js',
  output: {
    name: 'jsonml.browser.js',
    file: pkg.browser,
    format: 'cjs',
  },
  plugins: [
    commonjs(),
    replace({
      jsdom: './jsdom-stub',
    }),
  ],
};
