define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "./displayTextCollapsibleView",
], function(Ember, Utils, ColumnData, DisplayTextCollapsibleView) {

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconView
 * @extends GlobalModules.DisplayTextCollapsibleView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextCollapsibleGlypiconView = DisplayTextCollapsibleView.DisplayTextCollapsibleView.extend({
  glyphiconCollapsed : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),
  glyphiconOpened : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),

  glyphicon : function() {
    return this.get( this.get("collapsed") ? "glyphiconCollapsed" : "glyphiconOpened" );
  }.property("view.collpased"),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}<span {{bind-attr class=":glyphicon view.glyphicon"}}></span>{{/tool-tip}}' +
    '</a>' +
  ''),
});

return {
  DisplayTextCollapsibleGlypiconView : DisplayTextCollapsibleGlypiconView,
};

});
