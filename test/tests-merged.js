$.mockjaxSettings.logging = false;
$.mockjaxSettings.responseTime = 50;

var mockjaxSettings = {
  throwServerError : false,
  throwProcessError : 0,
  returnId : false,
  modelChangeMap : {
  },
},
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
},
urlPartsExtractRegex = new RegExp("^/(.*)/(.*?)$");

function getDataForModelType(settings, model, type) {
  var retData = {
    result : {
      status : mockjaxSettings.throwProcessError,
      message : mockjaxSettings.throwProcessError ? "Failed" : "Success",
    }
  }, parts = settings.url.match(urlPartsExtractRegex),
  params = Ember.typeOf(settings.data) === "string" ? JSON.parse(settings.data.replace(/^data=/, "")) : settings.data;
  model = model || (parts && parts[1]);
  type = type || (parts && parts[2]);
  if(mockjaxSettings.modelChangeMap[model]) {
    model = mockjaxSettings.modelChangeMap[model];
  }
  mockjaxData.lastPassedData = {
    model : model,
    type : type,
    params : params,
  };
  if(model && type) {
    var modelData = mockjaxData[model];
    if(type === "getAll") {
      retData.result.data = modelData.data;
      if(modelData.getAllAdditionalData) {
        Utils.merge(retData.result, modelData.getAllAdditionalData);
      }
    }
    else if(type === "get") {
      retData.result.data = modelData.data.findBy("id", CrudAdapter.getId(params, modelData.modelClass));
      if(modelData.getAdditionalData) {
        Utils.merge(retData.result, modelData.getAdditionalData);
      }
    }
    else if(type === "delete") {
      retData.result.data = {
        id : CrudAdapter.getId(params, modelData.modelClass),
      };
    }
  }
  return retData;
}

$.mockjax({
  url: /\/.*?\/.*?/,
  type : "GET",
  response : function(settings) {
    this.responseText = getDataForModelType(settings);
  },
});

$.mockjax({
  url: /\/.*?\/.*?/,
  type : "POST",
  response : function(settings) {
    //console.log(settings.data);
    if(mockjaxSettings.throwServerError) {
      this.status = 500;
      this.statusText = "Server Error";
    }
    else {
      var retData = {
        result : {
          status : mockjaxSettings.throwProcessError,
          message : mockjaxSettings.throwProcessError ? "Failed" : "Success",
        }
      }, parts = settings.url.match(urlPartsExtractRegex),
      model = parts && parts[1],
      type = parts && parts[2],
      params = Ember.typeOf(settings.data) === "string" ? JSON.parse(settings.data) : settings.data,
      modelData = model && mockjaxData[model];
      mockjaxData.lastPassedData = {
        model : model,
        type : type,
        params : params,
      };
      retData.result.data = {
        id : type === "update" ? CrudAdapter.getId(params, modelData.modelClass) : null,
      };
      if(modelData.createUpdateData) {
        Utils.merge(retData.result.data, modelData.createUpdateData);
      }
      this.responseText = retData;
    }
  },
});

function checkElements(arrayController, key, expected, exactCheck) {
  equal(arrayController.get("length"), expected.length, expected.length+" elements are there");
  for(var i = 0; i < expected.length; i++) {
    if(exactCheck) {
      var arrayObj = arrayController.objectAt(i);
      equal(arrayObj.get(key), expected[i], "element at index "+i+" has "+key+" = "+expected[i]);
    }
    else {
      var found = arrayController.findBy(key, expected[i]);
      ok(found, "element with "+key+" = "+expected[i]+" is present in arrangedContent");
    }
  }
}

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

function getCurDate(offset) {
  var d = new Date();
  if(offset) {
    d = new Date(d.getTime() + offset*1000);
  }
  return d.toLocaleDateString()+" "+d.toTimeString();
};

function setupStoreAndReturnIt(container) {
  if (DS._setupContainer) {
    DS._setupContainer(container);
  } else {
    container.register('store:main', DS.Store);
  }

  container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  return container.lookup('store:main');
}

