const path = require('path');

module.exports = {
  plugins: [],
  output: {
    module: true,
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist/hug-at-home'),
  },
  optimization: {
    chunkIds: 'natural',
    concatenateModules: true,
    minimize: true,
  },
};