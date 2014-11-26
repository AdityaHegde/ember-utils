define([
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Wrapper to create record.
 *
 * @method createRecordWrapper
 * @for CrudAdapter
 * @param {Instance} store
 * @param {Class|String} type
 * @param {Object} data
 */
var createRecordWrapper = function(store, type, data) {
  if(data.id && store.recordIsLoaded(type, data.id)) {
    var record = store.recordForId(type, data.id);
    record.unloadRecord();
  }
  var record = store.createRecord(type, data);
  record.recordReady();
  return record;
};

return {
  createRecordWrapper : createRecordWrapper,
};

});
