/**
 * Column data interface for tree.
 *
 * @module tree
 * @submodule tree-column-data
 */
define([
  "./treeColumnDataGroup",
  "./treeColumnData",
], function() {
  var TreeColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        TreeColumnData[k] = arguments[i][k];
      }
    }
  }

  return TreeColumnData;
});
