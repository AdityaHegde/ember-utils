mockjaxData = {
  test : {
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
    createUpdateData : {
      varc : "test_varc",
    },
    getAllAdditionalData : {
    },
    //modelClass : TestApp.Test,
  },

  testparent : {
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
    createUpdateData : {
    },
    getAllAdditionalData : {
    },
    //modelClass : TestApp.Testp,
  },
};

function checkTableRowElements(column, expected) {
  var rowEles = [];
  for(var i = 1; i <= expected.length; i++) {
    rowEles.push(Ember.Object.create({
      text : $(getCellByColumn(column, i)).text(),
    }));
  }
  checkElements(rowEles, "text", expected, 1);
}

function closeAlert(alert) {
  alert.set("switchAlert", false);
  var timer = alert.get("windowTimer");
  alert.set("windowTimer", null);
  Ember.run.cancel(timer);
}

function getColumnSelector(column, inputType) {
  return ".ember-view[data-column-name='"+column+"'] "+inputType;
}

function getCellByColumn(column, row, isHead) {
  return (isHead ? "th" : getRowByPos(row)) + ".ember-view[data-column-name='"+column+"']";
}

function getRowByPos(row) {
  return ".main-table tbody tr:nth-of-type("+row+") td";
}

TestCase.ArrayModifierTC = TestCase.TestCase.extend({
  initialize : function() {
    this.set("testData.arrayController", ArrayMod.ArrayModController.create({
      content : [
        Ember.Object.create({vara : "test1", varb : "test_1"}),
        Ember.Object.create({vara : "test5", varb : "test_1"}),
        Ember.Object.create({vara : "test2", varb : "test_2"}),
        Ember.Object.create({vara : "test4", varb : "test_4"}),
        Ember.Object.create({vara : "test6", varb : "test_2"}),
        Ember.Object.create({vara : "test3", varb : "test_1"}),
        Ember.Object.create({vara : "test8", varb : "test_3"}),
        Ember.Object.create({vara : "test7", varb : "test_1"}),
      ],
      unique_id : "test",
    }));
  },
});
Utils.addToHierarchy(TestCase.TestHierarchyMap, "arrayMod", TestCase.ArrayModifierTC, 0);

