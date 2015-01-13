define([
  "ember",
  "lib/ember-utils-core",
  "../timer/main",
  "./array-modifier-types/main",
  "./array-modifier-groups/main",
], function(Ember, Utils, Timer, ArrayModType, ArrayModGroup) {

/**
 * ArrayModMixin modifies array in 'arrayModSrc' and puts it in 'arrayModTar'.
 *
 * @class ArrayMod.ArrayModMixin
 */
//TODO : revisit the observers addition and deletion
var ArrayModMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var 
    arrayModSrc = this.get("arrayModSrc"),
    arrayModTar = this.get("arrayModTar")
    arrayPropsToAdd = ["arrayMods", "arrayModGrps", arrayModSrc];
    Ember.addBeforeObserver(this, arrayModSrc, this, this.arrayModSrcWillChange);
    Ember.defineProperty(this, arrayModTar, Ember.computed(arrayModSrc, this.arrayModTarComputed));
    this[arrayModSrc+"WillBeDeleted"] = this.arrayModSrcWillBeDeleted;
    this[arrayModSrc+"WasAdded"] = this.arrayModSrcWasAdded;
  },

  unique_id : function() {
    return Utils.getEmberId(this);
  }.property(),

  /**
   * Source array to modifiy. Defaults to 'content'.
   *
   * @property arrayModSrc
   * @type String
   * @default "content"
   */
  arrayModSrc : "content",

  /**
   * Source array to modifiy. Defaults to 'arrangedContent'.
   *
   * @property arrayModTar
   * @type String
   * @default "arrangedContent"
   */
  arrayModTar : "arrangedContent",

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
    var arrayModSrc = this.get("arrayModSrc") || [], arrayModTar = this.get("arrayModTar"),
        that = this;
    for(var i = 0; i < deletedArrayMods.length; i++) {
      var arrayMod = deletedArrayMods[i];
      arrayMod.removeModObservers(this, "arrayModsDidChange");
      arrayModSrc.forEach(function(item) {
        if(this.arrayMod.get("addObserverToAll") || this.arrayModTar.contains(item)) {
          Ember.addObserver(item, this.arrayMod.get("property"), this.that, "arrayModSrcItemPropertyDidChange");
        }
      }, {that : this, arrayMod : arrayMod, arrayModTar : arrayModTar});
      this.removeArrayModFromGroup(arrayMod);
    }
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrayModTar");
    });
  },
  arrayModsWasAdded : function(addedArrayMods, idx) {
    var arrayModSrc = this.get("arrayModSrc") || [], arrayModTar = this.get("arrayModTar"),
        that = this;
    for(var i = 0; i < addedArrayMods.length; i++) {
      var arrayMod = addedArrayMods[i];
      arrayMod.addModObservers(this, "arrayModsDidChange");
      arrayModSrc.forEach(function(item) {
        if(this.arrayMod.get("addObserverToAll") || this.arrayModTar.contains(item)) {
          Ember.removeObserver(item, this.arrayMod.get("property"), this.that, "arrayModSrcItemPropertyDidChange");
        }
      }, {that : this, arrayMod : arrayMod, arrayModTar : arrayModTar});
      this.addArrayModToGroup(arrayMod);
    }
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrayModTar");
    });
  },

  addObserversToItems : function(override, arranged) {
    var arrayModSrc = override || this.get("arrayModSrc") || [], arrayModTar = arranged || this.get("arrayModTar"),
        arrayMods = this.get("arrayMods");
    arrayModSrc.forEach(function(item) {
      for(var i = 0; i < this.arrayMods.length; i++) {
        if(this.arrayMods[i].get("addObserverToAll") || this.arrayModTar.contains(item)) {
          Ember.addObserver(item, this.arrayMods[i].get("property"), this.that, "arrayModSrcItemPropertyDidChange");
        }
      }
    }, {that : this, arrayMods : arrayMods, arrayModTar : arrayModTar});
  },

  removeObserversFromItems : function(override, arranged) {
    var arrayModSrc = override || this.get("arrayModSrc") || [], arrayModTar = arranged || this.get("arrayModTar"),
        arrayMods = this.get("arrayMods");
    arrayModSrc.forEach(function(item) {
      for(var i = 0; i < this.arrayMods.length; i++) {
        if(this.arrayMods[i].get("addObserverToAll") || this.arrayModTar.contains(item)) {
          Ember.removeObserver(item, this.arrayMods[i].get("property"), this.that, "arrayModSrcItemPropertyDidChange");
        }
      }
    }, {that : this, arrayMods : arrayMods, arrayModTar : arrayModTar});
  },

  arrayModsDidChange : function() {
    var that = this;
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrayModTar");
    });
  },

  arrayModsDidChange_each : function() {
    var that = this;
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged_Each", 500).then(function() {
      var arrayModSrc = that.get("arrayModSrc"), arrayModTar = that.get("arrayModTar"),
          arrayModGrps = that.get('arrayModGrps');
      //enclose the operation in a run loop to decrease the view render overhead
      Ember.run(function() {
        for(var i = 0; i < arrayModSrc.get("length"); i++) {
          var item = arrayModSrc.objectAt(i), inArrangedContent = arrayModTar.contains(item),
              canAdd = true;
          for(var j = 0; j < arrayModGrps.length; j++) {
            if(!arrayModGrps[j].canAdd(item)) {
              canAdd = false;
              break;
            }
          }
          if(inArrangedContent && !canAdd) {
            arrayModTar.removeObject(item);
          }
          else if(!inArrangedContent && canAdd) {
            for(var j = 0; j < arrayModGrps.length; j++) {
              if(!arrayModGrps[j].modifySingle(arrayModTar, item, arrayModTar.indexOf(item))) {
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

  arrayModTarComputed : function(key, value) {
    var arrayModSrc = this.get('arrayModSrc'), retArrayModSrc,
        arrayModGrps = this.get('arrayModGrps'),
        isModified = !!arrayModGrps && arrayModGrps.length > 0,
        that = this, hasContent = arrayModSrc && (arrayModSrc.length > 0 || (arrayModSrc.get && arrayModSrc.get("length") > 0));

    if(arrayModSrc) {
      retArrayModSrc = arrayModSrc.slice();
      if(isModified) {
        for(var i = 0; i < arrayModGrps.length; i++) {
          if(retArrayModSrc.length > 0) {
            retArrayModSrc = arrayModGrps[i].modify(retArrayModSrc);
          }
        }
        this.addObserversToItems(arrayModSrc, retArrayModSrc);
      }
      return Ember.A(retArrayModSrc);
    }

    return Ember.A([]);
  },

  arrayModSrcWillChange : function() {
    this.removeObserversFromItems();
    this._super();
  },

  arrayModsWillBeDeleted : function(removedObjects, idxs) {
    var isModified = this.get('isModified');
    if(isModified) {
      var arrayModTar = this.get('arrayModTar'),
          arrayModGrps = this.get('arrayModGrps');
      this.removeObserversFromItems(removedObjects);
      removedObjects.forEach(function(item) {
        this.removeObject(item);
      }, arrayModTar);
    }
  },

  arrayModsWasAdded : function(addedObjects, idxs) {
    var isModified = this.get('isModified');
    if(isModified) {
      var arrayModTar = this.get('arrayModTar'),
          arrayModGrps = this.get('arrayModGrps');
      this.addObserversToItems(addedObjects);
      for(var i = 0; i < addedObjects.length; i++) {
        for(var j = 0; j < arrayModGrps.length; j++) {
          if(!arrayModGrps[j].modifySingle(arrayModTar, addedObjects[i], arrayModTar.indexOf(addedObjects[i]))) {
            break;
          }
        }
      }
    }
  },

  arrayModSrcItemPropertyDidChange : function(item) {
    var arrayModGrps = this.get('arrayModGrps'),
        arrayModTar = this.get("arrayModTar");
    for(var i = 0; i < arrayModGrps.length; i++) {
      if(!arrayModGrps[i].modifySingle(arrayModTar, item, arrayModTar.indexOf(item))) {
        break;
      }
    }
  },
});

return {
  ArrayModController : ArrayModController,
};

});
