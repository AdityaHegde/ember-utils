define([
  "ember",
], function(Ember) {

/**
 * Column data for the list group modules (title, rightBlock or desc based on 'type')
 *
 * @class ListGroup.ListColumnData
 * @module list-group
 * @submodule list-column-data
 */
var ListColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

var ListTitleColumnData = ListColumnData.extend({
  tagName : "span",
  classNames : ['group-item-name'],
});

var ListRightBlockColumnData = ListColumnData.extend({
  tagName : "div",
  classNames : ['pull-right', 'text-right'],
});

var ListDescColumnData = ListColumnData.extend({
  tagName : "p",
  classNames : ['list-group-item-text'],
});

var ListColumnDataMap = {
  title      : ListTitleColumnData,
  rightBlock : ListRightBlockColumnData,
  desc       : ListDescColumnData,
};

return {
  ListColumnData           : ListColumnData,
  ListTitleColumnData      : ListTitleColumnData,
  ListRightBlockColumnData : ListRightBlockColumnData,
  ListDescColumnData       : ListDescColumnData,
  ListColumnDataMap        : ListColumnDataMap,
};

});
