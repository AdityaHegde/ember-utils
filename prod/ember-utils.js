Utils = Ember.Namespace.create();
Utils.deepSearchArray = function(d, e, k, ak) { //d - data, e - element, k - key, ak - array key
  if(e === undefined || e === null) return false;
  if(d[k] === e) return true;
  if(d[ak]) {
    for(var i = 0; i < d[ak].length; i++) {
      if(Utils.deepSearchArray(d[ak][i], e, k, ak)) return true;
    }
  }
  return false;
};

Utils.cmp = function(a, b) {
  return a - b;
};
Utils.binarySearch = function(a, e, l, h, c) {
  var i = Math.floor((h + l) / 2), o = a.objectAt(i);
  if(l > h) return l;
  if(c(e, o) >= 0) {
    return Utils.binarySearch(a, e, i + 1, h, c);
  }
  else {
    return Utils.binarySearch(a, e, l, i - 1, c);
  }
};
Utils.binaryInsert = function(a, e, c) {
  c = c || Utils.cmp;
  var len = a.get("length");
  if(len > 0) {
    var i = Utils.binarySearch(a, e, 0, len - 1, c);
    a.insertAt(i, e);
  }
  else {
    a.pushObject(e);
  }
};

Utils.merge = function(tar, src, replace) {
  for(var k in src) {
    if(!src.hasOwnProperty(k) || !Ember.isNone(tar[k])) {
      continue;
    }
    tar[k] = src[k];
  }
  return tar;
};

Utils.hashHasKeys = function(hash) {
  for(var k in hash) {
    if(hash.hasOwnProperty(k)) return true;
  }
  return false;
};

Utils.getArrayFromRange = function(l, h, s) {
//low (inclusive), high (exclusive), steps
  var a = [];
  s = s || 1;
  for(var i = l; i < h; i += s) {
    a.push(i);
  }
  return a;
};

Utils.hasMany = function(modelClass, modelClassMap, modelClassKey) {
  modelClass = modelClass || Ember.Object;
  var hasInheritance = modelClassMap && modelClassKey;
  return Ember.computed(function(key, newval) {
    if(Ember.typeOf(modelClass) == 'string') {
      modelClass = Ember.get(modelClass);
    }
    if(arguments.length > 1) {
      if(newval && newval.length) {
        newval.beginPropertyChanges();
        for(var i = 0; i < newval.length; i++) {
          var obj = newval[i];
          if(hasInheritance) modelClass = modelClassMap[obj[modelClassKey]];
          if(!(obj instanceof modelClass)) {
            obj = modelClass.create(obj);
            obj.set("parentObj", this);
          }
          newval.splice(i, 1, obj);
        }
        newval.endPropertyChanges();
      }
      return newval;
    }
  });
};

Utils.belongsTo = function(modelClass) {
  modelClass = modelClass || Ember.Object;
  return Ember.computed(function(key, newval) {
    if(Ember.typeOf(modelClass) == 'string') {
      modelClass = Ember.get(modelClass);
    }
    if(arguments.length > 1) {
      if(newval && !(newval instanceof modelClass)) {
        newval = modelClass.create(newval);
      }
      return newval;
    }
  });
};

Utils.HashMapArrayComputed = function(elementClass, keyForKey, keyForVal, dontBind) {
  return Ember.computed(function(key, newval) {
    if(arguments.length > 1) {
      return Utils.HashMapArray.create({
        elementClass : elementClass,
        keyForKey : keyForKey,
        keyForVal : keyForVal,
        hashMap : newval,
        content : [],
        parentObj : this,
      });
    }
  });
};
Utils.HashMapArrayInnerComputed = function(hashMapArrayActual) {
  return Ember.computed(function(key, newval) {
    if(arguments.length > 1) {
      this.set(hashMapArrayActual, newval);
      return newval;
    }
  });
};
Utils.HashMapArray = Ember.ArrayProxy.extend({
  elementClass : null,
  keyForKey : null,
  keyForVal : null,

  parentObj : null,

  hashMap : null,
  hashMapDidChange : function() {
    var elementClass = this.get("elementClass"), hashMap = this.get("hashMap"),
        keyForKey = this.get("keyForKey"), keyForVal = this.get("keyForVal");
    for(var k in hashMap) {
      var val = elementClass.create({parentObj : this.get("parentObj")});
      val.set(keyForVal, hashMap[k]);
      val.set(keyForKey, k);
      this.pushObject(val);
    }
  }.observes('hashMap').on('init'),

  arrayElementValueDidChange : function(obj, key) {
    var hashMap = this.get("hashMap"),
        keyForKey = this.get("keyForKey"), keyForVal = this.get("keyForVal");
    hashMap[obj.get(keyForKey)] = obj.get(keyForVal);
  },

  arrayElementKeyWillChange : function(obj, key) {
    var hashMap = this.get("hashMap"),
        keyForKey = this.get("keyForKey"), keyForVal = this.get("keyForVal");
    delete hashMap[obj.get(keyForKey)];
  },

  arrayElementKeyDidChange : function(obj, key) {
    this.arrayElementValueDidChange(obj, key);
  },

  lockArray : false,

  contentArrayWillChange : function(array, idx, removedCount, addedCount) {
    if(!this.get("lockArray")) {
      var removedObjects = array.slice(idx, idx+removedCount), hashMap = this.get("hashMap"),
          keyForKey = this.get("keyForKey"), keyForVal = this.get("keyForVal");
      for(var i = 0; i < removedObjects.length; i++) {
        delete hashMap[removedObjects[i].get(keyForKey)];
        Ember.removeObserver(removedObjects[i], keyForVal, this, this.arrayElementValueDidChange);
        Ember.removeBeforeObserver(removedObjects[i], keyForKey, this, this.arrayElementKeyWillChange);
        Ember.removeObserver(removedObjects[i], keyForKey, this, this.arrayElementKeyDidChange);
      }
    }
  },

  contentArrayDidChange : function(array, idx, removedCount, addedCount) {
    if(!this.get("lockArray")) {
      var addedObjects = array.slice(idx, idx+addedCount), hashMap = this.get("hashMap"), elementClass = this.get("elementClass"),
          keyForKey = this.get("keyForKey"), keyForVal = this.get("keyForVal");
      for(var i = 0; i < addedObjects.length; i++) {
        var existing = array.findBy(keyForKey, (addedObjects[i].get && addedObjects[i].get(keyForKey)) || addedObjects[i][keyForKey]), index = array.indexOf(existing);
        if(index < idx || index > idx+addedCount) {
          array.removeObject(existing);
          if(index < idx) idx--;
          if(addedObjects[i].set) {
            addedObjects[i].set(keyForVal, existing.get(keyForVal));
          }
          else {
            addedObjects[i][keyForVal] = existing.get(keyForVal);
          }
        }
        if(!(addedObjects[i] instanceof elementClass)) {
          addedObjects[i] = elementClass.create(addedObjects[i]);
          this.set("lockArray", true);
          array.removeAt(idx + i);
          array.insertAt(idx + i, addedObjects[i]);
          this.set("lockArray", false);
        }
        addedObjects[i].set("parentObj", this.get("parentObj"));
        hashMap[addedObjects[i].get(keyForKey)] = addedObjects[i].get(keyForVal);
        Ember.addObserver(addedObjects[i], keyForVal, this, this.arrayElementValueDidChange);
        Ember.addBeforeObserver(addedObjects[i], keyForKey, this, this.arrayElementKeyWillChange);
        Ember.addObserver(addedObjects[i], keyForKey, this, this.arrayElementKeyDidChange);
      }
    }
  },
});

Utils.ObjectWithArrayMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.set("arrayProps", this.get("arrayProps") || []);
    this.addArrayObserverToProp("arrayProps");
    var arrayProps = this.get("arrayProps");
    for(var i = 0; i < arrayProps.length; i++) {
      this.arrayPropWasAdded(arrayProps[i]);
    }
  },

  addBeforeObserverToProp : function(propKey) {
    Ember.addBeforeObserver(this, propKey, this, "propWillChange");
  },

  removeBeforeObserverFromProp : function(propKey) {
    Ember.removeBeforeObserver(this, propKey, this, "propWillChange");
  },

  addObserverToProp : function(propKey) {
    Ember.addObserver(this, propKey, this, "propDidChange");
  },

  removeObserverFromProp : function(propKey) {
    Ember.removeObserver(this, propKey, this, "propDidChange");
  },

  propWillChange : function(obj, key) {
    this.removeArrayObserverFromProp(key);
    var prop = this.get(key);
    if(prop && prop.objectsAt) {
      var idxs = Utils.getArrayFromRange(0, prop.get("length"));
      this[key+"WillBeDeleted"](prop.objectsAt(idxs), idxs, true);
    }
  },

  propDidChange : function(obj, key) {
    this.addArrayObserverToProp(key);
    var prop = this.get(key);
    if(prop) {
      this.propArrayNotifyChange(prop, key);
    }
  },

  propArrayNotifyChange : function(prop, key) {
    if(prop.objectsAt) {
      var idxs = Utils.getArrayFromRange(0, prop.get("length"));
      this[key+"WasAdded"](prop.objectsAt(idxs), idxs, true);
    }
  },

  addArrayObserverToProp : function(propKey) {
    var prop = this.get(propKey);
    if(prop && prop.addArrayObserver) {
      prop.set("propKey", propKey);
      prop.addArrayObserver(this, {
        willChange : this.propArrayWillChange,
        didChange : this.propArrayDidChange,
      });
    }
  },

  removeArrayObserverFromProp : function(propKey) {
    var prop = this.get(propKey);
    if(prop && prop.removeArrayObserver) {
      prop.removeArrayObserver(this);
    }
  },

  propArrayWillChange : function(array, idx, removedCount, addedCount) {
    if((array.content || array.length) && array.get("length") > 0) {
      var propKey = array.get("propKey"), idxs = Utils.getArrayFromRange(idx, idx + removedCount);
      this[propKey+"WillBeDeleted"](array.objectsAt(idxs), idxs);
    }
  },
  propArrayDidChange : function(array, idx, removedCount, addedCount) {
    if((array.content || array.length) && array.get("length") > 0) {
      var propKey = array.get("propKey"),
          addedIdxs = [], removedObjs = [];
      for(var i = idx; i < idx + addedCount; i++) {
        var obj = array.objectAt(i);
        if(!this[propKey+"CanAdd"](obj)) {
          removedObjs.push(obj);
        }
        else {
          addedIdxs.push(i);
        }
      }
      if(addedIdxs.length > 0) {
        this[propKey+"WasAdded"](array.objectsAt(addedIdxs), addedIdxs);
      }
      if(removedObjs.length > 0) {
        array.removeObjects(removedObjs);
      }
    }
  },

  propWillBeDeleted : function(props, idxs) {
  },
  propCanAdd : function(prop, idx) {
    return true;
  },
  propWasAdded : function(props, idxs) {
  },

  arrayProps : null,
  arrayPropsWillBeDeleted : function(arrayProp) {
    this.removeArrayObserverFromProp(arrayProp);
    this.removeBeforeObserverFromProp(arrayProp);
    this.removeObserverFromProp(arrayProp);
  },
  arrayPropWasAdded : function(arrayProp) {
    var prop = this.get(arrayProp);
    if(!this[arrayProp+"WillBeDeleted"]) this[arrayProp+"WillBeDeleted"] = this.propWillBeDeleted;
    if(!this[arrayProp+"CanAdd"]) this[arrayProp+"CanAdd"] = this.propCanAdd;
    if(!this[arrayProp+"WasAdded"]) this[arrayProp+"WasAdded"] = this.propWasAdded;
    if(!prop) {
      this.set(arrayProp, []);
    }
    else {
      this.propArrayNotifyChange(prop, arrayProp);
    }
    this.addArrayObserverToProp(arrayProp);
    this.addBeforeObserverToProp(arrayProp);
    this.addObserverToProp(arrayProp);
  },

});

var delayAddId = 0;
Utils.DelayedAddToHasMany = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    this.set("arrayPropDelayedObjs", {});
  },

  arrayPropDelayedObjs : null,

  addDelayObserverToProp : function(propKey, method) {
    method = method || "propWasUpdated";
    Ember.addObserver(this, propKey, this, method);
  },

  removeDelayObserverFromProp : function(propKey) {
    method = method || "propWasUpdated";
    Ember.removeObserver(this, propKey, this, method);
  },

  propArrayNotifyChange : function(prop, key) {
    if(prop.then) {
      prop.set("canAddObjects", false);
      prop.then(function() {
        prop.set("canAddObjects", true);
      });
    }
    else {
      for(var i = 0; i < prop.get("length"); i++) {
        this[key+"WasAdded"](prop.objectAt(i), i, true);
      }
    }
  },

  addToProp : function(prop, propObj) {
    var arrayPropDelayedObjs = this.get("arrayPropDelayedObjs"), propArray = this.get(prop);
    if(propArray.get("canAddObjects")) {
      if(!propArray.contains(propObj)) {
        propArray.pushObject(propObj);
      }
    }
    else {
      arrayPropDelayedObjs[prop] = arrayPropDelayedObjs[prop] || [];
      if(!arrayPropDelayedObjs[prop].contains(propObj)) {
        arrayPropDelayedObjs[prop].push(propObj);
      }
    }
  },

  hasArrayProp : function(prop, findKey, findVal) {
    var arrayPropDelayedObjs = this.get("arrayPropDelayedObjs"), propArray = this.get(prop);
    if(propArray.get("canAddObjects")) {
      return !!propArray.findBy(findKey, findVal);
    }
    else if(arrayPropDelayedObjs && arrayPropDelayedObjs[prop]) {
      return !!arrayPropDelayedObjs[prop].findBy(findKey, findVal);
    }
    return false;
  },

  addToContent : function(prop) {
    var arrayPropDelayedObjs = this.get("arrayPropDelayedObjs"), propArray = this.get(prop);
    if(propArray.get("canAddObjects") && arrayPropDelayedObjs[prop]) {
      arrayPropDelayedObjs[prop].forEach(function(propObj) {
        if(!propArray.contains(propObj)) {
          propArray.pushObject(propObj);
        }
      }, propArray);
      delete arrayPropDelayedObjs[prop];
    }
  },

  arrayProps : null,
  arrayPropsWillBeDeleted : function(arrayProp) {
    this._super(arrayProp);
    this.removeDelayObserverFromProp(arrayProp+".canAddObjects");
  },
  arrayPropWasAdded : function(arrayProp) {
    this._super(arrayProp);
    var prop = this.get(arrayProp), that = this;
    if(!this["addTo_"+arrayProp]) this["addTo_"+arrayProp] = function(propObj) {
      that.addToProp(arrayProp, propObj);
    };
    this.addDelayObserverToProp(arrayProp+".canAddObjects", function(obj, key) {
      that.addToContent(arrayProp);
    });
  },

});

Utils.ExtractIdRegex = /:(ember\d+):?/;
Utils.getEmberId = function(obj) {
  var str = obj.toString(), match = str.match(Utils.ExtractIdRegex);
  return match && match[1];
};

AsyncQue = Ember.Namespace.create();

AsyncQue.queMap = {};
AsyncQue.TIMEOUT = 500;
AsyncQue.TIMERTIMEOUT = 250;