TestCase.TestSuit.create({
  suitName : "array-modifier",
  testCases : [{
    title : "sort - descending on varb and ascending on vara",
    type : "arrayMod",
    testData : {},
    testBlocks : [
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", "", ArrayMod.ArraySortModifier.create({ property : "varb", order : false, }), "push"],
          ["base", "arrayController.arrayMods", "", ArrayMod.ArraySortModifier.create({ property : "vara" }),                 "push"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test4", "test8", "test2", "test6", "test1", "test3", "test5", "test7"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test9", varb : "test_4" }),  "push"   ],
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test10", varb : "test_1" }), "unshift"],
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test80", varb : "test_1" }), "unshift"],
          ["base", "arrayController.content.[vara=test5]", "varb", "test_3"],
          ["base", "arrayController",                      "",     "",                                                        "remove" , "arrayController.content.[vara=test4]"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test9", "test5", "test8", "test2", "test6", "test1", "test10", "test3", "test7", "test80"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", 1, "", "removeAt"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test9", "test5", "test8", "test2", "test6", "test80", "test10", "test1", "test3", "test7"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", 0, "", "removeAt"],
        ]],
      ]],
      ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test80", "test10", "test1", "test5", "test2", "test6", "test3", "test8", "test7", "test9"]],
      ]],
    ],
  }, {
    type : "arrayMod",
    title : "search - on varb with 'test_1'",
    testData : {},
    testBlocks : [
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", "", ArrayMod.ArraySearchModifier.create({ property : "varb", searchString : "test_1" }), "push"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test1", "test3", "test5", "test7"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test9", varb : "test_1" }),  "push"],
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test10", varb : "test_2" }), "push"],
          ["base", "arrayController.content.[vara=test5]", "varb", "test_3"],
          ["base", "arrayController.content.[vara=test6]", "varb", "test_1"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test1", "test3", "test6", "test7", "test9"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods.0", "searchString", "test_2"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test2", "test10"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods.0", "property",     "vara"],
          ["base", "arrayController.arrayMods.0", "searchString", "test1"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test1", "test10"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods.0", "negate", true],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test5", "test2", "test4", "test6", "test3", "test8", "test7", "test9"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", 0, "", "removeAt"],
        ]],
      ]],
      ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test1", "test5", "test2", "test4", "test6", "test3", "test8", "test7", "test9", "test10"]],
      ]],
    ],
  }, {
    type : "arrayMod",
    title : "filter - on varb with tags 'test_2' and 'test_4'",
    testData : {},
    testBlocks : [
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", "", ArrayMod.ArrayTagSearchModifier.create({
            property : "varb",
            tags : [
              {label : "test_1", val : "test_1", checked : false},
              {label : "test_2", val : "test_2", checked : true},
              {label : "test_3", val : "test_3", checked : false},
              {label : "test_4", val : "test_4", checked : true},
            ],
          }), "push"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test2", "test4", "test6"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test9",  varb : "test_1" }), "push"],
          ["base", "arrayController",                      "",     Ember.Object.create({ vara : "test10", varb : "test_2" }), "push"],
          ["base", "arrayController.content.[vara=test5]", "varb", "test_2"],
          ["base", "arrayController.content.[vara=test6]", "varb", "test_1"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test2", "test4", "test5", "test10"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods.0.tags.1", "checked", false],
          ["base", "arrayController.arrayMods.0.tags.2", "checked", true],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test4", "test8"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods.0.tags.2", "negate",  true],
          ["base", "arrayController.arrayMods.0.tags.3", "checked", false],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value"
          ["base", "arrayController.@.vara", ["test4", "test1", "test5", "test2", "test6", "test3", "test7", "test9", "test10"]],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "arrayController.arrayMods", 0, "", "removeAt"],
        ]],
      ]],
      ["checkValues", [
        //"type", "path", "value"
        ["base", "arrayController.@.vara", ["test1", "test5", "test2", "test4", "test6", "test3", "test8", "test7", "test9", "test10"]],
      ]],
    ],
  }],
});

module("timer", {
  setup: function() {
  },
  teardown : function() {
    TestApp.reset();
  },
});


test("Timer - Sanity Test", function() {
  var runCount = 0, end = 0,
      d, timingWasAsExpected = true;
  Ember.run(function() {
    d = new Date();
    Timer.Timer.create({
      count : 5,
      timerCallback : function() {
        runCount++;
        timingWasAsExpected &= Math.round( ( new Date() - d ) / 10 ) * 10 === Timer.TIMERTIMEOUT;
        d = new Date();
      },
      endCallback : function() {
        end = 1;
      },
    });
    Ember.run.later(function() {}, 1500);
  });
  wait();
  andThen(function() {
    equal(runCount, 5, "Timer ran for 5 times!");
    equal(end, 1, "Timer endCallback was called");
    ok(timingWasAsExpected, "timerCallback was called at the right intervals");
  });
});

test("Timer - Different period.", function() {
  var runCount = 0, end = 0,
      d, timingWasAsExpected = true;
  Ember.run(function() {
    d = new Date();
    Timer.Timer.create({
      count : 3,
      timeout : 750,
      timerCallback : function() {
        runCount++;
        timingWasAsExpected &= Math.round( ( new Date() - d ) / 10 ) * 10 === 750;
        d = new Date();
      },
      endCallback : function() {
        end = 1;
      },
    });
    Ember.run.later(function() {}, 2500);
  });
  wait();
  andThen(function() {
    equal(runCount, 3, "Timer ran for 3 times!");
    equal(end, 1, "Timer endCallback was called");
    ok(timingWasAsExpected, "timerCallback was called at the right intervals");
  });
});

