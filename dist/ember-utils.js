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
    if(Ember.typeOf(modelClassMap) == 'string') {
      modelClassMap = Ember.get(modelClassMap);
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

Utils.belongsTo = function(modelClass, modelClassMap, modelClassKey) {
  modelClass = modelClass || Ember.Object;
  var hasInheritance = modelClassMap && modelClassKey;
  return Ember.computed(function(key, newval) {
    if(Ember.typeOf(modelClass) == 'string') {
      modelClass = Ember.get(modelClass);
    }
    if(Ember.typeOf(modelClassMap) == 'string') {
      modelClassMap = Ember.get(modelClassMap);
    }
    if(arguments.length > 1) {
      if(newval) {
        if(hasInheritance) modelClass = modelClassMap[newval[modelClassKey]];
        if(!(newval instanceof modelClass)) {
          newval = modelClass.create(newval);
          newval.set("parentObj", this);
        }
      }
      return newval;
    }
  });
};

Utils.belongsToWithMixin = function(modelClass, modelClassMap, modelClassKey, mixinMap, mixinKey, defaultMixin) {
  modelClass = modelClass || Ember.Object;
  var hasInheritance = modelClassMap && modelClassKey,
      hasMixin = mixinMap && mixinKey;
  return Ember.computed(function(key, newval) {
    if(Ember.typeOf(modelClass) == 'string') {
      modelClass = Ember.get(modelClass);
    }
    if(Ember.typeOf(modelClassMap) == 'string') {
      modelClassMap = Ember.get(modelClassMap);
    }
    if(Ember.typeOf(mixinMap) == 'string') {
      mixinMap = Ember.get(mixinMap);
    }
    if(Ember.typeOf(defaultMixin) == 'string') {
      defaultMixin = Ember.get(defaultMixin);
    }
    if(arguments.length > 1) {
      if(newval) {
        if(hasInheritance) modelClass = modelClassMap[newval[modelClassKey]];
        if(!(newval instanceof modelClass)) {
          if(hasMixin) {
            newval = modelClass.createWithMixins(newval, mixinMap[newval[mixinKey]] || defaultMixin);
          }
          else {
            newval = modelClass.create(newval);
          }
          newval.set("parentObj", this);
        }
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

/**
 * Timer module with stuff related to timers.
 *
 * @module timer
 */


Timer = Ember.Namespace.create();

Timer.queMap = {};

/**
 * Default timeout for the asyncQue.
 *
 * @property TIMEOUT
 * @type Number
 * @default 500
 * @static
 */
Timer.TIMEOUT = 500;

/**
 * Timer ticks.
 *
 * @property TIMERTIMEOUT
 * @type Number
 * @default 250
 * @static
 */
Timer.TIMERTIMEOUT = 250;

/**
 * @class Timer.AsyncQue
 * @private
 */
Timer.AsyncQue = Ember.Object.extend({
  init : function() {
    this._super();
    var that = this, timer;
    Ember.run.later(function() {
      that.timerTimedout();
    }, that.get("timeout") || Timer.TIMEOUT);
  },

  timerTimedout : function() {
    if(!this.get("resolved")) {
      var that = this;
      Ember.run(function() {
        delete Timer.queMap[that.get("key")];
        that.set("resolved", true);
        that.get("resolve")();
      });
    }
  },

  /**
   * native timer
   *
   * @property timer
   * @type Number
   */
  timer : null,

  /**
   * unique identifier for the associated task
   *
   * @property key
   * @type String
   */
  key : "",

  /**
   * resolve function of the associated promise
   *
   * @property resolve
   * @type Function
   */
  resolve : null,

  /**
   * reject function of the associated promise
   *
   * @property reject
   * @type Function
   */
  reject : null,

  /**
   * boolean to indicate whether the associated promise has resolved
   *
   * @property resolved
   * @type boolean
   */
  resolved : false,

  /**
   * timeout after which the associated promise resolves
   *
   * @property reject
   * @type Number
   */
  timeout : Timer.TIMEOUT,
});

/**
 * Public API to create a job into async que.
 * 
 * @method addToQue
 * @return {Class} Promise created for the async-que.
 * @param {String} key Unique identifier for the job.
 * @param {Number} [timeout=Timer.TIMEOUT] timeout after which the job should be run.
 */
Timer.addToQue = function(key, timeout) {
  if(Timer.queMap[key]) {
    Timer.queMap[key].set("resolved", true);
    Timer.queMap[key].get("reject")();
  }
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var asyncQue = Timer.AsyncQue.create({key : key, resolve : resolve, reject : reject, timeout : timeout});
      Timer.queMap[key] = asyncQue;
    });
  });
  return promise;
};

Timer.curTimer = null;
Timer.timers = [];

/**
 * A timer module which executes a job periodically.
 *
 * @class Timer.Timer
 */
Timer.Timer = Ember.Object.extend({
  init : function() {
    this._super();
    Timer.timers.push(this);
    this.set("ticks", Math.ceil(this.get("timeout") / Timer.TIMERTIMEOUT));
    if(!Timer.curTimer) {
      Timer.curTimer = setInterval(Timer.timerFunction, Timer.TIMERTIMEOUT);
    }
  },

  /**
   * Periodic timeout after which the job should be executed.
   *
   * @property timeout
   * @type boolean
   * @default Timer.TIMERTIMEOUT
   */
  timeout : Timer.TIMERTIMEOUT,

  /**
   * Number of times of Timer.TIMERTIMEOUT per period.
   *
   * @property ticks
   * @type Number
   * @default 1
   * @private
   */
  ticks : 1,

  /**
   * Number of times to execute the job.
   *
   * @property count
   * @type Number
   * @default 0
   */
  count : 0,

  /**
   * Callback executed every period. The job goes here.
   *
   * @method timerCallback
   */
  timerCallback : function() {
  },


  /**
   * Callback executed after the end of timer.
   *
   * @method endCallback
   */
  endCallback : function() {
  },
});
Timer.timerFunction = function() {
  if(Timer.timers.length === 0) {
    clearTimeout(Timer.curTimer);
    Timer.curTimer = null;
  }
  else {
    for(var i = 0; i < Timer.timers.length;) {
      var timer = Timer.timers[i];
      timer.decrementProperty("ticks");
      if(timer.get("ticks") === 0) {
        timer.set("ticks", Math.ceil(timer.get("timeout") / Timer.TIMERTIMEOUT));
        timer.timerCallback();
        timer.decrementProperty("count");
      }
      if(timer.get("count") <= 0) {
        Timer.timers.removeAt(i);
        timer.endCallback();
      }
      else {
        i++;
      }
    }
  }
};

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
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
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
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
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
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },

  arrayModsDidChange_each : function() {
    var that = this;
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged_Each", 500).then(function() {
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

    if(content) {
      retcontent = content.slice();
      if(isModified) {
        for(var i = 0; i < arrayModGrps.length; i++) {
          if(retcontent.length > 0) {
            retcontent = arrayModGrps[i].modify(retcontent);
          }
        }
        this.addObserversToItems(content, retcontent);
      }
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
          if(!arrayModGrps[j].modifySingle(arrangedContent, addedObjects[i], arrangedContent.indexOf(addedObjects[i]))) {
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
      //return "data="+JSON.stringify(query);
      return query;
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
    if(Utils.hashHasKeys(record._attributes)) {
      Utils.merge(attrs, record._attributes); 
    }
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
  //Ember.run(function() {
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
              hasManyArray.then(function() {
                var map = {};
                for(var i = 0; i < hasManyArray.get("length");) {
                  var item = hasManyArray.objectAt(i), emberId = Utils.getEmberId(item);
                  if(map[emberId]) {
                    hasManyArray.removeAt(i);
                  }
                  else if(item.get("isNew")) {
                    hasManyArray.removeAt(i);
                    item.unloadRecord();
                  }
                  else {
                    map[emberId] = 1;
                    i++;
                  }
                }
              });
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
  //});
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

var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;

/**
 * A module for wrapper over Ember.Application which initializes a few things automatically
 * 
 * @module app-wrapper
 */

AppWrapper = Ember.Namespace.create();

/**
 * A wrapper class over Ember.Application which initializes CrudAdapter and ColumnData.
 *
 * @class AppWrapper.AppWrapper
 */
AppWrapper.AppWrapper = Ember.Application.extend({
  init : function() {
    this._super();
    CrudAdapter.loadAdaptor(this);
  },

  ready : function() {
    this._super();
    ColumnData.initializer(this);
  },
});

ColumnData = Ember.Namespace.create();

ColumnData.ColumnDataGroup = Ember.Object.extend({
  init : function (){
    this._super();
    this.set("columns", this.get("columns") || []);
    ColumnData.Registry.store(this.get("name"), "columnDataGroup", this);
  },

  name : "",

  columns : Utils.hasMany("ColumnData.ColumnData"),

  list : Utils.belongsTo("ListGroup.ListColumnDataGroup"),
  tree : Utils.belongsTo("Tree.TreeColumnDataGroup"),
  sort : Utils.belongsTo("DragDrop.SortableColumnDataGroup"),
  panel : Utils.belongsTo("Panels.PanelColumnDataGroup"),

  lazyDisplay : Utils.belongsTo("LazyDisplay.LazyDisplayColumnDataGroup"),

  form : Utils.belongsTo("Form.FormColumnDataGroup"),
});


ColumnData.Registry = Ember.Object.create({
  map : {},

  store : function(name, parent, columnData) {
    this.get("map")[parent+":"+name] = columnData;
  },

  retrieve : function(name, parent) {
    return this.get("map")[parent+":"+name];
  },
});

/***  ColumnData  ***/

ColumnData.ColumnData = Ember.Object.extend({
  init : function () {
    this._super();
    ColumnData.Registry.store(this.get("name"), "columnData", this);
  },

  name : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),

  validation : Utils.belongsTo("ColumnData.ColumnDataValidation"),

  list : Utils.belongsToWithMixin(null, "ListGroup.ListColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),
  tree : Utils.belongsToWithMixin(null, "Tree.TreeColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),
  //sort : Utils.belongsToWithMixin(null, "DragDrop.SortableColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),
  panel : Utils.belongsToWithMixin(null, "Panels.PanelColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  form : Utils.belongsTo(null, "Form.FormColumnDataMap", "type"),

  label : null,

  childCol : Utils.belongsTo("ColumnData.ColumnData"),
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childCol", ColumnData.Registry.retrieve(value, "columnData"));
      }
      return value;
    }
  }.property(),
  childColGroup : Utils.belongsTo("ColumnData.ColumnDataGroup"),
  childColGroupName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childColGroup", ColumnData.Registry.retrieve(value, "columnDataGroup"));
      }
      return value;
    }
  }.property(),
});


