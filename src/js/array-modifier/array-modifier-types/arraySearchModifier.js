define([
  "ember",
  "./arrayFilterModifier",
], function(Ember, ArrayFilterModifier) {

/**
 * Class to search for a string in the array elements.
 *
 * @class ArrayMod.ArraySearchModifier
 * @extends ArrayMod.ArrayFilterModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArraySearchModifier = ArrayFilterModifier.ArrayFilterModifier.extend({
  type : "search",

  /**
   * Search string.
   *
   * @property searchString
   * @type String
   */
  searchString : "",

  /**
   * If set to true, all elements matching searchString will be removed, else all elements not matching searchString will be removed.
   *
   * @property negate
   * @type Boolean
   * @default false
   */
  negate : false,

  /**
   * Search string regex object.
   *
   * @property searchRegex
   * @type RegEx
   * @private
   */
  searchRegex : function() {
    var searchString = this.get("searchString") || "";
    searchString = searchString.replace(/([\.\[\]\?\+\*])/g, "\\$1");
    return new RegExp(searchString, "i");
  }.property('searchString'),

  modFun : function(item, value) {
    var negate = this.get("negate"), filter = this.get("searchRegex").test(value)
    return (negate && !filter) || (!negate && filter);
  },

  addModObservers : function(context, method) {
    this._super();
    //handle this seperately
    Ember.addObserver(this, "searchString", context, method+"_each");
    Ember.addObserver(this, "negate", context, method+"_each");
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "searchString", context, method+"_each");
    Ember.removeObserver(this, "negate", context, method+"_each");
  },
});

return {
  ArraySearchModifier : ArraySearchModifier,
};

});
