/**
 * Array modifier types
 *
 * @submodule array-modifier-types
 * @module array-modifier
 */
define([
  "./arrayModifier",
  "./arrayFilterModifier",
  "./arraySearchModifier",
  "./arrayTagObjectModifier",
  "./arraySortModifier",
], function(ArrayModifier, ArrayFilterModifier, ArraySearchModifier, ArrayTagSearchModifier, ArraySortModifier) {
  var ArrayModTypes = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ArrayModTypes[k] = arguments[i][k];
      }
    }
  }
  ArrayModTypes.ArrayModMap = {
    basic : ArrayModifier.ArrayModifier,
    filter : ArrayFilterModifier.ArrayFilterModifier,
    search : ArraySearchModifier.ArraySearchModifier,
    tagSearch : ArrayTagSearchModifier.ArrayTagSearchModifier,
    sort : ArraySortModifier.ArraySortModifier,
  };

  return ArrayModTypes;
});
