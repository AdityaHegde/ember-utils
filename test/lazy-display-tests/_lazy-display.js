define([
  "ember",
  "ember_qunit",
  "source/lazy-display/main",
], function(Ember, emq, LazyDisplay) {

return function() {

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

};

});
