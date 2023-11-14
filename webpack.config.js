const path = require('path');

module.exports = {
  experiments: {
    outputModule: true,
  },
  plugins: [],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist/hug-at-home'),
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      maxSize: 1000000,
      chunks: 'all',
    }
  },
};