AsyncQue.AsyncQue = Ember.Object.extend({
  init : function() {
    this._super();
    var that = this, timer;
    Ember.run.later(function() {
      that.timerTimedout();
    }, that.get("timeout") || AsyncQue.TIMEOUT);
  },

  timerTimedout : function() {
    if(!this.get("resolved")) {
      var that = this;
      Ember.run(function() {
        delete AsyncQue.queMap[that.get("key")];
        that.set("resolved", true);
        that.get("resolve")();
      });
    }
  },

  timer : null,
  key : "",
  resolve : null,
  reject : null,
  resolved : false,
  timeout : AsyncQue.TIMEOUT,
});

AsyncQue.addToQue = function(key, timeout) {
  if(AsyncQue.queMap[key]) {
    AsyncQue.queMap[key].set("resolved", true);
    AsyncQue.queMap[key].get("reject")();
  }
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var asyncQue = AsyncQue.AsyncQue.create({key : key, resolve : resolve, reject : reject, timeout : timeout});
      AsyncQue.queMap[key] = asyncQue;
    });
  });
  return promise;
};

AsyncQue.curTimer = null;
AsyncQue.timers = [];
AsyncQue.Timer = Ember.Object.extend({
  init : function() {
    this._super();
    AsyncQue.timers.push(this);
    this.set("ticks", Math.ceil(this.get("timeout") / AsyncQue.TIMERTIMEOUT));
    if(!AsyncQue.curTimer) {
      AsyncQue.curTimer = setInterval(AsyncQue.timerFunction, AsyncQue.TIMERTIMEOUT);
    }
  },
  timeout : AsyncQue.TIMERTIMEOUT,
  ticks : 1,
  count : 0,

  timerCallback : function() {
  },

  endCallback : function() {
  },
});
AsyncQue.timerFunction = function() {
  if(AsyncQue.timers.length === 0) {
    clearTimeout(AsyncQue.curTimer);
    AsyncQue.curTimer = null;
  }
  else {
    for(var i = 0; i < AsyncQue.timers.length;) {
      var timer = AsyncQue.timers[i];
      timer.decrementProperty("ticks");
      if(timer.get("ticks") === 0) {
        timer.set("ticks", Math.ceil(timer.get("timeout") / AsyncQue.TIMERTIMEOUT));
        timer.timerCallback();
        timer.decrementProperty("count");
      }
      if(timer.get("count") <= 0) {
        AsyncQue.timers.removeAt(i);
        timer.endCallback();
      }
      else {
        i++;
      }
    }
  }
};

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

Alerts = Ember.Namespace.create();
Alerts.AlertTypeMap = {
  info : {
    alertClass : 'alert-info',
    glyphiconClass : 'glyphicon-info-sign',
  },
  success : {
    alertClass : 'alert-success',
    glyphiconClass : 'glyphicon-ok-sign',
  },
  warning : {
    alertClass : 'alert-warning',
    glyphiconClass : 'glyphicon-warning-sign',
  },
  error : {
    alertClass : 'alert-danger',
    glyphiconClass : 'glyphicon-exclamation-sign',
  },
};
Alerts.AlertMessage = Ember.Component.extend({
  type : 'error',
  typeData : function() {
    var type = this.get("type");
    return Alerts.AlertTypeMap[type] || Alerts.AlertTypeMap.error;
  }.property('type'),
  title : "",
  message : function(key, value) {
    if(arguments.length > 1) {
      if(!Ember.isEmply(value)) {
        this.set("showAlert", true);
      }
      else {
        this.set("showAlert", false);
      }
      return value;
    }
  },
  showAlert : false,

  click : function(event) {
    if($(event.target).filter('button.close').length > 0) {
      this.set("message", "");
    }
  },

  template : Ember.Handlebars.compile('' +
  '{{#if showAlert}}' +
    '<div {{bind-attr class=":alert typeData.alertClass :alert-dismissable"}}>' +
      '<button class="close" {{action "dismissed"}}>&times;</button>' +
      '<strong><span {{bind-attr class=":glyphicon typeData.glyphiconClass :btn-sm"}}></span> {{title}}</strong> {{message}}' +
    '</div>' +
  '{{/if}}'),
});

Ember.Handlebars.helper('alert-message', Alerts.AlertMessage);

Panels = Ember.Namespace.create();
Panels.Panel = Ember.Component.extend({
  classNames : ['panel', 'panel-default'],
  title : "",
  body : null,
  footer : null,
  obj : null,

  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading"><h3 class="panel-title">{{title}}</h3></div>' +
    '<div class="panel-body">' +
      '{{#if body}}' +
        '{{body}}' +
      '{{else}}' +
        '{{yield}}' +
      '{{/if}}' +
    '</div>' +
    '{{#if footer}}' +
      '{{footer}}' +
    '{{/if}}'),
});

Ember.Handlebars.helper('panel-comp', Panels.Panel);

Form = Ember.Namespace.create();

Form.MultiColumnMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  parentForRows : function() {
    return this;
  }.property(),

  getColEffectiveIndex : function(col, cols) {
    var j = cols.indexOf(col), k = 0;
    for(var i = 0; i <= j; i++) {
      if(this.findBy("col.name", cols[i].get("name"))) {
        k++;
      }
    }
    return k;
  },

  addNewCol : function(col, cols, record, curCell) {
    var newCell = Form.TypeToCellMap[col.type].create({
      col : col,
      record : record,
      labelWidthClass : this.get("labelWidthClass"),
      inputWidthClass : this.get("inputWidthClass"),
      tagName : this.get("childTagNames"),
      showLabel : this.get("showLabel"),
      parentForm : this.get("parentForRows"),
      immediateParent : this,
    }), idx;
    if(curCell) {
      idx = this.indexOf(curCell);
      curCell.unregisterForValChangeChild();
      this.removeAt(idx);
      this.insertAt(idx, newCell);
      curCell.destroy();
    }
    else {
      idx = this.getColEffectiveIndex(col, cols);
      this.insertAt(idx, newCell);
    }
    if(newCell.registerForValChangeChild) newCell.registerForValChangeChild();
  },

  canAddCol : function(col, record) {
    return !col.get('isOnlyTable') && (!col.get("removeOnEdit") || !record || record.get("isNew")) && (!col.get("removeOnNew") || !record || !record.get("isNew"));
  },

  colsWasAdded : function(addedCols, idxs) {
    var cols = this.get('cols'), record = this.get('record');
    Ember.run.begin();
    for(var i = 0; i < addedCols.length; i++) {
      var col = addedCols[i], curCell = this.findBy("col.name", col.get("name"));
      if(this.canAddCol(col, record)) {
        this.addNewCol(col, cols, record, curCell);
      }
    }
    Ember.run.end();
  },

  colsWillBeDeleted : function(deletedCols, idxs) {
    var cols = this.get('cols'), record = this.get('record');
    Ember.run.begin();
    for(var i = 0; i < deletedCols.length; i++) {
      var col = deletedCols[i], curCell = this.findBy("col.name", col.get("name"));
      if(curCell) {
        curCell.unregisterForValChangeChild();
        this.removeObject(curCell);
        curCell.destroy();
      }
    }
    Ember.run.end();
  },

  recordTypeChanged : function() {
    var cols = this.get('cols'), record = this.get("record"),
        removeOnEdit = cols.filterBy("removeOnEdit", true),
        removeOnNew = cols.filterBy("removeOnNew", true),
        that = this;
    if(record) {
      Ember.run.begin();
      removeOnEdit.pushObjects(removeOnNew).forEach(function(col) {
        var shouldBeThere = this.that.canAddCol(col, this.record),
            isPresent = this.that.findBy("col.name", col.get("name"));
        if(shouldBeThere && !isPresent) {
          this.that.addNewCol(col, this.cols, this.record);
        }
        else if(!shouldBeThere && isPresent) {
          isPresent.unregisterForValChangeChild();
          this.that.removeObject(isPresent);
          isPresent.destroy();
        }
      }, {that : this, cols : cols, record : record});
      Ember.run.end();
    }
  }.observes("view.record.isNew", "record.isNew"),

  record : function(key, value) {
    if(arguments.length > 1) {
      this.forEach(function(childView) {
        childView.set("record", this.value);
      }, {value : value});
    }
    return value;
  }.property(),
});

Form.MultiInputParentMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.set("listenToMap", this.get("listenToMap") || {});
    this.set("duplicateCheckMap", this.get("duplicateCheckMap") || {});
  },
  listenToMap : null,

  bubbleValChange : function(col, val, oldVal, callingView) {
    var listenToMap = this.get("listenToMap"), thisCol = this.get("col"),
        parentForm = this.get("parentForm");
    if(thisCol) {
      var checkDuplicates = thisCol.get("checkDuplicates");
      if(checkDuplicates && checkDuplicates.contains(col.name)) {
        console.log(checkDuplicates);
      }
    }
    if(listenToMap[col.name]) {
      listenToMap[col.name].forEach(function(listening) {
        var listeningViews = listening.get("views");
        for(var i = 0; i < listeningViews.length; i++) {
          var view = listeningViews[i];
          if(view !== this.callingView) {
            view.colValueChanged(col, val, oldVal);
          }
          if(view.get("col.bubbleValues") && parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, val, oldVal, callingView);
        }
      }, {val : val, col : col, callingView : callingView});
    }
    if(!Ember.isNone(oldVal) && this.get("record")) {
      this.get("record").set("tmplPropChangeHook", col.name);
    }
  },

  registerForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), existing,
        callingCol = colView.get("col"),
        colName = callingCol.get("name"),
        parentForm = this.get("parentForm");
    if(callingCol.get("bubbleValues") && parentForm && parentForm.registerForValChange) parentForm.registerForValChange(colView, listenColName);
    if(!listenToMap) {
      listenToMap = {};
      this.set("listenToMap", listenToMap);
    }
    listenToMap[listenColName] = listenToMap[listenColName] || [];
    existing = listenToMap[listenColName].findBy("name", colName);
    if(existing) {
      existing.get("views").pushObject(colView);
    }
    else {
      listenToMap[listenColName].pushObject(Ember.Object.create({views : [colView], name : colName}));
    }
  },

  unregisterForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), callingCol = colView.get("col"),
        colName = callingCol.get("name"),
        colListener = listenToMap && listenToMap[listenColName],
        existing = colListener && listenToMap[listenColName].findBy("name", colName),
        parentForm = this.get("parentForm");
    if(callingCol.get("bubbleValues") && parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(colView, listenColName);
    if(existing) {
      var existingViews = existing.get("views");
      existingViews.removeObject(colView);
      if(existingViews.length === 0) {
        colListener.removeObject(existing);
      }
      else {
        for(var i = 0; i < existingViews.length; i++) {
          existingViews[i].colValueChanged(Ember.Object.create({name : listenColName, key : listenColName}), null, null);
        }
      }
    }
  },
});

Form.FormView = Ember.ContainerView.extend(Form.MultiColumnMixin, Form.MultiInputParentMixin, {
  childTagNames : 'div',
  classNames : ['form-horizontal'],
  labelWidthClass : "col-sm-4",
  inputWidthClass : "col-sm-8",
  showLabel : true,

  cols : null,
  arrayProps : ['cols'],
});

