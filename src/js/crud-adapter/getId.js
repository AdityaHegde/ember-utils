define([
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Method to get id from a record/object for a type.
 *
 * @method getId
 * @for CrudAdapter
 * @param {Instance|Object} record Record/Object to get id from.
 * @param {Class} type Model for the Record/Object.
 * @returns {String} Id of the record/object.
 */
var getId = function(record, type) {
  var id = record.id;
  if(!id) {
    var keys = type.keys || [], ids = [];
    for(var i = 0; i < keys.length; i++) {
      var attr = (record.get && record.get(keys[i])) || record[keys[i]];
      if(null !== attr || undefined !== attr) {
        ids.push(attr);
      }
      else {
        return null;
      }
    }
    return ids.join("__");
  }
  else {
    return id;
  }
};

return {
  getId : getId,
};

});
