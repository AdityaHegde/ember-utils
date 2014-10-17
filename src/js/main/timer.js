/**
 * Timer module with stuff related to timers.
 *
 * @module timer
 */


Timer = Ember.Namespace.create();

Timer.queMap = {};

/**
 * Default timeout for the asyncQue.
 *
 * @property TIMEOUT
 * @type Number
 * @default 500
 * @static
 */
Timer.TIMEOUT = 500;

/**
 * Timer ticks.
 *
 * @property TIMERTIMEOUT
 * @type Number
 * @default 250
 * @static
 */
Timer.TIMERTIMEOUT = 250;

/**
 * @class Timer.AsyncQue
 * @private
 */
Timer.AsyncQue = Ember.Object.extend({
  init : function() {
    this._super();
    var that = this, timer;
    Ember.run.later(function() {
      that.timerTimedout();
    }, that.get("timeout") || Timer.TIMEOUT);
  },

  timerTimedout : function() {
    if(!this.get("resolved")) {
      var that = this;
      Ember.run(function() {
        delete Timer.queMap[that.get("key")];
        that.set("resolved", true);
        that.get("resolve")();
      });
    }
  },

  /**
   * native timer
   *
   * @property timer
   * @type Number
   */
  timer : null,

  /**
   * unique identifier for the associated task
   *
   * @property key
   * @type String
   */
  key : "",

  /**
   * resolve function of the associated promise
   *
   * @property resolve
   * @type Function
   */
  resolve : null,

  /**
   * reject function of the associated promise
   *
   * @property reject
   * @type Function
   */
  reject : null,

  /**
   * boolean to indicate whether the associated promise has resolved
   *
   * @property resolved
   * @type boolean
   */
  resolved : false,

  /**
   * timeout after which the associated promise resolves
   *
   * @property reject
   * @type Number
   */
  timeout : Timer.TIMEOUT,
});

/**
 * Public API to create a job into async que.
 * 
 * @method addToQue
 * @return {Class} Promise created for the async-que.
 * @param {String} key Unique identifier for the job.
 * @param {Number} [timeout=Timer.TIMEOUT] timeout after which the job should be run.
 */
Timer.addToQue = function(key, timeout) {
  if(Timer.queMap[key]) {
    Timer.queMap[key].set("resolved", true);
    Timer.queMap[key].get("reject")();
  }
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var asyncQue = Timer.AsyncQue.create({key : key, resolve : resolve, reject : reject, timeout : timeout});
      Timer.queMap[key] = asyncQue;
    });
  });
  return promise;
};

Timer.curTimer = null;
Timer.timers = [];

/**
 * A timer module which executes a job periodically.
 *
 * @class Timer.Timer
 */
Timer.Timer = Ember.Object.extend({
  init : function() {
    this._super();
    Timer.timers.push(this);
    this.set("ticks", Math.ceil(this.get("timeout") / Timer.TIMERTIMEOUT));
    if(!Timer.curTimer) {
      Timer.curTimer = setInterval(Timer.timerFunction, Timer.TIMERTIMEOUT);
    }
  },

  /**
   * Periodic timeout after which the job should be executed.
   *
   * @property timeout
   * @type boolean
   * @default Timer.TIMERTIMEOUT
   */
  timeout : Timer.TIMERTIMEOUT,

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
});
Timer.timerFunction = function() {
  if(Timer.timers.length === 0) {
    clearTimeout(Timer.curTimer);
    Timer.curTimer = null;
  }
  else {
    for(var i = 0; i < Timer.timers.length;) {
      var timer = Timer.timers[i];
      timer.decrementProperty("ticks");
      if(timer.get("ticks") === 0) {
        timer.set("ticks", Math.ceil(timer.get("timeout") / Timer.TIMERTIMEOUT));
        timer.timerCallback();
        timer.decrementProperty("count");
      }
      if(timer.get("count") <= 0) {
        Timer.timers.removeAt(i);
        timer.endCallback();
      }
      else {
        i++;
      }
    }
  }
};
