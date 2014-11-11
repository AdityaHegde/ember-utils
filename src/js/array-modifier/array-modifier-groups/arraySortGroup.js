define([
  "ember",
  "./arrayModGroup",
], function(Ember, ArrayModGroup) {

/** 
 * Array sort modifier group.
 *
 * @class ArrayMod.ArraySortGroup
 * @extends ArrayMod.ArrayModGroup
 * @module array-modifier
 * @submodule array-modifier-groups
 */
var Compare = function(a, b) {
  return a === b ? 0 : (a > b ? 1 : -1);
};
var ArraySortGroup = ArrayModGroup.ArrayModGroup.extend({
  type : "sort",

  compare : function(a, b) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      var av = a.get(arrayMods[i].get("property")),
          bv = b.get(arrayMods[i].get("property")),
          cmp = Compare(av, bv),
          order = arrayMods[i].get("order");
      if(!order) {
        cmp = -cmp;
      }
      if(cmp) {
        return cmp;
      }
      else {
        continue;
      }
    }
    return 0;
  },

  modify : function(array) {
    var that = this;
    return array.sort(function(a, b) {
      return that.compare(a, b);
    }, this);
  },

  modifySingle : function(array, item, idx) {
    var that = this;
    if(array.contains(item)) {
      array.removeObject(item);
    }
    Utils.binaryInsert(array, item, function(a, b) {
      return that.compare(a, b);
    });
    return true;
  },
});

return {
  ArraySortGroup : ArraySortGroup,
  Compare : Compare,
};

});
