module.exports = {
  dist: {
    options : {
      mangle : {
        except: ['jQuery', 'Ember', 'Em', 'DS'],
      },
    },
    files: {
      'dist/ember-utils.min.js': ['dist/ember-utils.js'],
      'build/templates.min.js' : 'build/templates.js',
    }
  }
};

