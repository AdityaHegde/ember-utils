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

/*test("Sanity tests", function() {
  var columnData = ColumnData.ColumnData.create({
    name : "vara",
    keyName : "varb",
    label : "Vara",
    placeholder : "_Vara",
    validations : [
      {type : 0},
      {type : 1, regex : "^([a-zA-Z0-9](?:[ \\t]*\\,[ \\t]*)?)+$", negate : true, invalidMessage : "Can only be alphanumeric"},
      {type : 2, delimeter : ",", regex : "^[a-zA-Z0-9]*$", negate : true, invalidMessage : "Can only be alphanumeric"},
      {type : 3, delimeter : ",", invalidMessage : "Cannot have duplicates"},
    ],
  }), record = Ember.Object.create();
  andThen(function() {
    equal(columnData.get("key"), "varb", "Has proper 'key' : 'varb'");
    equal(columnData.get("placeholderActual"), "_Vara", "Has proper 'placeholderActual' : '_Vara'");
    ok(columnData.get("mandatory"), "Has proper 'mandatory' : 'true'");
  });
  Ember.run(function() {
    columnData.set("keyName", null);
    columnData.set("placeholder", null);
    columnData.get("validations").shiftObject();
  });
  andThen(function() {
    equal(columnData.get("key"), "vara", "Has proper 'key' : 'vara'");
    equal(columnData.get("placeholderActual"), "Vara", "Has proper 'placeholderActual' : 'Vara'");
    ok(!columnData.get("mandatory"), "Has proper 'mandatory' : 'false'");
  });
});*/

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

moduleFor("view:form/form", "form.js", {
  setup : function() {
    setupAppForTesting(TestApp, this.container);
  },
  teardown : function() {
    TestApp.reset();
  },
  needs : ['model:test', 'model:testp', 'view:form/textInput', 'view:form/multiInput', 'view:form/radioInput'],
});

test("Check propagation of text from text field to record", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "Init",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
        validations : [
          {type : 0},
          {type : 1, regex : "^[0-9a-zA-Z \\.\\-_]{1,50}$", negate : true, invalidMessage : "Vara cannot have special Characters"},
        ],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "Init", "Value of vara is 'Init' intially");
  });
  fillFormElement("vara", "input", "From DOM");
  wait();
  andThen(function() {
    equal(record.get("vara"), "From DOM", "Value of vara is 'From DOM' after the input was filled");
    form.destroy();
  });
});

test("Check that record becomes invalid if invalid text is entered", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "Invalid#",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
        validations : [
          {type : 0},
          {type : 1, regex : "^[0-9a-zA-Z \\.\\-_]{1,50}$", negate : true, invalidMessage : "Vara cannot have special Characters"},
        ],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "Invalid#", "Value of vara is 'Invalid#' intially");
    ok(record.get("validationFailed"), "Record's 'validationFailed' is true");
    ok(record._validation.vara, "'vara' column is invalid");
  });
  fillFormElement("vara", "input", "Valid");
  wait();
  andThen(function() {
    equal(record.get("vara"), "Valid", "Value of vara is 'Valid'");
    ok(!record.get("validationFailed"), "Record's 'validationFailed' is false");
    form.destroy();
  });
});

test("Test static select component", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "staticSelect",
        label : "Vara",
        validations : [
          {type : 0},
        ],
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
        prompt : "Select",
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  //TODO : click on the option instead of setting value
  fillFormElement("vara", "select", "v1");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "Value of vara is 'v1', after selecting 'l1'");
    form.destroy();
  });
});

