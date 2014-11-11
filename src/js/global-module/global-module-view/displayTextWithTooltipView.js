define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "./displayTextView",
], function(Ember, Utils, ColumnData, DisplayTextView) {

/**
 * Module for a simple display of text with tooltip.
 *
 * @class GlobalModules.DisplayTextWithTooltipView
 * @extends GlobalModules.DisplayTextView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextWithTooltipView = DisplayTextView.DisplayTextView.extend({
  tooltip : function() {
    return this.get("columnData."+this.get("columnDataKey")+".tooltip") || this.get("record"+this.get("columnData."+this.get("columnDataKey")+".tooltipKey")) || "";
  }.property("view.columnData"),

  template : Ember.Handlebars.compile('' +
    '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
  ''),
});

return {
  DisplayTextWithTooltipView : DisplayTextWithTooltipView,
};

});
