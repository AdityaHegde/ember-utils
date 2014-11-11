/**
 * Different panel views.
 *
 * @module panels
 * @submodule panel-views
 */
define([
  "./panelView",
  "./panelCollapsibleView",
], function() {
  var PanelView = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        PanelView[k] = arguments[i][k];
      }
    }
  }

  PanelView.NameToLookupMap = {
    "base" : "panels/panel",
    "collapsible" : "panels/panelCollapsible",
  };

  return PanelView;
});