Form.TextInputView = Ember.View.extend({
  init : function() {
    this._super();
    this.recordDidChange();
  },

  parentForm : null,
  immediateParent : null,
  valLength : function(){
    if(this.get("val"))
      return this.get("col.maxlength") - this.get("val").length;
    else
      return this.get("col.maxlength");
  }.property('view.val','val'),

  layout : Ember.Handlebars.compile('' +
    '{{#if view.showLabelComp}}<div {{bind-attr class="view.labelClass"}} ><label {{bind-attr for="view.col.name" }}>{{#if view.col.label}}{{view.col.label}}{{#if view.col.mandatory}}*{{/if}}{{/if}}</label>' +
    '{{#if view.col.helpText}}<div class="label-tooltip">{{#tool-tip placement="right" titleup=view.col.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}</div>{{/if}} </div>' +
    '{{/if}}'+
    '<div {{bind-attr class="view.inputClass"}}> {{#if view.col.fieldDescription}}<span>{{view.col.fieldDescription}}</span>{{/if}}' +
      '<div class="validateField">'+
        '{{yield}}' +
        '{{#unless view.showLabelComp}}'+
          '{{#if view.col.helpText}}<div class="label-tooltip">{{#tool-tip placement="right" titleup=view.col.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}</div>{{/if}}' +
        '{{/unless}}'+
        '{{#if view.col.maxlength}}'+
          '<span class="maxlength"><span>{{ view.valLength}}</span></span>'+
        '{{/if}}'+
        '{{#if view.invalid}}' +
          '{{#if view.invalidReason}}<span class="help-block text-danger">{{view.invalidReason}}</span>{{/if}}' +
        '{{/if}}' +
      '</div>'+
    '</div>' +
    ''),
  template : Ember.Handlebars.compile('{{input class="form-control" autofocus=view.col.autofocus type="text" value=view.val disabled=view.isDisabled placeholder=view.col.placeholderActual maxlength=view.col.maxlength}}'),
  classNames : ['form-group'],
  classNameBindings : ['col.additionalClass', 'col.validations:has-validations', 'invalid:has-error', ':has-feedback', 'disabled:hidden','additionalClass'],
  attributeBindings : ['colName:data-column-name'],
  colName : Ember.computed.alias("col.name"),
  col : null,
  cols : null,
  record : null,
  labelWidthClass : "col-full",
  inputWidthClass : "col-sm-8",
  showLabel : true,
  labelClass : function() {
    var col = this.get("col"), labelWidthClass = this.get("labelWidthClass");
    return "control-label "+(col.labelWidthClass || labelWidthClass);
  }.property('view.col', 'view.labelWidthClass'),
  inputClass : function() {
    var col = this.get("col"), inputWidthClass = this.get("inputWidthClass");
    return "control-input "+(col.inputWidthClass || inputWidthClass);
  }.property('view.col', 'view.inputWidthClass'),

  isDisabled : function() {
    var col = this.get("col"),record = this.get("record");
    return col.get("fixedValue") || ((col.get("disableOnEdit") && record && !record.get("isNew")) || (col.get("disableOnNew") && record && record.get("isNew")));
  }.property('view.col','view.col.fixedValue','view.col.disableOnEdit','view.col.disableOnNew'),

  showLabelComp : function(){
    var col = this.get("col");
    if(col.showLabel === undefined ) return this.get("showLabel");
    return this.get("showLabel") && col.showLabel;
  }.property('showLabel','view.col'),

  invalid : false,
  invalidReason : false,

  disabled : false,
  disableCheck : function(changedCol, changedValue) {
    var col = this.get("col"), record = this.get("record"),
        disableEntry = col.get("disableForCols") && col.get("disableForCols").findBy("name", changedCol.get("name"));
    changedValue = changedValue || record.get(changedCol.get("key"));
    if(disableEntry) {
      var eq = disableEntry.value === changedValue, dis = disableEntry.disable, en = disableEntry.enable;
      this.set("disabled", (dis && eq) || (en && !eq));
    }
  },
  colValueChanged : function(changedCol, changedValue, oldValue) {
    this.disableCheck(changedCol, changedValue);
    if(changedCol.get("name") === this.get("col.name")) {
      var that = this;
      //The delay is added cos destroy on the view of removed record is called before it is actually removed from array
      //TODO : find a better way to do this check
      AsyncQue.addToQue("duplicateCheck-"+Utils.getEmberId(this), 100).then(function() {
        if(!that.get("isDestroyed")) {
          that.validateValue(that.get("val"));
        }
      });
    }
  },

  validateValue : function(value) {
    var col = this.get("col"), record = this.get("record");
    if(col.get("validate")) {
      if(!this.get("disabled")) {
        var validVal = col.validateValue(value, record);
        if(validVal[0]) record._validation[col.name] = 1;
        else delete record._validation[col.name];
        this.set("invalid", validVal[0]);
        this.set("invalidReason", !Ember.isEmpty(validVal[1]) && validVal[1]);
      }
      else {
        delete record._validation[col.name];
      }
    }
    record.set("validationFailed", Utils.hashHasKeys(record._validation));
  },

  val : function(key, value) {
    var col = this.get("col"), record = this.get("record"),
        parentForm = this.get("parentForm");
    if(!record) return value;
    record._validation = record._validation || {};
    if(arguments.length > 1) {
      if(!(record instanceof DS.Model) || (record.currentState && !record.currentState.stateName.match("deleted"))) {
        var oldVal = record.get(col.get("key"));
        this.validateValue(value);
        if(record.get("isSaving")) {
          this.set("delayedUpdate", value);
        }
        else {
          //TODO : find a better way to fix value becoming null when selection changes
          //can be observed for repeatAdsFromSlot on adunit
          if(value || !col.get("cantBeNull")) {
            record.set(col.get("key"), value);
            this.valueDidChange(value);
            if(parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, value, oldVal, this);
          }
        }
      }
      return value;
    }
    else {
      value = record.get(col.get("key"));
      this.validateValue(value);
      if(parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, value, null, this);
      return value;
    }
  }.property('col', 'col.disabled', 'view.disabled', 'disabled'),

  valueDidChange : function(value) {
  },

  delayedUpdate : null,
  flushChanges : function() {
    var col = this.get("col"), record = this.get("record"),
        delayedUpdate = this.get("delayedUpdate");
    if(delayedUpdate && !record.get("isSaving")) {
      var oldVal = record.get(col.get("key"));
      //if(delayedUpdate.trim) delayedUpdate = delayedUpdate.trim();
      record.set(col.name, delayedUpdate);
      if(this.get("parentForm") && this.get("parentForm").bubbleValChange) this.get("parentForm").bubbleValChange(col, value, oldVal, this);
      this.set("delayedUpdate", null);
      this.valueDidChange(value);
    }
  }.observes('view.record.isSaving', 'record.isSaving'),

  prevRecord : null,
  recordDidChange : function() {
    var record = this.get("record"), prevRecord = this.get("prevRecord"),
        col = this.get("col");
    if(prevRecord) {
      Ember.removeObserver(prevRecord, col.name, this, "notifyValChange");
    }
    if(record) {
      this.recordChangeHook();
      Ember.addObserver(record, col.name, this, "notifyValChange");
      this.set("prevRecord", record);
      this.notifyPropertyChange("val");
      if(col.get("disableForCols")) {
        col.get("disableForCols").forEach(function(disableCol) {
          this.disableCheck(disableCol);
        }, this);
      }
    }
    else {
      this.recordRemovedHook();
    }
  }.observes("view.record", "record"),
  recordChangeHook : function() {
    this.notifyPropertyChange('isDisabled');
  },
  recordRemovedHook : function(){
  },
  title : "test",

  notifyValChange : function(obj, val) {
    this.notifyPropertyChange("val");
    this.valueDidChange(this.get("val"));
  },

  registerForValChangeChild : function() {
    var col = this.get("col"), parentForm = this.get("parentForm");
    if(col.get("listenForCols")) {
      col.get("listenForCols").forEach(function(listenCol) {
        if(parentForm && parentForm.registerForValChange) parentForm.registerForValChange(this, listenCol);
      }, this);
    }
  },

  unregisterForValChangeChild : function() {
    var col = this.get("col"), parentForm = this.get("parentForm");
    if(col.get("listenForCols")) {
      col.get("listenForCols").forEach(function(listenCol) {
        if(parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(this, listenCol);
      }, this);
    }
  },

  destroy : function() {
    this._super();
    this.unregisterForValChangeChild();
  },
});

Form.TextAreaView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{textarea class="form-control" autofocus="view.col.autofocus" value=view.val disabled=view.isDisabled rows=view.col.rows cols=view.col.cols ' +
                                                                      'placeholder=view.col.placeholderActual maxlength=view.col.maxlength readonly=view.col.readonly}}'),
});

Form.MultipleValue = Ember.Object.extend({
  val : function(key, value) {
    var col = this.get("col");
    if(arguments.length > 1) {
      if(!Ember.isNone(col)) {
        var validation = col.validateValue(value, null, col.get("eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
        }
        else {
          this.set("isInvalid", false);
        }
      }
      return value;
    }
  }.property('col'),
  label : "",
  isInvalid : false,
});
Form.CopyValuesToObject = function(obj, col, record, value) {
  var copyAttrs = col.get("copyAttrs"),
      staticAttrs = col.get("staticAttrs"),
      valAttrs = col.get("valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        obj[copyAttrs[k]] = record.get(k);
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        obj[k] = staticAttrs[k];
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        obj[valAttrs[k]] = value.get(k);
      }
    }
  }
};
Form.CopyValuesToRecord = function(toRecord, col, fromRecord, value) {
  var copyAttrs = col.get("copyAttrs"),
      staticAttrs = col.get("staticAttrs"),
      valAttrs = col.get("valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        toRecord.set(copyAttrs[k], fromRecord.get(k));
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        toRecord.set(k, staticAttrs[k]);
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        toRecord.set(valAttrs[k], value.get(k));
      }
    }
  }
};
Form.MultipleValueMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    var values = this.get("values");
    this.set("values", Ember.isEmpty(values) ? [] : values);
    if(this.get("val")) this.valArrayDidChange();
    else this.valuesArrayDidChange();
  },

  values : Utils.hasMany(Form.MultipleValue),

  valuesCount : function() {
    return this.get("values.length") || 0;
  }.property('values.@each'),

  valuesArrayDidChange : function() {
    if(!this.get("values") || this.get("lock")) return;
    var val = this.get("val"), values = this.get("values"),
        valLength = val && val.get("length"), valuesLength = values.get("length"),
        col = this.get("col"), record = this.get("record");
    if(val) {
      this.set("lock", true);
      values.forEach(function(value, idx) {
        var valObj = this.val.objectAt(idx);
        if(valObj) {
          valObj.set(this.col.get("arrayCol"), value.get("val"));
          Form.CopyValuesToRecord(valObj, this.col, this.record, value);
        }
        else {
          var data = { /*id : col.get("name")+"__"+csvid++*/ };
          data[this.col.get("arrayCol")] = value.get("val");
          Form.CopyValuesToObject(data, this.col, this.record, value);
          this.record.addToProp(this.col.get("key"), CrudAdapter.createRecordWrapper(this.record.store, this.col.get("arrayType"), data));
        }
      }, {val : val, col : col, record : record});
      if(valLength > valuesLength) {
        for(var i = valuesLength; i < valLength; i++) {
          val.popObject();
        }
      }
      this.set("lock", false);
    }
  }.observes('values.@each.val', 'view.values.@each.val'),

  valArrayDidChange : function() {
    if(this.get("lock")) return;
    var val = this.get("val"), col = this.get("col");
    if(val) {
      var values, val = this.get("val");
      values = this.valuesMultiCreateHook(val);
      this.set("lock", true);
      this.set("values", values);
      this.set("lock", false);
    }
  }.observes('val.@each', 'view.val.@each'),

  valuesMultiCreateHook : function(value) {
    if(value.map) {
      return value.map(function(e, i, a) {
        return this.valuesElementCreateHook(e);
      }, this);
    }
    return [];
  },

  valuesElementCreateHook : function(element) {
    var col = this.get("col");
    return {val : element.get(col.get("arrayCol")), col : col};
  },

  lock : false,

  valuesWereInvalid : function() {
    //for now arrayCol is present for all multi value columns
    //change this check if there are exceptions
    if(!this.get("col.arrayCol")) return;
    var values = this.get("values"),
        isInvalid = !values || values.get("length") === 0 || values.anyBy("isInvalid", true),
        record = this.get("record"), col = this.get("col");
    if(!record) return;
    if(this.get("disabled")) {
      delete record._validation[col.get("name")];
    }
    else {
      this.set("invalid", isInvalid);
      record._validation = record._validation || {};
      if(isInvalid) {
        record._validation[col.get("name")] = 1;
      }
      else {
        delete record._validation[col.get("name")];
      }
    }
    this.validateValue();
  }.observes('values.@each.isInvalid', 'view.values.@each.isInvalid', 'disabled', 'view.disabled'),
});

//TODO : support multiple on static select (no requirement for now)
Form.StaticSelectView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{view Ember.Select class="form-control" content=view.col.options optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                          'prompt=view.col.prompt value=view.val disabled=view.isDisabled maxlength=view.col.maxlength}}' +
                                      '{{#if view.helpblock}}<p class="help-block">{{view.helpblock}}</p>{{/if}}'),

  helpblock : "",
});

Form.DynamicSelectView = Form.StaticSelectView.extend(Form.MultipleValueMixin, Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var col = this.get("col");
    Ember.addObserver(this,col.get("dataPath")+".@each",this,"dataDidChange");
  },

  classNameBindings : ['hideOnEmpty:hidden'],
  hideOnEmpty : false,

  selectOptions : function() {
    var col = this.get("col"), data = [], opts = [];
    if(col.dataPath) {
      data = Ember.get(col.dataPath) || this.get(col.dataPath);
    }
    else {
      data = col.data || [];
    }
    if(data) {
      data.forEach(function(item) {
        opts.push(Ember.Object.create({ val : item.get(col.dataValCol), label : item.get(col.dataLabelCol)}));
      }, this);
    }
    if(col.get("hideOnEmpty") && opts.length - col.get("hideEmptyBuffer") === 0) {
      this.set("hideOnEmpty", true);
    }
    else {
      this.set("hideOnEmpty", false);
    }
    return opts;
  }.property('view.col'),

  dataDidChange : function(){
    this.notifyPropertyChange("selectOptions");
    this.rerender();
  },

  selection : function(key, value) {
    if(arguments.length > 1) {
      if(this.state !== "preRender") {
        if(this.get("col.multiple")) {
          if(Ember.isEmpty(value[0])) {
            //initially the selection is an array with undef as its 1st element
            //this.set("values", []);
          }
          else {
            this.set("values", value); 
          }
        }
        else {
          this.set("val", value && value.val);
        }
      }
      return value;
    }
    else {
      var options = this.get("selectOptions"), sel;
      if(this.get("col.multiple")) {
        var values = this.get("values"), col = this.get("col");
        if(values && values.get("length")) {
          sel = options.filter(function(e, i, a) {
            return !!this.values.findBy("val", e.get("val"));
          }, {col : col, values : values});
        }
      }
      else {
        sel = options.findBy("val", this.get("val"));
      }
      return sel;
    }
  }.property("view.values.@each", "values.@each"),

  recordChangeHook : function() {
    this._super();
    this.notifyPropertyChange("selection");
  },

  valueDidChange : function() {
    this.notifyPropertyChange("selection");
  },

  selectionWasAdded : function(addedSels, idxs, fromSetFunc) {
    if(this.get("col.multiple") && !fromSetFunc) {
      this.set("values", this.get("selection"));
    }
  },

  arrayProps : ["selection"],

  template : Ember.Handlebars.compile('{{view Ember.Select class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" multiple=view.col.multiple '+
                                                          'prompt=view.col.prompt selection=view.selection disabled=view.isDisabled maxlength=view.col.maxlength}}'),
});

Form.SelectiveSelectView = Ember.Select.extend({
  options : [],
  filterColumn : "",
  content : function() {
    var filterColumn = this.get("filterColumn");
    return this.get("options").filter(function(item) {
      return !Ember.isEmpty(item.get(this.filterColumn));
    }, {filterColumn : filterColumn});
  }.property('view.overallOptions.@each'),
});

Form.Label = Form.TextInputView.extend({
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('<label>{{view.col.label}}</label>'),
  col : null,
  record : null,
});

Form.Legend = Ember.View.extend({
  classNameBindings : ['col.disabled:hidden'],
  template : Ember.Handlebars.compile('<legend>{{view.col.label}}</legend>'),
  col : null,
  record : null,
});

Form.FileUpload = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.accept"}}>'),

  disableBtn : false,
  fileName : "",

  btnLabel : function(){
    return this.get('uploadBtnLabel') || this.get('col').get('btnLabel');
  }.property('col','col.btnLabel'),

  postRead : function(data) {
    this.set("val", data);
  },

  postFail : function(message) {
    this.set("val", null);
  },

  change : function(event) {
    var files = event.originalEvent && event.originalEvent.target.files, that = this, col = this.get("col");
    if(files && files.length > 0 && !Ember.isEmpty(files[0])) {
      this.set("disableBtn", "disabled");
      this.set("fileName", files[0].name);
      EmberFile[col.get("method")](files[0]).then(function(data) {
        that.postRead(data);
        that.set("disableBtn", false);
      }, function(message) {
        that.postFail(message);
        that.set("disableBtn", false);
      });
      $(this.get("element")).find("input[type='file']")[0].value = "";
    }
  },

  actions : {
    loadFile : function() {
      fileInput = $(this.get("element")).find("input[type='file']");
      fileInput.click();
    },
  },
});

Form.ImageUpload = Form.FileUpload.extend({
  template : Ember.Handlebars.compile('<p><button class="btn btn-default btn-sm" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.col.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.accept"}}></p>' +
                                      '<canvas class="hidden"></canvas>' +
                                      '<div {{bind-attr class="view.hasImage::hidden"}}>' +
                                        '<div class="image-container">' +
                                          '<div class="image-container-inner">' +
                                            '<img class="the-image" {{bind-attr src="view.imageSrc"}}>' +
                                            '<div class="image-cropper"></div>' +
                                          '</div>' +
                                        '</div>' +
                                        '<button class="btn btn-default btn-sm" {{action "cropImage" target="view"}}>Crop</button>' +
                                      '</div>' +
                                      '<div class="clearfix"></div>'),

  imageSrc : "",
  hasImage : false,

  postRead : function(data) {
    this.set("imageSrc", data);
    this.set("hasImage", true);
  },

  postFail : function(message) {
    this.set("imageSrc", null);
    this.set("hasImage", false);
  },

  didInsertElement : function() {
    this._super();
    var cropper = $(this.get("element")).find(".image-cropper");
    cropper.draggable({
      containment: "parent",
    });
    cropper.resizable({
      containment: "parent",
    });
  },

  actions : {
    cropImage : function() {
      var cropper = $(this.get("element")).find(".image-cropper"),
          x = cropper.css("left"), y = cropper.css("top"),
          h = cropper.height(), w = cropper.width(),
          canvas = $(this.get("element")).find("canvas")[0],
          context = canvas.getContext("2d");
      x = Number(x.match(/^(\d+)px$/)[1]);
      y = Number(y.match(/^(\d+)px$/)[1]);
      context.drawImage($(this.get("element")).find(".the-image")[0], x, y, h, w, 0, 0, h, w);
      this.set("val", canvas.toDataURL());
      this.set("hasImage", false);
      cropper.css("left", 0);
      cropper.css("top", 0);
      cropper.height(100);
      cropper.width(100);
    },
  },

});

