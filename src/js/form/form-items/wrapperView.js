define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Extend this to add extra content before views like Form.MultiEntryView or Form.MultiInputView.
 *
 * @class Form.WrapperView
 * @module form
 * @submodule form-items
 */
var WrapperView = Ember.View.extend({
  childView : function() {
    var columnData = this.get("columnData");
    return Form.TypeToCellNameMap[columnData.get("childCol").type];
  }.property("view.columnData.childCol.type"),
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('{{create-view view.childView record=view.record columnData=view.columnData.childCol parentForm=view.parentForm immediateParent=view.immediateParent}}'),
});

return {
  WrapperView : WrapperView,
};

});
