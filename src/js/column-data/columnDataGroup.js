define([
  "ember",
  "./registry",
  "./columnData",
  "lib/ember-utils-core",
], function(Ember, Registry, ColumnData, Utils) {

/**
 * Class with meta data of a record type.
 *
 * @class ColumnData.ColumnDataGroup
 */
var ColumnDataGroup = Ember.Object.extend({
  init : function (){
    this._super();
    this.set("columns", this.get("columns") || []);
    Registry.store(this.get("name"), "columnDataGroup", this);
  },

  /**
   * A name to uniquely identify the column data group.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Array of columns. Each element is an object which will be passed to ColumnData.ColumnData.create.
   *
   * @property columns
   * @type Array
   */
  columns : Utils.hasMany(ColumnData.ColumnData),

  /**
   * Meta data used by list-group module. Passed as an object while creating.
   *
   * @property list
   * @type Class
   */
  list : Utils.belongsTo("ListGroup.ListColumnDataGroup"),

  /**
   * Meta data used by tree module. Passed as an object while creating.
   *
   * @property tree
   * @type Class
   */
  tree : Utils.belongsTo("Tree.TreeColumnDataGroup"),

  /**
   * Meta data used by sortable module. Passed as an object while creating.
   *
   * @property sort
   * @type Class
   */
  sort : Utils.belongsTo("DragDrop.SortableColumnDataGroup"),

  /**
   * Meta data used by panels module. Passed as an object while creating.
   *
   * @property panel
   * @type Class
   */
  panel : Utils.belongsTo("Panels.PanelColumnDataGroup"),

  /**
   * Meta data used by lazy-display module. Passed as an object while creating.
   *
   * @property lazyDisplay
   * @type Class
   */
  lazyDisplay : Utils.belongsTo("LazyDisplay.LazyDisplayColumnDataGroup"),

  /**
   * Meta data used by form module. Passed as an object while creating.
   *
   * @property form
   * @type Class
   */
  form : Utils.belongsTo("Form.FormColumnDataGroup"),
});

return {
  ColumnDataGroup : ColumnDataGroup,
  Registry : Registry,
};

});
