define([
  "ember",
  "./timer-consts",
], function(Ember, TimerConsts) {

var queMap = {};

/**
 * @class AsyncQue
 * @for Timer
 * @private
 */
var AsyncQue = Ember.Object.extend({
  init : function() {
    this._super();
    var that = this, timer;
    Ember.run.later(function() {
      that.timerTimedout();
    }, that.get("timeout") || TimerConsts.TIMEOUT);
  },

  timerTimedout : function() {
    if(!this.get("resolved")) {
      var that = this;
      Ember.run(function() {
        delete queMap[that.get("key")];
        that.set("resolved", true);
        that.get("resolve")();
      });
    }
  },

  /**
   * native timer
   *
   * @property timer
   * @for AsyncQue
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
  timeout : TimerConsts.TIMEOUT,
});

/**
 * Public API to create a job into async que.
 * 
 * @method addToQue
 * @for Timer
 * @return {Class} Promise created for the async-que.
 * @param {String} key Unique identifier for the job.
 * @param {Number} [timeout=Timer.TIMEOUT] timeout after which the job should be run.
 */
var addToQue = function(key, timeout) {
  if(queMap[key]) {
    queMap[key].set("resolved", true);
    queMap[key].get("reject")();
  }
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var asyncQue = AsyncQue.create({key : key, resolve : resolve, reject : reject, timeout : timeout});
      queMap[key] = asyncQue;
    });
  });
  return promise;
};

return {
  addToQue : addToQue,
};

});
