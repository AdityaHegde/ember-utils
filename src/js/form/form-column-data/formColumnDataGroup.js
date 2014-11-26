define([
  "ember",
  "lib/ember-utils-core",
  "../../global-module/main",
], function(Ember, Utils, GlobalModules) {

/**
 * Column data group for form.
 *
 * @class Form.FormColumnDataGroup
 * @submodule form-column-data
 * @module form
 */
var FormColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "form",
  modules : [],
  lookupMap : {},

  labelWidthClass : "col-sm-4",
  inputWidthClass : "col-sm-8",
  showLabel : true,
});

return {
  FormColumnDataGroup : FormColumnDataGroup,
};

});
