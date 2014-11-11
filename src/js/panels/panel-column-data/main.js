/**
 * Column data interface for panels.
 *
 * @module panels
 * @submodule panel-column-data
 */
define([
  "./panelColumnDataGroup",
  "./panelColumnData",
], function() {
  var PanelColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        PanelColumnData[k] = arguments[i][k];
      }
    }
  }

  return PanelColumnData;
});
