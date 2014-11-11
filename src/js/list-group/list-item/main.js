/**
 * Different list item views.
 *
 * @module list-group
 * @submodule list-item
 */
define([
  "./listItemView",
], function() {
  var ListItem = {};

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ListItem[k] = arguments[i][k];
      }
    }
  }

  ListItem.NameToLookupMap = {
    "base" : "listGroup/listItem",
  };

  return ListItem;
});