test("Test dynamic select component", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "v0",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "dynamicSelect",
        label : "Vara",
        dataPath : "TestApp.BaseDataObj.data",
        dataValCol : "data_val",
        dataLabelCol : "data_label",
        validations : [
          {type : 0},
        ],
        prompt : "Select",
      }),
    ];
    Ember.set("TestApp.BaseDataObj.data", [Ember.Object.create({
      data_val : "v0",
      data_label : "l0",
    })]);
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  //TODO : click on the option instead of setting value
  fillFormElement("vara", "select", "v0");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v0", "Value of vara is 'v0', after selecting 'l0'");
  });
  Ember.run(function() {
    Ember.get("TestApp.BaseDataObj.data").pushObject(Ember.Object.create({
      data_val : "v1",
      data_label : "l1",
    }));
  });
  wait();
  andThen(function() {
    equal($(".ember-view[data-column-name='vara'] option").length, 3, "v1-l1 option was added to select");
  });
  fillFormElement("vara", "select", "v1");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "Value of vara is 'v1', after selecting 'l1'");
    form.destroy();
  });
});

test("Test dynamic select component with multi-select", function() {
  var form = this.subject(), record, columnData,
      store = setupStoreAndReturnIt(this.container);
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
      varb : "test_varb",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "tests",
        type : "dynamicSelect",
        label : "Tests",
        dataPath : "TestApp.BaseDataObj.data",
        dataValCol : "data_val",
        dataLabelCol : "data_label",
        validations : [
          {type : 0},
        ],
        multiple : "multiple",
        arrayCol : "vara",
        arrayType : "test",
        copyAttrs : {
          varb : "varb",
        },
        staticAttrs : {
          varc : "varc_static",
        },
        valAttrs : {
          label : "vard",
        },
        eachValidations : [
          {type : 0},
        ],
      }),
    ];
    Ember.set("TestApp.BaseDataObj.data", [Ember.Object.create({
      data_val : "v0",
      data_label : "l0",
    }), Ember.Object.create({
      data_val : "v1",
      data_label : "l1",
    }), Ember.Object.create({
      data_val : "v2",
      data_label : "l3",
    })]);
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  fillFormElement("tests", "select", ["v0", "v1"]);
  wait();
  andThen(function() {
    var tests = record.get("tests"), fst = tests.objectAt(0), snd = tests.objectAt(1);
    equal(fst.get("vara"), "v0", "'vara' of 1st element is 'v0'");
    equal(fst.get("varb"), "test_varb", "'varb' of 1st element is 'test_varb' copied from 'record'");
    equal(fst.get("varc"), "varc_static", "'varc' of 1st element is 'varc_static' assigned a static value");
    equal(fst.get("vard"), "l0", "'vard' of 1st element is 'l0' copied from selected value from dynamic select");
    equal(snd.get("vara"), "v1", "'vara' of 2nd element is 'v1'");
    equal(snd.get("varb"), "test_varb", "'varb' of 2nd element is 'test_varb' copied from 'record'");
    equal(snd.get("varc"), "varc_static", "'varc' of 2nd element is 'varc_static' assigned a static value");
    equal(snd.get("vard"), "l1", "'vard' of 2nd element is 'l1' copied from selected value from dynamic select");
    form.destroy();
  });
});

test("Test csv data", function() {
  var form = this.subject(), record, columnData,
      store = setupStoreAndReturnIt(this.container);
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
      varb : "test_varb",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "tests",
        type : "csvData",
        label : "Tests",
        arrayCol : "vara",
        arrayType : "test",
        btnLabel : "Upload File",
        splitRegex : "\\s*[,\\n\\r]\\s*",
        accept : ".csv, .txt,text/csv",
        rows : "5",
        cols : "100",
        method : "ReadFileAsText",
        entityPlural : "tests",
        copyAttrs : {
          varb : "varb",
        },
        staticAttrs : {
          varc : "varc_static",
        },
        valAttrs : {
          label : "vard",
        },
        eachValidations : [
          {type : 0},
        ],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  fillFormElement("tests", "textarea", "test1, test2, test3, test4, test5");
  wait();
  andThen(function() {
    var tests = record.get("tests");
    checkElements(tests, "vara", ["test1", "test2", "test3", "test4", "test5"], 1);
  });
  wait();
  fillFormElement("tests", "textarea", "test6, test7, test8, test9, test10");
  wait();
  andThen(function() {
    var tests = record.get("tests");
    checkElements(tests, "vara", ["test6", "test7", "test8", "test9", "test10"], 1);
    checkElements(tests, "varb", ["test_varb", "test_varb", "test_varb", "test_varb", "test_varb"], 1);
    checkElements(tests, "varc", ["varc_static", "varc_static", "varc_static", "varc_static", "varc_static"], 1);
  });
  wait();
  fillFormElement("tests", "textarea", "test11, test12");
  wait();
  andThen(function() {
    var tests = record.get("tests");
    checkElements(tests, "vara", ["test11", "test12"], 1);
    form.destroy();
  });
});

