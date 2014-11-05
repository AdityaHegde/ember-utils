requirejs([
  "./utils/main",
  "jquery",
  //"jquery_mockjax",
  "handlebars",
  //"bootstrap",
  "ember",
  //"ember_data",
  "ember_qunit",
  "core/main",
  //"ember-test-utils",
  "test-app",
], function(utils) {
  emq.globalize();
  utils();
  QUnit.load();
  QUnit.start();
});
