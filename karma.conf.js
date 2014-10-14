module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['qunit'],

    plugins: [
      'karma-qunit',
      'karma-junit-reporter',
      'karma-coverage',
      'karma-ember-preprocessor',
      'karma-phantomjs-launcher',
    ],

    files: [
      {pattern : "src/js/lib/jquery-2.1.1.js",   watched: true, included: true, served: true},
      {pattern : "src/js/lib/jquery.mockjax.js", watched: true, included: true, served: true},
      {pattern : "src/js/lib/qunit.js",          watched: true, included: true, served: true},
      {pattern : "src/js/lib/handlebars.js",     watched: true, included: true, served: true},
      {pattern : "src/js/lib/bootstrap.js",      watched: true, included: true, served: true},
      {pattern : "src/js/lib/ember.js",          watched: true, included: true, served: true},
      {pattern : "src/js/lib/ember-data.js",     watched: true, included: true, served: true},
      {pattern : "src/js/lib/ember-qunit.js",    watched: true, included: true, served: true},
      {pattern : "dist/ember-utils.js",          watched: true, included: true, served: true},
      {pattern : "test/tests-merged.js",         watched: true, included: true, served: true},
    ],

    preprocessors: {
      "dist/ember-utils.js" : "coverage",
    },

    reporters: ['progress', 'junit', 'coverage'],
    coverageReporter : {
      reporters : [
        {
          type : "json",
          dir : "coverage",
          subdir : ".",
          file : "test-coverage.json"
        },
        {
          type : "lcov",
          dir : "coverage",
          subdir : "."
        }
      ]
    },

    browsers: ['PhantomJS'],

    port: 9876,
    colors: true,
    //logLevel: config.LOG_ERROR,
    autoWatch: true,
    singleRun: true,
  });
};
