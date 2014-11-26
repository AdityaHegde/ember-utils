define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/crud-adapter/main",
], function(Ember, DS, emq, Utils, EmberTests, CrudAdapter, TestApp) {

EmberTests.TestCase.addToTestHierarchy("mockjaxSetting", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("mockjaxSettingBack", EmberTests.MockjaxUtils.MockjaxSettings.MockjaxSettingsInstance);
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
    testData.set(this.get("attr3"), CrudAdapter.createRecordWrapper(testData.get("store"), this.get("attr1"), this.get("attr2")));
  },
  attr3 : "record",
}), "to");
EmberTests.TestCase.addToTestHierarchy("findRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set(this.get("attr3"), testData.get("store").find(this.get("attr1"), this.get("attr2")));
  },
  attr3 : "record",
}), "to");
EmberTests.TestCase.addToTestHierarchy("correctRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set(this.get("attr1"), testData.get(this.get("attr1")).content);
  },
  attr1 : "record",
}), "to");
EmberTests.TestCase.addToTestHierarchy("deleteRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.get(this.get("attr1")).deleteRecord();
  },
  attr1 : "record",
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
EmberTests.TestCase.addToTestHierarchy("rollbackRecord", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    CrudAdapter.rollbackRecord(testData.get("record"));
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
      GlobalData : CrudAdapter.GlobalData,
      MockjaxSettings : EmberTests.MockjaxUtils.MockjaxSettings,
    });
  },
}), "tc");

});
