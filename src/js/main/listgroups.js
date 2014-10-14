ListGroup = Ember.Namespace.create();

ListGroup.ListGroupView = Ember.View.extend({
  list : null,
  columnDataGroup : null,
  classNames : ['list-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.list}}' +
        '{{view thatView.columnDataGroup.list.typeLookup record=this columnDataGroup=thatView.columnDataGroup}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});


/***   ListItems   ***/

ListGroup.ListItemView = Ember.View.extend({
  record : null,
  columnDataGroup : null,
  classNames : ['list-group-item'],

  template : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '{{view view.columnDataGroup.list.titleLookup record=view.record columnData=view.columnDataGroup.list.titleColumnData}}' +
      '{{view view.columnDataGroup.list.rightBlockLookup record=view.record columnData=view.columnDataGroup.list.rightBlockColumnData}}' +
    '</h4>' +
    '{{view view.columnDataGroup.list.descLookup record=view.record columnData=view.columnDataGroup.list.descColumnData}}' +
  ''),
});


/***   ListTitle   ***/

ListGroup.ListTitleView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  record : null,
  columnData : null,

  tagName : "span",
  classNames : ['group-item-name'],

  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});


/***   ListRightBlock   ***/

ListGroup.ListRightBlockView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  record : null,
  columnData : null,

  classNames : ['pull-right', 'text-right'],

  template : Ember.Handlebars.compile('' +
    '<span class="glyphicon glyphicon-pencil"></span>' +
  ''),
});


/***   ListDesc   ***/

ListGroup.ListDescView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  record : null,
  columnData : null,

  tagName : "p",
  classNames : ['list-group-item-text'],

  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});


/***   Name to Lookup map  ***/

ListGroup.NameToLookupMap = {
  list : {
    "base" : "listGroup/listItem",
  },
  title : {
    "base" : "listGroup/listTitle",
  },
  rightBlock : {
    "base" : "listGroup/listRightBlock",
  },
  desc : {
    "base" : "listGroup/listDesc",
  },
};


/***   ListColumnInterface   ***/

ListGroup.ListColumnDataGroup = Ember.Object.extend(ColumnData.ColumnDataGroupPluginMixin, {
  groupType : "list",
  modules : ["title", "rightBlock", "desc"],
  lookupMap : ListGroup.NameToLookupMap,
});

ListGroup.ListTitleColumnData = Ember.Object.extend({
});

ListGroup.ListRightBlockColumnData = Ember.Object.extend({
});

ListGroup.ListDescColumnData = Ember.Object.extend({
});

ListGroup.ListColumnDataMap = {
  title : ListGroup.ListTitleColumnData,
  rightBlock : ListGroup.ListRightBlockColumnData,
  desc : ListGroup.ListDescColumnData,
};
