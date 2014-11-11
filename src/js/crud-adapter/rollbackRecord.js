define([
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Wrapper method to rollback a record.
 *
 * @method rollbackRecord
 * @for CrudAdapter
 * @param {Instance} record
 */
var rollbackRecord = function(record) {
  if(record.get("isError") || record.get("isInvalid") || record.get("isSaving")) {
    var attrs = record._inFlightAttributes, data = record._data;
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, data[f]);
    }
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
  else {
    record.rollback();
  }
  record.__proto__.constructor.eachRelationship(function(name, relationship) {
    if(relationship.kind === "hasMany") {
      var rarr = record.get(relationship.key);
      rarr.then(function() {
        rarr.forEach(function(rec) {
          rollbackRecord(rec);
        });
      });
    }
  });
};

return {
  rollbackRecord : rollbackRecord,
};

});
