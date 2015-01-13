module.exports = {
  build   : ['requirejs'],
  move    : ['concat:dist'],
  process : ['yuidoc', 'qunit', 'uglify', 'cssmin'],
  clean   : ['clean'],
};
