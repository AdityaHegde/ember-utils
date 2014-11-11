/**
 * Wrapper module around ember data.
 *
 * @module crud-adapter
 */
define([
  "./model-wrapper",
  "./getId",
  "./applicationAdapter",
  "./applicationSerializer",
  "./createRecordWrapper",
  "./saveRecord",
  "./backupData",
  "./retrieveBackup",
  "./retrieveFailure",
  "./forceReload",
  "./rollbackRecord",
], function() {
  /**
   * Global class for crud-adapter.
   *
   * @class CrudAdapter
   */
  var CrudAdapter = Ember.Namespace.create();
  window.CrudAdapter = CrudAdapter;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        CrudAdapter[k] = arguments[i][k];
      }
    }
  }

  CrudAdapter.loadAdaptor = function(app) {
    app.ApplicationAdapter = CrudAdapter.ApplicationAdapter;
    app.ApplicationSerializer = CrudAdapter.ApplicationSerializer;
  };

  return CrudAdapter;
});
