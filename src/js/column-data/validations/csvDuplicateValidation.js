define([
  "ember",
  "./csvRegexValidation",
], function(Ember, CSVRegexValidation) {


/**
 * Validate duplication in a CSV. Pass type = 3 to get this.
 *
 * @class CSVDuplicateValidation
 */
var CSVDuplicateValidation = CSVRegexValidation.extend({
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool, valuesMap = {};
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        if(valuesMap[item]) {
          invalid = true;
        }
        else {
          valuesMap[item] = 1;
        }
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

return CSVDuplicateValidation;

});
