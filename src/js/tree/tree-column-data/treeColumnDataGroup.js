define([
  "ember",
  "../../global-module/main",
  "../tree-nodes/main",
], function(Ember, GlobalModules, TreeNode) {

/**
 * A column data group for the tree module.
 *
 * @class Tree.TreeColumnDataGroup
 * @module tree
 * @submodule tree-column-data
 */
var TreeColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "tree",
  modules : ["leftBar", "label", "node"],
  lookupMap : TreeNode.NameToLookupMap,

  /**
   * Type of left bar view.
   *
   * @property leftBarType
   * @type String
   * @default "displayText"
   */
  //leftBarType : "displayTextCollapsibleGlypicon",

  /**
   * Type of label view.
   *
   * @property labelType
   * @type String
   * @default "displayText"
   */
  //labelType : "displayText",

  /**
   * Type of node view.
   *
   * @property nodeType
   * @type String
   * @default "displayText"
   */
  //nodeType : "node",
});

return {
  TreeColumnDataGroup : TreeColumnDataGroup,
};

});
