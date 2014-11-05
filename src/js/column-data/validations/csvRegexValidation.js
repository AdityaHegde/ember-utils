define([
  "ember",
  "./regexValidation",
], function(Ember, RegexValidation) {

/**
 * Validate on a regex on each value in a Comma Seperated Value. Pass type = 2 to get this.
 *
 * @class CSVRegexValidation
 */
var CSVRegexValidation = RegexValidation.extend({
  /**
   * Delimeter to use to split values in the CSV.
   *
   * @property delimeter
   * @type String
   */
  delimeter : ",",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        invalid = this.get("regexObject").test(item); 
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

return CSVRegexValidation;

});
