define([
  "ember",
], function(Ember) {

/**
 * Node view for a non leaf node.
 *
 * @class Tree.NodeView
 * @module tree
 * @submodule tree-nodes
 */
var NodeView = Ember.View.extend({
  /**
   * Record for the node.
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

  classNames : ['tree-node'],

  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property("elementId"),

  collapsed : false,

  template : Ember.Handlebars.compile('' +
    '{{view view.columnDataGroup.tree.leftBarLookup record=view.record columnData=view.columnDataGroup.tree.leftBarColumnData collapseId=view.collapseId groupId=view.elementId ' +
                                                   'tagName=view.columnDataGroup.tree.leftBarColumnData.tree.tagName columnDataKey="tree" collapsed=view.collapsed}}' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
      '<div {{bind-attr id=view.collapseId class="view.columnDataGroup.tree.nodeChildrenClass :tree-node-children :collapse :in"}}>' +
        '{{#each view.record.children}}' +
          '{{view columnDataGroup.tree.nodeLookup record=this columnDataGroup=columnDataGroup}}' +
        '{{/each}}' +
      '</div>' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),

  didInsertElement : function() {
    var ele = $(this.get("element")).find(this.get("collapseIdSelector")), that = this;
    ele.on("shown.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", false);
      });
      e.stopPropagation();
    });
    ele.on("hidden.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", true);
      });
      e.stopPropagation();
    });
  },
});

return {
  NodeView : NodeView,
};

});
