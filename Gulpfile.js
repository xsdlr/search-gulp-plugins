var gulp = require('gulp');
var brunch = require('brunch');
require('gulp-grunt')(gulp);

// Deploy using gh-pages
gulp.task('deploy', function () {
  gulp.run('grunt-deploy');
});

// Simple dev task, brunch watch --server
gulp.task('dev', function (cb) {
  brunch.watch({server: true});
});