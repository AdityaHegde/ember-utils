define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Column Data mixin for modal body.
 *
 * @class Modal.ModalBodyColumnDataMixin
 * @extends GlobalModules.DisplayTextColumnDataMixin
 * @module modal
 * @submodule modal-column-data
 */
var ModalBodyColumnDataMixin = Ember.Mixin.create({
  classNames : ["modal-body"],
});
GlobalModules.GlobalModulesColumnDataMixinMap["modalBody"] = ModalBodyColumnDataMixin;
GlobalModules.GlobalModulesColumnDataMixinMap["modalFormBody"] = ModalBodyColumnDataMixin;

return {
  ModalBodyColumnDataMixin : ModalBodyColumnDataMixin,
};

});
