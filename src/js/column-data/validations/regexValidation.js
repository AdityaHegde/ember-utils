define([
  "ember",
  "./emptyValidation",
], function(Ember, EmptyValidation) {

/**
 * Validate on a regex. Pass type = 1 to get this.
 *
 * @class RegexValidation
 * @module column-data
 * @submodule column-data-validation
 */
var RegexValidation = EmptyValidation.extend({
  /**
   * Regex to valide with.
   *
   * @property regex
   * @type String
   */
  regex : "",

  /**
   * Regex flags to use while creating the regex object.
   *
   * @property regexFlags
   * @type String
   */
  regexFlags : "",

  /**
   * RegExp object create using regex and regexFlags.
   *
   * @property regexObject
   * @type RegExp
   */
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),

  /**
   * Method to validate.
   *
   * @method validateValue
   * @param {any} value Value to validate.
   * @param {Class} record Record to validate on.
   * @returns {Boolean}
   * @private
   */
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    emptyBool = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    invalid = (isEmpty && emptyBool) || this.get("regexObject").test(value);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

return RegexValidation;

});
