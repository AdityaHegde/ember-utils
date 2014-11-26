define([
  "ember",
  "lib/ember-utils-core",
  "./dynamicSelectView",
  "./multipleValueMixin",
], function(Ember, Utils, DynamicSelectView, MultipleValueMixin) {

/**
 * View for a select tag with dynamic options and multiple selections.
 *
 * @class Form.DynamicMultiSelectView
 * @extends Form.StaticSelectView
 * @module form
 * @submodule form-items
 */
var DynamicMultiSelectView = DynamicSelectView.DynamicSelectView.extend(MultipleValueMixin.MultipleValueMixin, Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    this.set("selection", []);
    this.valuesArrayDidChange_Selection();
    this.selectionArrayDidChange();
  },

  selectionLock : false,

  valuesArrayDidChange_Selection : function() {
    if(!this.get("selectionLock")) {
      var values = this.get("values");
      this.set("selectionLock", true);
      this.get("selection").replace(0, this.get("selection.length"), this.get("selectOptions").filter(function(sel) {
        return !!values.findBy("val", sel.get("val"));
      }));
    }
    else {
      this.set("selectionLock", false);
    }
  }.observes("values.@each.value", "view.values.@each.value"),

  selectionArrayDidChange : function() {
    if(!this.get("selectionLock")) {
      this.set("selectionLock", true);
      this.set("values", this.get("selection").slice());
    }
    else {
      this.set("selectionLock", false);
    }
  }.observes("selection.@each.val", "view.selection.@each.val"),

  selection : null,

  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'multiple="multiple" prompt=view.columnData.form.prompt selection=view.selection disabled=view.isDisabled}}'),
});

return {
  DynamicMultiSelectView : DynamicMultiSelectView,
};

});
