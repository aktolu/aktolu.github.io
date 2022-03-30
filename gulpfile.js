const gulp = require('gulp');

// Load plugins
const terser = require('gulp-terser');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const gulp_if = require('gulp-if');
const del = require('del');

let production = true;
let add_sourcemaps = true;

const root = path.resolve('./') + '/';
const lib = root + 'lib/';
//const node = root + 'node_modules/';

const tasks = {
	// SCSS
	scss_custom: {
		type: 'scss',
		watch: [
			lib + 'src/scss/custom.scss',
		],
		src_scss: lib + 'src/scss/custom.scss',
		dst_path: lib + 'dist/css',
	},
	scss_static: {
		type: 'scss',
		watch: [
			lib + 'src/scss/static.scss',
			lib + 'src/scss/scss/**/*.scss',
		],
		src_scss: lib + 'src/scss/static.scss',
		dst_path: lib + 'dist/css',
	},
	
	// JS
	js_custom: {
		type: 'js',
		watch: [
			lib + 'src/js/custom.js',
		],
		dst_path: lib + 'dist/js',
		dst_name: 'custom.js',
		src_path: lib + 'src/js',
	},
}


// ---------------- EXPORTS START ---------------- //
// Front
// All
exports.watch_all = ()=>{watchTasks(tasks).forEach(item=>{gulp.watch(item.watch, gulp.task(item.task))})}
exports.run_all = runTasks(tasks);


function watchTasks(tasks) {
	let returnTasks = [];
	for (const [task_name, item] of Object.entries(tasks)) {
		if (typeof item.watch !== 'undefined') {
			if (item.type === 'scss') {
				gulp.task(task_name, function(){
					return scss(item.src_scss, item.dst_path);
				});
			} else if (item.type === 'js') {
				gulp.task(task_name, function(){
					return js(item.watch, item.dst_path, item.dst_name, item.src_path);
				});
			} else if (item.type === 'concat') {
				gulp.task(task_name, function(){
					return concat_files(item.watch, item.dst_path, item.dst_name);
				});
			} else if (item.type === 'copy') {
				gulp.task(task_name, function(){
					return copy(item.watch, item.dst_path);
				});
			}
			
			returnTasks.push({
				watch: item.watch,
				task: task_name,
			});
		}
	}
	
	return returnTasks;
}

function runTasks(tasks) {
	let runTasks = [];
	for (const [task_name, item] of Object.entries(tasks)) {
		if (item.type === 'scss') {
			gulp.task(task_name, function(){
				return scss(item.src_scss, item.dst_path);
			});
		} else if (item.type === 'js') {
			gulp.task(task_name, function(){
				return js(item.watch, item.dst_path, item.dst_name, item.src_path);
			});
		} else if (item.type === 'concat') {
			gulp.task(task_name, function(){
				return concat_files(item.watch, item.dst_path, item.dst_name);
			});
		} else if (item.type === 'copy') {
			gulp.task(task_name, function(){
				return copy(item.watch, item.dst_path);
			});
		}
		
		runTasks.push(task_name);
	}
	
	return gulp.series(runTasks);
}
// ---------------- EXPORTS END ---------------- //




// ---------------- FUNCTIONS START ---------------- //
// JS function
function js(src_mix, dst_path, dst_name, src_path) {
	
	const sourceMapsOptions = {
		includeContent: false, // bunun false ile çalışabilmesi için alttaki sourceRoot kısmının doğru ayarlanması gerekir
		sourceRoot: path.relative(dst_path, src_path) // Önemli. Genellikle Çıktı: "../../src/js"
	};
	
	if (!add_sourcemaps) {
		const dst_map = dst_path.replace(/\/$/, '') + '/' + dst_name + '.map';
		del(dst_map);
	}
	
	return gulp.src(src_mix)
		.pipe(gulp_if(add_sourcemaps, sourcemaps.init()))
		.pipe(concat(dst_name))
		.pipe(gulp_if(production, terser({
			output: {
				comments: false,
			},
		})))
		.pipe(gulp_if(add_sourcemaps, sourcemaps.write('.', sourceMapsOptions)))
		.pipe(gulp.dest(dst_path));
}

// SCSS function
function scss(src_file, dst_path){
	
	let sourceMapsOptions = {
		includeContent: false, // bunun false ile çalışabilmesi için alttaki sourceRoot kısmının doğru ayarlanması gerekir
		sourceRoot: path.relative(dst_path, src_file.replace(/\/[^\/]*$/, '')) // Önemli. Genellikle Çıktı: "../../src/scss"
	}
	
	if (!add_sourcemaps) {
		const split = src_file.split(/[\\\/]/);
		const dst_map = dst_path.replace(/[\/\\]$/, '') + '/' + split[split.length - 1].replace(/\.s[ca]ss$/, '.css') + '.map';
		del(dst_map);
	}
	
	return gulp.src(src_file)
		.pipe(gulp_if(add_sourcemaps, sourcemaps.init()))
		.pipe(sass({outputStyle: 'compressed'}, true).on('error', sass.logError))
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 2 versions'],
			cascade: false,
		}))
		.pipe(gulp_if(add_sourcemaps, sourcemaps.write('.', sourceMapsOptions)))
		.pipe(gulp.dest(dst_path));
}

function concat_files(src_mix, dst_path, dst_name) {
	return gulp.src(src_mix)
		.pipe(concat(dst_name))
		.pipe(gulp.dest(dst_path));
}

function copy(src_mix, dst_path) {
	return gulp.src(src_mix)
		.pipe(gulp.dest(dst_path));
}
// ---------------- FUNCTIONS END ---------------- //