test("Test radio buttons component", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "groupRadioButton",
        label : "Vara",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  click(getColumnSelector("vara", "input")+"[value='v1']");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "Value of vara is 'v1', after clicking 'l1' radio button");
  });
  click(getColumnSelector("vara", "input")+"[value='v2']");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v2", "Value of vara is 'v2', after clicking 'l2' radio button");
    form.destroy();
  });
});

test("Test group checkboxes", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "v1,v3",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "groupCheckBox",
        label : "Vara",
        checkList : [
          { checkboxLabel : "l0", id : "v0", checked : false },
          { checkboxLabel : "l1", id : "v1", checked : true },
          { checkboxLabel : "l2", id : "v2", checked : false },
          { checkboxLabel : "l3", id : "v3", checked : true },
          { checkboxLabel : "l4", id : "v4", checked : false },
        ],
        displayInline : true,
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1,v3", "Value of vara is initially 'v1,v3'");
  });
  click($(getColumnSelector("vara", "input"))[1]);
  click($(getColumnSelector("vara", "input"))[2]);
  wait();
  andThen(function() {
    equal(record.get("vara"), "v2,v3", "Value of vara is 'v2,v3', after checking 'v2' and unchecking 'v1'");
    form.destroy();
  });
});

/*test("Test confirm change component", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "test",
      varb : "v1",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "groupRadioButton",
        label : "Varb",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
        ],
      }),
      ColumnData.ColumnData.create({
        name : "confirmChangeTest",
        type : "confirmChange",
        confirmCol : "varb",
        confirmValueCol : "vara",
        confirmChangeValue : "v0",
        disableForCols : [
          {name : "varb", value : "v0", enable : true},
        ],
        listenForCols : ['vara', 'varb'],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  click(getColumnSelector("varb", "input")+"[value='v0']");
  wait();
  andThen(function() {
    fillFormElement("confirmChangeTest", "input", "test_not_equal");
  });
  wait();
  andThen(function() {
    ok($(getColumnSelector("confirmChangeTest", "button.btn-primary")).attr("disabled"), "Confirm button disabled");
    equal(record.get("varb"), "v0", "Value of 'varb' is 'v0'");
    ok(record._validation.confirmChangeTest, "Validation of 'confirmChangeTest' has failed");
  });

  fillFormElement("confirmChangeTest", "input", "test");
  wait();
  andThen(function() {
    ok(!$(getColumnSelector("confirmChangeTest", "button.btn-primary")).attr("disabled"), "Confirm button enabled");
  });

  click(getColumnSelector("confirmChangeTest", "button.btn-default"));
  wait();
  andThen(function() {
    equal(record.get("varb"), "v1", "Value of 'varb' is reverted to 'v1'");
  });

  click(getColumnSelector("varb", "input")+"[value='v0']");
  wait();
  fillFormElement("vara", "input", "test_changed");
  fillFormElement("confirmChangeTest", "input", "test");
  wait();
  andThen(function() {
    equal(record.get("vara"), "test_changed", "Value of 'vara' is 'test_changed'");
    ok($(getColumnSelector("confirmChangeTest", "button.btn-primary")).attr("disabled"), "Confirm button disabled as 'vara' is now 'test_changed'");
  });

  fillFormElement("confirmChangeTest", "input", "test_changed");
  wait();
  andThen(function() {
    ok(!$(getColumnSelector("confirmChangeTest", "button.btn-primary")).attr("disabled"), "Confirm button enabled");
  });

  click(getColumnSelector("confirmChangeTest", "button.btn-primary"));
  wait();
  andThen(function() {
    equal(record.get("varb"), "v0", "Value of 'varb' is reverted to 'v0'");
    ok(!record._validation.confirmChangeTest, "Validation of 'confirmChangeTest' has passed");
    form.destroy();
  });
});*/

