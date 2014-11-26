define([
  "./form-setup",
  "./form-items",
], function() {
  var testSuits = arguments;
  return function() {
    for(var i = 1; i < testSuits.length; i++) {
      testSuits[i]();
    }
  };
});
