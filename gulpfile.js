const { src, dest, parallel } = require('gulp');

function buildNodeIcons() {
  return src('nodes/**/*.{svg,png}').pipe(dest('dist/nodes'));
}

function buildCredentialIcons() {
  return src('credentials/**/*.{svg,png}').pipe(dest('dist/credentials'));
}

exports['build:icons'] = parallel(buildNodeIcons, buildCredentialIcons);
