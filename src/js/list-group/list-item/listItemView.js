define([
  "ember",
], function(Ember) {

/**
 * Basic list item view.
 *
 * @class ListGroup.ListItemView
 * @module list-group
 * @submodule list-item
 */
var ListItemView = Ember.View.extend({
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

  classNames : ['list-group-item'],

  template : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '{{view view.columnDataGroup.list.titleLookup record=view.record columnData=view.columnDataGroup.list.titleColumnData ' +
                                                   'tagName=view.columnDataGroup.list.titleColumnData.list.tagName columnDataKey="list"}}' +
      '{{view view.columnDataGroup.list.rightBlockLookup record=view.record columnData=view.columnDataGroup.list.rightBlockColumnData ' +
                                                        'tagName=view.columnDataGroup.list.rightBlockColumnData.list.tagName columnDataKey="list"}}' +
    '</h4>' +
    '{{view view.columnDataGroup.list.descLookup record=view.record columnData=view.columnDataGroup.list.descColumnData ' +
                                                'tagName=view.columnDataGroup.list.descColumnData.list.tagName columnDataKey="list"}}' +
  ''),
});

return {
  ListItemView : ListItemView,
};

});
