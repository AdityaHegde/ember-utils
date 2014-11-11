define([
  "ember",
], function(Ember) {

/**
 * Basic panel view.
 *
 * @class Panels.PanelView
 * @module panels
 * @submodule panel-views
 */
var PanelView = Ember.View.extend({
  /**
   * The record that holds all the data.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel', 'panel-default'],

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData ' +
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div class="panel-body">' +
      '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData ' +
                                                   'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '{{#if view.columnDataGroup.panel.footerColumnData}}' +
      '<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData ' +
                                                       'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>' +
    '{{/if}}' +
  ''),
});

return {
  PanelView : PanelView,
};

});
