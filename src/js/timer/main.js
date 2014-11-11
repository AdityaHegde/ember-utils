/**
 * Timer module with stuff related to timers.
 *
 * @module timer
 */
define([
  "./timer-consts",
  "./asyncQue",
  "./timerObj",
], function() {
  /**
   * Timer global class.
   *
   * @class Timer
   */
  var Timer = Ember.Namespace.create();
  window.Timer = Timer;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Timer[k] = arguments[i][k];
      }
    }
  }

  return Timer;
});
