define([
  "ember",
], function(Ember) {

/**
 * Default timeout for the asyncQue.
 *
 * @property TIMEOUT
 * @for Timer
 * @type Number
 * @default 500
 * @static
 */
var TIMEOUT = 500;

/**
 * Timer ticks.
 *
 * @property TIMERTIMEOUT
 * @for Timer
 * @type Number
 * @default 250
 * @static
 */
var TIMERTIMEOUT = 250;

return {
  TIMEOUT : TIMEOUT,
  TIMERTIMEOUT : TIMERTIMEOUT,
};

});
