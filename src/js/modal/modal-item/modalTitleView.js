define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Title view for modal.
 *
 * @class Modal.ModalTitleView
 * @exends GlobalModules.DisplayTextView
 * @submodule modal-item
 * @module modal
 */
var ModalTitleView = GlobalModules.DisplayTextView.extend({
  titleId : "",
  layout : Ember.Handlebars.compile('' +
    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
    '<h4 class="modal-title" {{bind-attr id="view.titleId"}}>{{yield}}</h4>' +
  ''),
});
GlobalModules.GlobalModulesMap["modalTitle"] = "modal/modalTitle";

return {
  ModalTitleView    : ModalTitleView,
};

});
