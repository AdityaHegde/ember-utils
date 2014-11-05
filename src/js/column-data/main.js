/**
 * Module for meta data of a record type and its properties.
 *
 * @module column-data
 */
define([
  "./columnDataGroup",
  "./columnData",
  "./validations/main",
  "./utils/main",
], function() {
  var ColumnData = Ember.Namespace.create();
  window.ColumnData = ColumnData;

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ColumnData[k] = arguments[i][k];
      }
    }
  }

  ColumnData.initializer = function(app) {
    if(app.ColumnData) {
      for(var i = 0; i < app.ColumnData.length; i++) {
        ColumnData.ColumnDataGroup.create(app.ColumnData[i]);
      }
    }
  };

  return ColumnData;
});
