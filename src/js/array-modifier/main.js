/**
 * Module to handle array modification like sorting, searching and filtering.
 *
 * @module array-modifier
 */
define([
  "./array-modifier-groups/main",
  "./array-modifier-types/main",
  "./arrayModController",
], function() {
  var ArrayMod = Ember.Namespace.create();
  window.ArrayMod = ArrayMod;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ArrayMod[k] = arguments[i][k];
      }
    }
  }

  return ArrayMod;
});
