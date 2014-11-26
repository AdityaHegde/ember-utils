define([
  "ember",
  "../../global-module/main",
  "./modalBodyView",
], function(Ember, GlobalModules, ModalBodyView) {

/**
 * Body view for modal with form.
 *
 * @class Modal.ModalFormBodyView
 * @exends Modal.ModalBodyView
 * @submodule modal-item
 * @module modal
 */
var ModalFormBodyView = ModalBodyView.ModalBodyView.extend({
  template : Ember.Handlebars.compile('' +
    '{{view "form/form" record=view.value columnDataGroup=view.columnData.childColGroup}}' +
  ''),
});
GlobalModules.GlobalModulesMap["modalFormBody"] = "modal/modalFormBody";

return {
  ModalFormBodyView : ModalFormBodyView,
};

});
