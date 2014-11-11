/**
 * Views for the global modules.
 *
 * @module global-module
 * @submodule global-module-column-data
 */
define([
  "./globalModuleColumnDataGroupMixin",
  "./displayTextColumnDataMixin",
  "./displayTextWithTooltipColumnDataMixin",
  "./displayTextCollapsibleColumnDataMixin",
  "./displayTextCollapsibleGlypiconColumnDataMixin",
], function() {
  var GlobalModulesColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        GlobalModulesColumnData[k] = arguments[i][k];
      }
    }
  }

  GlobalModulesColumnData.GlobalModulesColumnDataMixinMap = {
    "displayText"                    : GlobalModulesColumnData.DisplayTextColumnDataMixin,
    "displayTextWithTooltip"         : GlobalModulesColumnData.DisplayTextWithTooltipColumnDataMixin,
    "displayTextCollapsible"         : GlobalModulesColumnData.DisplayTextCollapsibleColumnDataMixin,
    "displayTextCollapsibleGlypicon" : GlobalModulesColumnData.DisplayTextCollapsibleGlypiconColumnDataMixin,
  };

  return GlobalModulesColumnData;
});
