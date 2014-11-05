var require = {
  baseUrl : "/js",
  paths : {
    jquery         : "lib/jquery-2.1.1",
    handlebars     : "lib/handlebars",
    ember          : "lib/ember",
    ember_data     : "lib/ember-data",
    core           : "core",
  },
  shim : {
    ember : {
      deps : [ "jquery", "handlebars" ],
      exports : "Ember",
    },
    ember_data : {
      deps : [ "ember" ],
      exports : "DS",
    },
  },
};
