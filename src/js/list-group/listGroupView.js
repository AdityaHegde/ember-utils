define([
  "ember",
], function(Ember) {

/**
 * A view for a list of records.
 *
 * @class ListGroup.ListGroupView
 */
var ListGroupView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property list
   * @type Array
   */
  list : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['list-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.list}}' +
        '{{view thatView.columnDataGroup.list.viewLookup record=this columnDataGroup=thatView.columnDataGroup}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

return {
  ListGroupView : ListGroupView,
};

});