function setupAppForTesting(app, container) {
  Ember.run(function() {
    app.setupEventDispatcher();
    app.resolve(app);
    container.register('view:select', Ember.Select);
    container.register('view:checkbox', Ember.Checkbox);
  });
}

//Markup needed for testing
//TODO : find a way to add thru karma config
$("body").append("" +
  "<div id='qunit-main-container'>" +
    "<h1 id='qunit-header'>Tests</h1>" +
    "<h2 id='qunit-banner'></h2>" +
    "<div id='qunit-testrunner-toolbar'></div>" +
    "<h2 id='qunit-userAgent'></h2>" +
    "<ol id='qunit-tests'></ol>" +
    "<div id='qunit-fixture'></div>" +
  "</div>" +
  "<div id='ember-testing'></div>" +
"");

TestApp = Ember.Application.create({
  rootElement : "#ember-testing",
});

var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;

QUnit.config.reorder = false;
QUnit.config.autostart = false;
//workaroud for qunit not reporting toatal tests
var testCount = 0;
var qunitTest = QUnit.test;
QUnit.test = window.test = function () {
  testCount += 1;
  qunitTest.apply(this, arguments);
};
QUnit.begin(function (args) {
  args.totalTests = testCount;
});

emq.globalize();
TestApp.setupForTesting();
//TestApp.rootElement = '#ember-testing';
Ember.Test.registerAsyncHelper("fillFormElement",
  function(app, column, inputType, text, context) {
    return fillIn(getColumnSelector(column, inputType), text, context);
  }
);
Ember.Test.registerAsyncHelper("selectFromElement",
  function(app, column, value, context) {
    var ele = findWithAssert(getColumnSelector(column, "select"), context);
    if(ele) {
      Ember.run(function() {
        var op = ele.find("option[value='"+value+"']");
        if(op[0]) op[0].click();
      });
    }
    return wait();
  }
);

Ember.Test.registerAsyncHelper("scrollHelper",
  function(app, element, scrollVal, context) {
    Ember.run(function() {
      element.scrollTop(scrollVal).change();
    });
  }
);
TestApp.injectTestHelpers();
setResolver(Ember.DefaultResolver.create({ namespace: TestApp }))

