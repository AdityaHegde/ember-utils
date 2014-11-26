/**
 * A module for a modal windows.
 *
 * @module modal
 */
define([
  "./modalWindowView",
  "./formWindowView",
  "./modal-item/main",
  "./modal-column-data/main",
], function() {
  var Modal = Ember.Namespace.create();
  window.Modal = Modal;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Modal[k] = arguments[i][k];
      }
    }
  }

  return Modal;
});
