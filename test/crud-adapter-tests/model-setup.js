define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/crud-adapter/main",
  "test/test-app",
], function(Ember, DS, emq, Utils, EmberTests, CrudAdapter, TestApp) {

TestApp.Test = CrudAdapter.createModelWrapper({
  vara : attr(),
  varb : attr(),
  varc : attr(),
  vard : attr(),

  testp : belongsTo("testp", {async : true}),
}, {
  keys : ["vara"],
  apiName : "test",
  queryParams : ["vara"],
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

  arrayProps : ["tests"],
}, {
  keys : ["vara"],
  apiName : "testparent",
  queryParams : ["vara"],
}, [Utils.DelayedAddToHasManyMixin]);
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

EmberTests.TestCase.addToTestHierarchy("mockjaxSetting", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("mockjaxSettingBack", EmberTests.MockjaxUtils.MockjaxSettingsInstance);
    EmberTests.MockjaxUtils.MockjaxSettings.MockjaxSettingsInstance = EmberTests.MockjaxUtils.MockjaxSettings.create(this.get("attr1"));
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("restoreMockjaxSetting", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    EmberTests.MockjaxUtils.MockjaxSettings.MockjaxSettingsInstance = testData.get("mockjaxSettingBack");
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("createRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("record", CrudAdapter.createRecordWrapper(testData.get("store"), this.get("attr1"), this.get("attr2")));
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("findRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("record", testData.get("store").find(this.get("attr1"), this.get("attr2")));
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("correctRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("record", testData.get("record").content);
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("deleteRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.get("record").deleteRecord();
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("saveRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    CrudAdapter.saveRecord(testData.get("record")).then(function() {
      testData.set("savePassed", true);
    }, function(message) {
      testData.set("failureMessage", message);
      CrudAdapter.retrieveFailure(testData.get("record"));
    });
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("createChildRecord", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var tests = testData.get("record.tests");
      tests.then(function() {
        for(var i = 0; i < 5; i++) {
          tests.pushObject(CrudAdapter.createRecordWrapper(testData.get("store"), "test", {
            vara : "test"+i,
          }));
        }
        resolve();
      }, function(e) {
        reject(e);
      });
    });
  },
}), "to");

EmberTests.TestCase.addToTestHierarchy("crudTestCase", EmberTests.TestCase.TestCase.extend({
  initialize : function() {
    this._super();
    var testData = this.get("testData");
    testData.setProperties({
      ApplicationAdapter : CrudAdapter.ApplicationAdapter,
      ApplicationSerializer : CrudAdapter.ApplicationSerializer,
    });
  },
}), "tc");

});