test("Async Que - Sanity test", function() {
  var run = false;
  Timer.addToQue("test-async").then(function() {
    run = true;
  });
  andThen(function() {
    ok(!run, "Callback not run yet");
  });
  Ember.run.later(function() {
    ok(run, "Callback ran after 500ms (aprox.)");
  }, 500);
});

test("test async que with same keys", function() {
  var queRunCount1st = 0, queRunCountTotal = 0;
  for(var i = 0; i < 5; i++) {
    Timer.addToQue("test-async", 200).then(function() {
      queRunCount1st++;
      queRunCountTotal++;
    });
  }
  Ember.run.later(function() {
    for(var i = 0; i < 5; i++) {
      Timer.addToQue("test-async", 200).then(function() {
        queRunCountTotal++;
      });
    }
  }, 250);
  wait();
  andThen(function() {
    equal(queRunCount1st, 1, "Ran async que for 5 times within 200ms, callback executed once");
    equal(queRunCountTotal, 2, "Ran async que for 5 times within 200ms after a 250ms wait from previous executions, callback excuted once, twice in total");
  });
});

test("test async que with different keys", function() {
  var queRunCount = 0;
  for(var i = 0; i < 5; i++) {
    Timer.addToQue("test-async-"+i, 200).then(function() {
      queRunCount++;
    });
  }
  wait();
  andThen(function() {
    equal(queRunCount, 5, "Ran async que for 5 times within 200ms with different keys, callback executed five times");
  });
});

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

