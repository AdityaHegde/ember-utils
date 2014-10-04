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
