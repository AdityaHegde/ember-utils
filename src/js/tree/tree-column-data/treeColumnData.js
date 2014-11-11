define([
  "ember",
], function(Ember) {

/**
 * Column data for the tree modules (leftBar, label or node based on 'type')
 *
 * @class Tree.TreeColumnData
 * @module tree
 * @submodule tree-column-data
 */
var TreeColumnData = Ember.Object.extend({
});

var TreeLeftBarColumnData = TreeColumnData.extend({
  classNames : ["tree-node-leftbar"],
});

var TreeLabelColumnData = TreeColumnData.extend({
  tagName : "h4",
  classNames : ['tree-node-name'],
});

var TreeNodeColumnData = TreeColumnData.extend({
});

var TreeColumnDataMap = {
  "leftBar" : TreeLeftBarColumnData,
  "label"   : TreeLabelColumnData,
  "node"    : TreeNodeColumnData,
};

return {
  TreeColumnData        : TreeColumnData,
  TreeLeftBarColumnData : TreeLeftBarColumnData,
  TreeLabelColumnData   : TreeLabelColumnData,
  TreeNodeColumnData    : TreeNodeColumnData,
  TreeColumnDataMap     : TreeColumnDataMap,
};

});
