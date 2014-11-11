define([
  "ember",
  "./arrayModGroup",
], function(Ember, ArrayModGroup) {

/** 
 * Array filter modifier group which has ArrayMod.ArrayFilterModifier and ArrayMod.ArraySearchModifier
 *
 * @class ArrayMod.ArrayFilterGroup
 * @extends ArrayMod.ArrayModGroup
 * @module array-modifier
 * @submodule array-modifier-groups
 */
var ArrayFilterGroup = ArrayModGroup.ArrayModGroup.extend({
  type : "filter",

  canAdd : function(item) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      var value = item.get(arrayMods[i].get("property"));
      if(!arrayMods[i].modFun(item, value)) {
        return false;
      }
    }
    return true;
  },

  modify : function(array) {
    var that = this;
    return array.filter(function(item) {
      return that.canAdd(item);
    }, this);
  },

  modifySingle : function(array, item, idx) {
    if(this.canAdd(item)) {
      if(!array.contains(item)) {
        if(idx === -1) {
          array.pushObject(item);
        }
        else {
          array.insertAt(idx, item);
        }
      }
      return true;
    }
    else if(array.contains(item)) {
      array.removeObject(item);
    }
    return false;
  },
});

return {
  ArrayFilterGroup : ArrayFilterGroup,
};

});
