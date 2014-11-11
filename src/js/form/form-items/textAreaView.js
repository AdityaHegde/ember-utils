define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for textarea.
 *
 * @class Form.TextAreaView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var TextAreaView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('{{textarea class="form-control" autofocus="view.columnData.form.autofocus" value=view.value disabled=view.isDisabled rows=view.columnData.rows ' +
                                                                      'cols=view.columnData.cols placeholder=view.columnData.form.placeholderActual maxlength=view.columnData.form.maxlength ' +
                                                                      'readonly=view.columnData.form.readonly}}'),
});

return {
  TextAreaView : TextAreaView,
};

});
