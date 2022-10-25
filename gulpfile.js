//-----------------------------------------------------------------------------
// gulpfile.js - master gulp task file
//-----------------------------------------------------------------------------

'use strict';

//-----------------------------------------------------------------------------
// includes
//-----------------------------------------------------------------------------

const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

//-----------------------------------------------------------------------------
// tasks
//-----------------------------------------------------------------------------

/**
 * Build art script.
 */
gulp.task('js:art', () =>
  gulp
    .src(['src/traits.js', 'src/boot.js', 'src/index.js', 'src/art.js']) // hi ben! make sure this is a list of your files in src :)
    .pipe(concat('art-concat.js'))
    .pipe(gulp.dest('app'))
);

/**
 * Minify script.
 */
gulp.task('js:min', gulp.series('js:art'), () =>
  gulp
    .src(['app/art.js'])
    .pipe(
      babel({
        presets: [
          [
            'minify',
            {
              typeConstructors: false,
            },
          ],
        ],
        comments: false,
      })
    )
    .pipe(gulp.dest('app/min'))
);

//-----------------------------------------------------------------------------
// watch
//-----------------------------------------------------------------------------

gulp.task('watch', function () {
  gulp.watch('src/*.js', gulp.series('js:art'));
});
