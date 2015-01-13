define([
  "ember",
  "ember_qunit",
  "source/lazy-display/main",
  "source/column-data/main",
  "source/crud-adapter/main",
], function(Ember, emq, LazyDisplay, ColumnData, CrudAdapter) {

EmberTests.TestCase.addToTestHierarchy("initLazyDisplay", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    Ember.run(function() {
      var
      lazyDisplayDummy = Ember.View.extend(LazyDisplay.LazyDisplayDummyRow, {
        tagName : "tr",
      }),
      lazyDisplayRow = Ember.View.extend(LazyDisplay.LazyDisplayRow, {
        tagName : "tr",
        row : null,
        template : Ember.Handlebars.compile("<td>{{view.row.vara}}</td><td>{{view.varb}}</td>"),
      }),
      lazyDisplayMainClass = Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
        getDummyView : function(row) {
          return lazyDisplayDummy.create({row : row});
        },
        getRowView : function(row) {
          return lazyDisplayRow.create({row : row, varb : this.get("varb")});
        },
        tagName : "tbody",

        varb : function(key, value) {
          if(arguments.length > 1) {
            this.forEach(function(childView) {
              childView.set("varb", value);
            });
            return value;
          }
        }.property(),
      });
      TestApp.LazyDisplayTestMain = lazyDisplayMainClass;
      testData.set("lazyDisplayRow", lazyDisplayRow);
      testData.set("lazyDisplayDummy", lazyDisplayDummy);
    });
    Ember.run.later(function() {
    }, 250);
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("initLazyDisplayView", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    Ember.run(function() {
      var
      columnDataGroup = ColumnData.ColumnDataGroup.create({
        name : "lazyDisplayTest",
        lazyDisplay : {
          rowDelay : 50,
          rowHeight : 30,
          lazyDisplayMainClass : "TestApp.LazyDisplayTestMain",
          passValues : [{
            srcObj : CrudAdapter.GlobalData,
            srcKey : "varb",
            tarKey : "varb",
          }],
        },
      }),
      rows = [];
      for(var i = 0; i < 1000; i++) {
        rows.pushObject(Ember.Object.create({vara : "row"+i}));
      }
      lazyDisplay = LazyDisplay.LazyDisplayView.create({
        rows : rows,
        columnDataGroup : columnDataGroup,
        attributeBindings : ["style"],
        style : "height:100%;overflow:auto;",
      });
      $("#ember-testing").append("<div id='lazy-display-container' style='height:300px;position:relative;'></div>");
      lazyDisplay.appendTo("#lazy-display-container");
      testData.set("lazyDisplay", lazyDisplay);
      testData.set("rows", rows);
    });
    Ember.run.later(function() {
    }, 250);
  },
}), "to");

EmberTests.TestCase.addToTestHierarchy("getElement", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("element", $(testData.get("lazyDisplay.element")));
  },
}), "to");

EmberTests.TestCase.addToTestHierarchy("getLazyDisplayMain", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var lazyDisplay = testData.get("lazyDisplay");
    testData.set("lazyDisplayMain", lazyDisplay._childViews[0] && lazyDisplay._childViews[0]._childViews[0] && lazyDisplay._childViews[0]._childViews[0]._childViews[0]);
  },
}), "to");

EmberTests.TestCase.addToTestHierarchy("checkChildViews", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var
    partsPassed = 0,
    lazyDisplayMain = testData.get("lazyDisplayMain"),
    lazyDisplayDummy = testData.get("lazyDisplayDummy"),
    lazyDisplayRow = testData.get("lazyDisplayRow"),
    passed = true,
    parts = this.get("attr1");
    for(var i = 0; i < parts.length; i++) {
      for(var j = parts[i].start; j <= parts[i].end; j++) {
        var isDummy = lazyDisplayMain.objectAt(j) instanceof lazyDisplayDummy,
            isRow = lazyDisplayMain.objectAt(j) instanceof lazyDisplayRow;
        if(!((parts[i].type === 0 && isDummy) || (parts[i].type === 1 && isRow))) {
          passed = false;
          i = parts.length;
          break;
        }
      }
      partsPassed++;
    }
    EmberTests.TestUtils.ok(passed, this.get("attr2"));
  },
  assertions : 1,
}), "to");

EmberTests.TestCase.addToTestHierarchy("checkVarOfEachRow", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var
    rows = this.get("attr1"),
    key = this.get("attr2"),
    val = this.get("attr3"),
    passed = true;
    for(var i = 0; i < rows.length; i++) {
      if(rows[i].get(key) !== val) {
        passed = false;
        break;
      }
    }
    EmberTests.TestUtils.ok(passed, this.get("attr4"));
  },
  assertions : 1,
}), "to");

EmberTests.TestCase.addToTestHierarchy("scrollElement", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return scrollHelper(testData.get(this.get("attr1")), this.get("attr2"));
  },
}), "to");

EmberTests.TestCase.addToTestHierarchy("destroyLazyDisplayView", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.get("lazyDisplay").destroy();
  },
}), "to");

});
