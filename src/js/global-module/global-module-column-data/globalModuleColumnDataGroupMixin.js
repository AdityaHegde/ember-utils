define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
], function(Ember, Utils, ColumnData, GlobalModulesView) {

/**
 * Column Data Group for global modules.
 *
 * @class GlobalModules.GlobalModuleColumnDataGroupMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var GlobalModuleColumnDataGroupMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
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
    this.set(module+"Lookup", GlobalModulesView.GlobalModulesMap[this.get(moduleType) || "displayText"]);
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

return {
  GlobalModuleColumnDataGroupMixin : GlobalModuleColumnDataGroupMixin,
};

});
