/**
 * Global modules for certain tasks like displaying an attribute from the record.
 *
 * @module global-module
 */
define([
  "./global-module-column-data/main",
  "./global-module-view/main",
], function() {
  var GlobalModules = Ember.Namespace.create();
  window.GlobalModules = GlobalModules;

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        GlobalModules[k] = arguments[i][k];
      }
    }
  }

  return GlobalModules;
});
