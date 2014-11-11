define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
  "./displayTextCollapsibleColumnDataMixin",
], function(Ember, Utils, ColumnData, GlobalModulesView, DisplayTextCollapsibleColumnDataMixin) {

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextCollapsibleGlypiconColumnDataMixin = Ember.Mixin.create(DisplayTextCollapsibleColumnDataMixin.DisplayTextCollapsibleColumnDataMixin, {
  //viewType : "displayTextCollapsibleGlypicon",

  /**
   * Glypicon class when open.
   *
   * @property glyphiconOpened
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconOpened : "glyphicon-chevron-down",

  /**
   * Glypicon class when collapsed.
   *
   * @property glyphiconCollapsed
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconCollapsed : "glyphicon-chevron-right",
});

return {
  DisplayTextCollapsibleGlypiconColumnDataMixin : DisplayTextCollapsibleGlypiconColumnDataMixin,
};

});
