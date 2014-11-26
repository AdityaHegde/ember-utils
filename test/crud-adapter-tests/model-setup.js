define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/crud-adapter/main",
  "test/test-app",
], function(Ember, DS, emq, Utils, EmberTests, CrudAdapter, TestApp) {

CrudAdapter.APIConfig.ENABLE_END_POINT = 1;
CrudAdapter.APIConfig.APPEND_ID = 0;
CrudAdapter.APIConfig.HTTP_METHOD_MAP = {
  find    : "GET",
  findAll : "GET",
  create  : "POST",
  update  : "POST",
  delete  : "GET",
};

TestApp.Test = CrudAdapter.createModelWrapper({
  vara : attr(),
  varb : attr(),
  varc : attr(),
  vard : attr(),
  vare : attr(),
  varmeta : attr("string", {defaultValue : ""}),

  testp : belongsTo("testp", {async : true}),
}, {
  keys : ["vara"],
  apiName : "test",
  deleteParams : ["vara", "global_vardel"],
  findParams : ["vard", "global_varfind"],
  createUpdateParams : ["global_varcu"],
  ignoreFieldsOnCreateUpdate : ["varb"],
  ignoreFieldsOnRetrieveBackup : ["vard"],
  removeAttrsFromBackupOnFind : ["vare"],
  normalizeFunction : function(hash) {
    hash.varmeta += "N";
  },
  preSerializeRelations : function(data) {
    data.varmeta += "P";
  },
  serializeFunction : function(record, json) {
    json.varmeta += "S";
  },
  backupData : function(record, type, data) {
    data.varmeta += "B";
  },
  retrieveBackup : function(hash, type, data) {
    hash.varmeta += "R";
  },
});
EmberTests.MockjaxUtils.addMockjaxData({
  name : "test",
  data : [{
    id : "test",
    vara : "test",
    varb : "test_varb",
  }, {
    id : "test2",
    vara : "test2",
  }, {
    id : "test3",
    vara : "test3",
  }, {
    id : "test4",
    vara : "test4",
  }, {
    id : "test5",
    vara : "test5",
  }],
  createUpdateAdditionalData : {
    varc : "test_varc",
  },
  modelClass : TestApp.Test,
});

TestApp.Testp = CrudAdapter.createModelWrapper({
  vara : attr(),
  varb : attr(),

  tests : hasMany("test", {async : true}),
}, {
  keys : ["vara"],
  apiName : "testparent",
  queryParams : ["vara"],
});
EmberTests.MockjaxUtils.addMockjaxData({
  name : "testparent",
  data : [
    {
      id : "test",
      vara : "test",
      tests : [{
        id : "test1",
        vara : "test1",
        varb : "test_varb",
      }, {
        id : "test2",
        vara : "test2",
      }, {
        id : "test3",
        vara : "test3",
      }, {
        id : "test4",
        vara : "test4",
      }, {
        id : "test5",
        vara : "test5",
      }],
    },
    {
      id : "test1",
      vara : "test1",
      varb : "vb1",
      tests : [{
        id : "test11",
        vara : "test11",
        varb : "vb1",
      }, {
        id : "test12",
        vara : "test12",
        varb : "vb1",
      }, {
        id : "test13",
        vara : "test13",
        varb : "vb1",
      }],
    },
  ],
  modelClass : TestApp.Testp,
});

});
