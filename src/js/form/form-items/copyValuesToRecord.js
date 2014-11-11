define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/*
 *
 * @module form
 * @submodule form-items
 */
var CopyValuesToRecord = function(toRecord, col, fromRecord, value) {
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        toRecord.set(copyAttrs[k], fromRecord.get(k));
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        toRecord.set(k, staticAttrs[k]);
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        toRecord.set(valAttrs[k], value.get(k));
      }
    }
  }
};

return CopyValuesToRecord;

});
