define([
  "ember",
  "./lazyDisplayColumnDataGroup",
  "./lazyDisplayHeightWrapperView",
], function(Ember, LazyDisplayColumnDataGroup, LazyDisplayHeightWrapperView) {

/**
 * Main view to be used in the templates.
 *
 * @class LazyDisplay.LazyDisplayView
 */
var LazyDisplayView = Ember.ContainerView.extend({
  //scrolling is on this
  init : function() {
    this._super();
    var columnDataGroup = this.get("columnDataGroup") || LazyDisplayColumnDataGroup.LazyDisplayColumnDataGroup.create();
    this.pushObject(LazyDisplayHeightWrapperView.LazyDisplayHeightWrapperView.create({
      rows : this.get("rows"),
      columnDataGroup : columnDataGroup,
      classNames : columnDataGroup.get("lazyDisplay.lazyDisplayHeightWrapperClasses"),
    }));
  },
  
  /**
   * The rows to be displayed lazily.
   *
   * @property rows
   * @type Array
   */
  rows : null,
  rowsDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),
  
  /**
   * The column data group which will serve as a config for lazy display.
   *
   * @property rows
   * @type Array
   */
  columnDataGroup : null,
  columnDataGroupDidChange : function() {
    this.objectAt(0).set("columnDataGroup", columnDataGroup);
  }.observes('view.columnDataGroup', 'columnDataGroup'),

  classNames : ['lazy-display'],

  didInsertElement : function() {
    var ele = $(this.get("element")), childView = this.objectAt(0);
    ele.scroll(this, this.scroll);
    ele.resize(this, this.resize);
    if(childView) {
      Ember.run(function() {
        childView.scroll(ele.scrollTop());
        childView.resize(ele.height());
      });
    }
  },

  scroll : function(e) {
    var that = e.data, childView = that.objectAt(0),
        ele = $(that.get("element"));
    if(childView) {
      Ember.run(function() {
        childView.scroll(ele.scrollTop());
      });
    }
  },

  resize : function(e) {
    var that = e.data, childView = that.objectAt(0),
        ele = $(that.get("element"));
    if(childView) {
      Ember.run(function() {
        childView.resize(ele.height());
      });
    }
  },

});

return {
  LazyDisplayView : LazyDisplayView,
};

});
