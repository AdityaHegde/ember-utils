var lazyDisplayConfig, lazyDisplayMainClass,
    lazyDisplayDummy, lazyDisplayRow, lazyDisplay,
    rows = [], varb, varc;
TestApp.BaseDataObj = Ember.Object.create();

module("lazy-display.js", {
  setup : function() {
    lazyDisplayDummy = Ember.View.extend(LazyDisplay.LazyDisplayDummyRow, {
      tagName : "tr",
    });
    lazyDisplayRow = Ember.View.extend(LazyDisplay.LazyDisplayRow, {
      tagName : "tr",
      row : null,
      template : Ember.Handlebars.compile("<td>{{view.row.vara}}</td><td>{{view.varb}}</td>"),
    });
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
    lazyDisplayConfig = LazyDisplay.LazyDisplayConfig.create({
      rowDelay : 50,
      lazyDisplayMainClass : "TestApp.LazyDisplayTestMain",
      passKeys : ["varb"],
      passValuePaths : ["TestApp.BaseDataObj.varb"],
    });
    rows = [];
    for(var i = 0; i < 1000; i++) {
      rows.pushObject(Ember.Object.create({vara : "row"+i}));
    }
    lazyDisplay = LazyDisplay.LazyDisplay.create({
      rows : rows,
      lazyDisplayConfig : lazyDisplayConfig,
      attributeBindings : ["style"],
      style : "height:100%;overflow:auto;",
    });
    Ember.run(function() {
      $("#ember-testing").append("<div id='lazy-display-container' style='height:250px;position:relative;'></div>");
      lazyDisplay.appendTo("#lazy-display-container");
    });
    Ember.run.later(function() {
    }, 250);
    wait();
  },
  teardown : function() {
    $("#lazy-display-container").detach();
    TestApp.reset();
    Ember.run(function() {
      lazyDisplay.destroy();
    });
  },
});

function checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy, parts) {
  var partsPassed = 0;
  for(var i = 0; i < parts.length; i++) {
    for(var j = parts[i].start; j <= parts[i].end; j++) {
      var isDummy = lazyDisplayMain.objectAt(j) instanceof lazyDisplayDummy,
          isRow = lazyDisplayMain.objectAt(j) instanceof lazyDisplayRow;
      if(!((parts[i].type === 0 && isDummy) || (parts[i].type === 1 && isRow))) {
        //return [partsPassed, false];
        return false;
      }
    }
    partsPassed++;
  }
  return true;
}

function getLazyDisplayMain(lazyDisplay) {
  return lazyDisplay._childViews[0] && lazyDisplay._childViews[0]._childViews[0] && lazyDisplay._childViews[0]._childViews[0]._childViews[0];
}

test("setup the view", function() {
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    //5 shown (height 250px, each 50px) and buffer is 25
    equal(lazyDisplayMain.get("length"), 30, "Lazy display view has 30 child views");
    var all30areRows = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 29, type : 1},
      ]
    );
    ok(all30areRows, "All 30 child views present are rows");
  });
});

test("scroll down to 500th element", function() {
  var lazyDisplayElement = $(lazyDisplay.get("element"));
  scrollHelper(lazyDisplayElement, 50*500);
  wait();
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    equal(lazyDisplayMain.get("length"), 530, "Lazy display view has 530 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 29, type : 1},
        {start : 30, end : 474, type : 0},
        {start : 475, end : 529, type : 1},
      ]
    );
    ok(passed, "All child views are as expected");
  });
});

test("scroll to 500th element and back to 200th element", function() {
  expect(3);
  var lazyDisplayElement = $(lazyDisplay.get("element"));
  scrollHelper(lazyDisplayElement, 50*500);
  wait();
  scrollHelper(lazyDisplayElement, 50*200);
  wait();
  Ember.run.later(function() {}, 150);
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    equal(lazyDisplayMain.get("length"), 530, "Lazy display view has 530 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 29, type : 1},
        {start : 30, end : 174, type : 0},
        {start : 175, end : 229, type : 1},
        {start : 230, end : 474, type : 0},
        {start : 475, end : 529, type : 1},
      ]
    );
    ok(passed, "All child views are as expected");
  });
});

