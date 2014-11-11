define([
  "ember",
  "./panelView",
], function(Ember, PanelView) {

/**
 * Panel view for a collapsible.
 *
 * @class Panels.PanelCollapsibleView
 * @extends Panels.PanelView
 * @module panels
 * @submodule panel-views
 */
var PanelCollapsibleView = PanelView.PanelView.extend({
  groupId : null,
  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property('view.elementId'),
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  isFirst : function() {
    var panels = this.get("parentView.panels");
    return !panels || panels.objectAt(0) === this.get("record");
  }.property("view.parentView.panels.@each", "view.record"),

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div {{bind-attr id="view.collapseId" class=":panel-collapse :collapse view.isFirst:in"}}>' +
      '<div class="panel-body">' +
        '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                     'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>' +
      '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                       'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>{{/if}}' +
    '</div>' +
  ''),
});

return {
  PanelCollapsibleView : PanelCollapsibleView,
};

});
