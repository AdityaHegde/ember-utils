define([
  "ember",
  "ember_qunit",
  "source/timer/main",
], function(Ember, emq, Timer) {

return function() {

module("timer : Timer", {
  setup: function() {
  },
  teardown : function() {
    TestApp.reset();
  },
});


test("Sanity Test", function() {
  var runCount = 0, end = 0,
      d, timingWasAsExpected = true;
  Ember.run(function() {
    d = new Date();
    Timer.TimerObj.create({
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

test("Different period.", function() {
  var runCount = 0, end = 0,
      d, timingWasAsExpected = true;
  Ember.run(function() {
    d = new Date();
    Timer.TimerObj.create({
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

};

});
