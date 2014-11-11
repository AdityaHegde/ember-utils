/**
 * Views for the global modules.
 *
 * @module global-module
 * @submodule global-module-view
 */
define([
  "./displayTextView",
  "./displayTextWithTooltipView",
  "./displayTextCollapsibleView",
  "./displayTextCollapsibleGlypiconView",
], function() {
  var GlobalModulesView = Ember.Namespace.create();

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        GlobalModulesView[k] = arguments[i][k];
      }
    }
  }

  GlobalModulesView.GlobalModulesMap = {
    "displayText"                    : "globalModules/displayText",
    "displayTextWithTooltip"         : "globalModules/displayTextWithTooltip",
    "displayTextCollapsible"         : "globalModules/displayTextCollapsible",
    "displayTextCollapsibleGlypicon" : "globalModules/displayTextCollapsibleGlypicon",
  };

  return GlobalModulesView;
});
