define([
  "ember",
  "core/objectWithArrayMixin",
], function(Ember, ObjectWithArrayMixin) {

/**
 * A mixin that used by column data group extensions. It adds view lookup paths based on the 'type' and for modules based on <module>Type.
 *
 * @class ColumnDataGroupPluginMixin
 */
var ColumnDataGroupPluginMixin = Ember.Mixin.create(ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  /**
   * Type of the column data group extension. Used to extract 'typeLookup' in 'lookupMap' along with 'type'.
   *
   * @property groupType
   * @type String
   */
  groupType : null,

  /**
   * Type of the column data group in extension. Used to extract 'typeLookup' in 'lookupMap' along with 'groupType'.
   *
   * @property type
   * @type String
   */
  type : "base",

  /**
   * View lookup path extracted from 'lookupMap' using 'groupType' and 'type'.
   *     lookupMap[groupType][type]
   *
   * @property typeLookup
   * @type String
   */
  typeLookup : function() {
    return this.get("lookupMap")[this.get("groupType")][this.get("type")];
  }.property("type"),

  arrayProps : ['modules'],

  /**
   * Array of modules present in the extension.
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

return {
  ColumnDataGroupPluginMixin : ColumnDataGroupPluginMixin,
};

});
