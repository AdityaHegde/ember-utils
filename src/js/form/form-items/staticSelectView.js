define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for select tag with static options.
 *
 * @class Form.StaticSelectView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
//TODO : support multiple on static select (no requirement for now)
var StaticSelectView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.columnData.form.options optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'prompt=view.columnData.form.prompt value=view.value disabled=view.isDisabled maxlength=view.columnData.form.maxlength}}' +
                                      '{{#if view.helpblock}}<p class="help-block">{{view.helpblock}}</p>{{/if}}'),

  helpblock : "",
});

return {
  StaticSelectView : StaticSelectView,
};

});
