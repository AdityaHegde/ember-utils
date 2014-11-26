define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Column Data mixin for modal footer.
 *
 * @class Modal.ModalFooterColumnDataMixin
 * @extends GlobalModules.DisplayTextColumnDataMixin
 * @module modal
 * @submodule modal-column-data
 */
var ModalFooterColumnDataMixin = Ember.Mixin.create({
  classNames : ["modal-footer"],

  showOk : true,
  showCancel : true,
  okLabel : "Ok",
  cancelLabel : "Cancel",
});
GlobalModules.GlobalModulesColumnDataMixinMap["modalFooter"] = ModalFooterColumnDataMixin;

return {
  ModalFooterColumnDataMixin : ModalFooterColumnDataMixin,
};

});
