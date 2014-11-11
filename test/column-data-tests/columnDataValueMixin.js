define([
  "ember",
  "source/column-data/main",
  "lib/ember-test-utils",
], function(Ember, ColumnData, EmberTests) {

return function() {

var classWithValue = Ember.Object.extend(ColumnData.ColumnDataValueMixin, {
  valueChangeHook : function(val) {
    this.set("lastValueChanged", val);
  },

  recordChangeHook : function() {
    this.set("recordChanged", true);
  },

  recordRemovedHook : function() {
    this.set("recordRemoved", true);
  },
});

EmberTests.TestCase.TestSuit.create({
  suitName : "column-data-utils ColumnDataValueMixin",
  moduleOpts : {
  },

  testCases : [{
    title : "Sanity Test",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "objWithValue",             classWithValue.create()],
        ["base", "", "objWithValue.columnData",  ColumnData.ColumnData.create({
          name : "vara",
          validation : {
            validations : [
              {type : 0}, {type : 1, regex : "^[a-z]*$", regexFlags : "i", negate : true, invalidMessage : "Failed Regex"},
            ],
          },
        })],
        ["base", "", "objWithValue.record",      Ember.Object.create({vara : ""})],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "objWithValue.value",                   "",   "value is not assigned"],
          ["base", "objWithValue.record.validationFailed", true, "validation failed"    ],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "", "objWithValue.record.vara",   "123"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "objWithValue.value",                   "123", "value has '123'"            ],
          ["base", "objWithValue.record.validationFailed", true,  "validation still failed"    ],
          ["base", "objWithValue.lastValueChanged",        "123", "Last changed value is '123'"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "", "objWithValue.record.vara",   "abc"],
        ]],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "objWithValue.value",                   "abc", "value has 'abc'"             ],
        ["base", "objWithValue.record.validationFailed", false,  "validation passed"          ],
        ["base", "objWithValue.lastValueChanged",        "abc",  "Last changed value is 'abc'"],
      ]],
    ],
  }, {
    title : "Record change hooks",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "objWithValue",             classWithValue.create()],
        ["base", "", "objWithValue.columnData",  ColumnData.ColumnData.create({
          name : "vara",
        })],
        ["base", "", "objWithValue.record",      Ember.Object.create({vara : "vara1"})],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "objWithValue.recordChanged", true,    "Record changed fired"     ],
          ["base", "objWithValue.value",         "vara1", "value 'vara2' is assigned"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "", "objWithValue.recordChanged", false],
          ["base", "", "objWithValue.record",        Ember.Object.create({vara : "vara2"})],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "objWithValue.recordChanged", true,    "Record changed fired"     ],
          ["base", "objWithValue.value",         "vara2", "value 'vara2' is assigned"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "", "objWithValue.recordChanged", false],
          ["base", "", "objWithValue.record",        null ],
        ]],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "objWithValue.recordChanged", false, "Record changed not fired"],
        ["base", "objWithValue.recordRemoved", true,  "Record removed fired"    ],
        ["base", "objWithValue.value",         null,  "value is not assigned"    ],
      ]],
    ],
  }],
});

};

});