Form.CSVEntry = Form.MultipleValue.extend({
  val : function(key, value) {
    var col = this.get("col");
    if(arguments.length > 1) {
      if(!Ember.isNone(col)) {
        var validation = col.validateValue(value, null, col.get("eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
          if(!this.get("validated")) {
            this.set("showInput", true);
          }
        }
        else {
          this.set("isInvalid", false);
        }
        this.set("validated", true);
      }
      return value;
    }
  }.property('col'),
  showInput : false,
  validated : false,
  col : null,
});

//TODO : find a better way to set id
var csvid = 0;
Form.CSVDateValue = Ember.View.extend(LazyDisplay.LazyDisplayRow, {
  template : Ember.Handlebars.compile('' +
                                      '<div {{bind-attr class=":form-group view.data.isInvalid:has-error view.data.showInput:has-input view.data.showInput:has-feedback :csv-value"}}>' +
                                        '{{#if view.data.showInput}}' +
                                          '{{view Ember.TextField class="form-control input-sm" value=view.data.val}}' +
                                          '<span {{bind-attr class=":form-control-feedback"}}></span>' +
                                        '{{else}}' +
                                          '<p class="form-control-static">{{view.data.val}}</p>' +
                                        '{{/if}}' +
                                      '</div>' +
                                      ''),

  data : null,
});
Form.CSVDateDummyValue = Ember.View.extend(LazyDisplay.LazyDisplayDummyRow, {
  classNames : ["csv-dummy-value"],
  template : Ember.Handlebars.compile(''),
});
Form.CSVDateValues = Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
  getRowView : function(row) {
    return Form.CSVDateValue.create({
      data : row,
    });
  },

  getDummyView : function() {
    return Form.CSVDateDummyValue.create();
  },
});
Form.CSVDataInput = Form.FileUpload.extend(Form.MultipleValueMixin, {
  template : Ember.Handlebars.compile('' +
                                      '{{view.col.description}}' +
                                      '{{#if view.hasFile}}' +
                                        '{{view.fileName}} ({{view.valuesCount}} {{view.col.entityPlural}})' +
                                        '<button class="btn btn-link" {{action "remove" target="view"}}>Remove</button> | ' +
                                        '<button class="btn btn-link" {{action "replace" target="view"}}>Replace</button>' +
                                        '{{view LazyDisplay.LazyDisplay classNameBindings=":form-sm :csv-values-wrapper" lazyDisplayConfig=view.lazyDisplayConfig rows=view.valuesTransformed}}' +
                                      '{{else}}' +
                                        '{{textarea class="form-control" autofocus="view.col.autofocus" value=view.csvVal rows=view.col.rows cols=view.col.cols ' +
                                                                        'placeholder=view.col.placeholderActual maxlength=view.col.maxlength ' +
                                                                        'readonly=view.col.readonly}}' +
                                        '<div class="upload-help-text">'+
                                        '<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.col.btnLabel}}</button>' +
                                        '</div>'+
                                      '{{/if}}' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.accept"}}>' +
                                      ''),

  lazyDisplayConfig : LazyDisplay.LazyDisplayConfig.create({
    rowHeight : 28,
    lazyDisplayMainClass : "Form.CSVDateValues",
  }),
  hasFile : false,

  values : Utils.hasMany(Form.CSVEntry),
  valuesTransformed : function() {
    var values = this.get("values"), valuesTransformed = [];
    valuesTransformed.pushObjects(values.filterBy("showInput", true));
    valuesTransformed.pushObjects(values.filterBy("showInput", false));
    //console.log("valuesTransformed");
    return valuesTransformed;
  }.property("view.values.@each.showInput", "values.@each.showInput"),
  setToValues : function(value) {
    var col = this.get("col"), values = value.split(new RegExp(col.get("splitRegex")));
    //this.set("val", value);
    for(var i = 0; i < values.length;) {
      if(Ember.isEmpty(values[i])) {
        values.splice(i, 1);
      }
      else {
        values.splice(i, 1, {col : col, val : values[i++]});
      }
    }
    this.set("values", values);
  },

  csvVal : function(key, value) {
    var col = this.get("col"), that = this;
    if(arguments.length > 1) {
      //calculate 'values' after a delay to avoid multiple calcuations for every keystroke
      AsyncQue.addToQue("csvvalues-"+col.get("name"), 1500).then(function() {
        if(!that.get("isDestroyed")) {
          that.setToValues(value);
        }
      });
      return value;
    }
    else {
      var values = this.get("values");
      return values && values.mapBy("val").join(", ");
    }
  }.property("view.values.@each", "values.@each", "view.row", "row"),

  recordChangeHook : function() {
    this._super();
    this.set("hasFile", false);
    //this.set("csvVal", "");
    //this.set("values", []);
    //the validation happens after a delay. so initially set invalid to true if its a new record else false
    this.set("invalid", this.get("record.isNew"));
  },

  postRead : function(data) {
    this.setToValues(data);
    this.set("hasFile", true);
  },

  postFail : function(message) {
    this.set("hasFile", false);
  },

  actions : {
    remove : function() {
      this.set("hasFile", false);
      this.set("csvVal", "");
      this.setToValues("");
    },

    replace : function() {
      $(this.get("element")).find("input[type='file']").click();
    },
  },
});

var mulid = 0;
Form.MultiEntry = Form.TextInputView.extend(Form.MultiInputParentMixin, {
  childView : function() {
    var col = this.get("col");
    return Form.TypeToCellMap[col.get("childCol").type];
  }.property("view.col.childCol.type"),
  template : Ember.Handlebars.compile('' +
    '<div {{bind-attr class="view.col.multiEntryContainerClass"}}>' +
    '{{#each view.val}}' +
      '<div {{bind-attr class="view.col.eachMultiEntryClass"}}>' +
        '<div {{bind-attr class="view.col.multiEntryClass"}}>' +
          '{{create-view view.childView record=this col=view.col.childCol parentForm=view showLabel=view.col.showChildrenLabel immediateParent=view}}' +
        '</div>' +
        '{{#if view.col.canManipulateEntries}}' +
          '<div class="remove-entry" rel="tooltip" title="Delete Condition"><a {{action "deleteEntry" this target="view"}}>' +
            '<span class="glyphicon glyphicon-trash"></span>' +
          '</a></div>' +
          '<div class="add-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="view"}}>'+
            '<span class="glyphicon glyphicon-plus"></span>'+
          '</a></div>'+
        '{{/if}}' +
      '</div>' +
    '{{else}}'+
      '{{#if view.col.canManipulateEntries}}' +
        '<div class="add-first-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="view"}}>'+
          '<span class="glyphicon glyphicon-plus"></span>'+
        '</a></div>'+
      '{{/if}}' +
    '{{/each}}'+
    '</div>'+
    '<p class="tp-rules-end-msg">{{view.col.postInputText}}</p>'
    ),

  valuesArrayDidChange : function() {
    if(this.get("record")) this.validateValue(this.get("val"));
  }.observes("val.@each", "view.val.@each"),

  actions : {
    addEntry : function() {
      var record = this.get("record"), col = this.get("col"),
          entry, val = this.get("val"), data = { /*id : col.get("name")+"__"+mulid++*/ };
      $('.tooltip').hide();
      Form.CopyValuesToObject(data, col, record);
      entry = CrudAdapter.createRecordWrapper(record.store, col.get("arrayType"), data);
      if(!val) {
        val = [];
        this.set("val", val);
      }
      val.pushObject(entry);
    },

    deleteEntry : function(entry) {
      $('.tooltip').hide();
      var val = this.get("val");
      val.removeObject(entry);
    },
  },
});

Form.MultiInput = Ember.ContainerView.extend(Form.MultiColumnMixin, Form.MultiInputParentMixin, {
  classNames : ['clearfix'],
  classNameBindings : ['col.additionalClass'],
  parentForRows : function() {
    if(this.get("col.propogateValChange")) {
      return this.get("parentForm");
    }
    else {
      return this;
    }
  }.property(),

  arrayProps : ['cols'],
  cols : Ember.computed.alias("col.childCols"),

  //TODO : support non inline groups
  labelWidthClass : Ember.computed.alias("col.childrenLabelWidthClass"),
  inputWidthClass : Ember.computed.alias("col.childrenInputWidthClass"),
  showLabel : Ember.computed.alias("col.showChildrenLabel"),
});

Form.CheckBox = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<div class="checkbox"><label>{{view Ember.Checkbox checked=view.val disabled=view.isDisabled}}<label></label> {{view.col.checkboxLabel}}</label></div>'),
});

Form.TextAreaSelectedView = Form.TextAreaView.extend({
  init : function() {
    this._super();
    this.get("val");
  },

  valChanged : function(e) {
    var textarea = $(e.target);
    textarea.focus().select();
    Ember.run.later(function() {
      textarea.scrollTop(0);
    }, 1);
  },

  didInsertElement : function() {
    var textarea = $(this.get("element")).find("textarea"), that = this;
    this._super();
    textarea.change(this.valChanged);
    Ember.run.later(function() {
      that.valChanged({target : textarea});
    }, 1000);
  },
});

Form.GroupRadioButtonView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{#each view.col.options}}<div {{bind-attr class="radio view.col.displayInline:radio-inline"}}>'
    + '<label>{{view Form.RadioInputView name=view.groupName value=this.val selection=view.val}}<span></span>{{{this.label}}}</label></div> {{/each}}'
  ),
  groupName : function(){
    return Utils.getEmberId(this);
  }.property(),
});

Form.RadioInputView = Ember.View.extend({
  tagName : "input",
  type : "radio",
  attributeBindings : [ "name", "type", "value", "checked:checked" ],
  click : function() {
    this.set("selection", this.$().val());
  },
  checked : function() {
    return this.get("value") == this.get("selection");
  }.property('selection')
});

Form.GroupCheckBox = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{#each view.newCheckList}}<div {{bind-attr class="checkbox col-md-4 view.col.displayInline:checkbox-inline"}}>'
    + '<label>{{view Ember.Checkbox checked=this.checked disabled=view.isDisabled}}<label></label> {{this.checkboxLabel}}</label></div>{{/each}}'),

  checkBoxDidChange : function (){
    var checkList = this.get("newCheckList");
    this.set("val",checkList.filterBy("checked",true).mapBy("id").join(","));
  }.observes('newCheckList.@each.checked'),
  newCheckList : function() {
    var ncl = Ember.A(), ocl = this.get("col.checkList"),
        list = this.get("record").get(this.get("col").name).split(",");
    for(var i = 0; i < ocl.get("length") ; i++) {
      var op = JSON.parse(JSON.stringify(ocl[i], ["checkboxLabel", "id"]));
      if(list.indexOf(op.id+"") == -1) {
        op.checked = false;
      }
      else op.checked = true;
      ncl.pushObject(Ember.Object.create(op));
    }
    return ncl;
  }.property('view.col.checkList'),
  notifyValChange : function(obj, val) {
    this._super();
    var list = this.get("record").get(this.get("col").name).split(","),
        newCheckList = this.get("newCheckList");
    if(newCheckList) {
      newCheckList.forEach(function(ele){
        if(list.indexOf(ele.get("id")+"")==-1){
          ele.set("checked",false);
        }
        else ele.set("checked",true);
      },this);
    }
  },
});

Form.MediumHeading = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<label>{{view.col.label}}</label>'),
  layout : Ember.Handlebars.compile('{{yield}}'),
});

//extend this to add extra content before views like Form.MultiEntry or Form.MultiInput
Form.WrapperView = Ember.View.extend({
  childView : function() {
    var col = this.get("col");
    return Form.TypeToCellMap[col.get("childCol").type];
  }.property("view.col.childCol.type"),
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('{{create-view view.childView record=view.record col=view.col.childCol parentForm=view.parentForm immediateParent=view.immediateParent}}'),
});

Form.TypeToCellMap = {
  textInput : Form.TextInputView,
  textareaInput : Form.TextAreaView,
  staticSelect : Form.StaticSelectView,
  dynamicSelect : Form.DynamicSelectView,
  selectiveSelect : Form.SelectiveSelectView,
  label : Form.Label,
  fileUpload : Form.FileUpload,
  imageUpload : Form.ImageUpload,
  csvData : Form.CSVDataInput,
  multiEntry : Form.MultiEntry,
  multiInput : Form.MultiInput,
  checkBox : Form.CheckBox,
  textareaSelectedInput : Form.TextAreaSelectedView,
  groupRadioButton : Form.GroupRadioButtonView,
  groupCheckBox : Form.GroupCheckBox,
  sectionHeading : Form.MediumHeading,
};

Collapsible = Ember.Namespace.create();
Collapsible.CollapsibleGroup = Ember.Component.extend({
  groupId : '00',
  layout : Ember.Handlebars.compile('<div class="panel-group" {{bind-attr id="view.groupId"}}>{{yield}}</div>'),
});
Collapsible.Collapsible = Ember.Component.extend({
  classNames : ['panel', 'panel-default'],
  name : "",
  desc : null,
  hasActive : false,
  active : false,
  badgeLabel : null,
  badgeCount : 0,
  tooltipTitle : function() {
    return "Click to open "+this.get("badgeLabel");
  }.property('view.badgeLabel'),
  groupId : '00',
  groupIdHref : function() {
    return "#"+this.get("groupId");
  }.property('view.groupId'),
  collapseId : '0',
  idHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),
  headerTemplate : null,
  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '<h4 class="panel-title">' +
        '<div>' +
          '<h4 class="panel-title group-item-heading">' +
            '<a class="group-item-name" data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.idHref"}}>' +
              '{{#view Tooltip.Tooltip tagName="span" title=view.tooltipTitle data=view}}{{view.data.name}}{{/view}}' +
            '</a>' +
            '{{#if view.hasActive}}' +
              '{{view Views.ActiveLabel value=view.active}}' +
            '{{/if}}' +
            '{{#if view.badgeLabel}}' +
              '<span class="badge pull-right">{{view.badgeLabel}} : {{view.badgeCount}}</span>' +
            '{{/if}}' +
          '</h4>' +
        '</div>' +
        '{{#if view.desc}}' +
          '<div class="group-item-desc">' +
            '{{view.desc}}' +
          '</div>' +
        '{{/if}}' +
      '</h4>' +
    '</div>' +
    '<div {{bind-attr id="view.collapseId"}} class="panel-collapse collapse">' +
      '<div class="panel-body">{{yield}}</div>' +
    '</div>'),
});

ListGroup = Ember.Namespace.create();

ListGroup.ListItemView = Ember.View.extend({
  init : function() {
    this._super();
    var toBindProperties = this.get("toBindProperties");
    toBindProperties.forEach(function(item) {
      Ember.oneWay(this, item.toProp, "data."+item.fromProp);
    }, this);
  },

  toBindProperties : [],
  data : null,
});

