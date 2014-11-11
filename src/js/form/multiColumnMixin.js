define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Mixin for views with multiple child view with column data.
 *
 * @class MultiColumnMixin
 */
var MultiColumnMixin = Ember.Mixin.create({
  parentForRows : function() {
    return this;
  }.property(),

  filteredCols : function() {
    var cols = this.get("columnDataGroup.columns"), record = this.get("record"), that = this;
    if(cols) {
      return cols.filter(function(columnData) {
        return that.canAddColumnData(columnData, record);
      });
    }
    return [];
  }.property('columnDataGroup.columns.@each.form', 'view.columnDataGroup.columns.@each.form', 'record.isNew', 'view.record.isNew'),

  canAddColumnData : function(columnData, record) {
    return !columnData.get('form.isOnlyTable') && (!columnData.get("form.removeOnEdit") || !record || record.get("isNew")) && (!columnData.get("form.removeOnNew") || !record || !record.get("isNew"));
  },

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.filteredCols}}' +
        '{{view form.formView record=thatView.record columnData=this labelWidthClass=thatView.columnDataGroup.form.labelWidthClass ' +
                             'inputWidthClass=thatView.columnDataGroup.form.inputWidthClass tagName=thatView.columnDataGroup.form.tagName ' +
                             'showLabel=thatView.columnDataGroup.form.showLabel parentForm=thatView.parentForRows immediateParent=thatView}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

return {
  MultiColumnMixin : MultiColumnMixin,
};

});