module("timer.js", {
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

module("array-modifier.js", {
  teardown : function() {
    TestApp.reset();
  },
});

function getTestController() {
  return ArrayMod.ArrayModController.create({
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
  });
}

test("sort - descending on varb and ascending on vara", function() {
  var arrayController = getTestController(),
  arrangedContent = arrayController.get("arrangedContent"),
  sortMod1 = ArrayMod.ArraySortModifier.create({
    property : "varb",
    order : false,
  }),
  sortMod2 = ArrayMod.ArraySortModifier.create({
    property : "vara",
  });
  Ember.run(function() {
    arrayController.get("arrayMods").pushObjects([sortMod1, sortMod2]);
  });

  wait();

  andThen(function() {
    var expected = ["test4", "test8", "test2", "test6", "test1", "test3", "test5", "test7"];
    checkElements(arrayController, "vara", expected, 1);
  });

  andThen(function() {
    Ember.run(function() {
      arrayController.pushObject(Ember.Object.create({
        vara : "test9",
        varb : "test_4",
      }));
      arrayController.unshiftObject(Ember.Object.create({
        vara : "test10",
        varb : "test_1",
      }));
      arrayController.unshiftObject(Ember.Object.create({
        //just to put it at the end
        vara : "test80",
        varb : "test_1",
      }));
      var test5 = arrayController.get("content").findBy("vara", "test5");
      test5.set("varb", "test_3");
      arrayController.removeObject(arrayController.get("content").findBy("vara", "test4"));
    });
  });

  wait();

  andThen(function() {
    var expected = ["test9", "test5", "test8", "test2", "test6", "test1", "test10", "test3", "test7", "test80"];
    checkElements(arrayController, "vara",  expected, 1);
    arrayController.get("arrayMods").removeAt(1);
  });

  wait();

  andThen(function() {
    checkElements(arrayController, "vara",  ["test9", "test5", "test8", "test2", "test6", "test80", "test10", "test1", "test3", "test7"], 1);
    arrayController.get("arrayMods").removeAt(0);
  });

  wait();

  andThen(function() {
    checkElements(arrayController, "vara",  ["test80", "test10", "test1", "test5", "test2", "test6", "test3", "test8", "test7", "test9"], 1);
  });
});

test("search - on varb with 'test_1'", function() {
  var arrayController = getTestController(),
  arrangedContent = arrayController.get("arrangedContent"),
  searchMod = ArrayMod.ArraySearchModifier.create({
    property : "varb",
    searchString : "test_1",
  });
  Ember.run(function() {
    arrayController.get("arrayMods").pushObject(searchMod);
  });

  wait();

  andThen(function() {
    var expected = ["test1", "test3", "test5", "test7"];
    checkElements(arrayController, "vara", expected);
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      arrayController.pushObject(Ember.Object.create({
        vara : "test9",
        varb : "test_1",
      }));
      arrayController.pushObject(Ember.Object.create({
        vara : "test10",
        varb : "test_2",
      }));
      var test5 = arrayController.get("content").findBy("vara", "test5");
      test5.set("varb", "test_3");
      var test6 = arrayController.get("content").findBy("vara", "test6");
      test6.set("varb", "test_1");
    });
  });

  wait();

  andThen(function() {
    var expected = ["test1", "test3", "test6", "test7", "test9"];
    checkElements(arrayController, "vara", expected);
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      searchMod.set("searchString", "test_2");
    });
  });

  wait();

  andThen(function() {
    var expected = ["test2", "test10"];
    checkElements(arrayController, "vara", expected);
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      searchMod.set("property", "vara");
      searchMod.set("searchString", "test1");
    });
  });

  wait();

  andThen(function() {
    var expected = ["test1", "test10"];
    checkElements(arrayController, "vara", expected);
    arrayController.get("arrayMods").removeAt(0);
  });

  wait();

  andThen(function() {
    checkElements(arrayController, "vara",  ["test1", "test5", "test2", "test4", "test6", "test3", "test8", "test7", "test9", "test10"], 1);
  });
});

test("filter - on varb with tags 'test_2' and 'test_4'", function() {
  var arrayController = getTestController(),
  arrangedContent = arrayController.get("arrangedContent"),
  filterMod = ArrayMod.ArrayTagSearchModifier.create({
    property : "varb",
    tags : [
      {label : "test_1", val : "test_1", checked : false},
      {label : "test_2", val : "test_2", checked : true},
      {label : "test_3", val : "test_3", checked : false},
      {label : "test_4", val : "test_4", checked : true},
    ],
  });
  arrayController.get("arrayMods").pushObject(filterMod);

  wait();

  andThen(function() {
    var expected = ["test2", "test4", "test6"];
    checkElements(arrayController, "vara", expected);
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      arrayController.pushObject(Ember.Object.create({
        vara : "test9",
        varb : "test_1",
      }));
      arrayController.pushObject(Ember.Object.create({
        vara : "test10",
        varb : "test_2",
      }));
      var test5 = arrayController.get("content").findBy("vara", "test5");
      test5.set("varb", "test_2");
      var test6 = arrayController.get("content").findBy("vara", "test6");
      test6.set("varb", "test_1");
    });
  });

  wait();

  andThen(function() {
    var expected = ["test2", "test4", "test5", "test10"];
    checkElements(arrayController, "vara", expected);
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      filterMod.get("tags")[1].set("checked", false);
      filterMod.get("tags")[2].set("checked", true);
    });
  });

  wait();

  andThen(function() {
    var expected = ["test4", "test8"];
    checkElements(arrayController, "vara", expected);
    arrayController.get("arrayMods").removeAt(0);
  });

  wait();

  andThen(function() {
    checkElements(arrayController, "vara",  ["test1", "test5", "test2", "test4", "test6", "test3", "test8", "test7", "test9", "test10"], 1);
  });
});

