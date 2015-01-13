var require = {
  baseUrl : "/src/js",
  paths : {
    jquery         : "lib/jquery-2.1.1",
    handlebars     : "lib/handlebars",
    ember          : "lib/ember",
    ember_qunit    : "lib/ember-qunit",
    ember_data     : "lib/ember-data",
    bootstrap      : "lib/bootstrap",
    jquery_mockjax : "lib/jquery.mockjax",
    jquery_ui      : "lib/jquery-ui",
  },
  shim : {
    jquery_mockjax : ["jquery"],
    jquery_ui : ["jquery"],
    bootstrap : ["jquery"],
    ember : {
      deps : [ "jquery", "handlebars" ],
      exports : "Ember",
    },
    ember_data : {
      deps : [ "ember" ],
      exports : "DS",
    },
    ember_qunit : ["ember"],
  },
  waitSeconds : 10,
};
