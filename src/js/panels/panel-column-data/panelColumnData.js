define([
  "ember",
  "../../global-module/main",
  "../panel-views/main",
], function(Ember, GlobalModules) {

/**
 * Column data for the panels modules (heading, body and footer based on 'type')
 *
 * @class PanelGroup.PanelColumnData
 * @module panels
 * @submodule panel-column-data
 */
var PanelColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

var PanelHeadingColumnData = PanelColumnData.extend({
  tagName : "h3",
  classNames : ["panel-title"],
});

var PanelBodyColumnData = PanelColumnData.extend({
});

var PanelFooterColumnData = PanelColumnData.extend({
});

var PanelColumnDataMap = {
  heading : PanelHeadingColumnData,
  body    : PanelBodyColumnData,
  footer  : PanelFooterColumnData,
};

return {
  PanelColumnData        : PanelColumnData,
  PanelHeadingColumnData : PanelHeadingColumnData,
  PanelBodyColumnData    : PanelBodyColumnData,
  PanelFooterColumnData  : PanelFooterColumnData,
  PanelColumnDataMap     : PanelColumnDataMap,
};

});