ListGroup.ListGroup = Ember.View.extend({
  classNames : ['list-group'],

  objects : [],
  listgroupTemplate : "",

  template : Ember.Handlebars.compile('' +
    '{{#each view.objects}}' +
      '{{view ListGroup.ListGroupItem this templateName=view.listgroupTemplate}}' +
    '{{else}}' +
      'No {{name}} found' +
    '{{/each}}'),
});
ListGroup.ListGroupItem = Ember.View.extend({
  classNames : ['list-group-item'],

  name : "",
  desc : "",
  rightText : "",
  active : false,
  hasActive : false,
  layout : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '<span class="group-item-name">{{view.name}}</span>' +
      '{{#if view.hasActive}}' +
        '{{view Views.ActiveLabel value=view.active}}' +
      '{{/if}}' +
      '<div class="pull-right text-right">' +
        '{{yield}}' +
      '</div>' +
    '</h4>' +
    '<p class="list-group-item-text">{{view.desc}}</p>'),

  template : Ember.Handlebars.compile('{{view.rightText}}'),
});
ListGroup.ListGroupItemView = ListGroup.ListItemView.extend({
  classNames : ['list-group-item'],

  name : "",
  desc : "",
  rightText : "",
  active : false,
  hasActive : false,
  layout : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '<span class="group-item-name">{{view.name}}</span>' +
      '{{#if view.hasActive}}' +
        '{{view Views.ActiveLabel value=view.active}}' +
      '{{/if}}' +
      '<div class="pull-right text-right">' +
        '{{yield}}' +
      '</div>' +
    '</h4>' +
    '<p class="list-group-item-text">{{view.desc}}</p>'),

  template : Ember.Handlebars.compile('{{view.rightText}}'),
});

ListGroup.ListGroupView = Ember.ContainerView.extend({
  init : function() {
    this._super();
    this.addBeforeObserver('view.array', this, 'arrayWillChange', this);
    this.addObserver('view.array', this, 'arrayDidChange', this);
    var array = this.get("array");
    if(array && array.length > 0) {
      this.createViews(array);
    }
  },

  array : null,
  toBindProperties : [],
  arrayArrayDidChange1 : function() {
    console.log(1);
  }.observes('view.array.@each'),

  arrayWillChange : function() {
    var array = this.get("array");
    if(array) {
      array.removeArrayObserver(this);
    }
  },

  arrayDidChnage : function() {
    var array = this.get("array");
    if(array) {
      array.addArrayObserver(this, {
        willChange : this.arrayArrayWillChange,
        didChange : this.arrayArrayDidChange,
      });
    }
  },

  groupItemView : ListGroup.ListGroupItemView,

  createViews : function(array) {
    var groupItemView = this.get("groupItemView");
    this.groupItemView = groupItemView;
    array.forEach(function(item) {
      var view = this.groupItemView.create({ data : item, toBindProperties : this.get("toBindProperties") });
      item.listGroupItemView = view;
      this.addObject(view);
    }, this);
  },

  removeViews : function(array) {
    array.forEach(function(item, idx, array) {
      this.removeObject(item.listGroupItemView);
    }, this);
  },

  arrayArrayWillChange : function(array, idx, removedCount, addedCount) {
    var removedObjects = array.slice(idx, idx + removedCount);
    if(removedObjects || removedObjects.length > 0) {
      this.removeViews(removedObjects);
    }
  },

  arrayArrayDidChange : function(array, idx, removedCount, addedCount) {
    var addedObjects = array.splice(idx, idx + addedCount);
    if(addedObjects || addedObjects.length > 0) {
      this.createViews(addedObjects);
    }
  },
});

Tooltip = Ember.Namespace.create();

Tooltip.TooltipComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'title', 'delay:data-delay', 'type'],
  animation : "true",
  placement : "top",
  title : "",
  delay : 0,
  type : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),
  data : null,

  didInsertElement : function() {
    $(this.get("element")).tooltip();
  },
});

Ember.Handlebars.helper('tool-tip', Tooltip.TooltipComponent);

Carousel = Ember.Namespace.create()
Carousel.Carousel = Ember.View.extend({
  classNames : ['carousel', 'slide'],
  attributeBindings : ['dataRide:data-ride', 'dataInterval:data-interval'],
  dataRide : "carousel",
  dataInterval : "false",
  carouselId : "00",
  carouselIdStr : function() {
    return "#"+this.get("carouselId");
  }.property('carouselId'),

  objects : [],
  layout : Ember.Handlebars.compile('' +
  '<div class="carousel-inner">' +
    '{{#each view.objects}}' +
      '{{#if _view.contentIndex}}' +
        '<div class="item">' +
          '{{yield}}' +
        '</div>' +
      '{{else}}' +
        '<div class="item active">' +
          '{{yield}}' +
        '</div>' +
      '{{/if}}' +
    '{{/each}}' +
  '</div>' +
  '<a class="left carousel-control" {{bind-attr href="view.carouselIdStr"}} data-slide="prev">' +
    '<span class="carousel-navigate carousel-navigate-prev">&laquo;</span>' +
  '</a>' +
  '<a class="right carousel-control" {{bind-attr href="view.carouselIdStr"}} data-slide="next">' +
    '<span class="carousel-navigate carousel-navigate-next">&raquo;</span>' +
  '</a>'),
});

Sortable = Ember.Namespace.create();
//temp solution for chrome's buggy event.dataTransfer, v31.x.x
Sortable.VIEW_ID = "";
Sortable.MOVE_THRESHOLD = 2;
Sortable.DisplayElement = Ember.View.extend({
  Name : null,
  template : Ember.Handlebars.compile('{{view.Name}}'),
  tagName : '',
});
Sortable.Dragable = Ember.ContainerView.extend({
  init : function() {
    this._super();
    var Name = this.get("Name"), data = this.get("data");
    if(!data.Children) {
      this.pushObject(Sortable.DisplayElement.create({Name : Name}));
    }
    this.set("lastXY", [0, 0]);
  },
  attributeBindings: 'draggable',
  classNames : ['sortable-dragable'],
  classNameBindings : ['effH'],
  draggable: 'true',
  data : null,
  Name : Ember.computed.oneWay('data.Name'),
  sortable : null,
  tagName : 'li',
  groupId : 0,
  hasElements : false,
  curGrpId : function() {
    return this.get("groupId");
  }.property('groupId', 'data.sameLevel'),
  stateData : null,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  calcAppendPosition : function(xy) {
    var lxy = this.get("lastXY"),
        dx = xy[0] - lxy[0], adx = Math.abs(dx),
        dy = xy[1] - lxy[1], ady = Math.abs(dy),
        rd = dx, ard = adx;
    if(ady > adx) {
      rd = dy;
      ard = ady;
    }
    if(ard > Sortable.MOVE_THRESHOLD) {
      if(rd < 0) {
        this.set("appendNext", false);
      }
      else {
        this.set("appendNext", true);
      }
      this.set("lastXY", xy);
      this.set("change", true);
    }
    else {
      this.set("change", false);
    }
  },
  dragOver: function(event) {
    //console.log("view Id : "+Sortable.VIEW_ID);
    var dataTransfer = event.originalEvent.dataTransfer,
        thisSort = this.get("sortable"), thisSortId = thisSort.get("elementId"),
        thiseles = thisSort.get("Children"), thisName = this.get("Name"), thisidx = thiseles.indexOf(thiseles.findBy('Name', thisName)),
        thatId = dataTransfer.getData('ViewId') || Sortable.VIEW_ID, that = Ember.View.views[thatId],
        thatName = that.get("Name"), thatSort = that.get("sortable"), thatSortId = thatSort.get("elementId"),
        thateles = thatSort.get("Children"), thatidx = thateles.indexOf(thateles.findBy('Name', thatName)),
        thatdata = thateles[thatidx];
    that.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
    if(thisSort.get("effH") === thatSort.get("effH")) {
      if(that.get("change")) {
        if(thisSortId === thatSortId) {
          if(thisName !== thatName && thisidx !== thatidx) {
            //console.log("**1**");
            if(thisSort._childViews.length == 1 && thisSort._childViews[0] instanceof Sortable.Placeholder) {
              thisSort.removeAt(0);
              //console.log("remove placeholder");
            }
            //console.log("thatidx "+thatidx);
            thiseles.splice(thatidx, 1);
            //console.log("thatidx inserted "+thatidx);
            thisSort.removeAt(thatidx);
            //console.log("thatidx view "+thatidx);
            if(that.get("appendNext")) thisidx++;
            if(thisidx > thiseles.length) thisidx = thiseles.length;
            else if(thisidx === -1) thisidx = 0;
            //console.log("thisidx "+thisidx);
            thiseles.splice(thisidx, 0, thatdata);
            //console.log("thisidx inserted "+thisidx+".."+thisSort._childViews.length);
            thisSort.insertAt(thisidx, that);
            //console.log("thisidx view "+thisidx+".."+thisSort._childViews.length);
          }
        }
        else {
          if(thiseles.indexOf(thatName) === -1 && !Utils.deepSearchArray(thatdata, thisName, 'Name', 'Children')) {
            //console.log("**2**");
            if(thisSort._childViews.length == 1 && thisSort._childViews[0] instanceof Sortable.Placeholder) {
              thisSort.removeAt(0);
              //console.log("remove placeholder");
            }
            //console.log("thatidx "+thatidx);
            thateles.splice(thatidx, 1);
            //console.log("thatidx inserted "+thatidx);
            thatSort.removeAt(thatidx);
            //console.log("thatidx view "+thatidx);
            if(that.get("appendNext")) thisidx++;
            if(thisidx > thiseles.length) thisidx = thiseles.length;
            else if(thisidx === -1) thisidx = 0;
            //console.log("thisidx "+thisidx);
            thiseles.splice(thisidx, 0, thatdata);
            //console.log("thisidx inserted "+thisidx+".."+thisSort._childViews.length);
            that.set("sortable", thisSort);
            thisSort.insertAt(thisidx, that);
            //console.log("thisidx view "+thisidx+".."+thisSort._childViews.length);
            //console.log(thatidx+".."+thisidx+".."+thatSort._childViews.length);
            if(thatSort._childViews.length == 0) {
              thatSort.pushObject(Sortable.Placeholder.create({
                sortable : thatSort,
                hierarchy : that.get("hierarchy"),
                groupId : that.get("stateData").grpId,
              }));
              //console.log("add placeholder");
            }
          }
        }
        that.set("change", false);
      }
      event.stopPropagation();
    }
  },
  dragStart: function(event) {
    var dataTransfer = event.originalEvent.dataTransfer, viewid = this.get("elementId");
    dataTransfer.setData('ViewId', viewid);
    dataTransfer.dropEffect = 'move';
    Sortable.VIEW_ID = viewid;
    event.stopPropagation();
  },
  drop : function(event) {
    event.preventDefault();
  },
  change : false,
  appendNext : false,
  lastXY : null,
  tagName : 'li',
});
Sortable.Droppable = Ember.ContainerView.extend({
  classNames : ['sortable-droppable'],
  Children : [],
  parentData : null,
  elesIsEmpty : Ember.computed.empty('Children.@each'),
  groupId : 0,
  hierarchy : "",
  stateData : null,
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragEnter: function(event) {
    event.preventDefault();
  },
  dragOver : function(event) {
    event.preventDefault();
  },
  drop: function(event) {
    event.preventDefault();
  },
  tagName : 'ul',
});
Sortable.Placeholder = Ember.ContainerView.extend({
  init : function() {
    this._super();
    this.pushObject(Ember.View.create({
      template : Ember.Handlebars.compile('Placeholder'),
    }));
  },

  classNames : ['sortable-placeholder'],
  sortable : null,
  groupId : 0,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragEnter: function(event) {
    event.preventDefault();
  },
  dragOver : function(event) {
    event.preventDefault();
    var dataTransfer = event.originalEvent.dataTransfer,
        thisSort = this.get("sortable"), thisSortId = thisSort.get("elementId"),
        thiseles = thisSort.get("Children"), thisName = this.get("Name"), thisidx = thiseles.indexOf(thiseles.findBy('Name', thisName)),
        thatId = dataTransfer.getData('ViewId') || Sortable.VIEW_ID, that = Ember.View.views[thatId],
        thatName = that.get("Name"), thatSort = that.get("sortable"), thatSortId = thatSort.get("elementId"),
        thateles = thatSort.get("Children"), thatidx = thateles.indexOf(thateles.findBy('Name', thatName)),
        thatdata = thateles[thatidx];
    //console.log("Name : "+thisName+".."+thatName);
    that.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
    if(thisSort.get("effH") === thatSort.get("effH")) {
      if(that.get("change")) {
        if(thisSort._childViews.length == 1 && thisSort._childViews[0] instanceof Sortable.Placeholder) {
          thisSort.removeAt(0);
          //console.log("remove placeholder");
        }
        thateles.splice(thatidx, 1);
        thatSort.removeAt(thatidx);
        thiseles.push(thatdata);
        that.set("sortable", thisSort);
        thisSort.pushObject(that);
      }
      event.stopPropagation();
    }
  },
  drop: function(event) {
    event.preventDefault();
  },
  //tagName : 'li',
});

ArrayMod = Ember.Namespace.create();


//** ArrayMod types

ArrayMod.ArrayModifier = Ember.Object.extend({
  type : "basic",
  groupType : "basic",
  property : "",
  modify : function(array) {
    return array;
  },
  addObserverToAll : true,

  addModObservers : function(context, method) {
    Ember.addObserver(this, "property", context, method);
  },

  removeModObservers : function(context, method) {
    Ember.removeObserver(this, "property", context, method);
  },
});

ArrayMod.ArrayFilterModifier = ArrayMod.ArrayModifier.extend({
  type : "filter",
  groupType : "filter",
  modify : function(array) {
    return array.filter(function(item) {
      var value = item.get(this.get("property"));
      this.modFun(item, value);
    }, this);
  },

  modFun : function(item, value) {
    return true;
  },
});

ArrayMod.ArraySearchModifier = ArrayMod.ArrayFilterModifier.extend({
  type : "search",
  searchString : "",
  negate : false,
  searchRegex : function() {
    var searchString = this.get("searchString") || "";
    searchString = searchString.replace(/([\.\[\]\?\+\*])/g, "\\$1");
    return new RegExp(searchString, "i");
  }.property('searchString'),

  modFun : function(item, value) {
    var negate = this.get("negate"), filter = this.get("searchRegex").test(value)
    return (negate && !filter) || (!negate && filter);
  },

  addModObservers : function(context, method) {
    this._super();
    //handle this seperately
    Ember.addObserver(this, "searchString", context, method+"_each");
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "searchString", context, method+"_each");
  },
});

