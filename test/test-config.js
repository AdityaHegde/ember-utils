var require = {
  baseUrl : "../",
  paths : {
    source         : "src/js",
    lib            : "src/js/lib",
    jquery         : "src/js/lib/jquery-2.1.1",
    jquery_mockjax : "src/js/lib/jquery.mockjax",
    handlebars     : "src/js/lib/handlebars",
    bootstrap      : "src/js/lib/bootstrap",
    ember          : "src/js/lib/ember",
    ember_data     : "src/js/lib/ember-data",
    ember_qunit    : "src/js/lib/ember-qunit",
  },
  shim : {
    jquery_mockjax : [ "jquery" ],
    bootstrap : [ "jquery" ],
    ember : {
      deps : [ "jquery", "handlebars"],
      exports : "Ember",
    },
    ember_data : {
      deps : [ "ember" ],
      exports : "DS",
    },
    ember_qunit : {
      deps : [ "ember" ],
      exports : "emq",
    },
  },
};