test("Test dependent columns", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "v0",
      varb : "",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "staticSelect",
        label : "Vara",
        validations : [
          {type : 0},
        ],
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
        prompt : "Select",
      }),
      ColumnData.ColumnData.create({
        name : "varb_input",
        keyName : "varb",
        type : "textInput",
        label : "Varb",
        disableForCols : [
          {name : "vara", value : "v0", enable : true},
        ],
        listenForCols : ['vara'],
      }),
      ColumnData.ColumnData.create({
        name : "varb_select",
        keyName : "varb",
        type : "staticSelect",
        label : "Varb",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
        disableForCols : [
          {name : "vara", value : "v1", enable : true},
        ],
        listenForCols : ['vara'],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  //TODO : click on the option instead of setting value
  fillFormElement("vara", "select", "v0");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v0", "Value of vara is 'v0', after selecting 'l0'");
    ok(!form._childViews[1].get("disabled"), "2nd column data is enabled");
    ok(form._childViews[2].get("disabled"), "3nd column data is disabled");
  });
  fillFormElement("varb_input", "input", "v0");
  wait();
  andThen(function() {
    equal(record.get("varb"), "v0", "Value of varb is 'v0'");
  });
  fillFormElement("vara", "select", "v1");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "Value of vara is 'v1', after selecting 'l1'");
    ok(form._childViews[1].get("disabled"), "2nd column data is disabled");
    ok(!form._childViews[2].get("disabled"), "3nd column data is enabled");
  });
  fillFormElement("varb_select", "select", "v1");
  wait();
  andThen(function() {
    equal(record.get("varb"), "v1", "Value of varb is 'v1'");
  });
  fillFormElement("vara", "select", "v2");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v2", "Value of vara is 'v2', after selecting 'l2'");
    equal(record.get("varb"), "v1", "Value of varb is still 'v1'");
    form.destroy();
  });
});

test("Dynamic changes to record", function() {
  var form = this.subject(), record, columnData,
      formElement,
      store = setupStoreAndReturnIt(this.container);
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
        removeOnEdit : true,
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "Varb",
        removeOnNew : true,
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    formElement = $(form.get("element"));
    equal(formElement.find(getColumnSelector("vara", "input")).length, 1, "input for vara is present");
    equal(formElement.find(getColumnSelector("varb", "input")).length, 0, "input for varb is not present");
  });
  wait();
  andThen(function() {
    CrudAdapter.saveRecord(record, TestApp.Test);
  });
  wait();
  andThen(function() {
    equal(formElement.find(getColumnSelector("vara", "input")).length, 0, "input for vara is removed");
    equal(formElement.find(getColumnSelector("varb", "input")).length, 1, "input for varb is added");
  });
  wait();
  andThen(function() {
    form.destroy();
  });
});

test("Dynamic changes to column", function() {
  var form = this.subject(), record, columnData,
      formElement;
  Ember.run(function() {
    record = Ember.Object.create();
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      formElement = $(form.get("element"));
      columnData.pushObject(ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }));
      columnData.replace(0, 1, [ColumnData.ColumnData.create({
        name : "vara",
        type : "staticSelect",
        label : "VarA",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
      })]);
    });
  });
  wait();
  andThen(function() {
    equal(formElement.find(getColumnSelector("vara", "input")).length, 0, "input for vara was removed");
    fillFormElement("vara", "select", "v1");
    fillFormElement("varb", "input", "varb");
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "select was added for vara and value was updated");
    equal(record.get("varb"), "varb", "input was added for varb and value was updated");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      columnData.removeAt(1);
    });
  });
  wait();
  andThen(function() {
    equal(formElement.find(getColumnSelector("varb", "input")).length, 0, "input for varb was removed");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      columnData.pushObject(ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
      }));
    });
  });
  wait();
  andThen(function() {
    //adding column with same name remove the older form element
    equal(formElement.find(getColumnSelector("vara", "select")).length, 0, "select for vara was removed");
    equal(formElement.find(getColumnSelector("vara", "input")).length, 1, "input for vara was added");
    form.destroy();
  });
});

