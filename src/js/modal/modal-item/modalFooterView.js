define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Footer view for modal.
 *
 * @class Modal.ModalFooterView
 * @exends GlobalModules.DisplayTextView
 * @submodule modal-item
 * @module modal
 */
var ModalFooterView = GlobalModules.DisplayTextView.extend({
  disableAlias : false,

  modalView : null,

  layout : Ember.Handlebars.compile('' +
    '{{#if view.columnData.modal.showOk}}' +
      '<button type="button" class="btn btn-primary ok-btn" {{bind-attr disabled=view.disableAlias}} {{action "okClicked" target="view"}}>' +
        '{{view.columnData.modal.okLabel}}' +
      '</button>' +
    '{{/if}}' +
    '{{#if view.columnData.modal.showCancel}}' +
      '<button type="button" class="btn btn-default cancel-btn" data-dismiss="modal" {{action "cancelClicked" target="view"}}>' +
        '{{view.columnData.modal.cancelLabel}}' +
      '</button>' +
    '{{/if}}' +
    '{{yield}}' +
  ''),

  actions : {
    okClicked : function() {
      this.get("modalView").send("okClicked");
    },

    cancelClicked : function() {
      this.get("modalView").send("cancelClicked");
    },
  },
});
GlobalModules.GlobalModulesMap["modalFooter"] = "modal/modalFooter";

return {
  ModalFooterView : ModalFooterView,
};

});
