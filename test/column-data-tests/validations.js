define([
  "ember",
  "source/column-data/main",
  "lib/ember-test-utils",
], function(Ember, ColumnData, EmberTests) {

return function() {

EmberTests.TestCase.addToTestHierarchy("validateValue", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var valid = testData.get("columnData.validation").validateValue(this.get("attr1"), testData.get("record"), this.get("attr4"));
    EmberTests.TestUtils.equal(valid[0], this.get("attr2"), "Validation result was as expected for "+this.get("attr1"));
    if(valid[0]) {
      equal(valid[1], this.get("attr3"), "Invalid message was as expected.");
    }
  },

  assertions : function() {
    return this.get("attr2") ? 2 : 1;
  }.property("attr2"),
}), "to");

EmberTests.TestCase.TestSuit.create({
  suitName : "column-data-validations",
  moduleOpts : {
  },

  testCases : [{
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

};

});
