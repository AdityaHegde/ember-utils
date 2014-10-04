module.exports = {
  dist: {
    options : {
      mangle : {
        except: ['jQuery', 'Ember', 'Em', 'DS'],
      },
    },
    files: {
      'prod/ember-utils.min.js': ['prod/ember-utils.js'],
    }
  }
};

