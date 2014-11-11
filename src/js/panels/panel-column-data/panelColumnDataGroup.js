define([
  "ember",
  "../../global-module/main",
  "../panel-views/main",
], function(Ember, GlobalModules, PanelViews) {

/**
 * A column data group for the panels module.
 *
 * @class Panels.PanelColumnDataGroup
 * @module panels
 * @submodule panel-column-data
 */
var PanelColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "panel",
  modules : ["heading", "body", "footer"],
  lookupMap : PanelViews.NameToLookupMap,

  /**
   * Type of heading view.
   *
   * @property headingType
   * @type String
   * @default "displayText"
   */
  //headingType : "displayText",

  /**
   * Type of body view.
   *
   * @property bodyType
   * @type String
   * @default "displayText"
   */
  //bodyType : "displayText",

  /**
   * Type of footer view.
   *
   * @property footerType
   * @type String
   */
  //footerType : "",
});

return {
  PanelColumnDataGroup : PanelColumnDataGroup,
};

});
