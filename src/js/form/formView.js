define([
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
  "./multiColumnMixin",
], function(Ember, Utils, ColumnData, MultiColumnMixin) {

/**
 * Base form view.
 * Usage:
 *
 *     {{view "form/form" record=record columnDataGroup=columnDataGroup}}
 *
 * @class FormView
 */
var FormView = Ember.View.extend(MultiColumnMixin.MultiColumnMixin, ColumnData.ColumnDataChangeCollectorMixin, {
  childTagNames : 'div',
  classNames : ['form-horizontal'],
});

return {
  FormView : FormView,
};

});
