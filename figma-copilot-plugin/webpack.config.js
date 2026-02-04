const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    code: './src/code.ts',
    ui: './src/ui/ui.tsx', // có thể giữ, nhưng UI bridge sẽ chạy từ ui.html inline
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // cho phép import HTML thành string
      {
        test: /\.html$/i,
        type: 'asset/source',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/ui/index.html', to: 'ui.html' }],
    }),
  ],
  devtool: 'source-map',
};