//TODO : support dynamic tags
ArrayMod.ArrayTagObjectModifier = Ember.Object.extend({
  label : "",
  val : "",
  checked : true,
  negate : false,
});
ArrayMod.ArrayTagSearchModifier = ArrayMod.ArrayFilterModifier.extend({
  type : "tagSearch",
  tags : Utils.hasMany("ArrayMod.ArrayTagObjectModifier"),
  selectedTags : Ember.computed.filterBy("tags", "checked", true),
  joiner : "or",

  modFun : function(item, value) {
    var tags = this.get("selectedTags"), joiner = this.get("joiner") == "and", bool = joiner;
    for(var i = 0; i < tags.length; i++) {
      var res = value == tags[i].get("val");
      bool = (joiner && (bool && res)) || (!joiner && (bool || res));
    }
    return bool;
  },

  addModObservers : function(context, method) {
    this._super();
    //handle this seperately
    Ember.addObserver(this, "selectedTags.@each", context, method+"_each");
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "selectedTags.@each", context, method+"_each");
  },
});

ArrayMod.ArraySortModifier = ArrayMod.ArrayModifier.extend({
  type : "sort",
  groupType : "sort",
  //true for ascending, false for descending
  order : true,
  addObserverToAll : false,

  modify : function(array) {
    array.sortBy(this.get("property"));
    if(!this.get("order")) array.reverseObjects();
    return array;
  },

  addModObservers : function(context, method) {
    this._super();
    Ember.addObserver(this, "order", context, method);
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "order", context, method);
  },
});

ArrayMod.ArrayModMap = {
  basic : ArrayMod.ArrayModifier,
  filter : ArrayMod.ArrayFilterModifier,
  search : ArrayMod.ArraySearchModifier,
  tagSearch : ArrayMod.ArrayTagSearchModifier,
  sort : ArrayMod.ArraySortModifier,
};


//** ArrayModGroup types

ArrayMod.ArrayModGroup = Ember.Object.extend(Utils.ObjectWithArrayMixin, {
  type : "basic",
  arrayMods : Utils.hasMany(null, ArrayMod.ArrayModMap, "type"),
  arrayProps : ['arrayMods'],
  idx : 0,

  canAdd : function(item) {
    return true;
  },

  modify : function(array) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      array = arrayMods[i].modify(array);
    }
    return array;
  },
});

ArrayMod.ArrayFilterGroup = ArrayMod.ArrayModGroup.extend({
  type : "filter",

  canAdd : function(item) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      var value = item.get(arrayMods[i].get("property"));
      if(!arrayMods[i].modFun(item, value)) {
        return false;
      }
    }
    return true;
  },

  modify : function(array) {
    var that = this;
    return array.filter(function(item) {
      return that.canAdd(item);
    }, this);
  },

  modifySingle : function(array, item, idx) {
    if(this.canAdd(item)) {
      if(!array.contains(item)) {
        if(idx === -1) {
          array.pushObject(item);
        }
        else {
          array.insertAt(idx, item);
        }
      }
      return true;
    }
    else if(array.contains(item)) {
      array.removeObject(item);
    }
    return false;
  },
});

ArrayMod.Compare = function(a, b) {
  return a === b ? 0 : (a > b ? 1 : -1);
};
ArrayMod.ArraySortGroup = ArrayMod.ArrayModGroup.extend({
  type : "sort",

  compare : function(a, b) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      var av = a.get(arrayMods[i].get("property")),
          bv = b.get(arrayMods[i].get("property")),
          cmp = ArrayMod.Compare(av, bv),
          order = arrayMods[i].get("order");
      if(!order) {
        cmp = -cmp;
      }
      if(cmp) {
        return cmp;
      }
      else {
        continue;
      }
    }
    return 0;
  },

  modify : function(array) {
    var that = this;
    return array.sort(function(a, b) {
      return that.compare(a, b);
    }, this);
  },

  modifySingle : function(array, item, idx) {
    var that = this;
    if(array.contains(item)) {
      array.removeObject(item);
    }
    Utils.binaryInsert(array, item, function(a, b) {
      return that.compare(a, b);
    });
    return true;
  },
});

ArrayMod.ArrayModGroupMap = {
  basic : ArrayMod.ArrayModGroup,
  filter : ArrayMod.ArrayFilterGroup,
  sort : ArrayMod.ArraySortGroup,
};


//TODO : revisit the observers addition and deletion
ArrayMod.ArrayModController = Ember.ArrayController.extend(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
  },
  unique_id : "arrayMod",

  //arrayMods : Utils.hasMany(null, ArrayMod.ArrayModMap, "type"),
  arrayMods : null,
  //arrayModGrps : Utils.hasMany(null, ArrayMod.ArrayModGroupMap, "type"),
  arrayModGrps : null,
  arrayProps : ['arrayMods', 'arrayModGrps'],
  //not firing on adding new objects!
  isModified : function() {
    var arrayModGrps = this.get('arrayModGrps');
    return !!arrayModGrps && arrayModGrps.length > 0;
  }.property('arrayModGrps.@each'),

  addArrayModToGroup : function(arrayMod) {
    var arrayModGrps = this.get("arrayModGrps"), arrayModGrp = arrayModGrps.findBy("type", arrayMod.get("groupType")),
        arrayMods = this.get("arrayMods");
    if(arrayModGrp) {
      Utils.binaryInsert(arrayModGrp.get("arrayMods"), arrayMod, function(a, b) {
        return ArrayMod.Compare(arrayMods.indexOf(a), arrayMods.indexOf(b));
      });
    }
    else {
      arrayModGrp = ArrayMod.ArrayModGroupMap[arrayMod.get("groupType")].create({
        arrayMods : [arrayMod],
        idx : arrayMods.indexOf(arrayMod),
      });
      Utils.binaryInsert(arrayModGrps, arrayModGrp, function(a, b) {
        return ArrayMod.Compare(arrayMods.indexOf(a), arrayMods.indexOf(b));
      });
    }
  },

  removeArrayModFromGroup : function(arrayMod) {
    var arrayModGrps = this.get("arrayModGrps"), arrayModGrp = arrayModGrps.findBy("type", arrayMod.get("groupType")),
        arrayMods = arrayModGrp.get("arrayMods");
    if(arrayModGrp) {
      arrayMods.removeObject(arrayMod);
      if(arrayMods.length === 0) {
        arrayModGrps.removeObject(arrayModGrp);
      }
    }
  },

  arrayModsWillBeDeleted : function(deletedArrayMods, idx) {
    var content = this.get("content") || [], arrangedContent = this.get("arrangedContent"),
        that = this;
    for(var i = 0; i < deletedArrayMods.length; i++) {
      var arrayMod = deletedArrayMods[i];
      arrayMod.removeModObservers(this, "arrayModsDidChange");
      content.forEach(function(item) {
        if(this.arrayMod.get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.addObserver(item, this.arrayMod.get("property"), this.that, "contentItemPropertyDidChange");
        }
      }, {that : this, arrayMod : arrayMod, arrangedContent : arrangedContent});
      this.removeArrayModFromGroup(arrayMod);
    }
    AsyncQue.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },
  arrayModsWasAdded : function(addedArrayMods, idx) {
    var content = this.get("content") || [], arrangedContent = this.get("arrangedContent"),
        that = this;
    for(var i = 0; i < addedArrayMods.length; i++) {
      var arrayMod = addedArrayMods[i];
      arrayMod.addModObservers(this, "arrayModsDidChange");
      content.forEach(function(item) {
        if(this.arrayMod.get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.removeObserver(item, this.arrayMod.get("property"), this.that, "contentItemPropertyDidChange");
        }
      }, {that : this, arrayMod : arrayMod, arrangedContent : arrangedContent});
      this.addArrayModToGroup(arrayMod);
    }
    AsyncQue.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },

  addObserversToItems : function(override, arranged) {
    var content = override || this.get("content") || [], arrangedContent = arranged || this.get("arrangedContent"),
        arrayMods = this.get("arrayMods");
    content.forEach(function(item) {
      for(var i = 0; i < this.arrayMods.length; i++) {
        if(this.arrayMods[i].get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.addObserver(item, this.arrayMods[i].get("property"), this.that, "contentItemPropertyDidChange");
        }
      }
    }, {that : this, arrayMods : arrayMods, arrangedContent : arrangedContent});
  },

  removeObserversFromItems : function(override, arranged) {
    var content = override || this.get("content") || [], arrangedContent = arranged || this.get("arrangedContent"),
        arrayMods = this.get("arrayMods");
    content.forEach(function(item) {
      for(var i = 0; i < this.arrayMods.length; i++) {
        if(this.arrayMods[i].get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.removeObserver(item, this.arrayMods[i].get("property"), this.that, "contentItemPropertyDidChange");
        }
      }
    }, {that : this, arrayMods : arrayMods, arrangedContent : arrangedContent});
  },

  arrayModsDidChange : function() {
    var that = this;
    AsyncQue.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },

  arrayModsDidChange_each : function() {
    var that = this;
    AsyncQue.addToQue(this.get("unique_id")+"__ArrayModChanged_Each", 500).then(function() {
      var content = that.get("content"), arrangedContent = that.get("arrangedContent"),
          arrayModGrps = that.get('arrayModGrps');
      //enclose the operation in a run loop to decrease the view render overhead
      Ember.run(function() {
        for(var i = 0; i < content.get("length"); i++) {
          var item = content.objectAt(i), inArrangedContent = arrangedContent.contains(item),
              canAdd = true;
          for(var j = 0; j < arrayModGrps.length; j++) {
            if(!arrayModGrps[j].canAdd(item)) {
              canAdd = false;
              break;
            }
          }
          if(inArrangedContent && !canAdd) {
            arrangedContent.removeObject(item);
          }
          else if(!inArrangedContent && canAdd) {
            for(var j = 0; j < arrayModGrps.length; j++) {
              if(!arrayModGrps[j].modifySingle(arrangedContent, item, arrangedContent.indexOf(item))) {
                break;
              }
            }
          }
        }
      });
    });
  },

  destroy : function() {
    this.removeObserversFromItems();
    return this._super();
  },

  arrangedContent : Ember.computed('content', function(key, value) {
    var content = this.get('content'), retcontent,
        arrayModGrps = this.get('arrayModGrps'),
        isModified = !!arrayModGrps && arrayModGrps.length > 0,
        that = this, hasContent = content && (content.length > 0 || (content.get && content.get("length") > 0));

    if(content && isModified) {
      retcontent = content.slice();
      for(var i = 0; i < arrayModGrps.length; i++) {
        if(retcontent.length > 0) {
          retcontent = arrayModGrps[i].modify(retcontent);
        }
      }
      this.addObserversToItems(content, retcontent);
      return Ember.A(retcontent);
    }

    return Ember.A([]);
  }),

  _contentWillChange : Ember.beforeObserver('content', function() {
    this.removeObserversFromItems();
    this._super();
  }),

  contentArrayWillChange : function(array, idx, removedCount, addedCount) {
    var isModified = this.get('isModified');
    if(isModified) {
      var arrangedContent = this.get('arrangedContent'),
          removedObjects = array.slice(idx, idx+removedCount),
          arrayModGrps = this.get('arrayModGrps');
      this.removeObserversFromItems(removedObjects);
      removedObjects.forEach(function(item) {
        this.removeObject(item);
      }, arrangedContent);
    }
  },

  contentArrayDidChange : function(array, idx, removedCount, addedCount) {
    var isModified = this.get('isModified');
    if(isModified) {
      var arrangedContent = this.get('arrangedContent'),
          addedObjects = array.slice(idx, idx+addedCount),
          arrayModGrps = this.get('arrayModGrps');
      this.addObserversToItems(addedObjects);
      for(var i = 0; i < addedObjects.length; i++) {
        for(var j = 0; j < arrayModGrps.length; j++) {
          if(!arrayModGrps[j].modifySingle(arrangedContent, addedObjects[i], idx + i)) {
            break;
          }
        }
      }
    }
  },

  contentItemPropertyDidChange : function(item) {
    var arrayModGrps = this.get('arrayModGrps'),
        arrangedContent = this.get("arrangedContent");
    for(var i = 0; i < arrayModGrps.length; i++) {
      if(!arrayModGrps[i].modifySingle(arrangedContent, item, arrangedContent.indexOf(item))) {
        break;
      }
    }
  },
});

ColumnData = Ember.Namespace.create();
ColumnData.ColumnValidation = Ember.Object.extend({
  type : 0,
  regex : "",
  regexFlags : "",
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),
  invalidMessage : "",
  negate : false,

  minValue : 0,
  maxValue : 999999,

  validateValue : function(value, record) {
    var type = this.get("type"), invalid = false, negate = this.get("negate"),
        emptyRegex = new RegExp("^\\s*$"), value = value || "";
    if(value.trim) value = value.trim();
    Ember.run.begin();
    switch(type) {
      case 0:  Ember.run.begin();
               invalid = Ember.isEmpty(value); invalid = invalid || emptyRegex.test(value);
               Ember.run.end();
               break;

      case 1:  Ember.run.begin();
               invalid = ( Ember.isEmpty(value.trim()) && this.get("canBeEmpty") )||this.get("regexObject").test(value);
               Ember.run.end();
               break;

      case 2:  Ember.run.begin();
               if(Ember.isEmpty(value.trim()) && this.get("canBeEmpty")){invalid=true; break;}
               value.split(this.get("delimeter")).some(function(item){ 
                 item=item.trim();
                 invalid= this.get("regexObject").test(item); 
                 return negate ? !invalid : invalid; 
               },this); 
               Ember.run.end();
               break;

      case 3:  Ember.run.begin();
               arrVals ={};invalid=false; 
               value.split(this.get("delimeter")).some(function(item){
                 item = item.trim();
                 if(arrVals[item]) return negate ? invalid=false : invalid=true; 
                 else arrVals[item]=true;
               },this);
               Ember.run.end();
               break;

      case 4:  Ember.run.begin();
               var arr = record.get(this.get("duplicateCheckPath")), values = arr && arr.filterBy(this.get("duplicateCheckKey"), value);
               invalid = values && values.get("length") > 1;
               Ember.run.end();
               break;

      case 5:  Ember.run.begin();
               var num = Number(value);
               if(num < this.get("minValue") || num > this.get("maxValue")) invalid = true;
               Ember.run.end();
               break;

      default: invalid = true;
    }
    Ember.run.end();
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.DisableForCol = Ember.Object.extend({
  name : "",
  value : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
  enable : false,
  disable : false,
});

ColumnData.ColumnData = Ember.Object.extend({
  init : function (){
    this._super();
    this.canBeEmpty();
  },
  name : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
  label : null,
  placeholder : null,
  placeholderActual : function() {
    var placeholder = this.get("placeholder"), label = this.get("label");
    if(placeholder) return placeholder;
    return label;
  }.property('label', 'placeholder'),
  type : "",
  fixedValue : null,
  options : [],
  data : [],
  dataValCol : "",
  dataLabelCol : "",
  bubbleValues : false,
  cantBeNull : false,
  canManipulateEntries : true,
  validations : Utils.hasMany(ColumnData.ColumnValidation),
  eachValidations : Utils.hasMany(ColumnData.ColumnValidation),
  checkList : Utils.hasMany(),
  validate : Ember.computed.notEmpty('validations'),
  validateValue : function(value, record, validations) {
    var invalid = [false, ""];
    validations = validations || this.get("validations");
    for(var i = 0; i < validations.length; i++) {
      invalid = validations[i].validateValue(value, record);
      if(invalid[0]) break;
    }
    return invalid;
  },
  canBeEmpty : function(){
    if(this.get("validations"))
    if(!this.get("validations").mapBy("type").contains('0')){
      this.get("validations").forEach(function(item){item.set('canBeEmpty',true)});
    }
  }.observes('validations.@each'),
  mandatory : Ember.computed('validations.@each.type', function() {
    var validations = this.get("validations"), isMandatory = false;
    if(validations) {
      validations.forEach(function(item) {
        isMandatory = isMandatory || item.get("type") == 0;
      });
    }
    return isMandatory;
  }),

  multiEntryContainerClass : "multi-entry-container",
  eachMultiEntryClass : "each-multi-entry",
  multiEntryClass : "multi-entry",
  showChildrenLabel : false,
  childrenLabelWidthClass : "",
  childrenInputWidthClass : "col-md-12",

  childCol : Utils.belongsTo("ColumnData.ColumnData"),
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value && ColumnData.ColumnDataMap[value]) {
        this.set("childCol", ColumnData.ColumnDataMap[value]);
      }
      return value;
    }
  }.property(),
  childCols : Utils.hasMany("ColumnData.ColumnData"),
  childColsName : function(key, value) {
    if(arguments.length > 1) {
      if(value && ColumnData.ColumnDataMap[value]) {
        this.set("childCols", ColumnData.ColumnDataMap[value]);
      }
      return value;
    }
  }.property(),
  exts : Utils.hasMany(),
  disableForCols : Utils.hasMany(ColumnData.DisableForCol),
});