define([
  "ember",
  "lib/ember-test-utils",
  "core/main",
], function(Ember, Utils) {

Utils.addToHierarchy(TestCase.TestHierarchyMap, "validateValue", TestCase.TestOperation.extend({
  run : function(testData) {
    var valid = testData.get("columnData.validation").validateValue(this.get("attr1"), testData.get("record"), this.get("attr4"));
    TestUtils.equal(valid[0], this.get("attr2"), "Validation result was as expected for "+this.get("attr1"));
    if(valid[0]) {
      equal(valid[1], this.get("attr3"), "Invalid message was as expected.");
    }
  },

  assertions : function() {
    return this.get("attr2") ? 2 : 1;
  }.property("attr2"),
}), 2);

TestCase.EmberTestSuit.create({
  suitName : "column-data",
  moduleFunction : "moduleForModel",
  param : "test",
  moduleOpts : {
    setup : function() {
      CrudAdapter.loadAdaptor(TestApp);
    },
    teardown : function() {
    },

    needs : ["model:testp", "model:test"],
  },

  testCases : [{
    title : "Sanity Test",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnDataGroup1", ColumnData.ColumnDataGroup.create({
          name : "test1",
          columns : [{
            name : "vara1",
          }, {
            name : "varb1",
          }],
        })],
        ["base", "", "columnDataGroup",  ColumnData.ColumnDataGroup.create({
          name : "test",
          columns : [{
            name : "vara",
            label : "VarA",
          }, {
            name : "varb",
            keyName : "varc",
            label : "VarB",
          }, {
            name : "vard",
            childColName : "vara1",
            childColGroupName : "test1",
          }, {
            name : "vare",
            childCol : {
              name : "varf",
            },
            childColGroup : {
              name : "test2",
              columns : [{
                name : "vara2",
              }, {
                name : "varb2",
              }],
            },
          }],
        })],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "columnDataGroup",                                        ColumnData.ColumnDataGroup,       "Instance of ColumnData.ColumnDataGroup was created"],
        ["base", "columnDataGroup.columns.0",                              ColumnData.ColumnData,            "Instance of ColumnData.ColumnData was created for columns"],
        ["base", "columnDataGroup.columns.@.name",                         ["vara", "varb", "vard", "vare"], "'name' of all columns are as expected"],
        ["base", "columnDataGroup.columns.@.key",                          ["vara", "varc", "vard", "vare"], "'key' of all columns are as expected"],
        ["base", "columnDataGroup.columns.2.childCol",                     ColumnData.ColumnData,            "Child col was created when referenced with 'childColName'"],
        ["base", "columnDataGroup.columns.2.childCol.name",                "vara1"],
        ["base", "columnDataGroup.columns.2.childColGroup",                ColumnData.ColumnDataGroup,       "Child col group was created when referenced with 'childColGroupName'"],
        ["base", "columnDataGroup.columns.2.childColGroup.name",           "test1"],
        ["base", "columnDataGroup.columns.2.childColGroup.columns.@.name", ["vara1", "varb1"],               "Child col group has the right names for columns"],
        ["base", "columnDataGroup.columns.3.childCol",                     ColumnData.ColumnData,            "Child col was created when an object was passed to 'childCol'"],
        ["base", "columnDataGroup.columns.3.childCol.name",                "varf"],
        ["base", "columnDataGroup.columns.3.childColGroup",                ColumnData.ColumnDataGroup,       "Child col group was created when an object was passed to 'childColGroup'"],
        ["base", "columnDataGroup.columns.3.childColGroup.name",           "test2"],
        ["base", "columnDataGroup.columns.3.childColGroup.columns.@.name", ["vara2", "varb2"],               "Child col group has the right names for columns"],
      ]],
    ],
  }, {
    title : "Validation tests - simple",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnData", ColumnData.ColumnData.create({
          name : "test1",
          validation : {
            validations : [
              {type : 0, invalidMessage : "Cant be empty"},
              {type : 1, regex : "^[a-z]*$", regexFlags : "i", negate : true, invalidMessage : "Failed Regex"},
            ],
          },
        })],
        ["base", "", "record",     Ember.Object.create()],
      ]],
      ["validateValue", null,  true,  "Cant be empty"],
      ["validateValue", "",    true,  "Cant be empty"],
      ["validateValue", 123,   true,  "Failed Regex"],
      ["validateValue", "a.b", true,  "Failed Regex"],
      ["validateValue", "abc", false, ""],
      ["validateValue", "ABC", false, ""],
    ],
  }, {
    title : "Validation tests - can be empty",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnData", ColumnData.ColumnData.create({
          name : "test1",
          validation : {
            validations : [
              {type : 1, regex : "^[a-z]+$", negate : true, invalidMessage : "Failed Regex"},
            ],
          },
        })],
        ["base", "", "record",     Ember.Object.create()],
      ]],
      ["validateValue", null,  false, ""],
      ["validateValue", "",    false, ""],
      ["validateValue", "abc", false, ""],
    ],
  }, {
    title : "Validation tests - csv",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnData", ColumnData.ColumnData.create({
          name : "test1",
          validation : {
            validations : [
              {type : 2, delimeter : ",", regex : "^[a-z]+$", negate : true, invalidMessage : "CSV validation failed."},
              {type : 3, delimeter : ",", invalidMessage : "Duplicates not allowed."},
            ],
          },
        })],
        ["base", "", "record",     Ember.Object.create()],
      ]],
      ["validateValue", "a,b.,c", true,  "CSV validation failed."],
      ["validateValue", "a,b,c",  false, ""],
      ["validateValue", "a,a,c",  true,  "Duplicates not allowed."],
    ],
  }, {
    title : "Validation tests - number",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnData", ColumnData.ColumnData.create({
          name : "test1",
          validation : {
            validations : [
              {type : 1, regex : "^[0-9]*$", negate : true, invalidMessage : "Can only be number"},
              {type : 5, minValue : 10, maxValue : 100, invalidMessage : "Should be between 10 and 100"},
            ],
          },
        })],
        ["base", "", "record",     Ember.Object.create()],
      ]],
      ["validateValue", undefined, false, ""],
      ["validateValue", "abc",     true,  "Can only be number"],
      ["validateValue", "1",       true,  "Should be between 10 and 100"],
      ["validateValue", "1000",    true,  "Should be between 10 and 100"],
      ["validateValue", "50",      false, ""],
    ],
  }, {
    title : "Validation tests - array duplicate check",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnData", ColumnData.ColumnData.create({
          name : "vara",
          validation : {
            validations : [
              {type : 0, invalidMessage : "Cant be empty"},
              {type : 1, regex : "^[a-z]*$", negate : true, invalidMessage : "Failed Regex"},
              {type : 4, duplicateCheckPath : "parentRecord.records", duplicateCheckKey : "vara", invalidMessage : "Should be unique across records"},
            ],
          },
        })],
        ["base", "",                  "precord",      Ember.Object.create({ records : [] })                           ],
        ["base", "precord.records",   "",             Ember.Object.create({ vara : "a" }),  "push"                    ],
        ["base", "precord.records",   "",             Ember.Object.create({ vara : "b" }),  "push"                    ],
        ["base", "precord.records",   "",             Ember.Object.create({ vara : "c" }),  "push"                    ],
        ["base", "precord.records.0", "parentRecord", "",                                   "",    "precord"          ],
        ["base", "precord.records.1", "parentRecord", "",                                   "",    "precord"          ],
        ["base", "precord.records.2", "parentRecord", "",                                   "",    "precord"          ],
        ["base", "",                  "record",       "",                                   "",    "precord.records.1"],
      ]],
      ["validateValue", undefined, true,  "Cant be empty"],
      ["validateValue", "a",       true,  "Should be unique across records"],
      ["validateValue", "b",       false, ""],
      ["validateValue", "c",       true,  "Should be unique across records"],
      ["validateValue", "d",       false, ""],
    ],
  }, {
    title : "Validation tests - array empty/not empty",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnData", ColumnData.ColumnData.create({
          name : "vara",
          validation : {
            validations : [
              {type : 0, invalidMessage : "Cant be empty"},
            ],
          },
        })],
        ["base", "", "record",    Ember.Object.create()],
      ]],
      ["validateValue", [],              true,  "Cant be empty"],
      ["validateValue", ["a", "b", "c"], false, ""],
    ],
  }],
});

});