test("change rows", function() {
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    equal(lazyDisplayMain.get("length"), 30, "Lazy display view has 30 child views");
  });
  var lazyDisplayElement = $(lazyDisplay.get("element"));
  Ember.run(function() {
    lazyDisplay.set("rows", [
      Ember.Object.create({vara : "a"}),
      Ember.Object.create({vara : "b"}),
      Ember.Object.create({vara : "c"}),
      Ember.Object.create({vara : "d"}),
    ]);
  });
  wait();
  Ember.run.later(function() {}, 150);
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    equal(lazyDisplayMain.get("length"), 4, "Lazy display view has 4 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 3, type : 1},
      ]
    );
    ok(passed, "All child views are as expected");
  });
});

test("addition of rows", function() {
  var lazyDisplayElement = $(lazyDisplay.get("element"));
  andThen(function() {
    Ember.run(function() {
      for(var i = 0; i < 5; i++) {
        rows.unshiftObject(Ember.Object.create({vara : "a"+i}));
      }
    });
  });
  wait();
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    equal(lazyDisplayMain.get("length"), 35, "Lazy display view has 35 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 34, type : 1},
      ]
    );
    ok(passed, "All child views are as expected");
  });
  scrollHelper(lazyDisplayElement, 50*200);
  wait();
  Ember.run.later(function() {}, 150);
  wait();
  andThen(function() {
    Ember.run(function() {
      for(var i = 0; i < 5; i++) {
        rows.unshiftObject(Ember.Object.create({vara : "b"+i}));
      }
    });
  });
  wait();
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    equal(lazyDisplayMain.get("length"), 235, "Lazy display view has 235 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 4, type : 0},
        {start : 5, end : 39, type : 1},
        {start : 40, end : 179, type : 0},
        {start : 180, end : 234, type : 1},
      ]
    );
    ok(passed, "All child views are as expected");
  });
});

test("deletion of rows", function() {
  var lazyDisplayElement = $(lazyDisplay.get("element"));
  //load a few rows in the begining
  scrollHelper(lazyDisplayElement, 50*50);
  wait();
  scrollHelper(lazyDisplayElement, 0);
  wait();
  Ember.run.later(function() {}, 150);
  wait();
  andThen(function() {
    Ember.run(function() {
      for(var i = 0; i < 10; i++) {
        rows.removeAt(i*3 - i);
      }
    });
  });
  wait();
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    ok(lazyDisplayMain, "Main view is present");
    equal(lazyDisplayMain.get("length"), 70, "Lazy display view has 70 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 69, type : 1},
      ]
    );
    ok(passed, "All child views are as expected");
  });
});

function checkVarOfEachRow(rows, key, val) {
  for(var i = 0; i < rows.length; i++) {
    if(rows[i].get(key) !== val) {
      return false;
    }
  }
  return true;
}

test("check sync of passed params", function() {
  Ember.run(function() {
    Ember.set("TestApp.BaseDataObj.varb", "TestVal1");
  });
  andThen(function() {
    ok(checkVarOfEachRow(getLazyDisplayMain(lazyDisplay)._childViews, "varb", "TestVal1"), "Varb value changed to 'TestVal1'");
  });
  Ember.run(function() {
    Ember.set("TestApp.BaseDataObj.varb", "TestVal2");
  });
  andThen(function() {
    ok(checkVarOfEachRow(getLazyDisplayMain(lazyDisplay)._childViews, "varb", "TestVal2"), "Varb value changed to 'TestVal2'");
  });
});

test("check resize changes no of rows displayed", function() {
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    //5 shown (height 250px, each 50px) and buffer is 25
    equal(lazyDisplayMain.get("length"), 30, "Lazy display view has 30 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 29, type : 1},
      ]
    );
    ok(passed, "All 30 child views present are rows");
  });
  wait();
  Ember.run(function() {
    $("#lazy-display-container").css("height", "500px");
    $("#lazy-display-container > div").resize();
  });
  wait();
  Ember.run.later(function() {}, 150);
  wait();
  andThen(function() {
    var lazyDisplayMain = getLazyDisplayMain(lazyDisplay);
    //8 shown (height 500px, each 50px) and buffer is 25
    equal(lazyDisplayMain.get("length"), 35, "Lazy display view has 35 child views");
    var passed = checkChildViews(lazyDisplayMain, lazyDisplayRow, lazyDisplayDummy,
      [
        {start : 0, end : 34, type : 1},
      ]
    );
    ok(passed, "All 35 child views present are rows");
  });
});
