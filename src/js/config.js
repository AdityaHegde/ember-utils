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
  },
  shim : {
    jquery_mockjax : ["jquery"],
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
