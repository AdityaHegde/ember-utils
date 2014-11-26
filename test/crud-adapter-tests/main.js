define([
  "./model-setup",
  "./helper-setup",
  "./model-wrapper",
  "./simple-record",
  "./hasMany-record",
], function() {
  var testSuits = arguments;
  return function() {
    for(var i = 2; i < testSuits.length; i++) {
      testSuits[i]();
    }
  };
});
