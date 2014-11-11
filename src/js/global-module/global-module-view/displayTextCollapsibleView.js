define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "./displayTextWithTooltipView",
], function(Ember, Utils, ColumnData, DisplayTextWithTooltipView) {

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleView
 * @extends GlobalModules.DisplayTextWithTooltipView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextCollapsibleView = DisplayTextWithTooltipView.DisplayTextWithTooltipView.extend({
  groupId : null,
  groupIdHref : function() {
    return "#"+this.get("groupId");
  }.property('view.groupId'),
  collapseId : null,
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
    '</a>' +
  ''),
});

return {
  DisplayTextCollapsibleView : DisplayTextCollapsibleView,
};

});
