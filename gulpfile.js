const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del');
const fs = require('fs')
const sass = require('gulp-sass')(require('sass'));
const hb = require('gulp-hb')
const rename = require('gulp-rename')
const directoryTree = require('directory-tree')
const browserSync = require('browser-sync')
const server = browserSync.create()
const config = require('./slides.config.js')


// Build and Template Setup
// ------------------------

function clean () {
	return del([
    'build/**/*',
  ])
}

function reload (done) {
  server.reload()
  done()
}

function serve (done) {
  server.init({
    server: {
      baseDir: '.'
    }
  })
  done()
}

function watcher () {
	watch('theme/scss/**/*.scss', series(css, reload))
	watch('theme/**/*.{hbs,html}', series(html, reload))
	watch('theme/*.{hbs,html}', series(html, reload))
	// watch('theme/fonts/**/*', series(fonts, reload))
	// watch('images/**/*.{gif,jpg,png,svg}', series(images, reload))
	watch('slides/**/*.{html,md}', series(html, reload))
}


// Tidy template
// -------------

// function images () {
// 	return src('./images/**/*')
// 		.pipe(dest('./build/images'))
// }

// function fonts () {
// 	return src('./theme/fonts/**/*')
// 		.pipe(dest('./build/fonts'))
// }

function css () {
	return src('./theme/scss/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(dest('./assets/css'))
}

function html () {
	const slides = _findSlides()
	// console.log('---- slides ----')
	// console.log(JSON.stringify(slides, null, 4))
	// console.log('----')

	const data = Object.assign({}, config, { slides: slides })
	const hbstream = hb()
		.helpers({
			loadHTML: function (file) { return fs.readFileSync(file) }
		})
		.partials('./theme/partials/*.hbs')
		.data(data)
	return src('./theme/*.hbs')
		.pipe(hbstream)
		.pipe(rename({ extname: '.html' }))
		.pipe(dest('.'))
}

// function markdown () {
// 	return src('./slides/**/*.md')
// 		.pipe(dest('./build/slides'))
// }

// function prism () {
// 	return src('./vendor/**/*')
// 		.pipe(dest('./build/vendor'))
// }


// Reveal.js Library
// -----------------

function reveal() {
	return Promise.all([
		new Promise((resolve, reject) => {
			src('./node_modules/reveal.js/css/**/*.css')
				.pipe(dest('./assets/vendor/revealjs/css'))
				.on('end', resolve)
				.on('error', reject);
		}),
		new Promise((resolve, reject) => {
			src('./node_modules/reveal.js/dist/reveal.js')
				.pipe(dest('./assets/vendor/revealjs'))
				.on('end', resolve)
				.on('error', reject);
		}),
		// new Promise((resolve, reject) => {
		// 	src('./node_modules/reveal.js/lib/**')
		// 		.pipe(dest('./assets/vendor/revealjs/lib'))
		// 		.on('end', resolve)
		// 		.on('error', reject);
		// }),
		new Promise((resolve, reject) => {
			src('./node_modules/reveal.js/plugin/**')
				.pipe(dest('./assets/vendor/revealjs/plugin'))
				.on('end', resolve)
				.on('error', reject);
		}),
		new Promise((resolve, reject) => {
			src('./node_modules/reveal.js/dist/theme/**')
				.pipe(dest('./assets/vendor/revealjs/css/theme'))
				.on('end', resolve)
				.on('error', reject);
		})
	]);
}



// function init () {
// 	return src('./reveal.init.js')
// 		.pipe(rename('init.js'))
// 		.pipe(dest('./build/'))
// }


// Helpers
// -------


function _findSlides(tree) {
	let filtered = [];

	// Ensure tree is properly initialized
	if (!tree) {
		const dirTree = directoryTree('./slides');
		tree = dirTree ? dirTree.children : [];
	}

	// If tree is still undefined or empty, return an empty array
	if (!Array.isArray(tree)) return filtered;

	tree.forEach(child => {
		if (child.type === 'directory') {
			filtered.push({
				folder: child.path,
				slides: _findSlides(child.children || []) // Ensure recursion doesn't break
			});
		} else if (child.extension) {
			if (child.extension === '.html') {
				filtered.push({
					type: 'html',
					content: child.path
				});
			} else if (child.extension === '.md') {
				file_content = fs.readFileSync(child.path, 'utf8')
				filtered.push({
					type: 'markdown',
					content: file_content
				});
			}
		}
	});
	// console.log('---- filtered ----')
	// console.log(JSON.stringify(filtered, null, 4))
	// console.log('----')

	return filtered;
}



// Public Gulp Tasks
// -----------------

function build (done) {
	return series(
		clean,
		parallel(
			css,
			html,
			// fonts,
			// images,
			// markdown,
			reveal,
			// prism
		)//,
		// init
	)(done)
}


// Exports
// -------

exports.default = build
exports.build = build
exports.dev = series(build, serve, watcher)
exports.serve = series(build, serve)