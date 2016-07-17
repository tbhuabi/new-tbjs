const path = require('path');
const webpack = require('webpack');
const HtmlwebpackPlugin = require('html-webpack-plugin');
//定义了一些文件夹的路径
const ROOT_PATH = path.resolve(__dirname);
const APP_PATH = path.resolve(ROOT_PATH, 'src');
const BUILD_PATH = path.resolve(ROOT_PATH, 'dist');
const JS_PATH = path.resolve(APP_PATH, 'js');

module.exports = {
    //项目的文件夹 可以直接用文件夹名称 默认会找index.js 也可以确定是哪个文件名字
    watch: true,
    entry: {
        index: path.resolve(JS_PATH, 'index.js')
    },

    output: {
        path: BUILD_PATH,
        filename: '[name].js'
    },
    //添加我们的插件 会自动生成一个html文件
    plugins: [
//    new webpack.optimize.UglifyJsPlugin({
//      minimize: true
//    }),
    new HtmlwebpackPlugin({
            template: path.resolve(APP_PATH, 'index.html'),
            filename: 'index.html',
            //chunks这个参数告诉插件要引用entry里面的哪几个入口
            chunks: ['index'],
            //要把script插入到标签里
            inject: 'body'
        })
//    ,
//     new HtmlwebpackPlugin({
//      template: path.resolve(APP_PATH, 'test.html'),
//      filename: 'test.html',
//      //chunks这个参数告诉插件要引用entry里面的哪几个入口
//      chunks: ['test'],
//      //要把script插入到标签里
//      inject: 'body'
//    })
  ],
    devtool: 'eval-source-map',
    devServer: {
        historyApiFallback: true,
        hot: true,
        inline: true,
        progress: true,
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel',
                include: APP_PATH,
                query: {
                    presets: ['es2015']
                }
      }
    ]
    }
};
