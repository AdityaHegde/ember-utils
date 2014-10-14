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
