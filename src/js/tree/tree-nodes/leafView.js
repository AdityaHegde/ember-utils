define([
  "ember",
  "./nodeView",
], function(Ember, NodeView) {

/**
 * Node view for a leaf node.
 *
 * @class Tree.LeafView
 * @module tree
 * @submodule tree-nodes
 */
var LeafView = NodeView.NodeView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="tree-node-leftbar leaf-node"></div>' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main :leaf-node"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),
});

return {
  LeafView : LeafView,
};

});
