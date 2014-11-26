define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Body view for modal.
 *
 * @class Modal.ModalBodyView
 * @exends GlobalModules.DisplayTextView
 * @submodule modal-item
 * @module modal
 */
var ModalBodyView = GlobalModules.DisplayTextView.extend({
  messageLabel : "",
  message : "",

  layout : Ember.Handlebars.compile('' +
    '{{alert-message message=view.message title=view.messageLabel}}' +
    '{{yield}}' +
  ''),
  template : Ember.Handlebars.compile(''),
});
GlobalModules.GlobalModulesMap["modalBody"] = "modal/modalBody";

return {
  ModalBodyView : ModalBodyView,
};

});
