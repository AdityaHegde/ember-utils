define([
  "ember",
  "core/hasMany",
  "./emptyValidation",
  "./regexValidation",
  "./csvRegexValidation",
  "./csvDuplicateValidation",
  "./duplicateAcrossRecordsValidation",
  "./numberRangeValidation",
], function(Ember, hasMany) { 
hasMany = hasMany.hasMany;

var ColumnDataValidationsMap = {};
for(var i = 2; i < arguments.length; i++) {
  ColumnDataValidationsMap[i - 2] = arguments[i];
}

/**
 * Validation class that goes as 'validation' on column data.
 *
 * @class ColumnDataValidation
 */
var ColumnDataValidation = Ember.Object.extend({
  init : function() {
    this._super();
    this.canBeEmpty();
  },

  /**
   * Array of validations to run. Passed as objects while creating.
   *
   * @property validations
   * @type Array
   */
  validations : hasMany(ColumnDataValidationsMap, "type"),

  /**
   * @property validate
   * @type Boolean
   * @private
   */
  validate : Ember.computed.notEmpty('validations'),

  /**
   * Method to validate a value on record.
   *
   * @method validateValue
   * @param {any} value Value to validate.
   * @param {Class} record Record to validate on.
   * @param {Array} [validations] Optional override of the validations to run.
   * @returns {Array} Returns an array with 1st element as a boolean which says whether validations passed or not, 2nd element is the invalid message if it failed.
   */
  validateValue : function(value, record, validations) {
    var invalid = [false, ""];
    validations = validations || this.get("validations");
    for(var i = 0; i < validations.length; i++) {
      invalid = validations[i].validateValue(value, record);
      if(invalid[0]) break;
    }
    return invalid;
  },

  canBeEmpty : function() {
    if(this.get("validations") && !this.get("validations").mapBy("type").contains(0)) {
      this.set("mandatory", false);
      this.get("validations").forEach(function(item) {
        item.set('canBeEmpty', true);
      });
    }
    else {
      this.set("mandatory", true);
    }
  }.observes('validations.@each'),

  /**
   * Boolean to denote whether the property is mandatory or not.
   *
   * @property mandatory
   * @type Boolean
   */
  mandatory : false,
});

return ColumnDataValidation;

});
