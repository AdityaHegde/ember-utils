/**
 * Module to show record in a tree format.
 *
 * @module tree
 */
define([
  "./nodeRecordMixin",
  "./tree-nodes/main",
  "./tree-column-data/main",
], function() {
  var Tree = Ember.Namespace.create();
  window.Tree = Tree;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Tree[k] = arguments[i][k];
      }
    }
  }

  return Tree;
});
