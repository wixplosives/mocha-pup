/** @type {import('webpack').Configuration} */
module.exports = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: '@ts-tools/webpack-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.json'],
  },
};
