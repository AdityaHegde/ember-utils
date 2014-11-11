define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View to put a lable.
 *
 * @class Form.LabelView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var LabelView = TextInputView.TextInputView.extend({
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('<label>{{view.columnData.label}}</label>'),
  columnData : null,
  record : null,
});

return {
  LabelView : LabelView,
};

});
