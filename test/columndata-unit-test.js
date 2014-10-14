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
});

test("Validation tests - simple", function() {
  var columnData = ColumnData.ColumnData.create({
    name : "vara",
    label : "Vara",
    validations : [
      {type : 0},
      {type : 1, regex : "^([a-zA-Z0-9](?:[ \\t]*\\,[ \\t]*)?)+$", negate : true, invalidMessage : "Can only be alphanumeric"},
      {type : 2, delimeter : ",", regex : "^[a-zA-Z0-9]*$", negate : true, invalidMessage : "Can only be alphanumeric"},
      {type : 3, delimeter : ",", invalidMessage : "Cannot have duplicates"},
    ],
  }), record = Ember.Object.create(),
  validation11, validation12, validation13, validation14, validation15;
  Ember.run(function() {
    validation11 = columnData.validateValue("", record);
    validation12 = columnData.validateValue("abc$", record);
    validation13 = columnData.validateValue("a,a,b,c", record);
    validation14 = columnData.validateValue("a,b,c", record);
    validation15 = columnData.validateValue("a*b", record, [
      ColumnData.ColumnValidation.create({
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
    validations : [
      {type : 1, regex : "^[0-9]*$", negate : true, invalidMessage : "Can only be number"},
      {type : 5, minValue : 10, maxValue : 100, invalidMessage : "Should be between 10 and 100"},
    ],
  }),
  validation21, validation22, validation23, validation24;
  Ember.run(function() {
    validation21 = columnDataNum.validateValue(undefined, record);
    validation22 = columnDataNum.validateValue("1", record);
    validation23 = columnDataNum.validateValue("1000", record);
    validation24 = columnDataNum.validateValue("50", record);
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
    validations : [
      {type : 0},
      {type : 1, regex : "^[a-zA-Z0-9]*$", negate : true, invalidMessage : "Can only be alphanumeric"},
      {type : 4, duplicateCheckPath : "parentRecord.records", duplicateCheckKey : "varc", invalidMessage : "Should be unique across records"},
    ],
  }),
  columnDataArr = ColumnData.ColumnData.create({
    name : "records",
    label : "records",
    validations : [
      {type : 0},
    ],
  }),
  rec1 = Ember.Object.create({varc : "a"}),
  rec2 = Ember.Object.create({varc : "b"}),
  rec3 = Ember.Object.create({varc : "c"}),
  parentRecord = Ember.Object.create({records : [rec1, rec2, rec3]}),
  validation31, validation32, validation33, validation34;
  rec1.set("parentRecord", parentRecord);
  rec2.set("parentRecord", parentRecord);
  rec3.set("parentRecord", parentRecord);
  Ember.run(function() {
    validation31 = columnDataDup.validateValue("b", rec1);
    validation32 = columnDataDup.validateValue("a", rec1);

    validation33 = columnDataArr.validateValue([], parentRecord);
    validation34 = columnDataArr.validateValue(parentRecord.get("records"), parentRecord);
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
  ColumnData.ColumnDataMap = {
    record : {
      name : "vara",
      childColsName : "record_main",
    },
    record_main : [
      {
        name : "varb",
        childColName : "doesnt-exist",
      },
      {
        name : "varc",
      },
    ],
  };
  var record = Ember.Object.create(),
  columnDataArr = ColumnData.ColumnData.create({
    name : "records",
    label : "records",
    childColName : "record",
    validations : [
      {type : 0},
    ],
  });
  andThen(function() {
    equal(columnDataArr.get("childCol.name"), "vara", "Child col was successfully extracted");
    equal(columnDataArr.get("childCol.childCols.length"), 2, "Child cols were successfully extracted");
    ok(Ember.isEmpty(columnDataArr.get("childCol.childCols")[0].get("childCols.length")), "Child cols for childColsName that is not present is not extracted");
    ColumnData.ColumnDataMap = columnDataBack;
  });
});
