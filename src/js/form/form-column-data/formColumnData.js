define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Entry to disable/enable column based on value of another.
 *
 * @class Form.DisableForCol
 * @submodule form-column-data
 * @module form
 */
var HideForCol = Ember.Object.extend({
  name : "",
  value : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
  hide : false,
  show : false,
});

/**
 * Column data for form module.
 *
 * @class Form.FormColumnData
 * @submodule form-column-data
 * @module form
 */
var FormColumnData = Ember.Object.extend({
  placeholder : null,
  placeholderActual : function() {
    var placeholder = this.get("placeholder"), label = this.get("parentObj.label");
    if(placeholder) return placeholder;
    return label;
  }.property('parentObj.label', 'placeholder'),
  moduleType : "",
  formView : function() {
    return Form.TypeToCellNameMap[this.get("moduleType")];
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
  hideForCols : Utils.hasMany(HideForCol),
});

return {
  FormColumnData : FormColumnData,
};

});
