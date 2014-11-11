define([
  "ember",
], function(Ember) {

/**
 * Base class for array modifier
 *
 * @class ArrayMod.ArrayModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArrayModifier = Ember.Object.extend({
  /**
   * Type of the array modifier.
   *
   * @property type
   * @type String
   * @default "basic"
   * @readonly
   */
  type : "basic",

  /**
   * Array modifier group type the modifier belongs to.
   *
   * @property groupType
   * @type String
   * @default "basic"
   * @readonly
   */
  groupType : "basic",

  /**
   * Property the modifier applies on.
   *
   * @property property
   * @type String
   */
  property : "",

  /**
   * Set to true if a listener on all objects in the array should be added.
   *
   * @property addObserverToAll
   * @type Boolean
   * @default true
   */
  addObserverToAll : true,

  /**
   * Function called when observers are supposed to be added.
   *
   * @method addModObservers
   * @param {Class} context Context to add the observer to.
   * @param {String|Function} method Method to be called when observer is called.
   */
  addModObservers : function(context, method) {
    Ember.addObserver(this, "property", context, method);
  },

  /**
   * Function called when observers are supposed to be removed.
   *
   * @method removeModObservers
   * @param {Class} context Context to add the observer to.
   * @param {String|Function} method Method to be called when observer is called.
   */
  removeModObservers : function(context, method) {
    Ember.removeObserver(this, "property", context, method);
  },
});

return {
  ArrayModifier : ArrayModifier,
};

});
