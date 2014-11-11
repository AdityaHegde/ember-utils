define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
], function(Ember, Utils, ColumnData, GlobalModulesView) {

/**
 * Column Data for display text module.
 *
 * @class GlobalModules.DisplayTextColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextColumnDataMixin = Ember.Mixin.create({
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

return {
  DisplayTextColumnDataMixin : DisplayTextColumnDataMixin,
};

});
