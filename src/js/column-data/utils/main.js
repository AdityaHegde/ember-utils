/**
 * Utility classes related to column data.
 *
 * @submodule column-data-utils
 * @module column-data
 */

define([
  "ember",
  "./columnDataChangeCollectorMixin",
  "./columnDataValueMixin",
  "./columnDataGroupPluginMixin",
], function(Ember) {
  var mod = {};
  for(var i = 1; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        mod[k] = arguments[i][k];
      }
    }
  }

  return mod;
});
