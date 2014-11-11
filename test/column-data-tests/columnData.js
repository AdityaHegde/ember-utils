define([
  "ember",
  "source/column-data/main",
  "lib/ember-test-utils",
], function(Ember, ColumnData, EmberTests) {

return function() {

EmberTests.TestCase.TestSuit.create({
  suitName : "column-data ColumnData Class",
  moduleOpts : {
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
  }],
});

};

});
