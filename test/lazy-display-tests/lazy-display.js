define([
  "ember",
  "ember_qunit",
  "source/lazy-display/main",
], function(Ember, emq, LazyDisplay) {

return function() {

EmberTests.TestCase.TestSuit.create({
  suitName : "LazyDisplay",
  moduleOpts : {
    setup : function() {
    },
    teardown : function() {
      $("#lazy-display-container").detach();
      TestApp.reset();
    },
  },
  testCases : [{
    title : "setup the view",
    testData : {},
    type : "baseTestCase",
    testBlocks : [
      ["initLazyDisplay"],
      ["baseTestBlock", [
        ["getLazyDisplayMain"],
        ["checkChildViews", [
          {start : 0, end : 59, type : 1},
        ], "All 30 child views present are rows"],
        ["destroyLazyDisplayView"],
      ]],
    ],
  }, {
    title : "scroll down to 500th element",
    testData : {},
    type : "baseTestCase",
    testBlocks : [
      ["initLazyDisplay"],
      ["baseTestBlock", [
        ["getLazyDisplayMain"],
        ["getElement"],
        ["scrollElement", "element", 30*500],
      ]],
      ["baseTestBlock", [
        ["checkChildViews", [
          {start : 0, end : 59, type : 1},
          {start : 60, end : 449, type : 0},
          {start : 450, end : 559, type : 1},
        ], "All child views are as expected"],
        ["destroyLazyDisplayView"],
      ]],
    ],
  }, {
    title : "scroll to 500th element and back to 200th element",
    testData : {},
    type : "baseTestCase",
    testBlocks : [
      ["initLazyDisplay"],
      ["baseTestBlock", [
        ["getLazyDisplayMain"],
        ["getElement"],
        ["scrollElement", "element", 30*500],
      ]],
      ["baseTestBlock", [
        ["scrollElement", "element", 30*200],
      ]],
      ["baseTestBlock", [
        ["checkChildViews", [
          {start : 0, end : 59, type : 1},
          {start : 60, end : 149, type : 0},
          {start : 150, end : 259, type : 1},
          {start : 260, end : 449, type : 0},
          {start : 450, end : 559, type : 1},
        ], "All child views are as expected"],
        ["destroyLazyDisplayView"],
      ]],
    ],
  }, {
    title : "change rows",
    testData : {},
    type : "baseTestCase",
    testBlocks : [
      ["initLazyDisplay"],
      ["baseTestBlock", [
        ["getLazyDisplayMain"],
        ["getElement"],
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "lazyDisplayMain.length", 60, "Lazy display view has 60 child views"],
        ]],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "", "lazyDisplay.rows", [
            Ember.Object.create({vara : "a"}),
            Ember.Object.create({vara : "b"}),
            Ember.Object.create({vara : "c"}),
            Ember.Object.create({vara : "d"}),
            Ember.Object.create({vara : "e"}),
          ]],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "lazyDisplayMain.length", 5, "Lazy display view has 5 child views"],
        ]],
        ["checkChildViews", [
          {start : 0, end : 4, type : 1},
        ], "All child views are as expected"],
        ["destroyLazyDisplayView"],
      ]],
    ],
  }, {
    title : "addition of rows",
    testData : {},
    type : "baseTestCase",
    testBlocks : [
      ["initLazyDisplay"],
      ["baseTestBlock", [
        ["getLazyDisplayMain"],
        ["getElement"],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "lazyDisplay.@.rows", "", Ember.Object.create({vara : "a0"}), "unshift"],
          ["base", "lazyDisplay.@.rows", "", Ember.Object.create({vara : "a1"}), "unshift"],
          ["base", "lazyDisplay.@.rows", "", Ember.Object.create({vara : "a2"}), "unshift"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "lazyDisplayMain.length", 63, "Lazy display view has 63 child views"],
        ]],
        ["checkChildViews", [
          {start : 0, end : 62, type : 1},
        ], "All child views are as expected"],
      ]],
      ["baseTestBlock", [
        ["scrollElement", "element", 30*200],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "lazyDisplay.@.rows", "", Ember.Object.create({vara : "b0"}), "unshift"],
          ["base", "lazyDisplay.@.rows", "", Ember.Object.create({vara : "b1"}), "unshift"],
          ["base", "lazyDisplay.@.rows", "", Ember.Object.create({vara : "b2"}), "unshift"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "lazyDisplayMain.length", 263, "Lazy display view has 263 child views"],
        ]],
        ["checkChildViews", [
          {start : 0, end : 2, type : 0},
          {start : 3, end : 65, type : 1},
          {start : 66, end : 152, type : 0},
          {start : 153, end : 262, type : 1},
        ], "All child views are as expected"],
        ["destroyLazyDisplayView"],
      ]],
    ],
  }, {
    title : "deletion of rows",
    testData : {},
    type : "baseTestCase",
    testBlocks : [
      ["initLazyDisplay"],
      ["baseTestBlock", [
        ["getLazyDisplayMain"],
        ["getElement"],
      ]],
      ["baseTestBlock", [
        ["scrollElement", "element", 30*200],
      ]],
      ["baseTestBlock", [
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "lazyDisplay.@.rows", 5,   "", "removeAt"],
          ["base", "lazyDisplay.@.rows", 55,  "", "removeAt"],
          ["base", "lazyDisplay.@.rows", 105, "", "removeAt"],
          ["base", "lazyDisplay.@.rows", 155, "", "removeAt"],
          ["base", "lazyDisplay.@.rows", 205, "", "removeAt"],
          ["base", "lazyDisplay.@.rows", 255, "", "removeAt"],
          ["base", "lazyDisplay.@.rows", 305, "", "removeAt"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "lazyDisplayMain.length", 260, "Lazy display view has 260 child views"],
        ]],
        ["checkChildViews", [
          {start : 0, end : 57, type : 1},
          {start : 58, end : 146, type : 0},
          {start : 147, end : 259, type : 1},
        ], "All child views are as expected"],
        ["destroyLazyDisplayView"],
      ]],
    ],
  }],
});

};

});
