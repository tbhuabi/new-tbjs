/**
 * Created by tanbo on 16/7/22.
 */

const path = require('path');
const webpack = require('webpack');
const HtmlwebpackPlugin = require('html-webpack-plugin');

const ROOT_PATH = path.resolve(__dirname);
const APP_PATH = path.resolve(ROOT_PATH, 'src');
const BUILD_PATH = path.resolve(ROOT_PATH, 'build');

module.exports = {
  entry: {
    app: path.resolve(APP_PATH, 'index.js')
    //mobile: path.resolve(APP_PATH, 'mobile.js'),
    //vendors: ['jquery', 'moment']
  },
  output: {
    path: BUILD_PATH,
    filename: '[name].js'
  },
  devtool: 'eval-source-map',
  devServer: {
    contentBase: 'build',
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,
  },
  plugins: [
    new HtmlwebpackPlugin({
      template: path.resolve(APP_PATH, 'index.html'),
      filename: 'index.html',
      chunks: ['app'],
      inject: 'body'
    })
  ],
  module: {
    loaders: [{
      test: /\.s?css$/,
      loaders: ['style', 'css', 'sass'],
      include: APP_PATH
    }, {
      test: /\.(gif|jpg|jpeg|png|bmp|svg|woff|woff2|eot|ttf)$/,
      loader: 'url?limit=40000'
    }, {
      test: /\.html?$/,
      loader: 'html'
    }, {
      test: /\.jsx?$/,
      loader: 'babel',
      include: APP_PATH,
      query: {
        presets: ['es2015']
      }
    }]
//      ,
//    perLoaders: [{
//      test: /\.jsx?$/,
//      include: APP_PATH,
//      loader: 'jshint-loader'
//    }]
  }
};