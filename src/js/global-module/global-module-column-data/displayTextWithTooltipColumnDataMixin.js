define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
  "./displayTextColumnDataMixin",
], function(Ember, Utils, ColumnData, GlobalModulesView, DisplayTextColumnDataMixin) {

/**
 * Column Data for display text with tooltip module.
 *
 * @class GlobalModules.DisplayTextWithTooltipColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextWithTooltipColumnDataMixin = Ember.Mixin.create(DisplayTextColumnDataMixin.DisplayTextColumnDataMixin, {
  //viewType : "displayTextWithTooltip",

  /**
   * Static tooltip for the module.
   *
   * @property tooltip
   * @type String
   */
  //tooltip : null,

  /**
   * Key to the value on the record for dynamic tooltip.
   *
   * @property tooltipKey
   * @type String
   */
  //tooltipKey : null,
});

return {
  DisplayTextWithTooltipColumnDataMixin : DisplayTextWithTooltipColumnDataMixin,
};

});
