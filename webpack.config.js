const path = require('path');
const webpack = require('webpack');
const HtmlwebpackPlugin = require('html-webpack-plugin');

const ROOT_PATH = path.resolve(__dirname);
const APP_PATH = path.resolve(ROOT_PATH, 'src');
const BUILD_PATH = path.resolve(ROOT_PATH, 'dist');
const JS_PATH = path.resolve(APP_PATH, 'js');

module.exports = {
    watch: true,
    entry: {
        index: path.resolve(JS_PATH, 'index.js')
    },

    output: {
        path: BUILD_PATH,
        filename: '[name].js'
    },
    plugins: [new HtmlwebpackPlugin({
        template: path.resolve(APP_PATH, 'index.html'),
        filename: 'index.html',
        chunks: ['index'],
        inject: 'body'
    })],
    devtool: 'eval-source-map',
    devServer: {
        historyApiFallback: true,
        hot: true,
        inline: true,
        progress: true,
    },
    module: {
        loaders: [{
            test: /\.js?$/,
            loader: 'babel',
            include: APP_PATH,
            query: {
                presets: ['es2015']
            }
        }]
    }
};
