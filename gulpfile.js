const gulp = require('gulp');
// var minifycss = require('gulp-minify-css');
const htmlmin = require('gulp-htmlmin');
const webpack = require('webpack');
const webpackConfig=require('./webpack.production.config');
//    concat = require('gulp-concat'),
//    uglify = require('gulp-uglify'),
//    rename = require('gulp-rename'),
//    del = require('del');


// gulp.task('css', function () {
//   return gulp.src('src/**/*.css') //压缩的文件
//     .pipe(minifycss()) //执行压缩
//     .pipe(gulp.dest('webapp/')) //输出文件夹
// });
gulp.task('html', function () {
  return gulp.src('src/views/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .pipe(gulp.dest('build/views/'));
});
gulp.task('img', function () {
  return gulp.src('src/images/**.*') //压缩的文件
    .pipe(gulp.dest('build/images/')) //输出文件夹
});
gulp.task('webpack', function (callback) {
  webpack(webpackConfig, function (err) {
    if(!err){
      callback();
    }
  })
})
gulp.task('default', ['html', 'img','webpack'])
gulp.task('watch',function () {
  gulp.watch('src/**/*.js',['webpack'])
  gulp.watch('src/**/*.scss',['webpack','img'])
  gulp.watch('src/views/**/*.html',['html','img'])
})
