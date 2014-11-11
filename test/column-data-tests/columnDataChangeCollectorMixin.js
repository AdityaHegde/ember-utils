define([
  "ember",
  "source/column-data/main",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
], function(Ember, ColumnData, Utils, EmberTests) {

return function() {

var
classWithValue = Ember.Object.extend(ColumnData.ColumnDataValueMixin, {
  listenedColumnChangedHook : function(changedColumnData, changedValue, oldValue) {
    this.set("test_changedColumnData", changedColumnData);
    this.set("test_changedValue", changedValue);
    this.set("test_oldValue", oldValue);
  },

  parentForBubbling : Ember.computed.alias("parentObj"),
}),
classParentForValue = Ember.Object.extend(ColumnData.ColumnDataChangeCollectorMixin, {
  children : Utils.hasMany(classWithValue),
});

EmberTests.TestCase.TestSuit.create({
  suitName : "column-data-utils ColumnDataChangeCollectorMixin",
  moduleOpts : {
  },

  testCases : [{
    title : "Sanity Test",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "",                             "objParentForValue", classParentForValue.create({children : [{}, {}, {}]})],
        ["base", "objParentForValue.children.0", "columnData",        ColumnData.ColumnData.create({
          name : "vara",
          columnListenerEntries : [{name : "varb"}],
        })],
        ["base", "objParentForValue.children.0", "record",            Ember.Object.create({vara : "a1", varb : "b1", varc : "c1"})],
        ["base", "objParentForValue.children.1", "columnData",        ColumnData.ColumnData.create({
          name : "varb",
          columnListenerEntries : [{name : "varb"}, {name : "vara"}],
        })],
        ["base", "objParentForValue.children.1", "record",            Ember.Object.create({vara : "a2", varb : "b2", varc : "c2"})],
        ["base", "objParentForValue.children.2", "columnData",        ColumnData.ColumnData.create({
          name : "varc",
          columnListenerEntries : [{name : "vara"}],
        })],
        ["base", "objParentForValue.children.2", "record",            Ember.Object.create({vara : "a3", varb : "b3", varc : "c3"})],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "objParentForValue.children.0", "value", "ac1"],
          ["base", "objParentForValue.children.1", "value", "bc1"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "objParentForValue.children.0.test_changedColumnData.name", "varb"],
          ["base", "objParentForValue.children.0.test_changedValue",           "bc1" ],
          ["base", "objParentForValue.children.0.test_oldValue",               "b2"  ],
          ["base", "objParentForValue.children.1.test_changedColumnData.name", "vara"],
          ["base", "objParentForValue.children.1.test_changedValue",           "ac1" ],
          ["base", "objParentForValue.children.1.test_oldValue",               "a1"  ],
          ["base", "objParentForValue.children.2.test_changedColumnData.name", "vara"],
          ["base", "objParentForValue.children.2.test_changedValue",           "ac1" ],
          ["base", "objParentForValue.children.2.test_oldValue",               "a1"  ],
        ]],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
      ]],
    ],
  }],
});

};

});
