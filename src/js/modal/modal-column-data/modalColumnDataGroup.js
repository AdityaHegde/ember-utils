define([
  "ember",
  "../../global-module/main",
], function(Ember, GlobalModules) {

/**
 * Column data group for modal module.
 *
 * @class Modal.ModalColumnDataGroup
 * @module modal
 * @submodule modal-column-data
 */
var ModalColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "modal",
  modules : ["title", "body", "footer"],
  lookupMap : {},

  /**
   * Type of title view.
   *
   * @property titleType
   * @type String
   * @default "modalTitle"
   */
  titleType : "modalTitle",

  /**
   * Type of body view.
   *
   * @property bodyType
   * @type String
   * @default "modalBody"
   */
  bodyType : "modalBody",

  /**
   * Type of footer view.
   *
   * @property footerType
   * @type String
   * @default "modalFooter"
   */
  footerType : "modalFooter",
});

return {
  ModalColumnDataGroup : ModalColumnDataGroup,
};

});
