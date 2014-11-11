define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/*
 * Copy values from record to object.
 *
 * @method Form.CopyValuesToObject
 * @module form
 * @submodule form-items
 */
var CopyValuesToObject = function(obj, col, record, value) {
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        obj[copyAttrs[k]] = record.get(k);
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        obj[k] = staticAttrs[k];
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        obj[valAttrs[k]] = value.get(k);
      }
    }
  }
};

return CopyValuesToObject;

});
