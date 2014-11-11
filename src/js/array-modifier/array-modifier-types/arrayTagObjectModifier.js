define([
  "ember",
  "lib/ember-utils-core",
  "./arrayFilterModifier",
], function(Ember, Utils, ArrayFilterModifier) {

/**
 * Class for a tag. Never used directly. Passed as an object to ArrayMod.ArrayTagSearchModifier.
 *
 * @class ArrayMod.TagObject
 * @module array-modifier
 * @submodule array-modifier-types
 */
var TagObject = Ember.Object.extend({
  /**
   * Label for the tag.
   *
   * @property label
   * @type String
   */
  label : "",

  /**
   * Value for the tag.
   *
   * @property val
   * @type String
   */
  val : "",

  /**
   * Checked boolean.
   *
   * @property checked
   * @type Boolean
   * @default true
   */
  checked : true,

  /**
   * If set to true, val will be not taken if checked, else val will be taken if checked.
   *
   * @property negate
   * @type Boolean
   * @default false
   */
  negate : false,
});

/**
 * Class to filter elements based on tags.
 *
 * @class ArrayMod.ArrayTagSearchModifier
 * @extends ArrayMod.ArrayFilterModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArrayTagSearchModifier = ArrayFilterModifier.ArrayFilterModifier.extend({
  type : "tagSearch",

  /**
   * Tags to filter with. Elements are ArrayMod.TagObject instances. But passed as objects while creating.
   *
   * @property tags
   */
  tags : Utils.hasMany(TagObject),

  /**
   * Tags that are taken.
   *
   * @property selectedTags
   */
  selectedTags : Ember.computed.filterBy("tags", "checked", true),

  /**
   * Joiner for the tags. Can be "or" or "and".
   *
   * @property joiner
   * @type String
   * @default "or"
   */
  joiner : "or",

  modFun : function(item, value) {
    var tags = this.get("selectedTags"), joiner = this.get("joiner") == "and", bool = joiner;
    for(var i = 0; i < tags.length; i++) {
      var res = value == tags[i].get("val"), tagNegate = tags[i].get("negate");
      res = (tagNegate && !res) || (!tagNegate && res);
      bool = (joiner && (bool && res)) || (!joiner && (bool || res));
    }
    return bool;
  },

  addModObservers : function(context, method) {
    this._super();
    //handle this seperately
    Ember.addObserver(this, "selectedTags.@each.val",    context, method+"_each");
    Ember.addObserver(this, "selectedTags.@each.negate", context, method+"_each");
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "selectedTags.@each.val",    context, method+"_each");
    Ember.removeObserver(this, "selectedTags.@each.negate", context, method+"_each");
  },
});

return {
  ArrayTagSearchModifier : ArrayTagSearchModifier,
};

});
