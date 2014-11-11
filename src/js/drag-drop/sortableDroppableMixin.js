define([
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
  "./droppableMixin",
  "../column-data/main",
], function(Ember, Utils, DragDropGlobals, DroppableMixin, ColumnData) {

/**
 * Droppable mixin for the sortable component.
 *
 * @class DragDrop.SortableDroppableMixin
 */
var SortableDroppableMixin = Ember.Mixin.create(DroppableMixin.DroppableMixin, {
  init : function() {
    this._super();
    this.set("stateData", this.get("stateData") || {grpId : 0});
    //console.log("new droppable create!");
    this.sortEleChildrenDidChange();
  },

  classNames : ['dragdrop-sortable-container'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortableDroppableClassNames'),

  sortEleChildren : function() {
    return this.get("record."+this.get("columnDataGroup.sort.sortEleChildrenColumnData.key"));
  }.property("view.columnDataGroup.sort.sortEleChildrenColumnData", "view.record"),
  sortEleChildrenDidChange : function() {
    var sortEleChildren = this.get("sortEleChildren"), columnDataGroup = this.get("columnDataGroup"),
        thisLen = this.get("length"), newLen = sortEleChildren.length,
        replaceLen = (newLen < thisLen ? newLen : thisLen),
        addNewLen = newLen - replaceLen,
        i = 0;
        stateData = this.get("stateData"),
        sortEleChildrenClassMap = columnDataGroup.get("sort.sortEleChildrenClassMap"),
        sortEleChildrenClassColumnData = columnDataGroup.get("sort.sortEleChildrenClassColumnData"),
        sortEleChildrenColumnGroupLookup = columnDataGroup.get("sort.sortEleChildrenColumnGroupLookup");
    for(; i < replaceLen; i++) {
      this.objectAt(i).setProperties({
        record : sortEleChildren[i],
        columnDataGroup : ColumnData.Registry.retrieve(sortEleChildren[i].get(sortEleChildrenColumnGroupLookup.get("key")), "columnDataGroup"),
        stateData : stateData,
        sortableView : this,
      });
    }
    for(; i < addNewLen; i++) {
      this.pushObject(sortEleChildrenClassMap[sortEleChildren[i].get(sortEleChildrenClassColumnData.get("key"))].create({
        record : sortEleChildren[i],
        columnDataGroup : ColumnData.Registry.retrieve(sortEleChildren[i].get(sortEleChildrenColumnGroupLookup.get("key")), "columnDataGroup"),
        stateData : stateData,
        sortableView : this,
      }));
    }
    if(sortEleChildren.length === 0) {
      this.pushObject(columnDataGroup.get("sort.placeholderClass").create({
        record : this.get("record"),
        columnDataGroup : columnDataGroup,
        stateData : stateData,
        sortableView : this,
      }));
    }
  }.observes("view.sortEleChildren"),

  elesIsEmpty : Ember.computed.empty('sortEleChildren.@each'),
  groupId : 0,
  hierarchy : "",
  stateData : null,
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  isPlaceholder : false,
});

return {
  SortableDroppableMixin : SortableDroppableMixin,
};

});
