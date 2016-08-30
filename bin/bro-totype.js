#! /usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const sh = require('kool-shell');
const args = process.argv.splice(2);
const protoPath = args[0] ? path.join(process.cwd(), args[0]) : process.cwd();
const templatePath = path.join(__dirname, '../template');
let devDependencies = [];

//create project directory
try { fs.mkdirsSync(protoPath); }
catch(e) { sh.error(err); sh.exit(1); }

// copy templates files
try { fs.copySync(templatePath, protoPath, { clobber: false, dereference: true }); }
catch(e) { sh.error(e); sh.exit(1); }

// execute npm init + install browserify & budo
sh.exec('npm', ['init'], { cwd: protoPath })
  .catch((e) => { sh.error(e); sh.exit(1); })
  .then(() => { templateHtml(); });

// customize example/index.html with infos from package.json
function templateHtml() {
  const infos = require(path.join(protoPath, 'package.json'));
  const indexPath = path.join(protoPath, 'example/index.html');
  const replace = `<title>${infos.name}</title>
    <meta name="description" content="${infos.description}">
    <meta name="author" content="${infos.author}">`;
  let indexhtml = '';
  try {
    indexhtml = fs.readFileSync(indexPath, 'utf8')
      .replace('<!-- Custom informations -->', replace);
    fs.writeFileSync(indexPath, indexhtml, 'utf8');
  } catch(e) { sh.error(e); sh.exit(1); }
  installDevDependencies();
}

// install dev dependencies
function installDevDependencies() {
  sh.question('budo is required. Install it locally ? (yes) ',
    (answer) => { if (answer == '' || answer.match(/^y(es)?$/i)) devDependencies.push('budo') })
  .then(() => sh.question('browserify is required. Install it locally ? (yes) ',
    (answer) => { if (answer == '' || answer.match(/^y(es)?$/i)) devDependencies.push('browserify') }))
  .then(() => sh.question('uglify-js is required. Install it locally ? (yes) ',
    (answer) => { if (answer == '' || answer.match(/^y(es)?$/i)) devDependencies.push('uglify-js') }))
  .then(() => sh.question('Do you want babelify + babel-preset-es2015 ? (no) ',
    (answer) => { if (answer.match(/^y(es)?$/i)) devDependencies.push('babelify', 'babel-preset-es2015') }))
  .then(() => sh.exec('npm', ['i', '-D'].concat(devDependencies), { cwd: protoPath }))
  .catch((e) => { sh.error(e); sh.exit(1); })
  .then(() => packageCustomization())
}

// customize package.json to add browserify transforms
function packageCustomization() {
  const packagePath = path.join(protoPath, 'package.json');
  let packagejson = '';

  let replace = '"browserify": {\n    "transform": [\n';
  if (devDependencies.indexOf('babel-preset-es2015') > -1)
    replace += '      ["babelify", { "presets": ["es2015"] }]\n';
  replace += '    ]\n  }';

  try {
    packagejson = fs.readFileSync(packagePath, 'utf8')
      .replace('"browserify": {}', replace);
    fs.writeFileSync(packagePath, packagejson, 'utf8');
  } catch(e) { sh.error(e); sh.exit(1); }
  success();
}

// yay !
function success() {
  sh.success('Your brand new bro-totype is ready ! \nHave fun  🚀');
}