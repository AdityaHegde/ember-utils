/**
 * Different list item views.
 *
 * @module list-group
 * @submodule list-column-data
 */
define([
  "./listColumnDataGroup",
  "./listColumnData",
], function() {
  var ListGroupItem = {};

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ListGroupItem[k] = arguments[i][k];
      }
    }
  }

  ListGroupItem.NameToLookupMap = {
    "base" : "listGroup/listItem",
  };

  return ListGroupItem;
});