module("columndata.js", {
  setup: function() {
  },
  teardown : function() {
    TestApp.reset();
  },
});

test("Sanity tests", function() {
  var columnData = ColumnData.ColumnData.create({
    name : "vara",
    keyName : "varb",
    label : "Vara",
    placeholder : "_Vara",
    validation : {
      validations : [
        {type : 0},
        {type : 1, regex : "^([a-zA-Z0-9](?:[ \\t]*\\,[ \\t]*)?)+$", negate : true, invalidMessage : "Can only be alphanumeric"},
        {type : 2, delimeter : ",", regex : "^[a-zA-Z0-9]*$", negate : true, invalidMessage : "Can only be alphanumeric"},
        {type : 3, delimeter : ",", invalidMessage : "Cannot have duplicates"},
      ],
    },
  }), record = Ember.Object.create();
  andThen(function() {
    equal(columnData.get("key"), "varb", "Has proper 'key' : 'varb'");
    ok(columnData.get("validation.mandatory"), "Has proper 'mandatory' : 'true'");
  });
  Ember.run(function() {
    columnData.set("keyName", null);
    columnData.get("validation.validations").shiftObject();
  });
  andThen(function() {
    equal(columnData.get("key"), "vara", "Has proper 'key' : 'vara'");
    ok(!columnData.get("validation.mandatory"), "Has proper 'mandatory' : 'false'");
  });
});

test("Validation tests - simple", function() {
  var columnData = ColumnData.ColumnData.create({
    name : "vara",
    label : "Vara",
    validation : {
      validations : [
        {type : 0},
        {type : 1, regex : "^([a-zA-Z0-9](?:[ \\t]*\\,[ \\t]*)?)+$", negate : true, invalidMessage : "Can only be alphanumeric"},
        {type : 2, delimeter : ",", regex : "^[a-zA-Z0-9]*$", negate : true, invalidMessage : "Can only be alphanumeric"},
        {type : 3, delimeter : ",", invalidMessage : "Cannot have duplicates"},
      ],
    },
  }), record = Ember.Object.create(),
  validationObj = columnData.get("validation"),
  validation11, validation12, validation13, validation14, validation15;
  Ember.run(function() {
    validation11 = validationObj.validateValue("", record);
    validation12 = validationObj.validateValue("abc$", record);
    validation13 = validationObj.validateValue("a,a,b,c", record);
    validation14 = validationObj.validateValue("a,b,c", record);
    validation15 = validationObj.validateValue("a*b", record, [
      ColumnData.RegexValidation.create({
        type : 1,
        regex : "[a-zA-Z0-9\*]*",
        negate : true,
        invalidMessage : "",
      }),
    ]);
  });
  andThen(function() {
    ok(validation11[0], "Validation failed for empty value");
    ok(validation12[0], "Validation failed for value with '$', character not allowed");
    equal(validation12[1], "Can only be alphanumeric", "Invalid message has the proper value");
    ok(validation13[0], "Validation failed for value with duplicates");
    equal(validation13[1], "Cannot have duplicates", "Invalid message has the proper value");
    ok(!validation14[0], "Validation passed for valid value");
    ok(!validation15[0], "Validation passed for valid value with overriden validation");
  });
});

