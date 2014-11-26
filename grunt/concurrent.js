module.exports = {
  build   : ['requirejs', 'concat:css'],
  move    : ['concat:dist'],
  process : ['yuidoc', 'qunit', 'uglify', 'cssmin'],
  clean   : ['clean'],
};
