define([
  "ember",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/crud-adapter/main",
  "test/test-app",
], function(Ember, emq, Utils, EmberTests, CrudAdapter, TestApp) {

return function() {

EmberTests.TestCase.EmberTestSuit.create({
  suitName : "crud-adaptor simple record",
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
    title : "Create Record",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test", varb : "test", varc : "test", vard : "test" }],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "GlobalData", "global_varcu", "global_val"],
        ]],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",      "test",      "Has proper id : 'test'"                                                     ],
        ["base", "record.vara",    "test",      "'vara' has correct value : 'test'"                                          ],
        ["base", "record.varc",    "test_varc", "'varc' has correct value : 'test_varc' as returned from server after update"],
        ["base", "record.vard",    undefined,   "'vard' has was not retrieved from backup"                                   ],
        ["base", "record.varmeta", "BRNPN",     "Right callbacks were called"                                                ],
        ["base", "MockjaxSettings.MockjaxSettingsInstance.lastPassedData.params", 
                 { vara : "test", global_varcu : "global_val", varc : "test", "vard": "test", "testp": null, "varmeta": "S" },
                 "Right params was sent"],
      ]],
    ],
  }, {
    title : "Create Record on existing id",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test" }],
        ["saveRecord"],
      ]],
      ["baseTestBlock", [
        ["createRecord", "test", { id : "test", vara : "test" }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",   "test",      "Has proper id : 'test'"           ],
        ["base", "record.vara", "test",      "'vara' has correct value : 'test'"],
      ]],
    ],
  }, {
    title : "Create Record with 500 server error status",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test" }],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "varb_changed"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",      undefined,      "Id is not defined as save failed"        ],
        ["base", "record.varb",    "varb_changed", "'varb' value 'varb_changed' was retained"],
        ["base", "failureMessage", "Server Error", "Failure message captured"                ],
      ]],
      //to check that record is not in failure state and can be edited
      ["assignValues", [
        //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
        ["base",    "record", "varb",     "varb_changed"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Create Record with 404 server error status",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test" }],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "varb_changed"],
        ]],
        ["mockjaxSetting", { throwServerError : true, serverErrorCode : 404 }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",      undefined,      "Id is not defined as save failed"        ],
        ["base", "record.varb",    "varb_changed", "'varb' value 'varb_changed' was retained"],
        ["base", "failureMessage", "Server Error", "Failure message captured"                ],
      ]],
      //to check that record is not in failure state and can be edited
      ["assignValues", [
        //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
        ["base",    "record", "varb",     "varb_changed"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Create Record with processing error on server",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test" }],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "varb_changed"],
        ]],
        ["mockjaxSetting", { throwProcessError : 1 }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",      undefined,      "Id is not defined as save failed"        ],
        ["base", "record.varb",    "varb_changed", "'varb' value 'varb_changed' was retained"],
        ["base", "failureMessage", "Failed",       "Failure message captured"                ],
      ]],
      //to check that record is not in failure state and can be edited
      ["assignValues", [
        //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
        ["base",    "record", "varb",     "varb_changed"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Update Record",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "GlobalData", "global_varfind", "global_val"],
      ]],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base",  "record.varb",  "test_varb",  "Initial value of 'varb' is 'test_varb'"],
          ["base", "MockjaxSettings.MockjaxSettingsInstance.lastPassedData.params", 
                   { vara : "test", global_varfind : "global_val", "vard": undefined },
                   "Right params was sent"],
        ]],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "test_update"],
        ]],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",   "test",        "Has proper id : 'test'"                 ],
        ["base", "record.vara", "test",        "'vara' has correct value : 'test'"      ],
        ["base", "record.varb", "test_update", "'varb' value 'test_update' was retained"],
      ]],
    ],
  }, {
    title : "Update Record with server error",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base",  "record.varb",  "test_varb",  "Initial value of 'varb' is 'test_varb'"],
        ]],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage", "Server Error", "Failure message captured"               ],
        ["base", "record.id",      "test",         "Has proper id : 'test'"                 ],
        ["base", "record.vara",    "test",         "'vara' has correct value : 'test'"      ],
        ["base", "record.varb",    "test_update",  "'varb' value 'test_update' was retained"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Update Record with server error",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base",  "record.varb",  "test_varb",  "Initial value of 'varb' is 'test_varb'"],
        ]],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwProcessError : 1 }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage", "Failed",       "Failure message captured"               ],
        ["base", "record.id",      "test",         "Has proper id : 'test'"                 ],
        ["base", "record.vara",    "test",         "'vara' has correct value : 'test'"      ],
        ["base", "record.varb",    "test_update",  "'varb' value 'test_update' was retained"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Delete Record",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "record",     "varb",          "test_update"],
          ["base", "GlobalData", "global_vardel", "global_val" ],
        ]],
        ["deleteRecord"],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "MockjaxSettings.MockjaxSettingsInstance.lastPassedData.params", 
                 { vara : "test", global_vardel : "global_val" },
                 "Right params was sent"],
      ]],
    ],
  }, {
    title : "Delete Record with server error.",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["deleteRecord"],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage", "Server Error", "Failure message captured"               ],
        ["base", "record.id",      "test",         "Has proper id : 'test'"                 ],
        ["base", "record.vara",    "test",         "'vara' has correct value : 'test'"      ],
        ["base", "record.varb",    "test_update",  "'varb' value 'test_update' was retained"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Delete Record with server process error.",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwProcessError : 1 }],
        ["deleteRecord"],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage", "Failed",       "Failure message captured"               ],
        ["base", "record.id",      "test",         "Has proper id : 'test'"                 ],
        ["base", "record.vara",    "test",         "'vara' has correct value : 'test'"      ],
        ["base", "record.varb",    "test_update",  "'varb' value 'test_update' was retained"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Rollback Record.",
    type : "crudTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "test", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "record", "varb", "test_update"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.varb",    "test_update",  "'varb' has 'test_update'"],
        ]],
        ["rollbackRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.varb", "test_varb", "'varb' was rollbacked to 'test_varb'"],
      ]],
    ],
  }],
});

};

});
