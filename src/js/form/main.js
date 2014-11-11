/**
 * A module for a form.
 *
 * @module form
 */
define([
  "./formView",
  "./multiColumnMixin",
  "./form-column-data/main",
  "./form-items/main",
], function() {
  var Form = Ember.Namespace.create();
  window.Form = Form;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Form[k] = arguments[i][k];
      }
    }
  }

  return Form;
});
