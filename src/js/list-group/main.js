/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module list-group
 */
define([
  "./listGroupView",
  "./list-item/main",
  "./list-column-data/main",
], function() {
  var ListGroup = Ember.Namespace.create();
  window.ListGroup = ListGroup;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ListGroup[k] = arguments[i][k];
      }
    }
  }

  return ListGroup;
});
