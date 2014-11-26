define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Column Data mixin for modal title.
 *
 * @class Modal.ModalTitleColumnDataMixin
 * @extends GlobalModules.DisplayTextColumnDataMixin
 * @module modal
 * @submodule modal-column-data
 */
var ModalTitleColumnDataMixin = Ember.Mixin.create({
  classNames : ["modal-header"],
});
GlobalModules.GlobalModulesColumnDataMixinMap["modalTitle"] = ModalTitleColumnDataMixin;

return {
  ModalTitleColumnDataMixin : ModalTitleColumnDataMixin,
};

});
