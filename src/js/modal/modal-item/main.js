/**
 * Modal items submodule.
 *
 * @submodule modal-item
 * @module modal
 */
define([
  "./modalBodyView",
  "./modalFooterView",
  "./modalFormBodyView",
  "./modalTitleView",
], function() {
  var ModalItem = {};

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ModalItem[k] = arguments[i][k];
      }
    }
  }

  return ModalItem;
});
