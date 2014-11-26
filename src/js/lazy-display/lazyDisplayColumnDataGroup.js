define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Class for each pass value entry
 *
 * @class LazyDisplay.PassValueObject
 */
var PassValueObject = Ember.Object.extend({
  /**
   * Value to get from for passing values.
   *
   * @property srcObj
   * @type String|Instance
   */
  srcObj : null,

  /**
   * Key within the srcObj to get value from.
   *
   * @property srcKey
   * @type String
   */
  srcKey : "",

  /**
   * Key in the main view to put value to.
   *
   * @property tarKey
   * @type String
   */
  tarKey : "",
});

/**
 * A column data group for the lazy display module.
 *
 * @class LazyDisplay.LazyDisplayColumnDataGroup
 */
var LazyDisplayColumnDataGroup = Ember.Object.extend({
  /**
   * Height of each row.
   *
   * @property rowHeight
   * @type Number
   * @default 50
   */
  rowHeight : 50,

  /**
   * Number of extra rows to load past the area of view.
   *
   * @property rowBuffer
   * @type Number
   * @default 50
   */
  rowBuffer : 50,

  /**
   * Timeout after which the async-que job to load views past the area of view.
   *
   * @property rowLoadDelay
   * @type Number
   * @default 150
   */
  rowLoadDelay : 150,

  /**
   * Array of values to pass to the main view.
   *
   * @property passValues
   * @type Array
   */
  passValues : Utils.hasMany(PassValueObject),

  /**
   * View for the lazy display main which has the rows.
   *
   * @property lazyDisplayMainClass
   * @type String|Class
   */
  lazyDisplayMainClass : null,

  /**
   * Addtional class name for the lazyDisplayHeightWrapper view.
   *
   * @property lazyDisplayHeightWrapperClasses
   * @type Array
   */
  lazyDisplayHeightWrapperClasses : [],

  /**
   * View for the lazy display main which has the rows.
   *
   * @property lazyDisplayScrollViewClasses
   * @type Array
   */
  lazyDisplayScrollViewClasses : [],
});

return {
  LazyDisplayColumnDataGroup : LazyDisplayColumnDataGroup,
};

});
