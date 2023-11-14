const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  experiments: {
    outputModule: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname,'dist/hug-at-home/index.html'), // Spécifiez le chemin vers votre fichier HTML de modèle
      inject: true,
      chunks: '[name].bundle.js',
     template: path.join(__dirname, 'src/index.html'),
    }),
  ],
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