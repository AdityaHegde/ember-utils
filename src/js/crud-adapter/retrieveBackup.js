define([
  "ember",
  "ember_data",
  "./backupData",
  "./getId",
], function(Ember, DS, BackupData, getId) {
getId = getId.getId;

/**
 * Method to retrieve backed up data for a record when server doesnt return the full data.
 *
 * @method retrieveBackup
 * @for CrudAdaptor
 * @param {Object} hash Data returned by server.
 * @param {Class} type Model class for the record.
 * @param {Boolean} [hasId] Boolean to denote that the record has id.
 * @returns {Object} Retrieved data.
 */
var retrieveBackup = function(hash, type, hasId) {
  var backupId = hasId ? getId(hash, type) : "New",
      id = getId(hash, type) || "New";
  if(type.useIdForBackup) backupId = id;
  if(BackupData.backupDataMap[type.typeKey] && BackupData.backupDataMap[type.typeKey][backupId]) {
    var data = BackupData.backupDataMap[type.typeKey][backupId];
    delete BackupData.backupDataMap[type.typeKey][backupId];
    for(var i = 0; i < type.ignoreFieldsOnRetrieveBackup.length; i++) {
      delete data[type.ignoreFieldsOnRetrieveBackup[i]];
    }
    hash = Utils.merge(hash, data);
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var da = this.data[relationship.key], ha = this.hash[relationship.key];
        if(da) {
          for(var i = 0; i < da.length; i++) {
            var ele = ha.findBy(relationship.type.keys[0], da[i][relationship.type.keys[0]]);
            da[i].id = getId(da[i], relationship.type);
            if(ele) Ember.merge(ele, da[i]);
            else ha.push(da[i]);
          }
        }
      }
    }, {data : data, hash : hash});
    if(type.retrieveBackup) {
      type.retrieveBackup(hash, type, data);
    }
  }
  return hash;
};

return {
  retrieveBackup : retrieveBackup,
};

});
