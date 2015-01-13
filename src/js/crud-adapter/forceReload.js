define([
  "ember",
  "ember_data",
  "./backupData",
  "./findRecordWrapper",
], function(Ember, DS, backupData, findRecordWrapper) {
backupData = backupData.backupData;
findRecordWrapper = findRecordWrapper.findRecordWrapper;

/**
 * Method to reload a record.
 *
 * @method forceReload
 * @for CrudAdapter
 * @param {Instance} store Store to reload from.
 * @param {Class} type Type of the record to reload.
 * @param {String} id Id of the record to reload.
 * @returns {Instance} Reloaded record.
 */
var forceReload = function(store, type, id) {
  if(store.recordIsLoaded(type, id)) {
    var record = store.recordForId(type, id);
    backupData(record, record.__proto__.constructor, "find");
    return record.reload();
  }
  else {
    return findRecordWrapper(store, type, id);
  }
};

return {
  forceReload : forceReload,
};

});
