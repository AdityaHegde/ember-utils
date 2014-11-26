define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/form/main",
], function(Ember, DS, emq, Utils, EmberTests, Form) {

EmberTests.TestCase.addToTestHierarchy("initForm", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var form = testData.get("testContext").subject();
    form.set("record", testData.get("record"));
    form.set("columnDataGroup", testData.get("columnDataGroup"));
    form.appendTo("#ember-testing");
    testData.set("form", form);
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("destroyForm", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.get("form").destroy();
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("fillFormElement", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return fillFormElement(this.get("attr1"), this.get("attr2"), this.get("attr3"));
  },
}), "to");

});
