define([
  "ember",
  "../../global-module/main",
  "../list-item/main",
], function(Ember, GlobalModules, ListItem) {

/**
 * A column data group for the list group module.
 *
 * @class ListGroup.ListColumnDataGroup
 * @module list-group
 * @submodule list-column-data
 */
var ListColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "list",
  modules : ["title", "rightBlock", "desc"],
  lookupMap : ListItem.NameToLookupMap,

  /**
   * Type of title view.
   *
   * @property titleType
   * @type String
   * @default "displayText"
   */
  //titleType : "displayText",

  /**
   * Type of right block view.
   *
   * @property rightBlockType
   * @type String
   * @default "displayText"
   */
  //rightBlockType : "displayText",

  /**
   * Type of desc view.
   *
   * @property descType
   * @type String
   * @default "displayText"
   */
  //descType : "displayText",
});

return {
  ListColumnDataGroup : ListColumnDataGroup,
};

});
