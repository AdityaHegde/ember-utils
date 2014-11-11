define([
  "ember",
], function(Ember) {

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

  passKeys : [],
  passValuePaths : [],

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
