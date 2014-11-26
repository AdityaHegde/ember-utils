define([
  "ember",
  "ember_qunit",
  "lib/ember-test-utils",
  "source/modal/main",
], function(Ember, emq, EmberTests, Modal) {

return function() {

EmberTests.TestCase.EmberTestSuit.create({
  suitName : "FormWindowView",
  moduleFunction : "moduleFor",
  param : "view:modal/formWindow",
  moduleOpts : {
    setup : function() {
      EmberTests.TestUtils.setupAppForTesting(TestApp, this.container);
      CrudAdapter.loadAdaptor(TestApp);
    },
    teardown : function() {
      TestApp.reset();
    },
    needs : [
      "view:modal/modalTitle", 
      "view:modal/modalFormBody",
      "view:modal/modalFooter",
      "view:globalModules/displayText",
      "view:form/form",
      "view:form/textInput",
      "model:test",
      "model:testp"
    ],
  },

  testCases : [{
    title : "Delete new record on cancel",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test", varc : "test" }, "record1"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "",       "record", Ember.Object.create({title : "Title Test"})              ],
          ["base", "record", "rec",    "",                                         "", "record1"],
        ]],
        ["initFormModalWindow"],
      ]],
      ["baseTestBlock", [
        ["showModalWindow"],
      ]],
      ["baseTestBlock", [
        ["loadElementFromModal"],
        ["fillFormElement", "vara", "input", "ValA"],
        ["fillFormElement", "varb", "input", "ValB"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record1.vara", "ValA", "vara was set on record"],
          ["base", "record1.varb", "ValB", "varb was set on record"],
        ]],
        ["clickElement", ".cancel-btn"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record1.isDeleted", true, "record was deleted"],
      ]],
    ]
  }, {
    title : "Rollback existing record on cancel",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test", "record1"]
      ]],
      ["baseTestBlock", [
        ["correctRecord", "record1"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "",       "record", Ember.Object.create({title : "Title Test"})              ],
          ["base", "record", "rec",    "",                                         "", "record1"],
        ]],
        ["initFormModalWindow"],
      ]],
      ["baseTestBlock", [
        ["showModalWindow"],
      ]],
      ["baseTestBlock", [
        ["loadElementFromModal"],
        ["fillFormElement", "vara", "input", "ValA"],
        ["fillFormElement", "varb", "input", "ValB"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record1.vara", "ValA", "vara was set on record"],
          ["base", "record1.varb", "ValB", "varb was set on record"],
        ]],
        ["clickElement", ".cancel-btn"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record1.vara", "test",      "vara was reverted on record"],
        ["base", "record1.varb", "test_varb", "varb was reverted on record"],
      ]],
    ]
  }, {
    title : "Successfull save",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test", varc : "test" }, "record1"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "",       "record", Ember.Object.create({title : "Title Test"})              ],
          ["base", "record", "rec",    "",                                         "", "record1"],
        ]],
        ["initFormModalWindow"],
      ]],
      ["baseTestBlock", [
        ["showModalWindow"],
      ]],
      ["baseTestBlock", [
        ["loadElementFromModal"],
        ["fillFormElement", "vara", "input", "ValA"],
        ["fillFormElement", "varb", "input", "ValB"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record1.vara", "ValA", "vara was set on record"],
          ["base", "record1.varb", "ValB", "varb was set on record"],
        ]],
        ["clickElement", ".ok-btn"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record1.isNew",                            false,                 "record was saved"                              ],
        ["base", "actionContext.saveSuccessCallback",        true,                  "Success callback was called"                   ],
        ["base", "actionContext.saveSuccessCallbackMessage", "Saved successfully!", "Success callback was called with right message"],
      ]],
    ]
  }, {
    title : "Save failure",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test", varc : "test" }, "record1"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "",       "record", Ember.Object.create({title : "Title Test"})              ],
          ["base", "record", "rec",    "",                                         "", "record1"],
        ]],
        ["initFormModalWindow"],
      ]],
      ["baseTestBlock", [
        ["showModalWindow"],
      ]],
      ["baseTestBlock", [
        ["loadElementFromModal"],
        ["fillFormElement", "vara", "input", "ValA"],
        ["fillFormElement", "varb", "input", "ValB"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record1.vara", "ValA", "vara was set on record"],
          ["base", "record1.varb", "ValB", "varb was set on record"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["clickElement", ".ok-btn"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record1.isNew",                            true,           "record was not saved"                          ],
        ["base", "actionContext.saveFailureCallback",        true,           "Failure callback was called"                   ],
        ["base", "actionContext.saveFailureCallbackMessage", "Server Error", "Failure callback was called with right message"],
      ]],
      ["restoreMockjaxSetting"],
    ]
  }],
});

};

});
