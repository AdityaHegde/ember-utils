/**
 * Core module for ember-utils.
 *
 * @module ember-utils-core
 */
define([
  "ember",
  "./hasMany",
  "./belongsTo",
  "./hierarchy",
  "./delayedAddToHasMany",
  "./objectWithArrayMixin",
  //"./hashMapArray",
  "./misc",
], function() {
  var Utils = Ember.Namespace.create();
  window.Utils = Utils;

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Utils[k] = arguments[i][k];
      }
    }
  }

  return Utils;
});
