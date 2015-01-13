define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for a group of radio buttons.
 *
 * @class Form.GroupRadioButtonView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var GroupRadioButtonView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('' +
    '{{#each view.columnData.form.options}}' +
      '<div {{bind-attr class="radio view.columnData.form.displayInline:radio-inline"}}>' +
        '<label>{{view "form/radioInput" name=view.groupName value=this.val selection=view.value}}<span></span>{{{this.label}}}</label>' +
      '</div>' +
    '{{/each}}' +
  ''),
  groupName : function(){
    return Utils.getEmberId(this);
  }.property(),
});


return {
  GroupRadioButtonView : GroupRadioButtonView,
};

});
