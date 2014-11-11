define([
  "ember",
], function(Ember) {

/**
 * A view for a set of panels.
 *
 * @class Panels.PanelsView
 */
var PanelsView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property panels
   * @type Array
   */
  panels : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.panels}}' +
        '{{view thatView.columnDataGroup.panel.viewLookup record=this columnDataGroup=thatView.columnDataGroup groupId=thatView.elementId}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

return {
  PanelsView : PanelsView,
};

});
