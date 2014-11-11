requirejs([
  "jquery",
  "jquery_mockjax",
  "handlebars",
  "bootstrap",
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "test/test-app",
  "test/column-data-tests/main",
  "test/array-modifier-tests/main",
  "test/timer-tests/main",
  //"test/lazy-display-tests/main",
  //"test/crud-adapter-tests/main",
], function() {
  for(var i = 10; i < arguments.length; i++) {
    arguments[i]();
  }
  QUnit.load();
  QUnit.start();
});