/***  ColumnDataValidation  ***/

ColumnData.ColumnDataValidationsMap = {};
ColumnData.ColumnDataValidation = Ember.Object.extend({
  init : function() {
    this._super();
    this.canBeEmpty();
  },

  validations : Utils.hasMany(null, ColumnData.ColumnDataValidationsMap, "type"),
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

  canBeEmpty : function() {
    if(this.get("validations") && !this.get("validations").mapBy("type").contains(0)) {
      this.get("validations").forEach(function(item) {
        item.set('canBeEmpty', true);
      });
    }
  }.observes('validations.@each'),
});

/** ColumnDataValidations **/

ColumnData.EmptyValidation = Ember.Object.extend({
  invalidMessage : "",
  negate : false,

  validateValue : function(value, record) {
    var invalid = Ember.isEmpty(value) || /^\s*$/.test(value),
        negate = this.get("negate");
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },

  canBeEmpty : false,
});

ColumnData.RegexValidation = ColumnData.EmptyValidation.extend({
  regex : "",
  regexFlags : "",
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    emptyBool = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    invalid = (isEmpty && emptyBool) || this.get("regexObject").test(value);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.CSVRegexValidation = ColumnData.RegexValidation.extend({
  delimeter : ",",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        invalid = this.get("regexObject").test(item); 
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.CSVDuplicateValidation = ColumnData.CSVRegexValidation.extend({
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool, valuesMap = {};
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        if(valuesMap[item]) {
          invalid = true;
        }
        else {
          valuesMap[item] = 1;
        }
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.DuplicateAcrossRecordsValidation = ColumnData.EmptyValidation.extend({
  duplicateCheckPath : "",
  duplicateCheckKey : "id",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        arr = record.get(this.get("duplicateCheckPath")),
        values = arr && arr.filterBy(this.get("duplicateCheckKey"), value);
    invalid = (values && values.get("length") > 1) || (values.get("length") === 1 && values[0] !== record);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.NumberRangeValidation = ColumnData.EmptyValidation.extend({
  minValue : 0,
  maxValue : 999999,

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate");
    if(value && value.trim) value = value.trim();
    if(Ember.isEmpty(value)) {
      invalid = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    }
    else {
      var num = Number(value);
      if(num < this.get("minValue") || num > this.get("maxValue")) invalid = true;
    }
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.ColumnDataValidationsMap[0] = ColumnData.EmptyValidation;
ColumnData.ColumnDataValidationsMap[1] = ColumnData.RegexValidation;
ColumnData.ColumnDataValidationsMap[2] = ColumnData.CSVRegexValidation;
ColumnData.ColumnDataValidationsMap[3] = ColumnData.CSVDuplicateValidation;
ColumnData.ColumnDataValidationsMap[4] = ColumnData.DuplicateAcrossRecordsValidation;
ColumnData.ColumnDataValidationsMap[5] = ColumnData.NumberRangeValidation;


/***  MISC   ***/

ColumnData.ColumnDataValueMixin = Ember.Mixin.create({
  columnData : null,
  record : null,

  validateValue : function(value) {
    var columnData = this.get("columnData"), record = this.get("record"),
        validation = columnData.get("validation");
    if(validation) {
      if(!this.get("disabled")) {
        var validVal = validation.validateValue(value, record);
        if(validVal[0]) record._validation[columnData.name] = 1;
        else delete record._validation[columnData.name];
        this.set("invalid", validVal[0]);
        this.set("invalidReason", !Ember.isEmpty(validVal[1]) && validVal[1]);
      }
      else {
        delete record._validation[columnData.name];
      }
    }
    record.set("validationFailed", Utils.hashHasKeys(record._validation));
  },

  value : function(key, val) {
    var columnData = this.get("columnData"), record = this.get("record"),
        parentForm = this.get("parentForm");
    if(!record || !columnData) return val;
    record._validation = record._validation || {};
    if(arguments.length > 1) {
      if(!(record instanceof DS.Model) || (record.currentState && !record.currentState.stateName.match("deleted"))) {
        var oldVal = record.get(columnData.get("key"));
        this.validateValue(val);
        //TODO : find a better way to fix value becoming null when selection changes
        if(val || !columnData.get("cantBeNull")) {
          record.set(columnData.get("key"), val);
        }
      }
      return val;
    }
    else {
      val = record.get(columnData.get("key"));
      this.validateValue(val);
      return val;
    }
  }.property('columnData', 'view.columnData'),

  prevRecord : null,
  recordDidChange : function() {
    var record = this.get("record"), prevRecord = this.get("prevRecord"),
        columnData = this.get("columnData");
    if(prevRecord) {
      Ember.removeObserver(prevRecord, columnData.get("name"), this, "notifyValChange");
    }
    if(record) {
      this.recordChangeHook();
      Ember.addObserver(record, columnData.get("name"), this, "notifyValChange");
      this.set("prevRecord", record);
      this.notifyPropertyChange("val");
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
});

ColumnData.ColumnDataGroupPluginMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  type : "base",
  typeLookup : function() {
    return this.get("lookupMap")[this.get("groupType")][this.get("type")];
  }.property("type"),

  arrayProps : ['modules'],
  modules : null,

  modulesWillBeDeleted : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.removeObserver(modules[i]+"Type", this, "moduleTypeDidChange");
    }
  },
  modulesWasAdded : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.addObserver(modules[i]+"Type", this, "moduleTypeDidChange");
      this.moduleTypeDidChange(this, modules[i]+"Type");
    }
    this.columnsChanged();
  },

  moduleTypeDidChange : function(obj, key) {
    var module = key.match(/^(\w*)Type$/)[1];
    this.set(module+"Lookup", this.get("lookupMap")[module][this.get(key) || "base"]);
  },

  columnsChanged : function() {
    var columns = this.get("parentObj.columns"), modules = this.get("modules");
    if(columns) {
      for(var i = 0; i < modules.length; i++) {
        this.set(modules[i]+"ColumnData", columns.findBy(this.get("groupType")+".type", modules[i]));
      }
    }
  }.observes("parentObj.columns.@each.panel"),
});


/***   Initilizer   ***/

ColumnData.initializer = function(app) {
  if(app.ColumnData) {
    for(var i = 0; i < app.ColumnData.length; i++) {
      ColumnData.ColumnDataGroup.create(app.ColumnData[i]);
    }
  }
};

/**
 * Global modules for certain tasks like displaying an attribute from the record.
 *
 * @module global-module
 */

GlobalModules = Ember.Namespace.create();

/**
 * Views for the global modules.
 *
 * @module global-module
 * @submodule global-module-view
 */


/**
 * Module for a simple display of text.
 *
 * @class GlobalModules.DisplayTextView
 */
GlobalModules.DisplayTextView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  /**
   * Key for the configurations on columnData.
   *
   * @property columnDataKey
   * @type String
   */
  columnDataKey : '',

  //tagName : '',

  classNameBindings : ['moduleClassName'],
  moduleClassName : function() {
    var classNames = this.get("columnData."+this.get("columnDataKey")+".classNames") || [];
    if(classNames.join) {
      classNames = classNames.join(" ");
    }
    return classNames;
  }.property("view.columnData", "view.columnDataKey"),

  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});

/**
 * Module for a simple display of text with tooltip.
 *
 * @class GlobalModules.DisplayTextWithTooltipView
 */
GlobalModules.DisplayTextWithTooltipView = GlobalModules.DisplayTextView.extend({
  tooltip : function() {
    return this.get("columnData."+this.get("columnDataKey")+".tooltip") || this.get("record"+this.get("columnData."+this.get("columnDataKey")+".tooltipKey")) || "";
  }.property("view.columnData"),

  template : Ember.Handlebars.compile('' +
    '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
  ''),
});

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleView
 */
GlobalModules.DisplayTextCollapsibleView = GlobalModules.DisplayTextWithTooltipView.extend({
  groupId : null,
  groupIdHref : function() {
    return "#"+this.get("groupId");
  }.property('view.groupId'),
  collapseId : null,
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
    '</a>' +
  ''),
});

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconView
 */
GlobalModules.DisplayTextCollapsibleGlypiconView = GlobalModules.DisplayTextCollapsibleView.extend({
  glyphiconCollapsed : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),
  glyphiconOpened : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),

  glyphicon : function() {
    return this.get( this.get("collapsed") ? "glyphiconCollapsed" : "glyphiconOpened" );
  }.property("view.collpased"),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}<span {{bind-attr class=":glyphicon view.glyphicon"}}></span>{{/tool-tip}}' +
    '</a>' +
  ''),
});


