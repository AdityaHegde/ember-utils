define([
  "ember",
  "./timer-consts",
], function(Ember, TimerConsts) {


var curTimer = null;
var timers = [];

/**
 * A timer module which executes a job periodically.
 *
 * @class TimerObj
 * @for Timer
 */
var TimerObj = Ember.Object.extend({
  init : function() {
    this._super();
    timers.push(this);
    this.set("ticks", Math.ceil(this.get("timeout") / TimerConsts.TIMERTIMEOUT));
    if(!Timer.curTimer) {
      curTimer = setInterval(timerFunction, TimerConsts.TIMERTIMEOUT);
    }
    var that = this;
    this.set("promise", new Ember.RSVP.Promise(function(resolve, reject) {
      that.setProperties({
        resolve : resolve,
        reject : reject,
      });
    }));
  },

  /**
   * Periodic timeout after which the job should be executed.
   *
   * @property timeout
   * @type boolean
   * @default Timer.TIMERTIMEOUT
   */
  timeout : TimerConsts.TIMERTIMEOUT,

  /**
   * Number of times of Timer.TIMERTIMEOUT per period.
   *
   * @property ticks
   * @type Number
   * @default 1
   * @private
   */
  ticks : 1,

  /**
   * Number of times to execute the job.
   *
   * @property count
   * @type Number
   * @default 0
   */
  count : 0,

  /**
   * Callback executed every period. The job goes here.
   *
   * @method timerCallback
   */
  timerCallback : function() {
  },


  /**
   * Callback executed after the end of timer.
   *
   * @method endCallback
   */
  endCallback : function() {
  },

  promise : null,
  resolve : null,
  reject : null,
});

var timerFunction = function() {
  Ember.run(function() {
    if(timers.length === 0) {
      clearTimeout(curTimer);
      curTimer = null;
    }
    else {
      for(var i = 0; i < timers.length;) {
        var timer = timers[i];
        timer.decrementProperty("ticks");
        if(timer.get("ticks") === 0) {
          timer.set("ticks", Math.ceil(timer.get("timeout") / TimerConsts.TIMERTIMEOUT));
          timer.timerCallback();
          timer.decrementProperty("count");
        }
        if(timer.get("count") <= 0) {
          timers.removeAt(i);
          timer.endCallback();
          timer.get("resolve")();
        }
        else {
          i++;
        }
      }
    }
  });
};

return {
  TimerObj : TimerObj,
};

});
