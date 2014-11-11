define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
], function(Ember, Utils, ColumnData) {

/**
 * Module for a simple display of text.
 *
 * @class GlobalModules.DisplayTextView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
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

return {
  DisplayTextView : DisplayTextView,
};

});
