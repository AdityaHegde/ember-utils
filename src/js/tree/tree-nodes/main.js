/**
 * Different node views.
 *
 * @module tree
 * @submodule tree-nodes
 */
define([
  "../../global-module/main",
  "./nodeView",
  "./leafView",
], function(GlobalModules) {
  var TreeNodes = Ember.Namespace.create();

  for(var i = 1; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        TreeNodes[k] = arguments[i][k];
      }
    }
  }

  TreeNodes.NameToLookupMap = {
    "node" : "tree/node",
    "leaf" : "tree/leaf",
  };
  GlobalModules.GlobalModulesMap.node = "tree/node";
  GlobalModules.GlobalModulesMap.leaf = "tree/leaf";

  return TreeNodes;
});
