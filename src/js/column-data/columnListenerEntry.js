define([
  "ember",
], function(Ember) {

/**
 * Entry for column listeners.
 *
 * @class ColumnListenerEntry
 */
var ColumnListenerEntry = Ember.Object.extend({
  /**
   * A name to uniquely identify column data.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Key name of the attribute in the record. If not provided, 'name' is used a key.
   *
   * @property keyName
   * @type String
   */
  keyName : "",

  /**
   * Key of the attribute based on keyName or name if keyName is not provided.
   *
   * @property key
   * @type String
   * @private
   */
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
});

return ColumnListenerEntry;

});
