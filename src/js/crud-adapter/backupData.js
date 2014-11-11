define([
  "ember",
  "ember_data",
  "./getId",
], function(Ember, DS, getId) {
getId = getId.getId;

/**
 * Method to backup data for a record if server doesnt return the full data.
 *
 * @method backupData
 * @for CrudAdaptor
 * @param {Instance} record
 * @param {Class} type Model class for the record.
 * @param {String} [operation] Operation when the backup was called.
 * @returns {Object} Backedup data.
 */
var backupDataMap = {};
var backupData = function(record, type, operation) {
  //TODO : make 'new' into a custom new tag extracted from 'type'
  var data = record.toJSON(), 
      backupId = operation === "create" ? "New" : getId(record, type);
      id = getId(record, type) || "New";
  if(type.useIdForBackup) backupId = id;
  backupDataMap[type.typeKey] = backupDataMap[type.typeKey] || {};
  backupDataMap[type.typeKey][backupId] = data;
  if(type.retainId) data.id = id;
  for(var i = 0; i < type.keys.length; i++) {
    if(Ember.isEmpty(data[type.keys[i]])) delete data[type.keys[i]];
  }
  type.eachRelationship(function(name, relationship) {
    var a = record.get(relationship.key);
    if(a) {
      if(relationship.kind == 'hasMany') {
        this.data[relationship.key] = [];
        a.forEach(function(item) {
          this.data[relationship.key].push(backupData(item, relationship.type, operation));
        }, this);
      }
      else if(relationship.kind === "belongsTo") {
        a = a.content;
        this.data[relationship.key] = a ? a.get("id") || a : a;
      }
    }
  }, {data : data, record : record, operation : operation});
  if(type.backupData) {
    type.backupData(record, type, data);
  }
  if(operation === "find") {
    for(var i = 0; i < type.removeAttrsFromBackupOnFind.length; i++) {
      delete data[type.removeAttrsFromBackupOnFind[i]];
    }
  }
  return data;
};

return {
  backupData : backupData,
  backupDataMap : backupDataMap,
};

});