test("Multi entry with Multi input", function() {
  var form = this.subject(), columnData,
      parentRec, childRecs = [],
      store = setupStoreAndReturnIt(this.container),
      formElement;
  Ember.run(function() {
    parentRec = store.find("testp", "test1");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      parentRec = parentRec.content;
      columnData = [
        ColumnData.ColumnData.create({
          name : "tests",
          type : "multiEntry",
          label : "Tests",
          arrayType : "test",
          copyAttrs : {
            varb : "varb",
          },
          staticAttrs : {
            varc : "varc_static",
          },
          valAttrs : {
            label : "vard",
          },
          childCol : {
            name : "test",
            type : "multiInput",
            childCols : [
              {
                name : "vara",
                type : "textInput",
                label : "VarA",
                validations : [
                  {type : 4, duplicateCheckPath : "testp.tests", duplicateCheckKey : "vara"},
                ],
                bubbleValues : true,
                listenForCols : ['vara'],
              },
              {
                name : "varb",
                type : "staticSelect",
                label : "VarB",
                options : [
                  {val : "vb0", label : "lb0"},
                  {val : "vb1", label : "lb1"},
                  {val : "vb2", label : "lb2"},
                ],
              },
            ],
          },
          eachMultiEntryClass : "test-each-multi-wrapper",
          multiEntryClass : "test-each-multi",
        }),
      ];
      form.set("record", parentRec);
      form.set("cols", columnData);
      form.appendTo("#ember-testing");
    });
  });
  wait();
  andThen(function() {
    formElement = $(form.get("element"));
    equal(formElement.find(getColumnSelector("vara", "input")).length, 3, "3 inputs for vara for the 3 'test' records");
    equal(formElement.find(getColumnSelector("varb", "select")).length, 3, "3 selects for varb for the 3 'test' records");
    click(formElement.find(getColumnSelector("tests", ".test-each-multi-wrapper:nth-of-type(2) .remove-entry a")))
  });
  wait();
  andThen(function() {
    checkElements(parentRec.get("tests"), "vara", ["test11", "test13"], 1);
    click(formElement.find(getColumnSelector("tests", ".test-each-multi-wrapper:nth-of-type(2) .add-entry a")))
  });
  wait();
  andThen(function() {
    fillFormElement("tests", ".test-each-multi-wrapper:nth-of-type(3) " + getColumnSelector("vara", "input"), "test11");
  });
  wait();
  andThen(function() {
    var tests = parentRec.get("tests"),
        first = tests.objectAt(0),
        last = tests.objectAt(2);
    equal(last.get("vara"), "test11", "vara got the right value from input");
    equal(last.get("varb"), "vb1", "varb was copied from 'parentRec'");
    equal(last.get("varc"), "varc_static", "varc was assigned a static value");
    ok(first.get("validationFailed") && first._validation.vara, "validation failed for first element for vara"),
    ok(last.get("validationFailed") && last._validation.vara, "validation failed for last element for vara"),
    form.destroy();
  });
});

moduleFor("view:modal/modalWindow", "modal.js - ModalWindow", {
  setup : function() {
    setupAppForTesting(TestApp, this.container);
  },
  teardown : function() {
    TestApp.reset();
  },
});

test("Sanity Test", function() {
  var actionContext = {ok : false, cancel : false},
  modal = this.subject({
    title : "Title Test",
    okLabel : "Ok Test",
    cancelLabel : "Cancel Test",
    onOk : function() {
      this.ok = true;
      modal.set("fromButton", false);
    },
    onCancel : function() {
      this.cancel = true;
    },
    actionContext : actionContext,
  });
  Ember.run(function() {
    modal.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    click($(modal.get("element")).find(".ok-btn"));
    click($(modal.get("element")).find(".cancel-btn"));
  });
  wait();
  andThen(function() {
    var element = $(modal.get("element"))
    ok(actionContext.ok, "Ok callback called and context was passed");
    ok(actionContext.cancel, "Cancel callback called and context was passed");
    equal(element.find(".modal-title").text(), "Title Test");
    equal(element.find(".ok-btn").text(), "Ok Test");
    equal(element.find(".cancel-btn").text(), "Cancel Test");
    modal.destroy();
  });
});

