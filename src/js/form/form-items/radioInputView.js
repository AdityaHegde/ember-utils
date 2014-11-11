define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Basic radio button view.
 *
 * @class Form.RadioInputView
 * @module form
 * @submodule form-items
 */
var RadioInputView = Ember.View.extend({
  tagName : "input",
  type : "radio",
  attributeBindings : [ "name", "type", "value", "checked:checked" ],
  click : function() {
    this.set("selection", this.$().val());
  },
  checked : function() {
    return this.get("value") == this.get("selection");
  }.property('selection')
});

return {
  RadioInputView : RadioInputView,
};

});
