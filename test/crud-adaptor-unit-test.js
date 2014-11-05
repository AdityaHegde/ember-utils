TestApp.Test = ModelWrapper.createModelWrapper({
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
MockjaxUtils.addMockjaxData({
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

TestApp.Testp = ModelWrapper.createModelWrapper({
  vara : attr(),
  varb : attr(),

  tests : hasMany("test", {async : true}),

  arrayProps : ["tests"],
}, {
  keys : ["vara"],
  apiName : "testparent",
  queryParams : ["vara"],
}, [Utils.DelayedAddToHasMany]);
MockjaxUtils.addMockjaxData({
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

Utils.addToHierarchy(TestCase.TestHierarchyMap, "mockjaxSetting", TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("mockjaxSettingBack", MockjaxUtils.MockjaxSettingsInstance);
    MockjaxUtils.MockjaxSettingsInstance = MockjaxUtils.MockjaxSettings.create(this.get("attr1"));
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "restoreMockjaxSetting", TestCase.TestOperation.extend({
  run : function(testData) {
    MockjaxUtils.MockjaxSettingsInstance = testData.get("mockjaxSettingBack");
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "createRecord", TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("record", CrudAdapter.createRecordWrapper(testData.get("store"), this.get("attr1"), this.get("attr2")));
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "findRecord", TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("record", testData.get("store").find(this.get("attr1"), this.get("attr2")));
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "correctRecord", TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("record", testData.get("record").content);
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "deleteRecord", TestCase.TestOperation.extend({
  run : function(testData) {
    testData.get("record").deleteRecord();
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "saveRecord", TestCase.TestOperation.extend({
  run : function(testData) {
    CrudAdapter.saveRecord(testData.get("record")).then(function() {
      testData.set("savePassed", true);
    }, function(message) {
      testData.set("failureMessage", message);
      CrudAdapter.retrieveFailure(testData.get("record"));
    });
  },
}), 2);
Utils.addToHierarchy(TestCase.TestHierarchyMap, "createChildRecord", TestCase.AsyncOperation.extend({
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
}), 2);

TestCase.EmberTestSuit.create({
  suitName : "crud-adaptor",
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
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "test", { vara : "test", varc : "test" }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",   "test",      "Has proper id : 'test'"                                                     ],
        ["base", "record.vara", "test",      "'vara' has correct value : 'test'"                                          ],
        ["base", "record.varc", "test_varc", "'varc' has correct value : 'test_varc' as returned from server after update"],
      ]],
    ],
  }, {
    title : "Create Record on existing id",
    type : "baseTestCase",
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
    type : "baseTestCase",
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
    type : "baseTestCase",
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
    type : "baseTestCase",
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
    title : "Create Record with hasMany",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "testp", { vara : "test" }],
        ["createChildRecord"],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "varb_changed"],
        ]],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "varb_changed"],
        ]],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",             "test",                                        "Has proper id : 'test'"                             ],
        ["base", "record.vara",           "test",                                        "'vara' has correct value : 'test'"                  ],
        ["base", "record.varb",           "varb_changed",                                "'varb' value 'varb_changed' was retained"           ],
        ["base", "record.tests.@.vara",   ["test0", "test1", "test2", "test3", "test4"], "'tests' has right children with right 'vara' values"],
        ["base", "record.tests.0.id",     "test0",                                       "'id' of 1st element in tests is as expected"        ],
        ["base", "record.tests.0.varb",   "varb_changed",                                "'varb' of 1st element in tests is as expected"      ],
      ]],
    ],
  }, {
    title : "Create Record with hasMany, server error",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "testp", { vara : "test" }],
        ["createChildRecord"],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "varb_changed"],
        ]],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "varb_changed"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",             undefined,                                     "No id assigned as save failed"                      ],
        ["base", "record.varb",           "varb_changed",                                "'varb' value 'varb_changed' was retained"           ],
        ["base", "record.tests.@.vara",   ["test0", "test1", "test2", "test3", "test4"], "'tests' has right children with right 'vara' values"],
        ["base", "record.tests.0.varb",   "varb_changed",                                "'varb' of 1st element in tests is as expected"      ],
        ["base", "failureMessage",        "Server Error",                                "Failure message captured"                           ],
      ]],
      //to check that record is not in failure state and can be edited
      ["assignValues", [
        //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
        ["base",    "record",         "varb",     "varb_changed"],
        ["base",    "record.tests.0", "varb",     "varb_changed"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Create Record with hasMany, server processing error",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "testp", { vara : "test" }],
        ["createChildRecord"],
        ["assignValues", [
          //"type"    "path"    "putPath"   "value"   "param"   "valuePath"
          ["base",    "record", "varb",     "varb_changed"],
        ]],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "varb_changed"],
        ]],
        ["mockjaxSetting", { throwProcessError : 1 }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",             undefined,                                     "No id assigned as save failed"                      ],
        ["base", "record.varb",           "varb_changed",                                "'varb' value 'varb_changed' was retained"           ],
        ["base", "record.tests.@.vara",   ["test0", "test1", "test2", "test3", "test4"], "'tests' has right children with right 'vara' values"],
        ["base", "record.tests.0.varb",   "varb_changed",                                "'varb' of 1st element in tests is as expected"      ],
        ["base", "failureMessage",        "Failed",                                      "Failure message captured"                           ],
      ]],
      //to check that record is not in failure state and can be edited
      ["assignValues", [
        //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
        ["base",    "record",         "varb",     "varb_changed"],
        ["base",    "record.tests.0", "varb",     "varb_changed"],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Update Record",
    type : "baseTestCase",
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
    type : "baseTestCase",
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
    type : "baseTestCase",
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
    title : "Update Record with hasMany",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "testp", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base",  "record.tests.0.varb",  "test_varb",  "Initial value of 'varb' of 1st child record is 'test_varb'"],
        ]],
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "test_update"],
        ]],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.id",           "test",                                        "Has proper id : 'test'"                                      ],
        ["base", "record.vara",         "test",                                        "'vara' has correct value : 'test'"                           ],
        ["base", "record.tests.@.vara", ["test1", "test2", "test3", "test4", "test5"], "'tests' has right children with right 'vara' values"         ],
        ["base", "record.tests.0.varb", "test_update",                                 "'varb' of 1st child record has correct value : 'test_update'"],
        ["base", "record.tests.0.id",   "test1",                                       "id of 1st child record has correct value : 'test0'"          ],
      ]],
    ],
  }, {
    title : "Update Record with hasMany, server error",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "testp", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base",  "record.tests.0.varb",  "test_varb",  "Initial value of 'varb' of 1st child record is 'test_varb'"],
        ]],
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage",      "Server Error",                                "Failure message captured"                                    ],
        ["base", "record.id",           "test",                                        "Has proper id : 'test'"                                      ],
        ["base", "record.vara",         "test",                                        "'vara' has correct value : 'test'"                           ],
        ["base", "record.tests.@.vara", ["test1", "test2", "test3", "test4", "test5"], "'tests' has right children with right 'vara' values"         ],
        ["base", "record.tests.0.varb", "test_update",                                 "'varb' of 1st child record has correct value : 'test_update'"],
        ["base", "record.tests.0.id",   "test1",                                       "id of 1st child record has correct value : 'test0'"          ],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Update Record with hasMany, server process error",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "testp", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base",  "record.tests.0.varb",  "test_varb",  "Initial value of 'varb' of 1st child record is 'test_varb'"],
        ]],
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwProcessError : true }],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage",      "Failed",                                      "Failure message captured"                                    ],
        ["base", "record.id",           "test",                                        "Has proper id : 'test'"                                      ],
        ["base", "record.vara",         "test",                                        "'vara' has correct value : 'test'"                           ],
        ["base", "record.tests.@.vara", ["test1", "test2", "test3", "test4", "test5"], "'tests' has right children with right 'vara' values"         ],
        ["base", "record.tests.0.varb", "test_update",                                 "'varb' of 1st child record has correct value : 'test_update'"],
        ["base", "record.tests.0.id",   "test1",                                       "id of 1st child record has correct value : 'test0'"          ],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Delete Record with server error.",
    type : "baseTestCase",
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
    type : "baseTestCase",
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
    title : "Delete Record with hasMany, server error",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "testp", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwServerError : true }],
        ["deleteRecord"],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage",      "Server Error",                                "Failure message captured"                                    ],
        ["base", "record.id",           "test",                                        "Has proper id : 'test'"                                      ],
        ["base", "record.vara",         "test",                                        "'vara' has correct value : 'test'"                           ],
        ["base", "record.tests.@.vara", ["test1", "test2", "test3", "test4", "test5"], "'tests' has right children with right 'vara' values"         ],
        ["base", "record.tests.0.varb", "test_update",                                 "'varb' of 1st child record has correct value : 'test_update'"],
        ["base", "record.tests.0.id",   "test1",                                       "id of 1st child record has correct value : 'test0'"          ],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }, {
    title : "Delete Record with hasMany, server process error",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["setupStore"],
      ["baseTestBlock", [
        ["findRecord", "testp", "test"],
      ]],
      ["baseTestBlock", [
        ["correctRecord"],
        ["assignValues", [
          //"type"    "path"            "putPath"   "value"   "param"   "valuePath"
          ["base",    "record.tests.0", "varb",     "test_update"],
        ]],
        ["mockjaxSetting", { throwProcessError : true }],
        ["deleteRecord"],
        ["saveRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "failureMessage",      "Failed",                                      "Failure message captured"                                    ],
        ["base", "record.id",           "test",                                        "Has proper id : 'test'"                                      ],
        ["base", "record.vara",         "test",                                        "'vara' has correct value : 'test'"                           ],
        ["base", "record.tests.@.vara", ["test1", "test2", "test3", "test4", "test5"], "'tests' has right children with right 'vara' values"         ],
        ["base", "record.tests.0.varb", "test_update",                                 "'varb' of 1st child record has correct value : 'test_update'"],
        ["base", "record.tests.0.id",   "test1",                                       "id of 1st child record has correct value : 'test0'"          ],
      ]],
      ["restoreMockjaxSetting"],
    ],
  }],
});
