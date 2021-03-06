define([
  "ember",
  "ember_qunit",
], function(Ember, emq) {

return function() {

module("timer : AsyncQue", {
  setup: function() {
  },
  teardown : function() {
    TestApp.reset();
  },
});

test("Sanity test", function() {
  var run = false;
  Timer.addToQue("test-async").then(function() {
    run = true;
  });
  andThen(function() {
    ok(!run, "Callback not run yet");
  });
  Ember.run.later(function() {
    ok(run, "Callback ran after 500ms (aprox.)");
  }, 500);
});

test("With same keys", function() {
  var queRunCount1st = 0, queRunCountTotal = 0;
  for(var i = 0; i < 5; i++) {
    Timer.addToQue("test-async", 200).then(function() {
      queRunCount1st++;
      queRunCountTotal++;
    });
  }
  Ember.run.later(function() {
    for(var i = 0; i < 5; i++) {
      Timer.addToQue("test-async", 200).then(function() {
        queRunCountTotal++;
      });
    }
  }, 250);
  wait();
  andThen(function() {
    equal(queRunCount1st, 1, "Ran async que for 5 times within 200ms, callback executed once");
    equal(queRunCountTotal, 2, "Ran async que for 5 times within 200ms after a 250ms wait from previous executions, callback excuted once, twice in total");
  });
});

test("With different keys", function() {
  var queRunCount = 0;
  for(var i = 0; i < 5; i++) {
    Timer.addToQue("test-async-"+i, 200).then(function() {
      queRunCount++;
    });
  }
  wait();
  andThen(function() {
    equal(queRunCount, 5, "Ran async que for 5 times within 200ms with different keys, callback executed five times");
  });
});

};

});
