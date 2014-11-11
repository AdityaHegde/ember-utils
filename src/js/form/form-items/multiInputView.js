define([
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
  "../multiColumnMixin",
], function(Ember, Utils, ColumnData, MultiColumnMixin) {

/**
 * View for multiple form items.
 *
 * @class Form.MultiInputView
 * @extends Form.MultiColumnMixin
 * @module form
 * @submodule form-items
 */
var MultiInputView = Ember.View.extend(MultiColumnMixin.MultiColumnMixin, ColumnData.ColumnDataChangeCollectorMixin, {
  classNames : ['clearfix'],
  classNameBindings : ['columnData.form.additionalClass'],
  parentForRows : function() {
    if(this.get("columnData.form.propogateValChange")) {
      return this.get("parentForm");
    }
    else {
      return this;
    }
  }.property(),

  columnDataGroup : Ember.computed.alias("columnData.childColumnDataGroup"),
});

return {
  MultiInputView : MultiInputView,
};

});
