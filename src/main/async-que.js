AsyncQue = Ember.Namespace.create();

AsyncQue.queMap = {};
AsyncQue.TIMEOUT = 500;
AsyncQue.TIMERTIMEOUT = 250;

AsyncQue.AsyncQue = Ember.Object.extend({
  init : function() {
    this._super();
    var that = this, timer;
    Ember.run.later(function() {
      that.timerTimedout();
    }, that.get("timeout") || AsyncQue.TIMEOUT);
  },

  timerTimedout : function() {
    if(!this.get("resolved")) {
      var that = this;
      Ember.run(function() {
        delete AsyncQue.queMap[that.get("key")];
        that.set("resolved", true);
        that.get("resolve")();
      });
    }
  },

  timer : null,
  key : "",
  resolve : null,
  reject : null,
  resolved : false,
  timeout : AsyncQue.TIMEOUT,
});

AsyncQue.addToQue = function(key, timeout) {
  if(AsyncQue.queMap[key]) {
    AsyncQue.queMap[key].set("resolved", true);
    AsyncQue.queMap[key].get("reject")();
  }
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var asyncQue = AsyncQue.AsyncQue.create({key : key, resolve : resolve, reject : reject, timeout : timeout});
      AsyncQue.queMap[key] = asyncQue;
    });
  });
  return promise;
};

AsyncQue.curTimer = null;
AsyncQue.timers = [];
AsyncQue.Timer = Ember.Object.extend({
  init : function() {
    this._super();
    AsyncQue.timers.push(this);
    this.set("ticks", Math.ceil(this.get("timeout") / AsyncQue.TIMERTIMEOUT));
    if(!AsyncQue.curTimer) {
      AsyncQue.curTimer = setInterval(AsyncQue.timerFunction, AsyncQue.TIMERTIMEOUT);
    }
  },
  timeout : AsyncQue.TIMERTIMEOUT,
  ticks : 1,
  count : 0,

  timerCallback : function() {
  },

  endCallback : function() {
  },
});
AsyncQue.timerFunction = function() {
  if(AsyncQue.timers.length === 0) {
    clearTimeout(AsyncQue.curTimer);
    AsyncQue.curTimer = null;
  }
  else {
    for(var i = 0; i < AsyncQue.timers.length;) {
      var timer = AsyncQue.timers[i];
      timer.decrementProperty("ticks");
      if(timer.get("ticks") === 0) {
        timer.set("ticks", Math.ceil(timer.get("timeout") / AsyncQue.TIMERTIMEOUT));
        timer.timerCallback();
        timer.decrementProperty("count");
      }
      if(timer.get("count") <= 0) {
        AsyncQue.timers.removeAt(i);
        timer.endCallback();
      }
      else {
        i++;
      }
    }
  }
};
