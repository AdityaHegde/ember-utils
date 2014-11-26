(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define(['jquery', 'ember', 'ember_data'], factory);
  } else {
    // Browser globals.
    factory(root.$);
  }
}(this, function($) {