test("Validation tests - number", function() {
  var record = Ember.Object.create(),
  columnDataNum = ColumnData.ColumnData.create({
    name : "varb",
    label : "Varb",
    validation : {
      validations : [
        {type : 1, regex : "^[0-9]*$", negate : true, invalidMessage : "Can only be number"},
        {type : 5, minValue : 10, maxValue : 100, invalidMessage : "Should be between 10 and 100"},
      ],
    },
  }),
  validationObj = columnDataNum.get("validation"),
  validation21, validation22, validation23, validation24;
  Ember.run(function() {
    validation21 = validationObj.validateValue(undefined, record);
    validation22 = validationObj.validateValue("1", record);
    validation23 = validationObj.validateValue("1000", record);
    validation24 = validationObj.validateValue("50", record);
  });
  andThen(function() {
    ok(!validation21[0], "Validation passed for empty value");
    ok(validation22[0], "Validation failed for 1 : not within 10 and 100");
    equal(validation22[1], "Should be between 10 and 100", "Invalid message has the proper value");
    ok(validation23[0], "Validation failed for 1000 : not within 10 and 100");
    equal(validation23[1], "Should be between 10 and 100", "Invalid message has the proper value");
    ok(!validation24[0], "Validation passed for 50 : within 10 and 100");
  });
});

test("Validation tests - array", function() {
  var columnDataDup = ColumnData.ColumnData.create({
    name : "varc",
    label : "Varc",
    validation : {
      validations : [
        {type : 0},
        {type : 1, regex : "^[a-zA-Z0-9]*$", negate : true, invalidMessage : "Can only be alphanumeric"},
        {type : 4, duplicateCheckPath : "parentRecord.records", duplicateCheckKey : "varc", invalidMessage : "Should be unique across records"},
      ],
    },
  }),
  columnDataArr = ColumnData.ColumnData.create({
    name : "records",
    label : "records",
    validation : {
      validations : [
        {type : 0},
      ],
    },
  }),
  validationObjDup = columnDataDup.get("validation"),
  validationObjArr = columnDataArr.get("validation"),
  rec1 = Ember.Object.create({varc : "a"}),
  rec2 = Ember.Object.create({varc : "b"}),
  rec3 = Ember.Object.create({varc : "c"}),
  parentRecord = Ember.Object.create({records : [rec1, rec2, rec3]}),
  validation31, validation32, validation33, validation34;
  rec1.set("parentRecord", parentRecord);
  rec2.set("parentRecord", parentRecord);
  rec3.set("parentRecord", parentRecord);
  Ember.run(function() {
    validation31 = validationObjDup.validateValue("b", rec1);
    validation32 = validationObjDup.validateValue("a", rec1);

    validation33 = validationObjArr.validateValue([], parentRecord);
    validation34 = validationObjArr.validateValue(parentRecord.get("records"), parentRecord);
  });
  andThen(function() {
    ok(validation31[0], "Validation failed for 'b' : already present in rec2");
    equal(validation31[1], "Should be unique across records", "Invalid message has the proper value");
    ok(!validation32[0], "Validation passed for 'a' : is unique");

    ok(validation33[0], "Validation failed for empty array");
    ok(!validation34[0], "Validaiton passed for non empty array");
  });
});

test("Deep columns", function() {
  var columnDataBack = ColumnData.ColumnDataMap;
  ColumnData.ColumnDataGroup.create({
    name : "record",
    columns : [
      {
        name : "varb",
        childColName : "doesnt-exist",
      },
      {
        name : "varc",
      },
    ],
  });
  ColumnData.ColumnData.create({
    name : "vara",
    childColGroupName : "record",
  });
  var record = Ember.Object.create(),
  columnDataArr = ColumnData.ColumnData.create({
    name : "records",
    label : "records",
    childColName : "vara",
  });
  andThen(function() {
    var deepChildColGroup = columnDataArr.get("childCol.childColGroup");
    equal(columnDataArr.get("childCol.name"), "vara", "Child col was successfully extracted");
    equal(deepChildColGroup.get("columns.length"), 2, "Child col group were successfully extracted");
    ok(Ember.isEmpty(deepChildColGroup.get("columns")[0].get("childColGroup")), "Child col group for childColGroupName that is not present is not extracted");
    ColumnData.ColumnDataMap = columnDataBack;
  });
});
