/**
 * A module to selective load views for a very large set of records. Will load the views around the point of view.
 *
 * @module lazy-display
 */


LazyDisplay = Ember.Namespace.create();

/**
 * A column data group for the lazy display module.
 *
 * @class LazyDisplay.LazyDisplayColumnDataGroup
 */
LazyDisplay.LazyDisplayColumnDataGroup = Ember.Object.extend({
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

/**
 * Main view to be used in the templates.
 *
 * @class LazyDisplay.LazyDisplayView
 */
LazyDisplay.LazyDisplayView = Ember.ContainerView.extend({
  //scrolling is on this
  init : function() {
    this._super();
    var columnDataGroup = this.get("columnDataGroup") || LazyDisplay.LazyDisplayColumnDataGroup.create();
    this.pushObject(LazyDisplay.LazyDisplayHeightWrapperView.create({
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

LazyDisplay.LazyDisplayHeightWrapperView = Ember.ContainerView.extend({
  //this is to set the height to the actual height before the views corresponding to the rows are loaded
  init : function() {
    this._super();
    this.pushObject(LazyDisplay.LazyDisplayScrollView.create({
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

LazyDisplay.LazyDisplayScrollView = Ember.ContainerView.extend({
  //table with the actual rows
  init : function() {
    this._super();
    var columnDataGroup = this.get("columnDataGroup"),
        passValuePaths = columnDataGroup.get("lazyDisplay.passValuePaths"),
        passKeys = columnDataGroup.get("lazyDisplay.passKeys"),
        lazyDisplayMainData = {
          rows : this.get("rows"),
          columnDataGroup : columnDataGroup,
          lazyDisplayHeightWrapper : this.get("lazyDisplayHeightWrapper"),
        }, lazyDisplayMainObj,
        mainClass = columnDataGroup.get("lazyDisplay.lazyDisplayMainClass");
    for(var i = 0; i < passValuePaths.length; i++) {
      TestApp.addObserver(passValuePaths[i], this, "passValueDidChange");
      lazyDisplayMainData[passKeys[i]] = Ember.get(passValuePaths[i]);
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

LazyDisplay.LazyDisplayMainMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  rows : null,
  lazyDisplayHeightWrapper : null,

  classNames : ['lazy-display-main'],

  arrayProps : ['rows'],

  rowsWillBeDeleted : function(deletedRows, idxs) {
    if(this._state === "destroying") return;
    var rowViews = this.filter(function(e, i, a) {
      return deletedRows.findBy("id", e.get("row.id"));
    }), that = this;
    if(rowViews.length) {
      //this.removeObjects(rowViews);
      this.rerenderRows(deletedRows);
    }
    Timer.addToQue("lazyload", 100).then(function() {
      that.get("lazyDisplayHeightWrapper").rowsDidChange();
    });
  },

  rowsWasAdded : function(addedRows, idxs) {
    if(this._state === "destroying") return;
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
    Timer.addToQue("lazyload", 100).then(function() {
      that.get("lazyDisplayHeightWrapper").rowsDidChange();
    });
  },

  rerenderRows : function(ignoreRows) {
    if(this._state === "destroying") return;
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
    Timer.addToQue("lazyload", this.get("columnDataGroup.lazyDisplay.rowLoadDelay")).then(function() {
      that.rerenderRows();
    });
  }.observes("scrollTop", "view.scrollTop"),
  scroll : function(scrollTop) {
    this.set("scrollTop", scrollTop);
  },

  height : 0,
  heightDidChange : function() {
    var that = this;
    Timer.addToQue("lazyload", this.get("columnDataGroup.lazyDisplay.rowLoadDelay")).then(function() {
      that.rerenderRows();
    });
  }.observes("height", "view.height"),
  resize : function(height) {
    this.set("height", height);
  },

  canShowRow : function(idx) {
    var rows = this.get("rows"), length = rows.get("length"),
        scrollTop = this.get("scrollTop"), height = this.get("height"),
        columnDataGroup = this.get("columnDataGroup"),
        rowHeight = columnDataGroup.get("lazyDisplay.rowHeight"),
        rowBuffer = columnDataGroup.get("lazyDisplay.rowBuffer"),
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

  classNames : ['lazy-display-dummy-row'],
});

LazyDisplay.LazyDisplayRow = Ember.Mixin.create({
  rowType : 1,

  classNames : ['lazy-display-row'],
});
