define([
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
], function(Ember, Utils, DragDropGlobals) {

/***    Sortable ColumnData Interface    ***/

var SortableColumnDataGroup = Ember.Object.extend({
  sortableDragableClassNames : [],
  sortableDroppableClassNames : [],
  sortablePlaceholderClassNames : [],

  sortEleIdColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleId");
  }.property("parentObj.columns.@each.sort"),
  sortEleChildrenColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleChildren");
  }.property("parentObj.columns.@each.sort"),

  sortEleChildrenClassMap : function() {
    return Ember.get(this.get("sortEleChildrenClassMapName"));
  }.property("sortEleChildrenClassMapName"),
  sortEleChildrenClassMapName : null,
  sortEleChildrenClassColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleChildrenClass");
  }.property("parentObj.columns.@each.sort"),

  sortEleChildrenColumnGroupLookup : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleChildrenColumnGroup");
  }.property("parentObj.columns.@each.sort"),

  placeholderClass : function() {
    return Ember.get(this.get("placeholderClassName"));
  }.property("placeholderClassName"),
  placeholderClassName : "",

  sameLevel : false,
});

var SortableEleIdColumnData = Ember.Object.extend({
});

var SortableEleChildrenColumnData = Ember.Object.extend({
});

var SortableEleChildrenClassColumnData = Ember.Object.extend({
});

var SortableEleChildrenColumnGroup = Ember.Object.extend({
});

var SortableColumnDataMap = {
  sortEleId                  : SortableEleIdColumnData,
  sortEleChildren            : SortableEleChildrenColumnData,
  sortEleChildrenClass       : SortableEleChildrenClassColumnData,
  sortEleChildrenColumnGroup : SortableEleChildrenColumnGroup,
};

return {
  SortableColumnDataGroup : SortableColumnDataGroup,
  SortableColumnDataMap : SortableColumnDataMap,
};

});
