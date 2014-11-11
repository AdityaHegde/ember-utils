define([
  "ember",
  "./lazyDisplayScrollView",
], function(Ember, LazyDisplayScrollView) {

var LazyDisplayHeightWrapperView = Ember.ContainerView.extend({
  //this is to set the height to the actual height before the views corresponding to the rows are loaded
  init : function() {
    this._super();
    this.pushObject(LazyDisplayScrollView.LazyDisplayScrollView.create({
    //TODO : bind the vars. not needed for now though.
      rows : this.get("rows"),
      columnDataGroup : this.get("columnDataGroup"),
      lazyDisplayHeightWrapper : this,
      classNames : this.get("columnDataGroup.lazyDisplay.lazyDisplayScrollViewClasses"),
    }));
  },
  rows : null,
  rowsValueDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),
  columnDataGroup : null,
  columnDataGroupDidChange : function() {
    this.objectAt(0).set("columnDataGroup", columnDataGroup);
  }.observes('view.columnDataGroup', 'columnDataGroup'),

  classNames : ['lazy-display-height-wrapper'],

  attributeBindings : ['style'],
  style : function() {
    return "height:" + this.get("columnDataGroup.lazyDisplay.rowHeight") * this.get("rows.length") + "px;";
  }.property("view.rows.@each"),

  rowsDidChange : function() {
    this.notifyPropertyChange("style");
  },

  scroll : function(scrollTop) {
    var childView = this.objectAt(0),
        ele = $(this.get("element"));
    if(childView) {
      childView.scroll(scrollTop);
    }
  },

  resize : function(height) {
    var childView = this.objectAt(0),
        ele = $(this.get("element"));
    if(childView) {
      childView.resize(height);
    }
  },
});

return {
  LazyDisplayHeightWrapperView : LazyDisplayHeightWrapperView,
};

});