moduleFor("view:modal/addEditWindow", "modal.js - AddEditWindow", {
  setup : function() {
    setupAppForTesting(TestApp, this.container);
  },
  teardown : function() {
    TestApp.reset();
  },
  needs : ['model:test', 'model:testp'],
});

test("Click Ok", function() {
  var actionContext = {ok : false, cancel : false},
  store = setupStoreAndReturnIt(this.container),
  record, columnData, modal, that = this;
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test_vara",
      varb : "test_varb",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "VarA",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }),
    ];
    modal = that.subject({
      data : record,
      columns : columnData,
      saveCallback : function(rec) {
        actionContext.ok = rec;
      },
      postCancelCallback : function() {
        actionContext.cancel = true;
      },
    });
    modal.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    fillFormElement("varb", "input", "test_varb_changed");
    click($(modal.get("element")).find(".ok-btn"));
  });
  wait();
  andThen(function() {
    equal(actionContext.ok, record, "Save was called and record passed to callback");
    equal(record.get("vara"), "test_vara");
    equal(record.get("varb"), "test_varb_changed");
    modal.destroy();
  });
});

test("Click Ok but failed", function() {
  var actionContext = {ok : false, cancel : false},
  store = setupStoreAndReturnIt(this.container),
  record, columnData, modal, that = this;
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test_vara",
      varb : "test_varb",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "VarA",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }),
    ];
    modal = that.subject({
      data : record,
      columns : columnData,
      saveCallback : function(rec) {
        actionContext.ok = rec;
      },
      postCancelCallback : function() {
        actionContext.cancel = true;
      },
    });
    modal.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    fillFormElement("varb", "input", "test_varb_changed");
    mockjaxSettings.throwProcessError = 1;
    click($(modal.get("element")).find(".ok-btn"));
  });
  wait();
  andThen(function() {
    equal($(modal.get("element")).find(".alert-message").text(), "Failed");
    mockjaxSettings.throwProcessError = 0;
    click($(modal.get("element")).find(".ok-btn"));
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "test_vara");
    equal(record.get("varb"), "test_varb_changed");
    modal.destroy();
  });
});

test("Click Cancel and verify rollback", function() {
  var actionContext = {ok : false, cancel : false},
  store = setupStoreAndReturnIt(this.container),
  record, columnData, modal, that = this;
  Ember.run(function() {
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "VarA",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }),
    ];
    modal = that.subject({
      columns : columnData,
      saveCallback : function(rec) {
        actionContext.ok = rec;
      },
      postCancelCallback : function(rec) {
        actionContext.cancel = rec;
      },
    });
    modal.appendTo("#ember-testing");
    record = store.find("test", "test");
  });
  wait();
  andThen(function() {
    record = record.content;
    modal.set("data", record);
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    record.set("varb", "test_varb_changed");
  });
  wait();
  andThen(function() {
    click($(modal.get("element")).find(".cancel-btn"));
  });
  wait();
  andThen(function() {
    equal(record.get("varb"), "test_varb", "'varb' is reverted back to 'test_varb'");
    modal.destroy();
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
mockjaxData.test.modelClass = TestApp.Test;

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
mockjaxData.testparent.modelClass = TestApp.Testp;

moduleForModel("test", "crud-adaptor.js", {
  setup : function() {
    CrudAdapter.loadAdaptor(TestApp);
  },
  teardown : function() {
  },

  needs : ["model:testp"],
});

test("Create Record", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
      varc : "test",
    });
    CrudAdapter.saveRecord(data);
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varc"), "test_varc", "'varc' has correct value : 'test_varc' as returned from server after update");
  });
});

