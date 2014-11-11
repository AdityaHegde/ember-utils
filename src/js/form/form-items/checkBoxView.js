define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for checkbox input.
 *
 * @class Form.CheckBoxView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var CheckBoxView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('<div class="checkbox"><label>{{view "checkbox" checked=view.value disabled=view.isDisabled}}<label></label> {{view.columnData.form.checkboxLabel}}</label></div>'),
});

return {
  CheckBoxView : CheckBoxView,
};

});
