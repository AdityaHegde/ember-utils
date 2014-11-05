define([
  "ember",
  "./registry",
  "./validations/columnDataValidation",
  "core/belongsTo",
], function(Ember, Registry, ColumnDataValidation, belongsTo) {
belongsTo = belongsTo.belongsTo;

/**
 * Class for meta data for a property on a record.
 *
 * @class ColumnData.ColumnData
 */
var ColumnData = Ember.Object.extend({
  init : function () {
    this._super();
    Registry.store(this.get("name"), "columnData", this);
  },

  /**
   * A name to uniquely identify column data.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Key name of the attribute in the record. If not provided, 'name' is used a key.
   *
   * @property keyName
   * @type String
   */
  keyName : "",

  /**
   * Key of the attribute based on keyName or name if keyName is not provided.
   *
   * @property key
   * @type String
   * @private
   */
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),

  /**
   * Meta data for the validation of the attribute on the record. Passed as an object while creating.
   *
   * @property validation
   * @type Class
   */
  validation : belongsTo(ColumnDataValidation),

  /**
   * Meta data used by list-group module. Passed as an object while creating.
   *
   * @property list
   * @type Class
   */
  list : belongsTo("ListGroup.ListColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by tree module. Passed as an object while creating.
   *
   * @property tree
   * @type Class
   */
  tree : belongsTo("Tree.TreeColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by sortable module. Passed as an object while creating.
   *
   * @property sort
   * @type Class
   */
  sort : belongsTo("DragDrop.SortableColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by panels module. Passed as an object while creating.
   *
   * @property panel
   * @type Class
   */
  panel : belongsTo("Panels.PanelColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by form module. Passed as an object while creating.
   *
   * @property form
   * @type Class
   */
  form : Utils.belongsTo("Form.FormColumnDataMap", "type"),

  /**
   * A suitable label for the attribute used in displaying in certain places.
   *
   * @property label
   * @type String
   */
  label : null,

  /**
   * A nested child column data.
   *
   * @property childCol
   * @type Class
   * @private
   */
  childCol : belongsTo("ColumnData.ColumnData"),

  /**
   * A name for the nesting of a column data.
   *
   * @property childColName
   * @type String
   */
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childCol", Registry.retrieve(value, "columnData"));
      }
      return value;
    }
  }.property(),

  /**
   * A nested child column data group.
   *
   * @property childColGroup
   * @type Class
   * @private
   */
  childColGroup : belongsTo("ColumnData.ColumnDataGroup"),

  /**
   * A name for the nesting of a column data group.
   *
   * @property childColGroupName
   * @type String
   * @private
   */
  childColGroupName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childColGroup", Registry.retrieve(value, "columnDataGroup"));
      }
      return value;
    }
  }.property(),
});

return {
  ColumnData : ColumnData,
};

});
