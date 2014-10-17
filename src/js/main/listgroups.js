/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module list-group
 */


ListGroup = Ember.Namespace.create();

/**
 * A view for a list of records.
 *
 * @class ListGroup.ListGroupView
 */
ListGroup.ListGroupView = Ember.View.extend({
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


/**
 * Different list item views.
 *
 * @module list-group
 * @submodule list-item
 */

/**
 * Basic list item view.
 *
 * @class ListGroup.ListItemView
 */
ListGroup.ListItemView = Ember.View.extend({
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


/***   Name to Lookup map  ***/

ListGroup.NameToLookupMap = {
  "base" : "listGroup/listItem",
};


/**
 * Column data interface for list item views.
 *
 * @module list-group
 * @submodule list-column-data
 */

/**
 * A column data group for the list group module.
 *
 * @class ListGroup.ListColumnDataGroup
 */
ListGroup.ListColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "list",
  modules : ["title", "rightBlock", "desc"],
  lookupMap : ListGroup.NameToLookupMap,

  /**
   * Type of title view.
   *
   * @property titleType
   * @type String
   * @default "displayText"
   */
  //titleType : "displayText",

  /**
   * Type of right block view.
   *
   * @property rightBlockType
   * @type String
   * @default "displayText"
   */
  //rightBlockType : "displayText",

  /**
   * Type of desc view.
   *
   * @property descType
   * @type String
   * @default "displayText"
   */
  //descType : "displayText",
});

/**
 * Column data for the list group modules (title, rightBlock or desc based on 'type')
 *
 * @class ListGroup.ListColumnData
 */
ListGroup.ListColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

ListGroup.ListTitleColumnData = ListGroup.ListColumnData.extend({
  tagName : "span",
  classNames : ['group-item-name'],
});

ListGroup.ListRightBlockColumnData = ListGroup.ListColumnData.extend({
  tagName : "div",
  classNames : ['pull-right', 'text-right'],
});

ListGroup.ListDescColumnData = ListGroup.ListColumnData.extend({
  tagName : "p",
  classNames : ['list-group-item-text'],
});

ListGroup.ListColumnDataMap = {
  title : ListGroup.ListTitleColumnData,
  rightBlock : ListGroup.ListRightBlockColumnData,
  desc : ListGroup.ListDescColumnData,
};