moduleForComponent("alerts/alert-message", "alerts", {
  setup : function() {
  },
  teardown : function() {
  },
});

test("Sanity Test", function() {
  var component = this.subject(), ele = this.$();

  ok(ele.hasClass("alert alert-danger fade") && !ele.hasClass("in"), "Alert message has the right classes initially.");

  Ember.run(function() {
    component.set("message", "Test");
  });

  wait();
  andThen(function() {
    ok(ele.hasClass("alert alert-danger fade in"), "Alert message has the right class after message was shown.");
    equal(ele.find(".alert-message").text(), "Test", "Alert message was updated.");
  });
});

test("Clicking on close button", function() {
  var component = this.subject(), ele = this.$();

  Ember.run(function() {
    component.set("message", "Test");
  });

  wait();
  andThen(function() {
    click(ele.find("button.close"));
  });

  wait();
  andThen(function() {
    ok(ele.hasClass("alert alert-danger fade") && !ele.hasClass("in"), "Alert message has the right classes after closed.");
    ok(!component.get("showAlert"), "'showAlert' was set to false");
  });
});

test("Auto collapse after message change", function() {
  var component = this.subject(), ele = this.$(), d;

  Ember.run(function() {
    component.set("collapseTimeout", 250);
    component.set("message", "Test");
    d = new Date();
  });

  wait();
  andThen(function() {
    ok(new Date() - d >= 250, "Alert message closed after 250ms");
    ok(!component.get("showAlert"), "'showAlert' was set to false");

    component.set("collapseTimeout", 1000);
    component.set("message", "Test1");
    d = new Date();
  });

  wait();
  andThen(function() {
    ok(new Date() - d >= 1000, "Alert message closed after 1000ms");
    ok(!component.get("showAlert"), "'showAlert' was set to false");
  });
});
