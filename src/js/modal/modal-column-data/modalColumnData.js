define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Column data for the modal items (title, body, footer)
 *
 * @class Modal.ModalColumnData
 * @module modal
 * @submodule modal-column-data
 */
var ModalColumnData = Ember.Object.extend({
});

var ModalColumnDataMap = {
  title  : ModalColumnData,
  body   : ModalColumnData,
  footer : ModalColumnData,
};

return {
  ModalColumnData    : ModalColumnData,
  ModalColumnDataMap : ModalColumnDataMap,
};

});
