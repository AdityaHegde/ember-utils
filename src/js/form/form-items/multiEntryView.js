define([
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../../crud-adapter/main",
  "./textInputView",
  "./copyValuesToObject",
], function(Ember, Utils, ColumnData, CrudAdapter, TextInputView, CopyValuesToObject) {

/**
 * View for multiple rows of items.
 *
 * @class Form.MultiEntryView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var mulid = 0;
var MultiEntryView = TextInputView.TextInputView.extend(ColumnData.ColumnDataChangeCollectorMixin, {
  childView : function() {
    var columnData = this.get("columnData");
    return Form.TypeToCellNameMap[columnData.get("childCol.form.moduleType")];
  }.property("view.columnData.childCol.form.moduleType"),

  template : Ember.Handlebars.compile('' +
    '<div {{bind-attr class="view.columnData.form.multiEntryContainerClass"}}>' +
    '{{#with view as outerView}}' +
      '{{#each outerView.value}}' +
        '<div {{bind-attr class="outerView.columnData.form.eachMultiEntryClass"}}>' +
          '<div {{bind-attr class="outerView.columnData.form.multiEntryClass"}}>' +
            '{{view outerView.childView record=this columnData=outerView.columnData.childCol parentForm=outerView showLabel=outerView.columnData.form.showChildrenLabel immediateParent=outerView}}' +
          '</div>' +
          '{{#if outerView.columnData.form.canManipulateEntries}}' +
            '<div class="remove-entry" rel="tooltip" title="Delete Condition"><a {{action "deleteEntry" this target="outerView"}}>' +
              '<span class="glyphicon glyphicon-trash"></span>' +
            '</a></div>' +
            '<div class="add-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
              '<span class="glyphicon glyphicon-plus"></span>'+
            '</a></div>'+
          '{{/if}}' +
        '</div>' +
      '{{else}}'+
        '{{#if outerView.columnData.form.canManipulateEntries}}' +
          '<div class="add-first-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
            '<span class="glyphicon glyphicon-plus"></span>'+
          '</a></div>'+
        '{{/if}}' +
      '{{/each}}'+
    '{{/with}}' +
    '</div>'+
    '<p class="tp-rules-end-msg">{{view.columnData.form.postInputText}}</p>' +
  ''),

  valuesArrayDidChange : function() {
    if(this.get("record")) this.validateValue(this.get("value"));
  }.observes("value.@each", "view.value.@each"),

  actions : {
    addEntry : function() {
      var record = this.get("record"), columnData = this.get("columnData"),
          entry, value = this.get("value"), data = { /*id : columnData.get("name")+"__"+mulid++*/ };
      $('.tooltip').hide();
      CopyValuesToObject(data, columnData, record);
      entry = CrudAdapter.createRecordWrapper(record.store, columnData.get("form.arrayType"), data);
      if(!value) {
        value = [];
        this.set("value", value);
      }
      value.pushObject(entry);
    },

    deleteEntry : function(entry) {
      $('.tooltip').hide();
      var value = this.get("value");
      value.removeObject(entry);
    },
  },
});

return {
  MultiEntryView : MultiEntryView,
};

});
