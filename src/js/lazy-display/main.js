/**
 * A module to selective load views for a very large set of records. Will load the views around the point of view.
 *
 * @module lazy-display
 */
define([
  "./lazyDisplayColumnDataGroup",
  "./lazyDisplayView",
  "./lazyDisplayHeightWrapperView",
  "./lazyDisplayScrollView",
  "./lazyDisplayMainMixin",
], function() {
  var LazyDisplay = Ember.Namespace.create();
  window.LazyDisplay = LazyDisplay;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        LazyDisplay[k] = arguments[i][k];
      }
    }
  }

  return LazyDisplay;
});
