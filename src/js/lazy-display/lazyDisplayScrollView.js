define([
  "ember",
], function(Ember) {

var LazyDisplayScrollView = Ember.ContainerView.extend({
  //table with the actual rows
  init : function() {
    this._super();
    var columnDataGroup = this.get("columnDataGroup"),
        passValues = columnDataGroup.get("lazyDisplay.passValues"),
        lazyDisplayMainData = {
          rows : this.get("rows"),
          columnDataGroup : columnDataGroup,
          lazyDisplayHeightWrapper : this.get("lazyDisplayHeightWrapper"),
        }, lazyDisplayMainObj,
        mainClass = columnDataGroup.get("lazyDisplay.lazyDisplayMainClass");
    if(passValues) {
      for(var i = 0; i < passValues.length; i++) {
        var
        src = passValues[i].get("srcObj"),
        key = passValues[i].get("srcKey");
        if(src) {
          if(Ember.typeOf(src) === "string") {
            src = this.get("src");
          }
          Ember.addObserver(src, key, this, "passValueDidChange");
          lazyDisplayMainData[passValues[i].get("tarKey")] = src.get(key);
        }
      }
    }
    if(Ember.typeOf(mainClass) === "string") {
      mainClass = (this.container && this.container.lookup(mainClass)) || Ember.get(mainClass);
    }
    lazyDisplayMainObj = mainClass.create(lazyDisplayMainData);
    this.pushObject(lazyDisplayMainObj);
  },

  classNames : ['lazy-display-scroll-view'],

  columnDataGroup : null,
  lazyDisplayHeightWrapper : null,
  rows : null,
  rowsValueDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),

  passValueDidChange : function(obj, key) {
    var columnDataGroup = this.get("columnDataGroup"),
        passValuePaths = columnDataGroup.get("lazyDisplay.passValuePaths"),
        passKeys = columnDataGroup.get("lazyDisplay.passKeys"),
        idx = passValuePaths.findBy(key);
    this.objectAt(0).set(passKeys[idx], Ember.get(key));
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
  LazyDisplayScrollView : LazyDisplayScrollView,
};

});
