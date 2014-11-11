define([
  "ember",
  "ember_data",
  "lib/ember-utils-core",
  "./backupData",
  "./createRecordWrapper",
  "./getId",
], function(Ember, DS, Utils, BackupData, createRecordWrapper, getId) {
createRecordWrapper = createRecordWrapper.createRecordWrapper;
getId = getId.getId;

/**
 * Method to retrieve record from failure.
 *
 * @method retrieveFailure
 * @for CrudAdapter
 * @param {Instance} record
 */
var retrieveFailure = function(record) {
  var type = record.__proto__.constructor,
      backupId = record.get("isNew") ? "New" : record.get("id"),
      id = record.get("id") || "New";
  if(record.get("isDeleted")) {
    record.transitionTo('loaded.updated.uncommitted');
  }
  else {
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
  if(BackupData.backupDataMap[type.typeKey] && BackupData.backupDataMap[type.typeKey][backupId]) {
    var data = BackupData.backupDataMap[type.typeKey][backupId],
        attrs = record._inFlightAttributes;
    if(Utils.hashHasKeys(record._attributes)) {
      Utils.merge(attrs, record._attributes); 
    }
    delete BackupData.backupDataMap[type.typeKey][backupId];
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, attrs[f]);
    }
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var arr = this.record.get(relationship.key), darr = this.data[relationship.key];
        if(darr) {
          for(var i = 0; i < darr.length; i++) {
            var rid = getId(darr[i], relationship.type), rrec = this.record.store.getById(relationship.type, rid) || arr.objectAt(i);
            if(rrec) {
              retrieveFailure(rrec);
              if(this.record.addToProp) {
                this.record.addToProp(relationship.key, rrec);
              }
              else {
                arr.pushObject(rrec);
              }
            }
            else if(BackupData.backupDataMap[relationship.type.typeKey] && BackupData.backupDataMap[relationship.type.typeKey][rid]) {
              var crdata = BackupData.backupDataMap[relationship.type.typeKey][rid], parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete crdata[parentKey];
              }
              if(!rrec) {
                this.record.addToProp(relationship.key, createRecordWrapper(this.record.store, relationship.type, crdata));
              }
              delete BackupData.backupDataMap[relationship.type.typeKey][rid];
            }
            else {
              var parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete darr[i][parentKey];
              }
              this.record.addToProp(relationship.key, createRecordWrapper(this.record.store, relationship.type, darr[i]));
            }
          }
        }
      }
    }, {record : record, data : data});
  }
};

return {
  retrieveFailure : retrieveFailure,
};

});
