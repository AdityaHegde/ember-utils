define([
  "ember",
  "../array-modifier-types/main",
  "lib/ember-utils-core",
], function(Ember, ArrayModType, Utils) {

/** 
 * Basic array modifier group.
 *
 * @class ArrayMod.ArrayModGroup
 * @module array-modifier
 * @submodule array-modifier-groups
 */
var ArrayModGroup = Ember.Object.extend(Utils.ObjectWithArrayMixin, {
  type : "basic",

  /**
   * Array modifiers present in the group. Use object while creating.
   *
   * @property arrayMods
   * @type Array
   */
  arrayMods : Utils.hasMany(ArrayModType.ArrayModMap, "type"),

  arrayProps : ['arrayMods'],
  idx : 0,

  /**
   * Method that returns whether an item can be added or not.
   *
   * @method canAdd
   * @param {Class} item Item that is to be checked whether it can be added or not.
   * @returns {Boolean}
   */
  canAdd : function(item) {
    return true;
  },

  modify : function(array) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      array = arrayMods[i].modify(array);
    }
    return array;
  },
});

return {
  ArrayModGroup : ArrayModGroup,
};

});
