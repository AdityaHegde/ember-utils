define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
  "./displayTextWithTooltipColumnDataMixin",
], function(Ember, Utils, ColumnData, GlobalModulesView, DisplayTextWithTooltipColumnDataMixin) {

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextCollapsibleColumnDataMixin = Ember.Mixin.create(DisplayTextWithTooltipColumnDataMixin.DisplayTextWithTooltipColumnDataMixin, {
  //viewType : "displayTextCollapsible",
});

return {
  DisplayTextCollapsibleColumnDataMixin : DisplayTextCollapsibleColumnDataMixin,
};

});
