define([
  "ember",
  "lib/ember-utils-core",
  "../timer/main",
  "./array-modifier-types/main",
  "./array-modifier-groups/main",
], function(Ember, Utils, Timer, ArrayModType, ArrayModGroup) {

/**
 * Array controller which will modify the array on 'content' and put it under 'arrangedContent'.
 *
 * @class ArrayMod.ArrayModController
 */
//TODO : revisit the observers addition and deletion
var ArrayModController = Ember.ArrayController.extend(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
  },

  unique_id : function() {
    return Utils.getEmberId(this);
  }.property(),

  /**
   * Array mods added to the controller.
   *
   * @property arrayMods
   * @type Array
   */
  //arrayMods : Utils.hasMany(ArrayModType.ArrayModMap, "type"),
  arrayMods : null,

  /**
   * Array mods groups formed by arrayMods.
   *
   * @property arrayMods
   * @type Array
   * @readOnly
   */
  //arrayModGrps : Utils.hasMany(ArrayModGroup.ArrayModGroupMap, "type"),
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
        return ArrayModGroup.Compare(arrayMods.indexOf(a), arrayMods.indexOf(b));
      });
    }
    else {
      arrayModGrp = ArrayMod.ArrayModGroupMap[arrayMod.get("groupType")].create({
        arrayMods : [arrayMod],
        idx : arrayMods.indexOf(arrayMod),
      });
      Utils.binaryInsert(arrayModGrps, arrayModGrp, function(a, b) {
        return ArrayModGroup.Compare(arrayMods.indexOf(a), arrayMods.indexOf(b));
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

return {
  ArrayModController : ArrayModController,
};

});
