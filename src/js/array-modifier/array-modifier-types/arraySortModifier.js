define([
  "ember",
  "./arrayModifier",
], function(Ember, ArrayModifier) {

/**
 * Class to sort elements in the array.
 *
 * @class ArrayMod.ArraySortModifier
 * @extends ArrayMod.ArrayModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArraySortModifier = ArrayModifier.ArrayModifier.extend({
  type : "sort",
  groupType : "sort",

  /**
   * Order to sort by. true for ascending, false for descending
   *
   * @property order
   * @type String
   * @default true
   */
  order : true,

  addObserverToAll : false,

  modify : function(array) {
    array.sortBy(this.get("property"));
    if(!this.get("order")) array.reverseObjects();
    return array;
  },

  addModObservers : function(context, method) {
    this._super();
    Ember.addObserver(this, "order", context, method);
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "order", context, method);
  },
});


return {
  ArraySortModifier : ArraySortModifier,
};

});