test("Create Record on existing id", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
    });
    CrudAdapter.saveRecord(data);
  });

  wait();

  andThen(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      id : "test",
      vara : "test",
    });
    CrudAdapter.saveRecord(data);
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
  });
});

test("Create Record with server error status", function() {
  var
  store = this.store(), data, failed = "";

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
    });
    mockjaxSettings.throwServerError = true;
    CrudAdapter.saveRecord(data).then(function() {
    }, function(message) {
      failed = message;
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Server Error", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    mockjaxSettings.throwServerError = false;
  });
});

test("Create Record with processing error on server", function() {
  var
  store = this.store(), data, failed = "";

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
    });
    mockjaxSettings.throwProcessError = true;
    CrudAdapter.saveRecord(data).then(function() {
    }, function(message) {
      failed = message;
      CrudAdapter.retrieveFailure(data);
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Failed", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    mockjaxSettings.throwProcessError = false;
  });
});

test("Create Record with hasMany", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    }), tests = data.get("tests");
    tests.then(function() {
      for(var i = 0; i < 5; i++) {
        tests.pushObject(CrudAdapter.createRecordWrapper(store, "test", {
          vara : "test"+i,
        }));
      }
      CrudAdapter.saveRecord(data);
    });
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("tests.length"), 5, "Has 5 'test' child records");
  });
});

test("Create Record with hasMany, server error", function() {
  var
  store = this.store(), data, failed = false;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    }), tests = data.get("tests");
    tests.then(function() {
      for(var i = 0; i < 5; i++) {
        tests.pushObject(CrudAdapter.createRecordWrapper(store, "test", {
          vara : "test"+i,
        }));
      }
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Server Error", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    equal(data.get("tests.length"), 5, "Has 5 'test' child records");
    mockjaxSettings.throwServerError = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Create Record with hasMany, server processing error", function() {
  var
  store = this.store(), data, failed = false;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    }), tests = data.get("tests");
    tests.then(function() {
      for(var i = 0; i < 5; i++) {
        tests.pushObject(CrudAdapter.createRecordWrapper(store, "test", {
          vara : "test"+i,
        }));
      }
      mockjaxSettings.throwProcessError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Failed", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    equal(data.get("tests.length"), 5, "Has 5 'test' child records");
    mockjaxSettings.throwProcessError = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Update Record", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("test", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      equal(data.get("varb"), "test_varb", "Initial value of 'varb' is 'test_varb'");
      data.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      CrudAdapter.saveRecord(data);
    });
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varb"), "test_update", "'varb' has correct value : 'test_update'");
    mockjaxSettings.returnId = false;
  });
});

test("Update Record with server error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("test", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      equal(data.get("varb"), "test_varb", "Initial value of 'varb' is 'test_varb'");
      data.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Server Error", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varb"), "test_update", "'varb' has correct value : 'test_update'");
    mockjaxSettings.throwServerError = false;
    mockjaxSettings.returnId = false;
  });
});

test("Update Record with server process error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("test", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      equal(data.get("varb"), "test_varb", "Initial value of 'varb' is 'test_varb'");
      data.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwProcessError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Failed", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varb"), "test_update", "'varb' has correct value : 'test_update'");
    mockjaxSettings.throwProcessError = false;
    mockjaxSettings.returnId = false;
  });
});

test("Update Record with hasMany", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      CrudAdapter.saveRecord(data);
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.returnId = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Update Record with hasMany, server process error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwProcessError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Failed", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.throwProcessError = false;
    mockjaxSettings.returnId = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Update Record with hasMany, server error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Server Error", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.throwServerError = false;
    mockjaxSettings.returnId = false;
    CrudAdapter.rollbackRecord(data);
  });
});

//simple deletes are already handled in ember-data testing

test("Delete Record with hasMany, server process error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwProcessError = true;
      data.deleteRecord();
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Failed", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    mockjaxSettings.throwProcessError = false;
    mockjaxSettings.returnId = false;
  });
});

test("Delete Record with hasMany, server error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Server Error", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.throwServerError = false;
    mockjaxSettings.returnId = false;
  });
});
