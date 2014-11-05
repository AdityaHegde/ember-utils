module("timer", {
  setup: function() {
  },
  teardown : function() {
    TestApp.reset();
  },
});


test("Timer - Sanity Test", function() {
  var runCount = 0, end = 0,
      d, timingWasAsExpected = true;
  Ember.run(function() {
    d = new Date();
    Timer.Timer.create({
      count : 5,
      timerCallback : function() {
        runCount++;
        timingWasAsExpected &= Math.round( ( new Date() - d ) / 10 ) * 10 === Timer.TIMERTIMEOUT;
        d = new Date();
      },
      endCallback : function() {
        end = 1;
      },
    });
    Ember.run.later(function() {}, 1500);
  });
  wait();
  andThen(function() {
    equal(runCount, 5, "Timer ran for 5 times!");
    equal(end, 1, "Timer endCallback was called");
    ok(timingWasAsExpected, "timerCallback was called at the right intervals");
  });
});

test("Timer - Different period.", function() {
  var runCount = 0, end = 0,
      d, timingWasAsExpected = true;
  Ember.run(function() {
    d = new Date();
    Timer.Timer.create({
      count : 3,
      timeout : 750,
      timerCallback : function() {
        runCount++;
        timingWasAsExpected &= Math.round( ( new Date() - d ) / 10 ) * 10 === 750;
        d = new Date();
      },
      endCallback : function() {
        end = 1;
      },
    });
    Ember.run.later(function() {}, 2500);
  });
  wait();
  andThen(function() {
    equal(runCount, 3, "Timer ran for 3 times!");
    equal(end, 1, "Timer endCallback was called");
    ok(timingWasAsExpected, "timerCallback was called at the right intervals");
  });
});

test("Async Que - Sanity test", function() {
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

test("test async que with same keys", function() {
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

test("test async que with different keys", function() {
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