ProgressBars = Ember.Namespace.create();
ProgressBars.ProgressBar = Ember.Component.extend({
  classNames : ["progress"],
  maxVal : "100",
  minVal : "0",
  val : "0",
  progressStyle : function() {
    var maxVal = this.get("maxVal"), minVal = this.get("minVal"), val = this.get("val"),
        v = ( Number(val) - Number(minVal) ) * 100 / ( Number(maxVal) - Number(minVal) );
    return "width: "+v+"%;";
  }.property("val", "maxVal", "minVal"),

  layout : Ember.Handlebars.compile('' +
    '<div role="progressbar" {{bind-attr aria-valuenow=val aria-valuemin=minVal aria-valuemax=maxVal style=progressStyle class=":progress-bar complete:progress-bar-success"}}>' +
      '<div class="progressbar-tag">{{val}} / {{maxVal}}</div>' +
    '</div>'),
});

Ember.Handlebars.helper('progress-bar', ProgressBars.ProgressBar);

EmberFile = Ember.Namespace.create();
EmberFile.FileInput = Ember.Component.extend({
  data : "",
  disabled : false,
  label : "Load File",

  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}}>{{label}}</button>' +
                                      '<input class="input-hidden" type="file" name="files[]">'),


  change : function(event) {
    var files = event.originalEvent.target.files, that = this;
    if(files && files.length > 0 && !Ember.isEmpty(files[0])) {
      this.set("disabled", "disabled");
      EmberFile.ReadFileAsText(files[0]).then(function(data) {
        that.set("data", data);
        that.set("disabled", false);
      }, function(message) {
        console.log(message);
        that.set("disabled", false);
      });
      $(this.get("element")).children("input")[0].value = "";
    }
  },

  actions : {
    loadFile : function() {
      fileInput = $(this.get("element")).children("input")[0];
      fileInput.click();
    },
  },
});

Ember.Handlebars.helper('file-input', EmberFile.FileInput);

EmberFile.ReadFileAsText = function(file) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var reader = new FileReader(), that = this;
    reader.onload = function(data) {
      resolve(data.target.result);
    };
    reader.readAsText(file);
  });
};

Modal = Ember.Namespace.create();
Modal.ModalContainer = Ember.ContainerView.extend({
  tagName : '',
});
Modal.ModalWindow = Ember.View.extend({
  classNames : ['modal'],
  classNameBindings : ['animate:fade'],
  animate : true,

  attributeBindings : ['titleid:aria-labelledby', 'role', 'zIndex:data-zindex', 'backdrop:data-backdrop'],
  titleid : "title-id",
  role : 'dialog',
  loaded : true,
  zIndex : 1000,
  backdrop : "true",
  width : "600px",
  widthStyle : function() {
    return "width:"+this.get("width")+";";
  }.property('view.width', 'width'),

  title : "Title",
  okLabel : "OK",
  showOk : true,
  cancelLabel : "Cancel",
  showCancel : true,
  messageLabel : "",
  message : "",
  showAlert : false,
  layout : Ember.Handlebars.compile('' +
    '<div class="modal-dialog" {{bind-attr style="view.widthStyle"}}>' +
      '<div class="modal-content" tabindex=-1>' +
        '<div class="modal-header">' +
          '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
          '<h4 class="modal-title" {{bind-attr id="view.titleid"}}>{{view.title}}</h4>' +
          '<h5 class="custom-font">{{view.windowMessage}}</h5>'+
        '</div>' +
        '<div class="modal-body">' +
          '{{view Views.Alert message=view.message title=view.messageLabel type="error" switchAlert=view.showAlert}}' +
          '{{yield}}' +
        '</div>' +
        '<div class="modal-footer">' +
          '{{#if view.showOk}}' +
            '<button type="button" class="btn btn-primary ok-btn" {{bind-attr disabled=view.disableAlias}} {{action okClicked target="view"}}>{{view.okLabel}}</button>' +
          '{{/if}}' +
          '{{#if view.showCancel}}' +
            '<button type="button" class="btn btn-default cancel-btn" data-dismiss="modal" {{action cancelClicked target="view"}}>{{view.cancelLabel}}</button>' +
          '{{/if}}' +
        '</div>' +
      '</div>' +
    '</div>'),

  onOk : null,
  onCancel : null,
  actionContext : null,
  fromButton : false,

  disableAlias : Ember.computed.alias("data.disableSave"),

  showModalMesssage : function(label, message) {
    this.set("messageLabel", label);
    this.set("message", message);
    this.set("showAlert", true);
  },

  didInsertElement : function() {
    var onCancel = this.get("onCancel"), context = this.get("actionContext") || this,
        that = this, element = $(this.get("element"));
    element.on("hide.bs.modal", function(e) {
      Ember.run(function() {
        if(!that.get("fromButton") && onCancel) onCancel.call(context);
        that.set("fromButton", false);
      });
    });
    element.on("shown.bs.modal", function(e) {
      Ember.run(function() {
        that.postShowHook();
      });
    });

  },

  actions : {
    okClicked : function(event) {
      var onOk = this.get("onOk");
      this.set("fromButton", true);
      if(onOk) onOk.call(this.get("actionContext") || this);
    },

    cancelClicked : function(event) {
      var onCancel = this.get("onCancel");
      //this.set("fromButton", true);
      //if(onCancel) onCancel.call(this.get("actionContext") || this);
    },
  },

  onCancel : function(){
    $('.tooltip').hide();
  },
  postShowHook : function() {
  },

});

Modal.AddEditWindow = Modal.ModalWindow.extend({
  columns : [],
  data : null,

  saveCallback : null,
  postCancelCallback : null,
  closeOnSuccess : true,

  disableAlias : Ember.computed.or("data.disableSave", "saving"),

  saving : false,

  postShowHook : function() {
    this.set("saving", false);
  },

  didInsertElement : function() {
    this._super();
    $(this.get("element")).on("shown.bs.modal", function(e){
      if($('.modal-body:visible [autofocus]')[0]) $('.modal-body:visible [autofocus]')[0].focus();
    });
  },

  template : Ember.Handlebars.compile('' +
    '{{#unless view.loaded}}Loading...{{/unless}}' +
    '{{view Form.FormView record=view.data cols=view.columns classNameBindings="view.loaded::hidden"}}' +
  ''),

  onOk : function() {
    var data = this.get("data"), that = this;
    this.set("saving", true);
    CrudAdapter.saveRecord(data).then(function(response) {
      baseData.showMessage("Saved successfully!", data.__proto__.constructor.title || "Data", 'success'); 
      if(that.get("closeOnSuccess")) {
        $(that.get("element")).modal('hide');
        that.set("showAlert", false);
        that.set("loaded", false);
        that.set("saving", false);
      }
      if(that.get("saveCallback")) that.get("saveCallback")(data);
    }, function(response) {
      that.showModalMesssage(data.__proto__.constructor.title, response.statusText || response);
      CrudAdapter.retrieveFailure(data);
      CrudAdapter.backupDataMap = {};
      that.set("fromButton", false);
      that.set("saving", false);
    });
  },

  onCancel : function() {
    this._super();
    var data = this.get("data"), postCancelCallback = this.get("postCancelCallback");
    this.set("showAlert", false);
    this.set("loaded", false);
    if(data && !data.get("isSaving")) {
      if(data.get("isNew")) data.deleteRecord();
      else {
        data._validation = {};
        data.set("validationFailed", false);
        CrudAdapter.rollbackRecord(data);
      }
      if(postCancelCallback) {
        postCancelCallback(data);
      }
      this.set("data", null);
    }
  },
});

CrudAdapter = Ember.Namespace.create()
CrudAdapter.loadAdaptor = function(app) {
  app.ApplicationAdapter = CrudAdapter.ApplicationAdapter;
  app.ApplicationSerializer = CrudAdapter.ApplicationSerializer;
};
CrudAdapter.GlobalData = Ember.Object.create();
CrudAdapter.endPoint = {
  find : "get",
};
CrudAdapter.allowedModelAttrs = [{
  attr : "keys",
  defaultValue : "emptyArray",
}, {
  attr : "apiName",
  defaultValue : "value",
  value : "data/generic",
}, {
  attr : "queryParams", 
  defaultValue : "emptyArray",
}, {
  attr : "findParams", 
  defaultValue : "emptyArray",
}, {
  attr : "extraAttrs", 
  defaultValue : "emptyArray",
}, {
  attr : "ignoreFieldsOnCreateUpdate", 
  defaultValue : "emptyArray",
}, {
  attr : "ignoreFieldsOnRetrieveBackup", 
  defaultValue : "emptyArray",
}, {
  attr : "removeAttrsFromBackupOnFind", 
  defaultValue : "emptyArray",
}, {
  attr : "retainId", 
  defaultValue : "value",
  value : false,
}, {
  attr : "useIdForBackup", 
  defaultValue : "value",
  value : false,
}, {
  attr : "paginatedAttribute", 
  defaultValue : "value",
  value : "id",
}, {
  attr : "normalizeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "preSerializeRelations", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "serializeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "backupData", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "retrieveBackup", 
  defaultValue : "value",
  value : function() {},
}];
CrudAdapter.ModelMap = {};

CrudAdapter.ApplicationAdapter = DS.RESTAdapter.extend({
  getQueryParams : function(type, query, record, inBody) {
    var extraParams = {};
    //delete generated field
    if(!type.retainId) delete query.id;
    if(inBody) {
      //only sent for create / update
      for(var i = 0; i < type.ignoreFieldsOnCreateUpdate.length; i++) {
        delete query[type.ignoreFieldsOnCreateUpdate[i]];
      }
      for(var i = 0; i < type.extraAttrs.length; i++) {
        extraParams[type.extraAttrs[i]] = record.get(type.extraAttrs[i]) || CrudAdapter.GlobalData.get(type.extraAttrs[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.extraAttrs[i]] == 'all') delete query[type.extraAttrs[i]];
      }
      Ember.merge(query, extraParams);
      return "data="+JSON.stringify(query);
    }
    else {
      for(var i = 0; i < type.queryParams.length; i++) {
        extraParams[type.queryParams[i]] = record.get(type.queryParams[i]) || CrudAdapter.GlobalData.get(type.queryParams[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.queryParams[i]] == 'all') delete query[type.queryParams[i]];
      }
      Ember.merge(query, extraParams);
    }
    return query;
  },

  buildFindQuery : function(type, id, query) {
    var keys = type.keys || [], ids = id.split("__");
    for(var i = 0; i < keys.length; i++) {
      query[keys[i]] = (ids.length > i ? ids[i] : "");
    }
    for(var i = 0; i < type.findParams.length; i++) {
      query[type.findParams[i]] = CrudAdapter.GlobalData.get(type.findParams[i]);
    }
    return query;
  },

  buildURL : function(type, id) {
    var ty = (Ember.typeOf(type) == 'string' ? type : type.apiName || type.typeKey), url = '/' + ty;
    return url;
  },

  createRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    CrudAdapter.backupData(record, type, "create");
    return this.ajax(this.buildURL(type)+"/create", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  find : function(store, type, id) {
    return this.ajax(this.buildURL(type, id)+"/"+CrudAdapter.endPoint.find, 'GET', { data : this.buildFindQuery(type, id, {}) });
  },

  findAll : function(store, type) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET');
  },

  findQuery : function(store, type, query) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET', { data : query });
  },

  _findNext : function(store, type, query, id, queryType) {
    var adapter = store.adapterFor(type),
        serializer = store.serializerFor(type),
        label = "DS: Handle Adapter#find of " + type.typeKey;

    return $.ajax({
      url : adapter.buildURL(type)+"/"+queryType,
      method : 'GET', 
      data : { id : id, cur : Ember.get("CrudAdapter.GlobalData.cursor."+id) },
      dataType : "json",
    }).then(function(adapterPayload) {
      Ember.assert("You made a request for a " + type.typeKey + " with id " + id + ", but the adapter's response did not have any data", adapterPayload);
      var payload = serializer.extract(store, type, adapterPayload, id, "findNext");

      return store.push(type, payload);
    }, function(error) {
      var record = store.getById(type, id);
      record.notFound();
      throw error;
    }, "DS: Extract payload of '" + type + "'");
  },

  findNextFull : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    CrudAdapter.backupData(record, type);
    return this._findNext(record.store, type, query, CrudAdapter.getId(record, type), "getFullNext");
  },

  findNext : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    CrudAdapter.backupData(record, type);
    return this._findNext(record.store, type, query, CrudAdapter.getId(record, type), "getNext");
  },

  updateRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    CrudAdapter.backupData(record, type);
    return this.ajax(this.buildURL(type)+"/update", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  deleteRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true }), query = {};
    return this.ajax(this.buildURL(type)+"/delete", 'GET', { data : this.getQueryParams(type, query, record) });
  },
});

