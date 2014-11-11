define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * View for legend tag.
 *
 * @class Form.Legend
 * @module form
 * @submodule form-items
 */
var LegendView = Ember.View.extend({
  classNameBindings : ['columnData.disabled:hidden'],
  template : Ember.Handlebars.compile('<legend>{{view.columnData.label}}</legend>'),
  columnData : null,
  record : null,
});

return {
  LegendView : LegendView,
};

});
