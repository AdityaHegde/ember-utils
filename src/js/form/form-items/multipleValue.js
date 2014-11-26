define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Base for multiple value object.
 *
 * @class Form.MultipleValue
 * @module form
 * @submodule form-items
 */
var MultipleValue = Ember.Object.extend({
  value : function(key, value) {
    var columnData = this.get("columnData");
    if(arguments.length > 1) {
      if(!Ember.isNone(columnData)) {
        var validation = columnData.get("validation").validateValue(value, null, columnData.get("validation.eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
        }
        else {
          this.set("isInvalid", false);
        }
      }
      return value;
    }
  }.property('columnData'),
  label : "",
  isInvalid : false,
});

return {
  MultipleValue : MultipleValue,
};

});