CrudAdapter.ApplicationSerializer = DS.RESTSerializer.extend({
  serializeRelations : function(type, payload, data, parent) {
    type.preSerializeRelations(data);
    type.eachRelationship(function(name, relationship) {
      var plural = Ember.String.pluralize(relationship.type.typeKey);
      this.payload[plural] = this.payload[plural] || [];
      if(this.data[relationship.key]) {
        if(relationship.kind === "hasMany") {
          for(var i = 0; i < this.data[relationship.key].length; i++) {
            var childData = this.data[relationship.key][i], childModel, childType;
            if(relationship.options.polymorphic) {
              childType = CrudAdapter.ModelMap[relationship.type.typeKey][this.data[relationship.key][i].type];
            }
            else {
              childType = (CrudAdapter.ModelMap[relationship.type.typeKey] && CrudAdapter.ModelMap[relationship.type.typeKey][data.type]) || relationship.type.typeKey;
            }
            childModel = this.serializer.store.modelFor(childType);
            this.serializer.serializeRelations(childModel, payload, childData, this.data);
            childData = this.serializer.normalize(childModel, childData, childType);
            this.payload[plural].push(childData);
            if(relationship.options.polymorphic) {
              this.serializer.store.push(childType, childData);
              this.data[relationship.key][i] = {
                id : childData.id,
                type : childType,
              };
            }
            else {
              this.serializer.store.push(childType, childData);
              this.data[relationship.key][i] = childData.id;
            }
          }
        }
      }
      else if(relationship.kind === "belongsTo" && parent) {
        if(relationship.options.polymorphic) {
        }
        else {
          this.data[relationship.key] = CrudAdapter.getId(parent, relationship.type);
        }
      }
    }, {payload : payload, data : data, serializer : this});
  },

  extractSingle : function(store, type, payload, id, requestType) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");
    if(Ember.typeOf(payload.result.data) == 'array') payload.result.data = payload.result.data[0];

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[type.typeKey] = payload.result.data || {};
    CrudAdapter.retrieveBackup(payload[type.typeKey], type, requestType !== 'createRecord');
    this.normalize(type, payload[type.typeKey], type.typeKey);
    this.serializeRelations(type, payload, payload[type.typeKey]);
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractArray : function(store, type, payload, id, requestType) {
    var plural = Ember.String.pluralize(type.typeKey);
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[plural] = payload.result.data || [];
    for(var i = 0; i < payload[plural].length; i++) {
      this.normalize(type, payload[plural][i], type.typeKey);
      CrudAdapter.retrieveBackup(payload[plural][i], type, requestType !== 'createRecord');
      this.serializeRelations(type, payload, payload[plural][i]);
    }
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractFindNext : function(store, type, payload) {
    var id = CrudAdapter.getId(payload.result.data, type);
    payload.result.data[type.paginatedAttribute].replace(0, 0, CrudAdapter.backupDataMap[type.typeKey][id][type.paginatedAttribute]);
    delete CrudAdapter.backupDataMap[type.typeKey][id];
    return this.extractSingle(store, type, payload);
  },

  extractDeleteRecord : function(store, type, payload) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    return null;
  },

  extractCreateRecord : function(store, type, payload) {
    return this.extractSingle(store, type, payload, null, "createRecord");
  },

  extractFindHasMany : function(store, type, payload) {
    return this._super(store, type, payload);
  },

  extract : function(store, type, payload, id, requestType) {
    return this._super(store, type, payload, id, requestType);
  },

  normalize : function(type, hash, prop) {
    //generate id property for ember data
    hash.id = CrudAdapter.getId(hash, type);
    this.normalizeAttributes(type, hash);
    this.normalizeRelationships(type, hash);

    this.normalizeUsingDeclaredMapping(type, hash);

    if(type.normalizeFunction) {
      type.normalizeFunction(hash);
    }

    return hash;
  },

  serialize : function(record, options) {
    var json = this._super(record, options), type = record.__proto__.constructor;

    if(type.serializeFunction) {
      type.serializeFunction(record, json);
    }

    return json;
  },

  serializeHasMany : function(record, json, relationship) {
    var key = relationship.key;

    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    json[key] = record.get(key);
    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      json[key] = json[key].mapBy('id');
    }
    else if (relationshipType === 'manyToOne') {
      json[key] = json[key].map(function(r) {
        return this.serialize(r, {});
      }, this);
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    //do nothing!
  },

  typeForRoot : function(root) {
    if(/data$/.test(root)) {
      return root;
    }
    return Ember.String.singularize(root);
  }
});

CrudAdapter.getId = function(record, type) {
  var id = record.id;
  if(!id) {
    var keys = type.keys || [], ids = [];
    for(var i = 0; i < keys.length; i++) {
      var attr = (record.get && record.get(keys[i])) || record[keys[i]];
      if(null !== attr || undefined !== attr) {
        ids.push(attr);
      }
      else {
        return null;
      }
    }
    return ids.join("__");
  }
  else {
    return id;
  }
};

CrudAdapter.backupDataMap = {};
CrudAdapter.backupData = function(record, type, operation) {
  //TODO : make 'new' into a custom new tag extracted from 'type'
  var data = record.toJSON(), 
      backupId = operation === "create" ? "New" : CrudAdapter.getId(record, type);
      id = CrudAdapter.getId(record, type) || "New";
  if(type.useIdForBackup) backupId = id;
  CrudAdapter.backupDataMap[type.typeKey] = CrudAdapter.backupDataMap[type.typeKey] || {};
  CrudAdapter.backupDataMap[type.typeKey][backupId] = data;
  if(type.retainId) data.id = id;
  for(var i = 0; i < type.keys.length; i++) {
    if(Ember.isEmpty(data[type.keys[i]])) delete data[type.keys[i]];
  }
  type.eachRelationship(function(name, relationship) {
    var a = record.get(relationship.key);
    if(a) {
      if(relationship.kind == 'hasMany') {
        this.data[relationship.key] = [];
        a.forEach(function(item) {
          this.data[relationship.key].push(CrudAdapter.backupData(item, relationship.type, operation));
        }, this);
      }
      else if(relationship.kind === "belongsTo") {
        a = a.content;
        this.data[relationship.key] = a ? a.get("id") || a : a;
      }
    }
  }, {data : data, record : record, operation : operation});
  if(type.backupData) {
    type.backupData(record, type, data);
  }
  if(operation === "find") {
    for(var i = 0; i < type.removeAttrsFromBackupOnFind.length; i++) {
      delete data[type.removeAttrsFromBackupOnFind[i]];
    }
  }
  return data;
};

CrudAdapter.retrieveBackup = function(hash, type, hasId) {
  var backupId = hasId ? CrudAdapter.getId(hash, type) : "New",
      id = CrudAdapter.getId(hash, type) || "New";
  if(type.useIdForBackup) backupId = id;
  if(CrudAdapter.backupDataMap[type.typeKey] && CrudAdapter.backupDataMap[type.typeKey][backupId]) {
    var data = CrudAdapter.backupDataMap[type.typeKey][backupId];
    delete CrudAdapter.backupDataMap[type.typeKey][backupId];
    for(var i = 0; i < type.ignoreFieldsOnRetrieveBackup.length; i++) {
      delete data[type.ignoreFieldsOnRetrieveBackup[i]];
    }
    hash = Utils.merge(hash, data);
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var da = this.data[relationship.key], ha = this.hash[relationship.key];
        if(da) {
          for(var i = 0; i < da.length; i++) {
            var ele = ha.findBy(relationship.type.keys[0], da[i][relationship.type.keys[0]]);
            da[i].id = CrudAdapter.getId(da[i], relationship.type);
            if(ele) Ember.merge(ele, da[i]);
            else ha.push(da[i]);
          }
        }
      }
    }, {data : data, hash : hash});
  }
  if(type.retrieveBackup) {
    type.retrieveBackup(hash, type, data);
  }
  return hash;
};

CrudAdapter.retrieveFailure = function(record) {
  var type = record.__proto__.constructor,
      backupId = record.get("isNew") ? "New" : record.get("id"),
      id = record.get("id") || "New";
  if(CrudAdapter.backupDataMap[type.typeKey] && CrudAdapter.backupDataMap[type.typeKey][backupId]) {
    var data = CrudAdapter.backupDataMap[type.typeKey][backupId],
        attrs = record._inFlightAttributes;
    delete CrudAdapter.backupDataMap[type.typeKey][backupId];
    if(!record.get("isDeleted")) record.rollback();
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, attrs[f]);
    }
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var arr = this.record.get(relationship.key), darr = this.data[relationship.key];
        if(darr) {
          for(var i = 0; i < darr.length; i++) {
            var rid = CrudAdapter.getId(darr[i], relationship.type), rrec = this.record.store.getById(relationship.type, rid);
            if(rrec) {
              CrudAdapter.retrieveFailure(rrec);
              if(this.record.addToProp) {
                this.record.addToProp(relationship.key, rrec);
              }
              else {
                arr.pushObject(rrec);
              }
            }
            else if(CrudAdapter.backupDataMap[relationship.type.typeKey] && CrudAdapter.backupDataMap[relationship.type.typeKey][rid]) {
              var crdata = CrudAdapter.backupDataMap[relationship.type.typeKey][rid], parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete crdata[parentKey];
              }
              if(!rrec) {
                this.record.addToProp(relationship.key, CrudAdapter.createRecordWrapper(this.record.store, relationship.type, crdata));
              }
              delete CrudAdapter.backupDataMap[relationship.type.typeKey][rid];
            }
            else {
              var parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete darr[i][parentKey];
              }
              this.record.addToProp(relationship.key, CrudAdapter.createRecordWrapper(this.record.store, relationship.type, darr[i]));
            }
          }
        }
      }
    }, {record : record, data : data});
  }
  if(record.get("isDeleted")) {
    record.transitionTo('loaded.updated.uncommitted');
  }
  else {
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
};

CrudAdapter.isDirty = function(record) {
  //isDirty_alias is populated by ROSUI.AggregateFromChildren mixin with child records' isDirty
  return record.get("isDirty") || record.get("isDirty_alias");
};

CrudAdapter.validationFailed = function(record) {
  //created a wrapper to do other stuff if needed
  return record.get("validationFailed");
};

CrudAdapter.saveRecord = function(record, type) {
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      if(!record.get("isDeleted")) {
        record.eachAttribute(function(attr) {
          var val = this.get(attr);
          if(Ember.typeOf(val) === "string") {
            val = val.replace(/^\s*/, "");
            val = val.replace(/\s*$/, "");
            this.set(attr, val);
          }
        }, record);
      }
      var isNew = record.get("isNew");
      new Ember.RSVP.Promise(function(resolvei, rejecti) {
        record.save().then(function(data) {
          resolvei(data);
        }, function(message) {
          //Accessing the ember-data internal state machine directly. Might change with change in the ember-data version
          rejecti(message.message || message.statusText || message);
        });
      }).then(function(data) {
        resolve(data);
        if(!record.get("isDeleted")) {
          record.eachRelationship(function(name, relationship) {
            if(relationship.kind === "hasMany") {
              var hasManyArray = record.get(relationship.key);
              for(var i = 0; i < hasManyArray.get("length");) {
                var item = hasManyArray.objectAt(i);
                if(item.get("isNew")) {
                  hasManyArray.removeObject(item);
                  item.unloadRecord();
                }
                else {
                  i++;
                }
              }
            }
          }, record);
          var model = record.__proto__.constructor;
          if(model.attrsByServer) {
            /* attrs returned by server are not updated on the model for some reason */
            for(var i = 0; i < model.attrsByServer.length; i++) {
              record.set(model.attrsByServer[i], record._data[model.attrsByServer[i]]);
            }
            record.adapterDidCommit();
          }
        }
      }, function(message) {
        reject(message.message || message.statusText || message);
      });
    });
  });
  return promise;
};

CrudAdapter.forceReload = function(store, type, id) {
  if(store.recordIsLoaded(type, id)) {
    var record = store.recordForId(type, id);
    CrudAdapter.backupData(record, record.__proto__.constructor, "find");
    return record.reload();
  }
  else {
    return store.find(type, id);
  }
};

CrudAdapter.createRecordWrapper = function(store, type, data) {
  if(data.id && store.recordIsLoaded(type, data.id)) {
    var record = store.recordForId(type, data.id);
    record.unloadRecord();
  }
  return store.createRecord(type, data);
};

CrudAdapter.rollbackRecord = function(record) {
  if(record.get("isError") || record.get("isInvalid") || record.get("isSaving")) {
    var attrs = record._inFlightAttributes, data = record._data;
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, data[f]);
    }
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
  else {
    record.rollback();
  }
  record.__proto__.constructor.eachRelationship(function(name, relationship) {
    if(relationship.kind === "hasMany") {
      var rarr = record.get(relationship.key);
      rarr.then(function() {
        rarr.forEach(function(rec) {
          CrudAdapter.rollbackRecord(rec);
        });
      });
    }
  });
};

ModelWrapper = Ember.Namespace.create();
ModelWrapper.AggregateFromChildrenMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps"), that = this;
    this.set("isDirty_alias", this.get("isDirty"));
    Ember.addObserver(this, "isDirty", this, "attributeDidChange");
    for(var i = 0; i < arrayProps.length; i++) {
      var arrayProp = arrayProps[i];
      this[arrayProp+"WillBeDeleted"] = that.childrenWillBeDeleted;
      this[arrayProp+"WasAdded"] = that.childrenWasAdded;
    }
  },

  childrenWillBeDeleted : function(props, idxs) {
    this._validation = this._validation || {};
    for(var i = 0; i < props.length; i++) {
      var propId = Utils.getEmberId(props[i]);
      delete this._validation[propId];
      Ember.removeObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.removeObserver(props[i], "isDirty", this, "attributeDidChange");
    }
  },

  childrenWasAdded : function(props, idxs) {
    for(var i = 0; i < props.length; i++) {
      this.validationFailedDidChanged(props[i], "validationFailed");
      this.attributeDidChange(props[i], "isDirty");
      Ember.addObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.addObserver(props[i], "isDirty", this, "attributeDidChange");
    }
  },

  validationFailedDidChanged : function(obj, attr) {
    var val = obj.get(attr), objId = Utils.getEmberId(obj);
    this._validation = this._validation || {};
    if(val) {
      this._validation[objId] = 1;
    }
    else {
      delete this._validation[objId];
    }
    this.set("validationFailed", Utils.hashHasKeys(this._validation));
  },

  attributeDidChange : function(obj, attr) {
    this.set(attr+"_alias", this.get(attr) || obj.get(attr));
  },
});

ModelWrapper.ModelWrapper = DS.Model.extend({
  isDirty_alias : Ember.computed.oneWay("isDirty"),
  disableSave : function() {
    return this.get("validationFailed") || !this.get("isDirty_alias");
  }.property("validationFailed", "isDirty_alias"),
});
ModelWrapper.createModelWrapper = function(object, config, mixins) {
  var args = mixins || [];
  args.push(object);
  var model = ModelWrapper.ModelWrapper.extend.apply(ModelWrapper.ModelWrapper, args);
  for(var i = 0; i < CrudAdapter.allowedModelAttrs.length; i++) {
    if(config[CrudAdapter.allowedModelAttrs[i].attr]) {
      model[CrudAdapter.allowedModelAttrs[i].attr] = config[CrudAdapter.allowedModelAttrs[i].attr];
    }
    else {
      if(CrudAdapter.allowedModelAttrs[i].defaultValue === "emptyArray") {
        model[CrudAdapter.allowedModelAttrs[i].attr] = Ember.A();
      }
      else if(CrudAdapter.allowedModelAttrs[i].defaultValue === "value") {
        model[CrudAdapter.allowedModelAttrs[i].attr] = CrudAdapter.allowedModelAttrs[i].value;
      }
    }
  }
  return model;
};

Popovers = Ember.Namespace.create();

Popovers.PopoverComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'title:data-original-title', 'body:data-content', 'delay:data-delay', 'role'],
  animation : "true",
  placement : "top",
  title : "",
  body : "",
  delay : 0,
  role : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),
  data : null,

  didInsertElement : function() {
    $(this.get("element")).popover();
  },
});

Ember.Handlebars.helper('pop-over', Popovers.PopoverComponent);
