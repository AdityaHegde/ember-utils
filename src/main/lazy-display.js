LazyDisplay = Ember.Namespace.create();

LazyDisplay.LazyDisplayConfig = Ember.Object.extend({
  rowHeight : 50,
  rowBuffer : 50,
  rowLoadDelay : 150,

  passKeys : [],
  passValuePaths : [],

  lazyDisplayMainClass : null,
});

LazyDisplay.LazyDisplay = Ember.ContainerView.extend({
  //scrolling is on this
  //NOTE : style for scrolling is not there in itself, need to add class for that
  init : function() {
    this._super();
    var lazyDisplayConfig = this.get("lazyDisplayConfig") || LazyDisplay.LazyDisplayConfig.create();
    this.pushObject(LazyDisplay.LazyDisplayHeightWrapperView.create({
    //TODO : bind the vars. not needed for now though.
      rows : this.get("rows"),
      lazyDisplayConfig : lazyDisplayConfig,
    }));
  },
  rows : null,
  rowsDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),
  lazyDisplayConfig : null,

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

LazyDisplay.LazyDisplayHeightWrapperView = Ember.ContainerView.extend({
  //this is to set the height to the actual height before the views corresponding to the rows are loaded
  init : function() {
    this._super();
    this.pushObject(LazyDisplay.LazyDisplayScrollView.create({
    //TODO : bind the vars. not needed for now though.
      rows : this.get("rows"),
      lazyDisplayConfig : this.get("lazyDisplayConfig"),
      lazyDisplayHeightWrapper : this,
    }));
  },
  lazyDisplayConfig : null,
  rows : null,
  rowsValueDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),

  attributeBindings : ['style'],
  style : function() {
    return "height:" + this.get("lazyDisplayConfig.rowHeight") * this.get("rows.length") + "px;";
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

LazyDisplay.LazyDisplayScrollView = Ember.ContainerView.extend({
  //table with the actual rows
  init : function() {
    this._super();
    var lazyDisplayConfig = this.get("lazyDisplayConfig"),
        passValuePaths = lazyDisplayConfig.get("passValuePaths"),
        passKeys = lazyDisplayConfig.get("passKeys"),
        lazyDisplayMainData = {
          rows : this.get("rows"),
          lazyDisplayConfig : lazyDisplayConfig,
          lazyDisplayHeightWrapper : this.get("lazyDisplayHeightWrapper"),
        }, lazyDisplayMainObj;
    for(var i = 0; i < passValuePaths.length; i++) {
      ROSUI.addObserver(passValuePaths[i], this, "passValueDidChange");
      lazyDisplayMainData[passKeys[i]] = Ember.get(passValuePaths[i]);
    }
    lazyDisplayMainObj = Ember.get(lazyDisplayConfig.get("lazyDisplayMainClass")).create(lazyDisplayMainData);
    this.pushObject(lazyDisplayMainObj);
  },
  classNames : ['table', 'table-striped', 'main-table'],
  tagName : "table",

  lazyDisplayConfig : null,
  lazyDisplayHeightWrapper : null,
  rows : null,
  rowsValueDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),

  passValueDidChange : function(obj, key) {
    var lazyDisplayConfig = this.get("lazyDisplayConfig"),
        passValuePaths = lazyDisplayConfig.get("passValuePaths"),
        passKeys = lazyDisplayConfig.get("passKeys"),
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

LazyDisplay.LazyDisplayMainMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  rows : null,
  lazyDisplayHeightWrapper : null,

  arrayProps : ['rows'],

  rowsWillBeDeleted : function(deletedRows, idxs) {
    if(this.get("state") === "destroying") return;
    var rowViews = this.filter(function(e, i, a) {
      return deletedRows.findBy("id", e.get("row.id"));
    }), that = this;
    if(rowViews.length) {
      //this.removeObjects(rowViews);
      this.rerenderRows(deletedRows);
    }
    AsyncQue.addToQue("lazyload", 100).then(function() {
      that.get("lazyDisplayHeightWrapper").rowsDidChange();
    });
  },

  rowsWasAdded : function(addedRows, idxs) {
    if(this.get("state") === "destroying") return;
    var that = this;
    //this.beginPropertyChanges();
    for(var i = 0; i < addedRows.length; i++) {
      var row = addedRows[i], rowView = this.findBy("row.id", row.get("id")),
          that = this, canShow = this.canShowRow(idxs[i]);
      if(rowView && !Ember.isEmpty(row.get("id"))) {
        this.removeObject(rowView);
      }
      if(canShow === 0) {
        rowView = this.getRowView(row);
      }
      else if(canShow === -1) {
        rowView = this.getDummyView(row);
      }
      else {
        break;
      }
      this.insertAt(idxs[i], rowView);
    }
    //this.endPropertyChanges();
    AsyncQue.addToQue("lazyload", 100).then(function() {
      that.get("lazyDisplayHeightWrapper").rowsDidChange();
    });
  },

  rerenderRows : function(ignoreRows) {
    if(this.get("state") === "destroying") return;
    ignoreRows = ignoreRows || [];
    var rows = this.get("rows"), length = rows.get("length"), j = 0,
        userType = this.get("userType"), columnData = this.get("columnData");
    for(var i = 0; i < length; i++) {
      var cview = this.objectAt(j), canShow = this.canShowRow(j),
          rowObj = rows.objectAt(i);
      if(ignoreRows.contains(rowObj)) {
        if(cview) this.removeObject(cview);
        continue;
      }
      if(canShow === 0 && (!cview || cview.rowType === 0)) {
        var row = this.getRowView(rowObj);
        if(cview) {
          this.removeAt(j);
          this.insertAt(j, row);
        }
        else {
          this.pushObject(row);
        }
      }
      else if(canShow === -1 && !cview) {
        this.insertAt(j, this.getDummyView(rowObj));
      }
      j++;
    }
  },

  scrollTop : 0,
  scrollTopDidChange : function() {
    var that = this;
    AsyncQue.addToQue("lazyload", this.get("lazyDisplayConfig.rowLoadDelay")).then(function() {
      that.rerenderRows();
    });
  }.observes("scrollTop", "view.scrollTop"),
  scroll : function(scrollTop) {
    this.set("scrollTop", scrollTop);
  },

  height : 0,
  heightDidChange : function() {
    var that = this;
    AsyncQue.addToQue("lazyload", this.get("lazyDisplayConfig.rowLoadDelay")).then(function() {
      that.rerenderRows();
    });
  }.observes("height", "view.height"),
  resize : function(height) {
    this.set("height", height);
  },

  canShowRow : function(idx) {
    var rows = this.get("rows"), length = rows.get("length"),
        scrollTop = this.get("scrollTop"), height = this.get("height"),
        lazyDisplayConfig = this.get("lazyDisplayConfig"),
        rowHeight = lazyDisplayConfig.get("rowHeight"),
        rowBuffer = lazyDisplayConfig.get("rowBuffer"),
        scrollLength = Math.round(scrollTop / rowHeight - rowBuffer),
        heightLength = height / rowHeight + 2*rowBuffer;
    //console.log(scrollTop + ".." + height + ".." + idx + ".." + scrollLength + ".." + heightLength + "..retval.." + 
    //            (idx < scrollLength ? -1 : (idx >= scrollLength && idx < scrollLength + heightLength ? 0: 1)));
    if(idx < scrollLength) return -1;
    if(idx >= scrollLength && idx < scrollLength + heightLength) return 0;
    if(idx >= scrollLength + heightLength) return 1;
    return 0;
  },
});

LazyDisplay.LazyDisplayDummyRow = Ember.Mixin.create({
  rowType : 0,
});

LazyDisplay.LazyDisplayRow = Ember.Mixin.create({
  rowType : 1,
});
