define([
  "ember",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/crud-adapter/main",
  "test/test-app",
  "./model-setup",
], function(Ember, emq, Utils, EmberTests, CrudAdapter, TestApp) {

return function() {

EmberTests.TestCase.EmberTestSuit.create({
  suitName : "ModelWrapper",
  moduleFunction : "moduleForModel",
  param : "test",
  moduleOpts : {
    setup : function() {
      CrudAdapter.loadAdaptor(TestApp);
    },
    teardown : function() {
    },

    needs : ["model:testp"],
  },

  testCases : [{
    title : "Single Record",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test", varc : "test" }],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.isDirty",       true,  "record is dirty"      ],
        ["base", "record.isDirty_alias", true,  "isDirty_alias is true"],
        ["base", "record.disableSave",   false, "disableSave is false" ],
      ]],
      ["baseTestBlock", [
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.isDirty",       false, "record is dirty"      ],
        ["base", "record.isDirty_alias", false, "isDirty_alias is true"],
        ["base", "record.disableSave",   true,  "disableSave is true"  ],
      ]],
    ],
  }, {
    title : "Single record with multiple child records",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "testp", { vara : "test" }],
        ["createChildRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.isDirty",       true,  "record is dirty"      ],
        ["base", "record.isDirty_alias", true,  "isDirty_alias is true"],
        ["base", "record.disableSave",   false, "disableSave is false" ],
      ]],
      ["baseTestBlock", [
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.isDirty",       false, "record is dirty"      ],
        ["base", "record.isDirty_alias", false, "isDirty_alias is true"],
        ["base", "record.disableSave",   true,  "disableSave is true"  ],
      ]],
    ],
  }],
});

};

});
