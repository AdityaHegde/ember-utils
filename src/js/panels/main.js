/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module panels
 */
define([
  "./panel-column-data/main",
  "./panel-views/main",
  "./panelsView",
], function() {
  var Panels = Ember.Namespace.create();
  window.Panels = Panels;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Panels[k] = arguments[i][k];
      }
    }
  }

  return Panels;
});
