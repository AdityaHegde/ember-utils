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
  suitName : "crud-adaptor hasMany record",
  moduleFunction : "moduleForModel",
  param : "testp",
  moduleOpts : {
    setup : function() {
      CrudAdapter.loadAdaptor(TestApp);
    },
    teardown : function() {
    },

    needs : ["model:test"],
  },

  testCases : [{
    title : "Create Record",
    type : "crudTestCase",
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
    title : "Create Record with server error",
    type : "crudTestCase",
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
    title : "Create Record with server processing error",
    type : "crudTestCase",
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
    type : "crudTestCase",
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
    title : "Update Record with server error",
    type : "crudTestCase",
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
    title : "Update Record with server process error",
    type : "crudTestCase",
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
    title : "Delete Record with server error",
    type : "crudTestCase",
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
    title : "Delete Record with server process error",
    type : "crudTestCase",
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
  }, {
    title : "Rollbak Record",
    type : "crudTestCase",
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
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.tests.0.varb", "test_update", "'varb' is updated to 'test_update'"],
        ]],
        ["rollbackRecord"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.tests.0.varb", "test_varb", "'varb' of 1st child record has rollbacked value : 'test_varb'"],
      ]],
    ],
  }],
});

};

});
