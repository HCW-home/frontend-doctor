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
    // chunkIds: 'natural',
    // concatenateModules: true,
    minimize: true,
    runtimeChunk: 'single',
    splitChunks: {
      maxSize: 1000000,
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
      // minSize: 20000,
      // minRemainingSize: 0,
      // minChunks: 1,
      // maxAsyncRequests: 30,
      // maxInitialRequests: 30,
      // enforceSizeThreshold: 50000,
      // cacheGroups: {
      //   defaultVendors: {
      //     test: /[\\/]node_modules[\\/]/,
      //     priority: -10,
      //     reuseExistingChunk: true,
      //   },
      //   default: {
      //     minChunks: 2,
      //     priority: -20,
      //     reuseExistingChunk: true,
      //   },
      // },
    },
  },
};