GlobalModules.GlobalModulesMap = {
  "displayText" : "globalModules/displayText",
  "displayTextWithTooltip" : "globalModules/displayTextWithTooltip",
  "displayTextCollapsible" : "globalModules/displayTextCollapsible",
  "displayTextCollapsibleGlypicon" : "globalModules/displayTextCollapsibleGlypicon",
};


/**
 * Column Data Interface or the global modules.
 *
 * @module global-module
 * @submodule global-module-column-data
 */


/**
 * Column Data Group for global modules.
 *
 * @class GlobalModules.GlobalModuleColumnDataGroupMixin
 */
GlobalModules.GlobalModuleColumnDataGroupMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  /**
   * The type of base module.
   *
   * @property type
   * @type String
   */
  type : "base",

  /**
   * The view type of base module.
   *
   * @property viewType
   * @type String
   * @default "base"
   */
  viewType : "base",

  /**
   * Lookup map for the base module type to view's path.
   *
   * @property modules
   * @type Array
   */
  lookupMap : null,

  viewLookup : function() {
    return this.get("lookupMap")[this.get("viewType")];
  }.property("viewType", "lookupMap"),

  arrayProps : ['modules'],

  /**
   * Modules base module supports.
   *
   * @property modules
   * @type Array
   */
  modules : null,

  modulesWillBeDeleted : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.removeObserver(modules[i]+"Type", this, "moduleTypeDidChange");
    }
  },
  modulesWasAdded : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.addObserver(modules[i]+"Type", this, "moduleTypeDidChange");
      this.moduleTypeDidChange(this, modules[i]+"Type");
    }
    this.columnsChanged();
  },

  moduleTypeDidChange : function(obj, moduleType) {
    var module = moduleType.match(/^(\w*)Type$/)[1];
    this.set(module+"Lookup", GlobalModules.GlobalModulesMap[this.get(moduleType) || "displayText"]);
  },

  columnsChanged : function() {
    var columns = this.get("parentObj.columns"), modules = this.get("modules");
    if(columns) {
      for(var i = 0; i < modules.length; i++) {
        this.set(modules[i]+"ColumnData", columns.findBy(this.get("type")+".moduleType", modules[i]));
      }
    }
  }.observes("parentObj.columns.@each"),
});

/**
 * Column Data for display text module.
 *
 * @class GlobalModules.DisplayTextColumnDataMixin
 */
GlobalModules.DisplayTextColumnDataMixin = Ember.Mixin.create({
  //viewType : "displayText",

  /**
   * Class names to use for the module.
   *
   * @property classNames
   * @type String
   */
  //classNames : [],

  /**
   * Tag name used by the module.
   *
   * @property tagName
   * @type String
   * @default "div"
   */
  //tagName : 'div',
});

/**
 * Column Data for display text with tooltip module.
 *
 * @class GlobalModules.DisplayTextWithTooltipColumnDataMixin
 */
GlobalModules.DisplayTextWithTooltipColumnDataMixin = Ember.Mixin.create(GlobalModules.DisplayTextColumnDataMixin, {
  //viewType : "displayTextWithTooltip",

  /**
   * Static tooltip for the module.
   *
   * @property tooltip
   * @type String
   */
  //tooltip : null,

  /**
   * Key to the value on the record for dynamic tooltip.
   *
   * @property tooltipKey
   * @type String
   */
  //tooltipKey : null,
});

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleColumnDataMixin
 */
GlobalModules.DisplayTextCollapsibleColumnDataMixin = Ember.Mixin.create(GlobalModules.DisplayTextWithTooltipColumnDataMixin, {
  //viewType : "displayTextCollapsible",
});

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin
 */
GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin = Ember.Mixin.create(GlobalModules.DisplayTextCollapsibleColumnDataMixin, {
  //viewType : "displayTextCollapsibleGlypicon",

  /**
   * Glypicon class when open.
   *
   * @property glyphiconOpened
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconOpened : "glyphicon-chevron-down",

  /**
   * Glypicon class when collapsed.
   *
   * @property glyphiconCollapsed
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconCollapsed : "glyphicon-chevron-right",
});


GlobalModules.GlobalModulesColumnDataMixinMap = {
  "displayText" : GlobalModules.DisplayTextColumnDataMixin,
  "displayTextWithTooltip" : GlobalModules.DisplayTextWithTooltipColumnDataMixin,
  "displayTextCollapsible" : GlobalModules.DisplayTextCollapsibleColumnDataMixin,
  "displayTextCollapsibleGlypicon" : GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin,
};

/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module list-group
 */


ListGroup = Ember.Namespace.create();

/**
 * A view for a list of records.
 *
 * @class ListGroup.ListGroupView
 */
ListGroup.ListGroupView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property list
   * @type Array
   */
  list : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['list-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.list}}' +
        '{{view thatView.columnDataGroup.list.viewLookup record=this columnDataGroup=thatView.columnDataGroup}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});


/**
 * Different list item views.
 *
 * @module list-group
 * @submodule list-item
 */

/**
 * Basic list item view.
 *
 * @class ListGroup.ListItemView
 */
ListGroup.ListItemView = Ember.View.extend({
  /**
   * The record that holds all the data.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['list-group-item'],

  template : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '{{view view.columnDataGroup.list.titleLookup record=view.record columnData=view.columnDataGroup.list.titleColumnData ' +
                                                   'tagName=view.columnDataGroup.list.titleColumnData.list.tagName columnDataKey="list"}}' +
      '{{view view.columnDataGroup.list.rightBlockLookup record=view.record columnData=view.columnDataGroup.list.rightBlockColumnData ' +
                                                        'tagName=view.columnDataGroup.list.rightBlockColumnData.list.tagName columnDataKey="list"}}' +
    '</h4>' +
    '{{view view.columnDataGroup.list.descLookup record=view.record columnData=view.columnDataGroup.list.descColumnData ' +
                                                'tagName=view.columnDataGroup.list.descColumnData.list.tagName columnDataKey="list"}}' +
  ''),
});


/***   Name to Lookup map  ***/

ListGroup.NameToLookupMap = {
  "base" : "listGroup/listItem",
};


/**
 * Column data interface for list item views.
 *
 * @module list-group
 * @submodule list-column-data
 */

/**
 * A column data group for the list group module.
 *
 * @class ListGroup.ListColumnDataGroup
 */
ListGroup.ListColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "list",
  modules : ["title", "rightBlock", "desc"],
  lookupMap : ListGroup.NameToLookupMap,

  /**
   * Type of title view.
   *
   * @property titleType
   * @type String
   * @default "displayText"
   */
  //titleType : "displayText",

  /**
   * Type of right block view.
   *
   * @property rightBlockType
   * @type String
   * @default "displayText"
   */
  //rightBlockType : "displayText",

  /**
   * Type of desc view.
   *
   * @property descType
   * @type String
   * @default "displayText"
   */
  //descType : "displayText",
});

/**
 * Column data for the list group modules (title, rightBlock or desc based on 'type')
 *
 * @class ListGroup.ListColumnData
 */
ListGroup.ListColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

ListGroup.ListTitleColumnData = ListGroup.ListColumnData.extend({
  tagName : "span",
  classNames : ['group-item-name'],
});

ListGroup.ListRightBlockColumnData = ListGroup.ListColumnData.extend({
  tagName : "div",
  classNames : ['pull-right', 'text-right'],
});

ListGroup.ListDescColumnData = ListGroup.ListColumnData.extend({
  tagName : "p",
  classNames : ['list-group-item-text'],
});

ListGroup.ListColumnDataMap = {
  title : ListGroup.ListTitleColumnData,
  rightBlock : ListGroup.ListRightBlockColumnData,
  desc : ListGroup.ListDescColumnData,
};

/**
 * Module to show record in a tree format.
 *
 * @module tree
 */

Tree = Ember.Namespace.create();


/**
 * Mixin to define behaviour of a record in the tree module.
 *
 * @class Tree.NodeRecordMixin
 */
Tree.NodeRecordMixin = Ember.Mixin.create(Ember.ActionHandler, {
  /**
   * Array of children records.
   *
   * @property children
   */
  children : null,

  columnDataGroup : function() {
    var nodeColumnData = this.get("parentObj.columnDataGroup.tree.nodeColumnData");
    if(nodeColumnData) {
      return ColumnData.Registry.retrieve(this.get(nodeColumnData.get("key")), "columnDataGroup");
    }
    return null;
  }.property("parentObj.columnDataGroup"),
});


/**
 * Different node views.
 *
 * @module tree
 * @submodule tree-nodes
 */


/**
 * Node view for a non leaf node.
 *
 * @class Tree.NodeView
 */
Tree.NodeView = Ember.View.extend({
  /**
   * Record for the node.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['tree-node'],

  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property("elementId"),

  collapsed : false,

  template : Ember.Handlebars.compile('' +
    '{{view view.columnDataGroup.tree.leftBarLookup record=view.record columnData=view.columnDataGroup.tree.leftBarColumnData collapseId=view.collapseId groupId=view.elementId ' +
                                                   'tagName=view.columnDataGroup.tree.leftBarColumnData.tree.tagName columnDataKey="tree" collapsed=view.collapsed}}' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
      '<div {{bind-attr id=view.collapseId class="view.columnDataGroup.tree.nodeChildrenClass :tree-node-children :collapse :in"}}>' +
        '{{#each view.record.children}}' +
          '{{view columnDataGroup.tree.nodeLookup record=this columnDataGroup=columnDataGroup}}' +
        '{{/each}}' +
      '</div>' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),

  didInsertElement : function() {
    var ele = $(this.get("element")).find(this.get("collapseIdSelector")), that = this;
    ele.on("shown.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", false);
      });
      e.stopPropagation();
    });
    ele.on("hidden.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", true);
      });
      e.stopPropagation();
    });
  },
});

/**
 * Node view for a leaf node.
 *
 * @class Tree.LeafView
 */
Tree.LeafView = Tree.NodeView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="tree-node-leftbar leaf-node"></div>' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main :leaf-node"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),
});


/***   Name to Lookup map  ***/

Tree.NameToLookupMap = {
  "node" : "tree/node",
  "leaf" : "tree/leaf",
};
GlobalModules.GlobalModulesMap.node = "tree/node";
GlobalModules.GlobalModulesMap.leaf = "tree/leaf";


/**
 * Column data interface for tree.
 *
 * @module tree
 * @submodule tree-column-data
 */

/**
 * A column data group for the tree module.
 *
 * @class Tree.TreeColumnDataGroup
 */
Tree.TreeColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "tree",
  modules : ["leftBar", "label", "node"],
  lookupMap : Tree.NameToLookupMap,

  /**
   * Type of left bar view.
   *
   * @property leftBarType
   * @type String
   * @default "displayText"
   */
  //leftBarType : "displayTextCollapsibleGlypicon",

  /**
   * Type of label view.
   *
   * @property labelType
   * @type String
   * @default "displayText"
   */
  //labelType : "displayText",

  /**
   * Type of node view.
   *
   * @property nodeType
   * @type String
   * @default "displayText"
   */
  //nodeType : "node",
});

/**
 * Column data for the tree modules (leftBar, label or node based on 'type')
 *
 * @class Tree.TreeColumnData
 */
Tree.TreeColumnData = Ember.Object.extend({
});

Tree.TreeLeftBarColumnData = Tree.TreeColumnData.extend({
  classNames : ["tree-node-leftbar"],
});

Tree.TreeLabelColumnData = Tree.TreeColumnData.extend({
  tagName : "h4",
  classNames : ['tree-node-name'],
});

Tree.TreeNodeColumnData = Tree.TreeColumnData.extend({
});

Tree.TreeColumnDataMap = {
  "leftBar" : Tree.TreeLeftBarColumnData,
  "label" : Tree.TreeLabelColumnData,
  "node" : Tree.TreeNodeColumnData,
};

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

Form = Ember.Namespace.create();

Form.MultiColumnMixin = Ember.Mixin.create({
  parentForRows : function() {
    return this;
  }.property(),

  columnDataGroup : null,

  filteredCols : function() {
    var cols = this.get("columnDataGroup.columns"), record = this.get("record"), that = this;
    return cols.filter(function(col) {
      return that.canAddCol(col, record);
    });
  }.property('columnDataGroup.columns.@each.form', 'view.columnDataGroup.columns.@each.form', 'record.isNew', 'view.record.isNew'),

  canAddCol : function(col, record) {
    return !col.get('form.isOnlyTable') && (!col.get("form.removeOnEdit") || !record || record.get("isNew")) && (!col.get("form.removeOnNew") || !record || !record.get("isNew"));
  },

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.filteredCols}}' +
        '{{view form.formType record=thatView.record col=this labelWidthClass=thatView.columnDataGroup.form.labelWidthClass inputWidthClass=thatView.columnDataGroup.form.inputWidthClass ' +
                             'tagName=thatView.columnDataGroup.form.tagName showLabel=thatView.columnDataGroup.form.showLabel parentForm=thatView.parentForRows immediateParent=thatView}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

Form.MultiInputViewParentMixin = Ember.Mixin.create({
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
          if(view.get("col.form.bubbleValues") && parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, val, oldVal, callingView);
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
    if(callingCol.get("form.bubbleValues") && parentForm && parentForm.registerForValChange) parentForm.registerForValChange(colView, listenColName);
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
    if(callingCol.get("form.bubbleValues") && parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(colView, listenColName);
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

Form.FormView = Ember.View.extend(Form.MultiColumnMixin, Form.MultiInputViewParentMixin, {
  childTagNames : 'div',
  classNames : ['form-horizontal'],
});

Form.TextInputView = Ember.View.extend({
  init : function() {
    this._super();
    this.recordDidChange();
    this.registerForValChangeChild();
  },

  parentForm : null,
  immediateParent : null,
  valLength : function(){
    if(this.get("val"))
      return this.get("col.form.maxlength") - this.get("val").length;
    else
      return this.get("col.form.maxlength");
  }.property('view.val','val'),

  layout : Ember.Handlebars.compile('' +
    '{{#if view.showLabelComp}}<div {{bind-attr class="view.labelClass"}} >' +
      '<label {{bind-attr for="view.col.name" }}>{{#if view.col.label}}{{view.col.label}}{{#if view.col.form.mandatory}}*{{/if}}{{/if}}</label>' +
      '{{#if view.col.form.helpText}}<div class="label-tooltip">' +
        '{{#tool-tip placement="right" title=view.col.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
      '</div>{{/if}}' +
    '</div>{{/if}}'+
    '<div {{bind-attr class="view.inputClass"}}> {{#if view.col.form.fieldDescription}}<span>{{view.col.form.fieldDescription}}</span>{{/if}}' +
      '<div class="validateField">'+
        '{{yield}}' +
        '{{#unless view.showLabelComp}}'+
          '{{#if view.col.form.helpText}}<div class="label-tooltip">' +
            '{{#tool-tip placement="right" title=view.col.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
          '</div>{{/if}}' +
        '{{/unless}}'+
        '{{#if view.col.form.maxlength}}'+
          '<span class="maxlength"><span>{{ view.valLength}}</span></span>'+
        '{{/if}}'+
        '{{#if view.invalid}}' +
          '{{#if view.invalidReason}}<span class="help-block text-danger">{{view.invalidReason}}</span>{{/if}}' +
        '{{/if}}' +
      '</div>'+
    '</div>' +
  ''),
  template : Ember.Handlebars.compile('{{input class="form-control" autofocus=view.col.form.autofocus type="text" value=view.val disabled=view.isDisabled ' +
                                                                   'placeholder=view.col.form.placeholderActual maxlength=view.col.form.maxlength}}'),
  classNames : ['form-group'],
  classNameBindings : ['col.form.additionalClass', 'col.validation.validations:has-validations', 'invalid:has-error', ':has-feedback', 'disabled:hidden', 'additionalClass'],
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
    return col.get("form.fixedValue") || ((col.get("form.disableOnEdit") && record && !record.get("isNew")) || (col.get("form.disableOnNew") && record && record.get("isNew")));
  }.property('view.col','view.col.form.fixedValue','view.col.form.disableOnEdit','view.col.form.disableOnNew'),

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
        disableEntry = col.get("form.disableForCols") && col.get("form.disableForCols").findBy("name", changedCol.get("name"));
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
      Timer.addToQue("duplicateCheck-"+Utils.getEmberId(this), 100).then(function() {
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
          if(value || !col.get("form.cantBeNull")) {
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
  }.property('col', 'col.form.disabled', 'view.disabled', 'disabled'),

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
      if(col.get("form.disableForCols")) {
        col.get("form.disableForCols").forEach(function(disableCol) {
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
    if(col.get("form.listenForCols")) {
      col.get("form.listenForCols").forEach(function(listenCol) {
        if(parentForm && parentForm.registerForValChange) parentForm.registerForValChange(this, listenCol);
      }, this);
    }
  },

  unregisterForValChangeChild : function() {
    var col = this.get("col"), parentForm = this.get("parentForm");
    if(col.get("form.listenForCols")) {
      col.get("form.listenForCols").forEach(function(listenCol) {
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
  template : Ember.Handlebars.compile('{{textarea class="form-control" autofocus="view.col.form.autofocus" value=view.val disabled=view.isDisabled rows=view.col.rows cols=view.col.cols ' +
                                                                      'placeholder=view.col.form.placeholderActual maxlength=view.col.form.maxlength readonly=view.col.form.readonly}}'),
});

Form.MultipleValue = Ember.Object.extend({
  val : function(key, value) {
    var col = this.get("col");
    if(arguments.length > 1) {
      if(!Ember.isNone(col)) {
        var validation = col.validateValue(value, null, col.get("validation.eachValidations"));
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
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
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
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
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
          valObj.set(this.col.get("form.arrayCol"), value.get("val"));
          Form.CopyValuesToRecord(valObj, this.col, this.record, value);
        }
        else {
          var data = { /*id : col.get("name")+"__"+csvid++*/ };
          data[this.col.get("form.arrayCol")] = value.get("val");
          Form.CopyValuesToObject(data, this.col, this.record, value);
          this.record.addToProp(this.col.get("key"), CrudAdapter.createRecordWrapper(this.record.store, this.col.get("form.arrayType"), data));
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
    return {val : element.get(col.get("form.arrayCol")), col : col};
  },

  lock : false,

  valuesWereInvalid : function() {
    //for now arrayCol is present for all multi value columns
    //change this check if there are exceptions
    if(!this.get("col.form.arrayCol")) return;
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
  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.col.form.options optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'prompt=view.col.form.prompt value=view.val disabled=view.isDisabled maxlength=view.col.form.maxlength}}' +
                                      '{{#if view.helpblock}}<p class="help-block">{{view.helpblock}}</p>{{/if}}'),

  helpblock : "",
});

Form.DynamicSelectView = Form.StaticSelectView.extend(Form.MultipleValueMixin, Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var col = this.get("col");
    Ember.addObserver(this,col.get("form.dataPath")+".@each",this,"dataDidChange");
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
    if(col.get("form.hideOnEmpty") && opts.length - col.get("form.hideEmptyBuffer") === 0) {
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
      if(this._state !== "preRender") {
        if(this.get("col.form.multiple")) {
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
      if(this.get("col.form.multiple")) {
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
    if(this.get("col.form.multiple") && !fromSetFunc) {
      this.set("values", this.get("selection"));
    }
  },

  arrayProps : ["selection"],

  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" multiple=view.col.form.multiple '+
                                                      'prompt=view.col.form.prompt selection=view.selection disabled=view.isDisabled maxlength=view.col.form.maxlength}}'),
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

Form.LabelView = Form.TextInputView.extend({
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

Form.FileUploadView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.form.accept"}}>'),

  disableBtn : false,
  fileName : "",

  btnLabel : function(){
    return this.get('uploadBtnLabel') || this.get('col').get('form.btnLabel');
  }.property('col','col.form.btnLabel'),

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

Form.ImageUploadView = Form.FileUploadView.extend({
  template : Ember.Handlebars.compile('<p><button class="btn btn-default btn-sm" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.col.form.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.form.accept"}}></p>' +
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
        var validation = col.validateValue(value, null, col.get("validation.eachValidations"));
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
Form.CSVDataInputView = Form.FileUploadView.extend(Form.MultipleValueMixin, {
  template : Ember.Handlebars.compile('' +
                                      '{{view.col.form.description}}' +
                                      '{{#if view.hasFile}}' +
                                        '{{view.fileName}} ({{view.valuesCount}} {{view.col.form.entityPlural}})' +
                                        '<button class="btn btn-link" {{action "remove" target="view"}}>Remove</button> | ' +
                                        '<button class="btn btn-link" {{action "replace" target="view"}}>Replace</button>' +
                                        '{{view "lazyDisplay/lazyDisplay" classNameBindings=":form-sm :csv-values-wrapper" columnDataGroup=view.columnDataGroup rows=view.valuesTransformed}}' +
                                      '{{else}}' +
                                        '{{textarea class="form-control" autofocus="view.col.form.autofocus" value=view.csvVal rows=view.col.rows cols=view.col.cols ' +
                                                                        'placeholder=view.col.form.placeholderActual maxlength=view.col.form.maxlength ' +
                                                                        'readonly=view.col.form.readonly}}' +
                                        '<div class="upload-help-text">'+
                                        '<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.col.form.btnLabel}}</button>' +
                                        '</div>'+
                                      '{{/if}}' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.form.accept"}}>' +
                                      ''),

  /*lazyDisplayConfig : LazyDisplay.LazyDisplayConfig.create({
    rowHeight : 28,
    lazyDisplayMainClass : "Form.CSVDateValues",
  }),*/
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
      Timer.addToQue("csvvalues-"+col.get("name"), 1500).then(function() {
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
Form.MultiEntryView = Form.TextInputView.extend(Form.MultiInputViewParentMixin, {
  childView : function() {
    var col = this.get("col");
    return Form.TypeToCellNameMap[col.get("childCol").type];
  }.property("view.col.childCol.type"),
  template : Ember.Handlebars.compile('' +
    '<div {{bind-attr class="view.col.form.multiEntryContainerClass"}}>' +
    '{{#with view as outerView}}' +
      '{{#each outerView.val}}' +
        '<div {{bind-attr class="outerView.col.form.eachMultiEntryClass"}}>' +
          '<div {{bind-attr class="outerView.col.form.multiEntryClass"}}>' +
            '{{view outerView.childView record=this col=outerView.col.childCol parentForm=outerView showLabel=column.form.showChildrenLabel immediateParent=outerView}}' +
          '</div>' +
          '{{#if outerView.col.form.canManipulateEntries}}' +
            '<div class="remove-entry" rel="tooltip" title="Delete Condition"><a {{action "deleteEntry" this target="outerView"}}>' +
              '<span class="glyphicon glyphicon-trash"></span>' +
            '</a></div>' +
            '<div class="add-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
              '<span class="glyphicon glyphicon-plus"></span>'+
            '</a></div>'+
          '{{/if}}' +
        '</div>' +
      '{{else}}'+
        '{{#if outerView.col.form.canManipulateEntries}}' +
          '<div class="add-first-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
            '<span class="glyphicon glyphicon-plus"></span>'+
          '</a></div>'+
        '{{/if}}' +
      '{{/each}}'+
    '{{/with}}' +
    '</div>'+
    '<p class="tp-rules-end-msg">{{view.col.form.postInputText}}</p>'
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
      entry = CrudAdapter.createRecordWrapper(record.store, col.get("form.arrayType"), data);
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

Form.MultiInputView = Ember.View.extend(Form.MultiColumnMixin, Form.MultiInputViewParentMixin, {
  classNames : ['clearfix'],
  classNameBindings : ['col.form.additionalClass'],
  parentForRows : function() {
    if(this.get("col.form.propogateValChange")) {
      return this.get("parentForm");
    }
    else {
      return this;
    }
  }.property(),

  columnDataGroup : Ember.computed.alias("col.childColGroup"),
});

Form.CheckBoxView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<div class="checkbox"><label>{{view "checkbox" checked=view.val disabled=view.isDisabled}}<label></label> {{view.col.form.checkboxLabel}}</label></div>'),
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
  template : Ember.Handlebars.compile('{{#each view.col.form.options}}<div {{bind-attr class="radio view.col.form.displayInline:radio-inline"}}>'
    + '<label>{{view "form/radioInput" name=view.groupName value=this.val selection=view.val}}<span></span>{{{this.label}}}</label></div> {{/each}}'
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

Form.GroupCheckBoxView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{#each view.newCheckList}}<div {{bind-attr class="checkbox col-md-4 view.col.form.displayInline:checkbox-inline"}}>'
    + '<label>{{view "checkbox" checked=this.checked disabled=view.isDisabled}}<label></label> {{this.checkboxLabel}}</label></div>{{/each}}'),

  checkBoxDidChange : function (){
    var checkList = this.get("newCheckList");
    this.set("val",checkList.filterBy("checked",true).mapBy("id").join(","));
  }.observes('newCheckList.@each.checked'),
  newCheckList : function() {
    var ncl = Ember.A(), ocl = this.get("col.form.checkList"),
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

Form.MediumHeadingView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<label>{{view.col.label}}</label>'),
  layout : Ember.Handlebars.compile('{{yield}}'),
});

//extend this to add extra content before views like Form.MultiEntryView or Form.MultiInputView
Form.WrapperView = Ember.View.extend({
  childView : function() {
    var col = this.get("col");
    return Form.TypeToCellNameMap[col.get("childCol").type];
  }.property("view.col.childCol.type"),
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('{{create-view view.childView record=view.record col=view.col.childCol parentForm=view.parentForm immediateParent=view.immediateParent}}'),
});

Form.TypeToCellNameMap = {
  textInput : "form/textInput",
  textareaInput : "form/textArea",
  staticSelect : "form/staticSelect",
  dynamicSelect : "form/dynamicSelect",
  selectiveSelect : "form/selectiveSelect",
  label : "form/label",
  fileUpload : "form/fileUpload",
  imageUpload : "form/imageUpload",
  csvData : "form/csvDataInput",
  multiEntry : "form/multiEntry",
  multiInput : "form/multiInput",
  checkBox : "form/checkBox",
  textareaSelectedInput : "form/textAreaSelected",
  groupRadioButton : "form/groupRadioButton",
  groupCheckBox : "form/groupCheckBox",
  sectionHeading : "form/mediumHeading",
};

Ember.Select.reopen({
  _selectionDidChangeSingle: function() {
    //overriding this to fix a problem where ember was checking the actual selected object (ember object with val and label) and not the selected value
    var el = this.get('element');
    if (!el) { return; }

    var content = this.get('content'),
        selection = this.get('selection'),
        selectionIndex = content && content.findBy && selection ? content.indexOf(content.findBy("val", selection.val)) : -1,
        prompt = this.get('prompt');

    if (prompt) { selectionIndex += 1; }
    if (el) { el.selectedIndex = selectionIndex; }
  },
});


/***    FormColumnDataInterface    ***/

Form.FormColumnDataGroup = Ember.Object.extend({
  labelWidthClass : "col-sm-4",
  inputWidthClass : "col-sm-8",
  showLabel : true,
});

Form.FormColumnData = Ember.Object.extend({
  placeholder : null,
  placeholderActual : function() {
    var placeholder = this.get("placeholder"), label = this.get("parentObj.label");
    if(placeholder) return placeholder;
    return label;
  }.property('parentObj.label', 'placeholder'),
  type : "",
  formType : function() {
    return Form.TypeToCellNameMap[this.get("type")];
  }.property('type'),
  fixedValue : null,
  options : [],
  data : [],
  dataValCol : "",
  dataLabelCol : "",
  bubbleValues : false,
  cantBeNull : false,
  canManipulateEntries : true,

  multiEntryContainerClass : "multi-entry-container",
  eachMultiEntryClass : "each-multi-entry",
  multiEntryClass : "multi-entry",
  showChildrenLabel : false,
  childrenLabelWidthClass : "",
  childrenInputWidthClass : "col-md-12",

  exts : Utils.hasMany(),
  disableForCols : Utils.hasMany("Form.DisableForCol"),
});

Form.FormColumnDataMap = {
  textInput              : Form.FormColumnData,
  textareaInput          : Form.FormColumnData,
  staticSelect           : Form.FormColumnData,
  dynamicSelect          : Form.FormColumnData,
  selectiveSelect        : Form.FormColumnData,
  label                  : Form.FormColumnData,
  fileUpload             : Form.FormColumnData,
  imageUpload            : Form.FormColumnData,
  csvData                : Form.FormColumnData,
  multiEntry             : Form.FormColumnData,
  multiInput             : Form.FormColumnData,
  checkBox               : Form.FormColumnData,
  textareaSelectedInput  : Form.FormColumnData,
  groupRadioButton       : Form.FormColumnData,
  groupCheckBox          : Form.FormColumnData,
  sectionHeading         : Form.FormColumnData,
};

Form.DisableForCol = Ember.Object.extend({
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

/**
 * Alert module for all stuff related to alerts.
 *
 * @module alerts
 */


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

/**
 * Component for alert message.
 * Usage : 
 *
 *     {{alert-message type="info" title="Title" message="Message"}}
 *
 * @class Alerts.AlertMessage
 */
Alerts.AlertMessage = Ember.Component.extend({
  /**
   * Type of alert message. Possible values are "success", "warning", "info", "error"
   *
   * @property type
   * @type String
   * @default "error"
   */
  type : 'error',

  /**
   * Title of the alert message.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Alert message.
   *
   * @property message
   * @type String
   */
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

  typeData : function() {
    var type = this.get("type");
    return Alerts.AlertTypeMap[type] || Alerts.AlertTypeMap.error;
  }.property('type'),

  classNameBindings : ["view.showAlert:hidden"],

  showAlert : false,

  click : function(event) {
    if($(event.target).filter('button.close').length > 0) {
      this.set("message", "");
    }
  },

  template : Ember.Handlebars.compile('' +
  '<div {{bind-attr class=":alert typeData.alertClass :alert-dismissable"}}>' +
    '<button class="close" {{action "dismissed"}}>&times;</button>' +
    '<strong><span {{bind-attr class=":glyphicon typeData.glyphiconClass :btn-sm"}}></span> <span class="alert-title">{{title}}</span></strong> <span class="alert-message">{{message}}</span>' +
  '</div>'),
});

Ember.Handlebars.helper('alert-message', Alerts.AlertMessage);

/**
 * A drag drop module for all operations related to drag and drop. Uses html5 drag drop feature.
 *
 * @module drag-drop
 */
DragDrop = Ember.Namespace.create();
//temp solution for chrome's buggy event.dataTransfer, v31.x.x
DragDrop.VIEW_ID = "";
DragDrop.MOVE_THRESHOLD = 2;

/**
 * A draggable mixin when included enables the view to be dragged.
 *
 * @class DragDrop.DraggableMixin
 */
DragDrop.DraggableMixin = Ember.Mixin.create({
  classNames : ['dragdrop-draggable'],

  attributeBindings : 'draggable',
  draggable : 'true',
  dragStart : function(event) {
    var dataTransfer = event.originalEvent.dataTransfer, viewid = this.get("elementId");
    dataTransfer.setData('ViewId', viewid);
    dataTransfer.dropEffect = 'move';
    DragDrop.VIEW_ID = viewid;
    this.dragStartCallback(event);
    event.stopPropagation();
  },

  /**
   * A callback method that is called when a drag starts.
   *
   * @method dragStartCallback
   * @param {Object} event The event object of the dragStart event.
   */
  dragStartCallback : function(event) {
  },

  /**
   * Targets that are allowed to be dropped on. Can be a selector or an array of selectors.
   *
   * @property allowedDropTargets
   * @type String|Array
   * @default '.dragdrop-droppable'
   */
  allowedDropTargets : '.dragdrop-droppable',
});

/**
 * A droppable mixin when included enables the view to be dropped on.
 *
 * @class DragDrop.DroppableMixin
 */
DragDrop.DroppableMixin = Ember.Mixin.create({
  classNames : ['dragdrop-droppable'],

  selectorsPass : function(ele, selectors) {
    if(Ember.typeOf(selectors)  !== 'array') {
      selectors = [selectors];
    }
    for(var i = 0; i < selectors.length; i++) {
      if(!Ember.isEmpty(ele.filter(selectors[i]))) {
        return true;
      }
    }
    return false;
  },
  canInteract : function(dragView, dragEle, dropView, dropEle) {
    return this.selectorsPass(dropEle, dragView.get("allowedDropTargets")) && this.selectorsPass(dragEle, dropView.get("acceptDropFrom"));
  },

  dragEnter: function(event) {
    var dragView = Ember.View.views[DragDrop.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragEnterCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  dragOver : function(event) {
    var dragView = Ember.View.views[DragDrop.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragOverCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  dragLeave : function(event) {
    var dragView = Ember.View.views[DragDrop.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragLeaveCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  drop: function(event) {
    var dragView = Ember.View.views[DragDrop.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dropCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },

  /**
   * A callback method that is called when the view being dragged enters this view.
   *
   * @method dragEnterCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragEnterCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged is over this view.
   *
   * @method dragOverCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged leaves this view.
   *
   * @method dragLeaveCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragLeaveCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged is dropped on this view.
   *
   * @method dropCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dropCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * Accept drops from elements passing the selectors. Can be a single selectors or an array of it.
   *
   * @property acceptDropFrom
   * @type String|Array
   * @default '.dragdrop-draggable'
   */
  acceptDropFrom : '.dragdrop-draggable',
});


/***   Sortable Module   ***/

DragDrop.SortableDraggableMixin = Ember.Mixin.create(DragDrop.DraggableMixin, DragDrop.DroppableMixin, {
  init : function() {
    this._super();
    this.set("lastXY", [0, 0]);
  },
  classNames : ['dragdrop-sortable-element'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortableDragableClassNames'),
  sortEleId : function() {
    return this.get("record."+this.get("columnDataGroup.sort.sortEleIdColumnData.key"));
  }.property("view.columnData.key"),
  sortableView : null,
  groupId : 0,
  hasElements : false,
  curGrpId : function() {
    return this.get("groupId");
  }.property('view.groupId', 'view.columnDataGroup.sort.sameLevel'),
  stateData : null,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  isPlaceholder : false,
  calcAppendPosition : function(xy) {
    var lxy = this.get("lastXY"),
        dx = xy[0] - lxy[0], adx = Math.abs(dx),
        dy = xy[1] - lxy[1], ady = Math.abs(dy),
        rd = dx, ard = adx;
    if(ady > adx) {
      rd = dy;
      ard = ady;
    }
    if(ard > DragDrop.MOVE_THRESHOLD) {
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
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
    if(dropView.get("sortableView") && dragView.get("sortableView")) {
      var
      columnDataGroup = this.get("columnDataGroup"),
      sortEleIdKey = columnDataGroup.get("sort.sortEleIdColumnData.key"),

      //sortable container and it's element id of the element dropped on
      dropViewSort = dropView.get("sortableView"),
      dropViewSortId = dropViewSort.get("elementId"),
      //siblings of the element dropped on
      dropViewEles = dropViewSort.get("sortEleChildren"),
      //sort id of the element dropped on
      dropViewSortEleId = dropView.get("sortEleId"),
      //index of the element dropped on in the array of siblings
      dropViewIdx = dropViewEles.indexOf(dropViewEles.findBy( sortEleIdKey, dropViewSortEleId )),

      //sort id of the element dragged
      dragViewSortEleId = dragView.get("sortEleId"),
      //sortable container and it's element id of the element dragged
      dragViewSort = dragView.get("sortableView"),
      dragViewSortId = dragViewSort.get("elementId"),
      //siblings of the element dragged
      dragViewEles = dragViewSort.get("sortEleChildren"),
      //index of the element dragged in the array of siblings
      dragViewIdx = dragViewEles.indexOf(dragViewEles.findBy( sortEleIdKey, dragViewSortEleId )),
      dragViewData = dragViewEles[dragViewIdx];

      dragView.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
      if(dropViewSort.get("effH") === dragViewSort.get("effH")) {
        //allow sortable on views with same hierarchy

        if(dragView.get("change")) {
          //process only if there is a change in the mouse position

          if(dropViewSortId === dragViewSortId) {
            //if both eles are from the same sortable container (siblings)

            if(dropViewSortEleId !== dragViewSortEleId && dropViewIdx !== dragViewIdx) {
              //process only if the eles are not the same
              //return;

              if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
                //if there only 1 element and its a placeholder, remove it
                dropViewSort.removeAt(0);
              }

              //remove the dragged ele from its siblings array
              dropViewEles.removeAt(dragViewIdx);
              //remove the dragged ele's view from sortable container
              dropViewSort.removeAt(dragViewIdx);
              //if need to append after (calculated based on mouse position difference), increment dropViewIdx
              if(dragView.get("appendNext")) dropViewIdx++;
              //correct dropViewIdx to dropViewEles.length if needed
              if(dropViewIdx > dropViewEles.length) dropViewIdx = dropViewEles.length;
              else if(dropViewIdx === -1) dropViewIdx = 0;
              //insert the dragViewData to siblings array at the new index
              dropViewEles.insertAt(dropViewIdx, dragViewData);
              //insert the dragView to sortable container at the new index
              dropViewSort.insertAt(dropViewIdx, dragView);

              //reset the change boolean
              dragView.set("change", false);
              //stop propagation if it was processed
              event.stopPropagation();
            }
          }
          else {
            if(dropViewEles.indexOf(dragViewData) === -1 && !Utils.deepSearchArray(dragViewData, dropViewSortEleId, sortEleIdKey, columnDataGroup.get("sort.sortEleChildrenColumnData.key"))) {
              //process only if dropViewEles doesnt have dragViewData and dragViewData doesnt have dropViewSortEleId somewhere at a deeper level
              //this is to prevent a parent being dropped on its child
              //return;

              if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
                //if there only 1 element and its a placeholder, remove it
                dropViewSort.removeAt(0);
              }

              //remove the dragged ele from its siblings array
              dragViewEles.removeAt(dragViewIdx);
              //remove the dragged ele's view from sortable container
              dragViewSort.removeAt(dragViewIdx);
              //if need to append after (calculated based on mouse position difference), increment dropViewIdx
              if(dragView.get("appendNext")) dropViewIdx++;
              //correct dropViewIdx to dropViewEles.length if needed
              if(dropViewIdx > dropViewEles.length) dropViewIdx = dropViewEles.length;
              else if(dropViewIdx === -1) dropViewIdx = 0;
              //insert the dragViewData to siblings array at the new index
              dropViewEles.insertAt(dropViewIdx, dragViewData);
              //update the sortable container view of the drag ele to the drop's container
              dragView.set("sortableView", dropViewSort);
              //insert the dragView to sortable container at the new index
              dropViewSort.insertAt(dropViewIdx, dragView);
              if(dragViewSort.get("length") === 0) {
                //if the drag ele's sortable container is empty, leave a placeholder in it's place
                dragViewSort.pushObject(columnDataGroup.get("sort.placeholderClass").create({
                  sortableView : dragViewSort,
                  hierarchy : dragView.get("hierarchy"),
                  groupId : dragView.get("stateData.grpId"),
                  columnDataGroup : columnDataGroup,
                }));
              }

              //reset the change boolean
              dragView.set("change", false);
              //stop propagation if it was processed
              event.stopPropagation();
            }
          }
        }
      }
    }
  },
  change : false,
  appendNext : false,
  lastXY : null,
});

DragDrop.SortableDroppableMixin = Ember.Mixin.create(DragDrop.DroppableMixin, {
  init : function() {
    this._super();
    this.set("stateData", this.get("stateData") || {grpId : 0});
    //console.log("new droppable create!");
    this.sortEleChildrenDidChange();
  },

  classNames : ['dragdrop-sortable-container'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortableDroppableClassNames'),

  sortEleChildren : function() {
    return this.get("record."+this.get("columnDataGroup.sort.sortEleChildrenColumnData.key"));
  }.property("view.columnDataGroup.sort.sortEleChildrenColumnData", "view.record"),
  sortEleChildrenDidChange : function() {
    var sortEleChildren = this.get("sortEleChildren"), columnDataGroup = this.get("columnDataGroup"),
        thisLen = this.get("length"), newLen = sortEleChildren.length,
        replaceLen = (newLen < thisLen ? newLen : thisLen),
        addNewLen = newLen - replaceLen,
        i = 0;
        stateData = this.get("stateData"),
        sortEleChildrenClassMap = columnDataGroup.get("sort.sortEleChildrenClassMap"),
        sortEleChildrenClassColumnData = columnDataGroup.get("sort.sortEleChildrenClassColumnData"),
        sortEleChildrenColumnGroupLookup = columnDataGroup.get("sort.sortEleChildrenColumnGroupLookup");
    for(; i < replaceLen; i++) {
      this.objectAt(i).setProperties({
        record : sortEleChildren[i],
        columnDataGroup : ColumnData.Registry.retrieve(sortEleChildren[i].get(sortEleChildrenColumnGroupLookup.get("key")), "columnDataGroup"),
        stateData : stateData,
        sortableView : this,
      });
    }
    for(; i < addNewLen; i++) {
      this.pushObject(sortEleChildrenClassMap[sortEleChildren[i].get(sortEleChildrenClassColumnData.get("key"))].create({
        record : sortEleChildren[i],
        columnDataGroup : ColumnData.Registry.retrieve(sortEleChildren[i].get(sortEleChildrenColumnGroupLookup.get("key")), "columnDataGroup"),
        stateData : stateData,
        sortableView : this,
      }));
    }
    if(sortEleChildren.length === 0) {
      this.pushObject(columnDataGroup.get("sort.placeholderClass").create({
        record : this.get("record"),
        columnDataGroup : columnDataGroup,
        stateData : stateData,
        sortableView : this,
      }));
    }
  }.observes("view.sortEleChildren"),

  elesIsEmpty : Ember.computed.empty('sortEleChildren.@each'),
  groupId : 0,
  hierarchy : "",
  stateData : null,
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  isPlaceholder : false,
});

DragDrop.SortablePlaceholderMixin = Ember.Mixin.create(DragDrop.DraggableMixin, DragDrop.DroppableMixin, {
  init : function() {
    this._super();
  },

  isPlaceholder : true,

  classNames : ['dragdrop-sortable-placeholder'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortablePlaceholderClassNames'),
  columnDataGroup : null,
  sortableView : null,
  groupId : 0,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
    if(dropView.get("sortableView") && dragView.get("sortableView")) {
      var
      columnDataGroup = this.get("columnDataGroup"),

      //sortable container and it's element id of the element dropped on
      dropViewSort = dropView.get("sortableView"),
      dropViewSortId = dropViewSort.get("elementId"),
      //siblings of the element dropped on
      dropViewEles = dropViewSort.get("sortEleChildren"),
      //sort id of the element dropped on
      dropViewSortEleId = dropView.get("sortEleId"),
      //index of the element dropped on in the array of siblings
      dropViewIdx = dropViewEles.indexOf(dropViewEles.findBy( columnDataGroup.get("sort.sortEleIdColumnData.key"), dropViewSortEleId)),

      //sort id of the element dragged
      dragViewSortEleId = dragView.get("sortEleId"),
      //sortable container and it's element id of the element dragged
      dragViewSort = dragView.get("sortableView"),
      dragViewSortId = dragViewSort.get("elementId"),
      //siblings of the element dragged
      dragViewEles = dragViewSort.get("sortEleChildren"),
      //index of the element dragged in the array of siblings
      dragViewIdx = dragViewEles.indexOf(dragViewEles.findBy( columnDataGroup.get("sort.sortEleIdColumnData.key"), dragViewSortEleId)),
      dragViewData = dragViewEles[dragViewIdx];

      dragView.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
      if(dropViewSort.get("effH") === dragViewSort.get("effH")) {
        //allow sortable on views with same hierarchy

        if(dragView.get("change")) {
          //process only if there is a change in the mouse position

          if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
            //if there only 1 element and its a placeholder, remove it
            dropViewSort.removeAt(0);
          }

          //remove the dragged ele from its siblings array
          dragViewEles.removeAt(dragViewIdx);
          //remove the dragged ele's view from sortable container
          dragViewSort.removeAt(dragViewIdx);
          //insert the dragViewData to siblings array at the end
          dropViewEles.pushObject(dragViewData);
          //insert the dragView to sortable container at the end
          dropViewSort.pushObject(dragView);
          //update the sortable container view of the drag ele to the drop's container
          dragView.set("sortableView", dropViewSort);

          //reset the change boolean
          dragView.set("change", false);
          //stop propagation if it was processed
          event.stopPropagation();
        }
      }
    }
  },
});


/***    Sortable ColumnData Interface    ***/

DragDrop.SortableColumnDataGroup = Ember.Object.extend({
  sortableDragableClassNames : [],
  sortableDroppableClassNames : [],
  sortablePlaceholderClassNames : [],

  sortEleIdColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.type", "sortEleId");
  }.property("parentObj.columns.@each.sort"),
  sortEleChildrenColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.type", "sortEleChildren");
  }.property("parentObj.columns.@each.sort"),

  sortEleChildrenClassMap : function() {
    return Ember.get(this.get("sortEleChildrenClassMapName"));
  }.property("sortEleChildrenClassMapName"),
  sortEleChildrenClassMapName : null,
  sortEleChildrenClassColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.type", "sortEleChildrenClass");
  }.property("parentObj.columns.@each.sort"),

  sortEleChildrenColumnGroupLookup : function() {
    return this.get("parentObj.columns").findBy("sort.type", "sortEleChildrenColumnGroup");
  }.property("parentObj.columns.@each.sort"),

  placeholderClass : function() {
    return Ember.get(this.get("placeholderClassName"));
  }.property("placeholderClassName"),
  placeholderClassName : "",

  sameLevel : false,
});

DragDrop.SortableEleIdColumnData = Ember.Object.extend({
});

DragDrop.SortableEleChildrenColumnData = Ember.Object.extend({
});

DragDrop.SortableEleChildrenClassColumnData = Ember.Object.extend({
});

DragDrop.SortableEleChildrenColumnGroup = Ember.Object.extend({
});

DragDrop.SortableColumnDataMap = {
  sortEleId : DragDrop.SortableEleIdColumnData,
  sortEleChildren : DragDrop.SortableEleChildrenColumnData,
  sortEleChildrenClass : DragDrop.SortableEleChildrenClassColumnData,
  sortEleChildrenColumnGroup : DragDrop.SortableEleChildrenColumnGroup,
};

/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module panels
 */


Panels = Ember.Namespace.create();

/**
 * A view for a set of panels.
 *
 * @class Panels.PanelsView
 */
Panels.PanelsView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property panels
   * @type Array
   */
  panels : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.panels}}' +
        '{{view thatView.columnDataGroup.panel.viewLookup record=this columnDataGroup=thatView.columnDataGroup groupId=thatView.elementId}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});


/**
 * Different panel views.
 *
 * @module panels
 * @submodule panel-views
 */


/**
 * Basic panel view.
 *
 * @class Panels.PanelView
 */
Panels.PanelView = Ember.View.extend({
  /**
   * The record that holds all the data.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel', 'panel-default'],

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData '+
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div class="panel-body">' +
      '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData '+
                                                   'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
      '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData '+
                                                     'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>{{/if}}' +
  ''),
});


/**
 * Panel view for a collapsible.
 *
 * @class Panels.PanelCollapsibleView
 */
Panels.PanelCollapsibleView = Panels.PanelView.extend({
  groupId : null,
  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property('view.elementId'),
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  isFirst : function() {
    var panels = this.get("parentView.panels");
    return !panels || panels.objectAt(0) === this.get("record");
  }.property("view.parentView.panels.@each", "view.record"),

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div {{bind-attr id="view.collapseId" class=":panel-collapse :collapse view.isFirst:in"}}>' +
      '<div class="panel-body">' +
        '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                     'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>' +
      '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                       'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>{{/if}}' +
    '</div>' +
  ''),
});


/***   Name to Lookup map  ***/

Panels.NameToLookupMap = {
  "base" : "panels/panel",
  "collapsible" : "panels/panelCollapsible",
};


/**
 * Column data interface for panels.
 *
 * @module panels
 * @submodule panel-column-data
 */

/**
 * A column data group for the panels module.
 *
 * @class Panels.PanelColumnDataGroup
 */
Panels.PanelColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "panel",
  modules : ["heading", "body", "footer"],
  lookupMap : Panels.NameToLookupMap,

  /**
   * Type of heading view.
   *
   * @property headingType
   * @type String
   * @default "displayText"
   */
  //headingType : "displayText",

  /**
   * Type of body view.
   *
   * @property bodyType
   * @type String
   * @default "displayText"
   */
  //bodyType : "displayText",

  /**
   * Type of footer view.
   *
   * @property footerType
   * @type String
   */
  //footerType : "",
});

/**
 * Column data for the list group modules (title, rightBlock or desc based on 'type')
 *
 * @class ListGroup.ListColumnData
 */
Panels.PanelColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

Panels.PanelHeadingColumnData = Panels.PanelColumnData.extend({
  tagName : "h3",
  classNames : ["panel-title"],
});

Panels.PanelBodyColumnData = Panels.PanelColumnData.extend({
});

Panels.PanelFooterColumnData = Panels.PanelColumnData.extend({
});

Panels.PanelColumnDataMap = {
  heading : Panels.PanelHeadingColumnData,
  body : Panels.PanelBodyColumnData,
  footer : Panels.PanelFooterColumnData,
};

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
  tagName : "span",

  didInsertElement : function() {
    $(this.get("element")).tooltip();
  },
});

Ember.Handlebars.helper('tool-tip', Tooltip.TooltipComponent);

ProgressBars = Ember.Namespace.create();
ProgressBars.StyleMap = {
  "success" : {
    "class" : "progress-bar-success",
  },
  "info" : {
    "class" : "progress-bar-info",
  },
  "warning" : {
    "class" : "progress-bar-warning",
  },
  "error" : {
    "class" : "progress-bar-danger",
  },
};
ProgressBars.ProgressBar = Ember.Component.extend({
  classNames : ["progress"],
  maxVal : "100",
  minVal : "0",
  val : "0",
  style : "",
  styleClass : function() {
    var style = ProgressBars.StyleMap[this.get("style")];
    return style && style["class"];
  }.property("style"),
  striped : false,
  animated : false,
  progressStyle : function() {
    var maxVal = this.get("maxVal"), minVal = this.get("minVal"), val = this.get("val"),
        v = ( Number(val) - Number(minVal) ) * 100 / ( Number(maxVal) - Number(minVal) );
    return "width: "+v+"%;";
  }.property("val", "maxVal", "minVal"),

  layout : Ember.Handlebars.compile('' +
    '<div role="progressbar" {{bind-attr aria-valuenow=val aria-valuemin=minVal aria-valuemax=maxVal style=progressStyle ' +
                                        'class=":progress-bar styleClass striped:progress-bar-striped animated:active"}}>' +
      '<div class="progressbar-tag">{{yield}}</div>' +
    '</div>' +
  ''),
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
Modal.ModalWindowView = Ember.View.extend({
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
  layout : Ember.Handlebars.compile('' +
    '<div class="modal-dialog" {{bind-attr style="view.widthStyle"}}>' +
      '<div class="modal-content" tabindex=-1>' +
        '<div class="modal-header">' +
          '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
          '<h4 class="modal-title" {{bind-attr id="view.titleid"}}>{{view.title}}</h4>' +
          '<h5 class="custom-font">{{view.windowMessage}}</h5>'+
        '</div>' +
        '<div class="modal-body">' +
          '{{alert-message message=view.message title=view.messageLabel type="error"}}' +
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
  },

  didInsertElement : function() {
    var onCancel = this.get("onCancel"), context = this.get("actionContext") || this,
        that = this, element = $(this.get("element"));
    element.on("show.bs.modal", function(e) {
      Ember.run.begin();
    });
    element.on("shown.bs.modal", function(e) {
      Ember.run.end();
      Ember.run(function() {
        that.postShowHook();
      });
    });
    element.on("hide.bs.modal", function(e) {
      Ember.run(function() {
        if(!that.get("fromButton") && onCancel) onCancel.call(context);
        that.set("fromButton", false);
      });
      if($(e.currentTarget).hasClass("in")) {
        Ember.run.begin();
      }
    });
    element.on("hidden.bs.modal", function(e) {
      Ember.run.end();
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

Modal.AddEditWindowView = Modal.ModalWindowView.extend({
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
      if(that.get("closeOnSuccess")) {
        $(that.get("element")).modal('hide');
        that.set("showAlert", false);
        that.set("loaded", false);
        that.set("saving", false);
      }
      if(that.get("saveCallback")) that.get("saveCallback")(data, "Saved successfully!", data.__proto__.constructor.title || "Data");
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

Popovers = Ember.Namespace.create();

Popovers.PopoverComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'trigger:data-trigger', 'title:data-original-title', 'body:data-content', 'delay:data-delay', 'role'],
  animation : "true",
  placement : "top",
  trigger : "click",
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
