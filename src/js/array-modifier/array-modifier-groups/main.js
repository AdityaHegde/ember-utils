/**
 * Module to handle array modification like sorting, searching and filtering.
 *
 * @module array-modifier-groups
 */
define([
  "./arrayModGroup",
  "./arrayFilterGroup",
  "./arraySortGroup",
], function(ArrayModGroup, ArrayFilterGroup, ArraySortGroup) {
  var ArrayModGroup = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ArrayModGroup[k] = arguments[i][k];
      }
    }
  }

  ArrayModGroup.ArrayModGroupMap = {
    basic : ArrayModGroup.ArrayModGroup,
    filter : ArrayFilterGroup.ArrayFilterGroup,
    sort : ArraySortGroup.ArraySortGroup,
  };

  return ArrayModGroup;
});
