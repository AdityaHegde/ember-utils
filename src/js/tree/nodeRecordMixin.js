define([
  "ember",
], function(Ember) {

/**
 * Mixin to define behaviour of a record in the tree module.
 *
 * @class Tree.NodeRecordMixin
 */
var NodeRecordMixin = Ember.Mixin.create(Ember.ActionHandler, {
  /**
   * Array of children records.
   *
   * @property children
   */
  children : null,

  columnDataGroup : function() {
    var nodeColumnData = this.get("parentObj.columnDataGroup.tree.nodeColumnData");
    if(nodeColumnData) {
      return ColumnData.Registry.retrieve(this.get(nodeColumnData.get("key")), "columnDataGroup");
    }
    return null;
  }.property("parentObj.columnDataGroup"),
});

return {
  NodeRecordMixin : NodeRecordMixin,
};

});
