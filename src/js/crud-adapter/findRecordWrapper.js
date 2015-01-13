define([
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Wrapper to find record(s).
 *
 * @method findRecordWrapper
 * @for CrudAdapter
 * @param {Instance} store
 * @param {Class|String} type
 * @param {Object} [query]
 */

function recordReady(data) {
  if(data.forEach) {
    data.forEach(function(rec) {
      recordReady(rec);
    });
  }
  if(data.recordReady) {
    data.recordReady();
  }
}

var findRecordWrapper = function(store, type, query) {
  var promise = store.find(type, query);
  promise.then(function(data) {
    recordReady(data);
  });
  return promise;
};

return {
  findRecordWrapper : findRecordWrapper,
};

});
