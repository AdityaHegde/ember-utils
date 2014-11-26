/**
 * Modal items submodule.
 *
 * @submodule modal-column-data
 * @module modal
 */
define([
  "./modalTitleColumnDataMixin",
  "./modalBodyColumnDataMixin",
  "./modalFooterColumnDataMixin",
  "./modalColumnData",
  "./modalColumnDataGroup",
], function() {
  var ModalColumnData = {};

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ModalColumnData[k] = arguments[i][k];
      }
    }
  }

  return ModalColumnData;
});
