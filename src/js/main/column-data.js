/**
 * Module for meta data of a record type and its properties.
 *
 * @module column-data
 */
ColumnData = Ember.Namespace.create();

/**
 * Class with meta data of a record type.
 *
 * @class ColumnData.ColumnDataGroup
 */
ColumnData.ColumnDataGroup = Ember.Object.extend({
  init : function (){
    this._super();
    this.set("columns", this.get("columns") || []);
    ColumnData.Registry.store(this.get("name"), "columnDataGroup", this);
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
  columns : Utils.hasMany("ColumnData.ColumnData"),

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


ColumnData.Registry = Ember.Object.create({
  map : {},

  store : function(name, parent, columnData) {
    this.get("map")[parent+":"+name] = columnData;
  },

  retrieve : function(name, parent) {
    return this.get("map")[parent+":"+name];
  },
});


/**
 * Class for meta data for a property on a record.
 *
 * @class ColumnData.ColumnData
 */
ColumnData.ColumnData = Ember.Object.extend({
  init : function () {
    this._super();
    ColumnData.Registry.store(this.get("name"), "columnData", this);
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
  validation : Utils.belongsTo("ColumnData.ColumnDataValidation"),

  /**
   * Meta data used by list-group module. Passed as an object while creating.
   *
   * @property list
   * @type Class
   */
  list : Utils.belongsToWithMixin(null, "ListGroup.ListColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by tree module. Passed as an object while creating.
   *
   * @property tree
   * @type Class
   */
  tree : Utils.belongsToWithMixin(null, "Tree.TreeColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by sortable module. Passed as an object while creating.
   *
   * @property sort
   * @type Class
   */
  sort : Utils.belongsToWithMixin(null, "DragDrop.SortableColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by panels module. Passed as an object while creating.
   *
   * @property panel
   * @type Class
   */
  panel : Utils.belongsToWithMixin(null, "Panels.PanelColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by form module. Passed as an object while creating.
   *
   * @property form
   * @type Class
   */
  form : Utils.belongsTo(null, "Form.FormColumnDataMap", "type"),

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
  childCol : Utils.belongsTo("ColumnData.ColumnData"),

  /**
   * A name for the nesting of a column data.
   *
   * @property childColName
   * @type String
   */
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childCol", ColumnData.Registry.retrieve(value, "columnData"));
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
  childColGroup : Utils.belongsTo("ColumnData.ColumnDataGroup"),

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
        this.set("childColGroup", ColumnData.Registry.retrieve(value, "columnDataGroup"));
      }
      return value;
    }
  }.property(),
});


/**
 * Validations for property in record.
 *
 * @submodule column-data-validation
 * @module column-data
 */

ColumnData.ColumnDataValidationsMap = {};

/**
 * Validation class that goes as 'validation' on column data.
 *
 * @class ColumnData.ColumnDataValidation
 */
ColumnData.ColumnDataValidation = Ember.Object.extend({
  init : function() {
    this._super();
    this.canBeEmpty();
  },

  /**
   * Array of validations to run. Passed as objects while creating.
   *
   * @property validations
   * @type Array
   */
  validations : Utils.hasMany(null, ColumnData.ColumnDataValidationsMap, "type"),

  /**
   * @property validate
   * @type Boolean
   * @private
   */
  validate : Ember.computed.notEmpty('validations'),

  /**
   * Method to validate a value on record.
   *
   * @method validateValue
   * @param {any} value Value to validate.
   * @param {Class} record Record to validate on.
   * @param {Array} [validations] Optional override of the validations to run.
   * @returns {Array} Returns an array with 1st element as a boolean which says whether validations passed or not, 2nd element is the invalid message if it failed.
   */
  validateValue : function(value, record, validations) {
    var invalid = [false, ""];
    validations = validations || this.get("validations");
    for(var i = 0; i < validations.length; i++) {
      invalid = validations[i].validateValue(value, record);
      if(invalid[0]) break;
    }
    return invalid;
  },

  canBeEmpty : function() {
    if(this.get("validations") && !this.get("validations").mapBy("type").contains(0)) {
      this.set("mandatory", false);
      this.get("validations").forEach(function(item) {
        item.set('canBeEmpty', true);
      });
    }
    else {
      this.set("mandatory", true);
    }
  }.observes('validations.@each'),

  /**
   * Boolean to denote whether the property is mandatory or not.
   *
   * @property mandatory
   * @type Boolean
   */
  mandatory : false,
});

/**
 * Not empty validation class. Pass type = 0 to get this.
 *
 * @class ColumnData.EmptyValidation
 */
ColumnData.EmptyValidation = Ember.Object.extend({
  /**
   * Message to show when the validation fails.
   *
   * @property invalidMessage
   * @type String
   */
  invalidMessage : "",

  /**
   * Boolean that says whether to negate the result or not.
   *
   * @property negate
   * @type Boolean
   */
  negate : false,

  validateValue : function(value, record) {
    var invalid = Ember.isEmpty(value) || /^\s*$/.test(value),
        negate = this.get("negate");
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },

  canBeEmpty : false,
});

/**
 * Validate on a regex. Pass type = 1 to get this.
 *
 * @class ColumnData.RegexValidation
 */
ColumnData.RegexValidation = ColumnData.EmptyValidation.extend({
  /**
   * Regex to valide with.
   *
   * @property regex
   * @type String
   */
  regex : "",

  /**
   * Regex flags to use while creating the regex object.
   *
   * @property regexFlags
   * @type String
   */
  regexFlags : "",

  /**
   * RegExp object create using regex and regexFlags.
   *
   * @property regexObject
   * @type RegExp
   */
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),

  /**
   * Method to validate.
   *
   * @method validateValue
   * @param {any} value Value to validate.
   * @param {Class} record Record to validate on.
   * @returns {Boolean}
   * @private
   */
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    emptyBool = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    invalid = (isEmpty && emptyBool) || this.get("regexObject").test(value);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

/**
 * Validate on a regex on each value in a Comma Seperated Value. Pass type = 2 to get this.
 *
 * @class ColumnData.CSVRegexValidation
 */
ColumnData.CSVRegexValidation = ColumnData.RegexValidation.extend({
  /**
   * Delimeter to use to split values in the CSV.
   *
   * @property delimeter
   * @type String
   */
  delimeter : ",",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        invalid = this.get("regexObject").test(item); 
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

/**
 * Validate duplication in a CSV. Pass type = 3 to get this.
 *
 * @class ColumnData.CSVDuplicateValidation
 */
ColumnData.CSVDuplicateValidation = ColumnData.CSVRegexValidation.extend({
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool, valuesMap = {};
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        if(valuesMap[item]) {
          invalid = true;
        }
        else {
          valuesMap[item] = 1;
        }
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

/**
 * Validate duplication across siblings of the record. Pass type = 4 to get this.
 *
 * @class ColumnData.DuplicateAcrossRecordsValidation
 */
ColumnData.DuplicateAcrossRecordsValidation = ColumnData.EmptyValidation.extend({
  /**
   * Path relative to record to check duplication under.
   *
   * @property duplicateCheckPath
   * @type String
   */
  duplicateCheckPath : "",

  /**
   * Key in the object to check duplicate for.
   *
   * @property duplicateCheckKey
   * @type String
   */
  duplicateCheckKey : "id",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        arr = record.get(this.get("duplicateCheckPath")),
        values = arr && arr.filterBy(this.get("duplicateCheckKey"), value);
    invalid = (values && values.get("length") > 1) || (values.get("length") === 1 && values[0] !== record);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

/**
 * Validate number ranges. Pass type = 5 to get this.
 *
 * @class ColumnData.NumberRangeValidation
 */
ColumnData.NumberRangeValidation = ColumnData.EmptyValidation.extend({
  /**
   * Min value of a number.
   *
   * @property minValue
   * @type Number
   */
  minValue : 0,

  /**
   * Max value of a number.
   *
   * @property maxValue
   * @type Number
   */
  maxValue : 999999,

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate");
    if(value && value.trim) value = value.trim();
    if(Ember.isEmpty(value)) {
      invalid = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    }
    else {
      var num = Number(value);
      if(num < this.get("minValue") || num > this.get("maxValue")) invalid = true;
    }
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.ColumnDataValidationsMap[0] = ColumnData.EmptyValidation;
ColumnData.ColumnDataValidationsMap[1] = ColumnData.RegexValidation;
ColumnData.ColumnDataValidationsMap[2] = ColumnData.CSVRegexValidation;
ColumnData.ColumnDataValidationsMap[3] = ColumnData.CSVDuplicateValidation;
ColumnData.ColumnDataValidationsMap[4] = ColumnData.DuplicateAcrossRecordsValidation;
ColumnData.ColumnDataValidationsMap[5] = ColumnData.NumberRangeValidation;


/**
 * Utility classes related to column data.
 *
 * @submodule column-data-utils
 * @module column-data
 */

/**
 * A mixin that is a parent of ColumnData.ColumnDataValueMixin that collects value changes and fires listeners on the column.
 *
 * @class ColumnData.ColumnDataChangeCollectorMixin
 */
ColumnData.ColumnDataChangeCollectorMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.set("listenToMap", this.get("listenToMap") || {});
  },
  listenToMap : null,

  bubbleValChange : function(columnData, val, oldVal, callingView) {
    var listenToMap = this.get("listenToMap"), thisCol = this.get("columnData"),
        parentForm = this.get("parentForm");
    if(listenToMap[columnData.name]) {
      listenToMap[columnData.name].forEach(function(listening) {
        var listeningViews = listening.get("views");
        for(var i = 0; i < listeningViews.length; i++) {
          var view = listeningViews[i];
          if(view !== callingView) {
            view.colValueChanged(columnData, val, oldVal);
          }
          if(view.get("columnData.bubbleValues") && parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(columnData, val, oldVal, callingView);
        }
      });
    }
    if(!Ember.isNone(oldVal) && this.get("record")) {
      this.get("record").set("tmplPropChangeHook", columnData.name);
    }
  },

  registerForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), existing,
        callingCol = colView.get("columnData"),
        colName = callingCol.get("name"),
        parentForm = this.get("parentForm");
    if(callingCol.get("bubbleValues") && parentForm && parentForm.registerForValChange) parentForm.registerForValChange(colView, listenColName);
    if(!listenToMap) {
      listenToMap = {};
      this.set("listenToMap", listenToMap);
    }
    listenToMap[listenColName] = listenToMap[listenColName] || [];
    existing = listenToMap[listenColName].findBy("name", colName);
    if(existing) {
      existing.get("views").pushObject(colView);
    }
    else {
      listenToMap[listenColName].pushObject(Ember.Object.create({views : [colView], name : colName}));
    }
  },

  unregisterForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), callingCol = colView.get("columnData"),
        colName = callingCol.get("name"),
        colListener = listenToMap && listenToMap[listenColName],
        existing = colListener && listenToMap[listenColName].findBy("name", colName),
        parentForm = this.get("parentForm");
    if(callingCol.get("bubbleValues") && parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(colView, listenColName);
    if(existing) {
      var existingViews = existing.get("views");
      existingViews.removeObject(colView);
      if(existingViews.length === 0) {
        colListener.removeObject(existing);
      }
      else {
        for(var i = 0; i < existingViews.length; i++) {
          existingViews[i].colValueChanged(Ember.Object.create({name : listenColName, key : listenColName}), null, null);
        }
      }
    }
  },
});

/**
 * A mixin that aliases the value of the attribute given by 'columnData' in 'record' to 'value'.
 *
 * @class ColumnData.ColumnDataValueMixin
 */
ColumnData.ColumnDataValueMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.recordDidChange();
    this.registerForValChangeChild();
  },

  /**
   * Column data instance to be used to extract value.
   *
   * @property columnData
   * @type Class
   */
  columnData : null,

  /**
   * Record to extract the value from.
   *
   * @property record
   * @type Class
   */
  record : null,

  listenedColumnChanged : function(changedColumnData, changedValue, oldValue) {
    this.listenedColumnChangedHook(changedColumnData, changedValue, oldValue);
    if(changedColumnData.get("name") === this.get("columnData.name")) {
      var that = this;
      //The delay is added cos destroy on the view of removed record is called before it is actually removed from array
      //TODO : find a better way to do this check
      Timer.addToQue("duplicateCheck-"+Utils.getEmberId(this), 100).then(function() {
        if(!that.get("isDestroyed")) {
          that.validateValue(that.get("val"));
        }
      });
    }
  },
  listenedColumnChangedHook : function(changedColumnData, changedValue, oldValue) {
  },

  validateValue : function(value) {
    var columnData = this.get("columnData"), record = this.get("record"),
        validation = columnData.get("validation");
    if(validation) {
      if(!this.get("disabled")) {
        var validVal = validation.validateValue(value, record);
        if(validVal[0]) record._validation[columnData.name] = 1;
        else delete record._validation[columnData.name];
        this.set("invalid", validVal[0]);
        this.set("invalidReason", !Ember.isEmpty(validVal[1]) && validVal[1]);
      }
      else {
        delete record._validation[columnData.name];
      }
    }
    record.set("validationFailed", Utils.hashHasKeys(record._validation));
  },

  /**
   * An alias to the value in attribute. It undergoes validations and the change will be bubbled.
   *
   * @property value
   */
  value : function(key, val) {
    var columnData = this.get("columnData"), record = this.get("record"),
        parentForBubbling = this.get("parentForBubbling");
    if(!record || !columnData) return val;
    record._validation = record._validation || {};
    if(arguments.length > 1) {
      if(!(record instanceof DS.Model) || (record.currentState && !record.currentState.stateName.match("deleted"))) {
        var oldVal = record.get(columnData.get("key"));
        this.validateValue(val);
        //TODO : find a better way to fix value becoming null when selection changes
        if(val || !columnData.get("cantBeNull")) {
          record.set(columnData.get("key"), val);
          this.valueDidChange(val);
          if(record.valueDidChange) {
            record.valueDidChange(columnData, val);
          }
          if(parentForBubbling && parentForBubbling.bubbleValChange) parentForBubbling.bubbleValChange(col, value, oldVal, this); 
        }
      }
      return val;
    }
    else {
      val = record.get(columnData.get("key"));
      this.validateValue(val);
      if(parentForBubbling && parentForBubbling.bubbleValChange) parentForBubbling.bubbleValChange(col, value, oldVal, this); 
      return val;
    }
  }.property('columnData', 'view.columnData'),

  valueDidChange : function(val) {
  },

  prevRecord : null,
  recordDidChange : function() {
    var record = this.get("record"), prevRecord = this.get("prevRecord"),
        columnData = this.get("columnData");
    if(prevRecord) {
      Ember.removeObserver(prevRecord, columnData.get("name"), this, "notifyValChange");
    }
    if(record) {
      this.recordChangeHook();
      Ember.addObserver(record, columnData.get("name"), this, "notifyValChange");
      this.set("prevRecord", record);
      this.notifyPropertyChange("val");
    }
    else {
      this.recordRemovedHook();
    }
  }.observes("view.record", "record"),
  recordChangeHook : function() {
    this.notifyPropertyChange('isDisabled');
  },
  recordRemovedHook : function(){
  },

  registerForValChangeChild : function() {
    var columnData = this.get("columnData"), parentForBubbling = this.get("parentForBubbling");
    if(columnData.get("listenForCols")) {
      columnData.get("listenForCols").forEach(function(listenCol) {
        if(parentForBubbling && parentForBubbling.registerForValChange) parentForBubbling.registerForValChange(this, listenCol);
      }, this);
    }
  },

  unregisterForValChangeChild : function() {
    var columnData = this.get("columnData"), parentForBubbling = this.get("parentForBubbling");
    if(columnData.get("listenForCols")) {
      columnData.get("listenForCols").forEach(function(listenCol) {
        if(parentForBubbling && parentForBubbling.unregisterForValChange) parentForBubbling.unregisterForValChange(this, listenCol);
      }, this);
    }
  },

  destroy : function() {
    this._super();
    this.unregisterForValChangeChild();
  },
});

/**
 * A mixin that used by column data group extensions. It adds view lookup paths based on the 'type' and for modules based on <module>Type.
 *
 * @class ColumnData.ColumnDataGroupPluginMixin
 */
ColumnData.ColumnDataGroupPluginMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  /**
   * Type of the column data group extension. Used to extract 'typeLookup' in 'lookupMap' along with 'type'.
   *
   * @property groupType
   * @type String
   */
  groupType : null,

  /**
   * Type of the column data group in extension. Used to extract 'typeLookup' in 'lookupMap' along with 'groupType'.
   *
   * @property type
   * @type String
   */
  type : "base",

  /**
   * View lookup path extracted from 'lookupMap' using 'groupType' and 'type'.
   *     lookupMap[groupType][type]
   *
   * @property typeLookup
   * @type String
   */
  typeLookup : function() {
    return this.get("lookupMap")[this.get("groupType")][this.get("type")];
  }.property("type"),

  arrayProps : ['modules'],

  /**
   * Array of modules present in the extension.
   *
   * @property modules
   * @type Array
   */
  modules : null,

  modulesWillBeDeleted : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.removeObserver(modules[i]+"Type", this, "moduleTypeDidChange");
    }
  },
  modulesWasAdded : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.addObserver(modules[i]+"Type", this, "moduleTypeDidChange");
      this.moduleTypeDidChange(this, modules[i]+"Type");
    }
    this.columnsChanged();
  },

  moduleTypeDidChange : function(obj, key) {
    var module = key.match(/^(\w*)Type$/)[1];
    this.set(module+"Lookup", this.get("lookupMap")[module][this.get(key) || "base"]);
  },

  columnsChanged : function() {
    var columns = this.get("parentObj.columns"), modules = this.get("modules");
    if(columns) {
      for(var i = 0; i < modules.length; i++) {
        this.set(modules[i]+"ColumnData", columns.findBy(this.get("groupType")+".type", modules[i]));
      }
    }
  }.observes("parentObj.columns.@each.panel"),
});


/***   Initilizer   ***/

ColumnData.initializer = function(app) {
  if(app.ColumnData) {
    for(var i = 0; i < app.ColumnData.length; i++) {
      ColumnData.ColumnDataGroup.create(app.ColumnData[i]);
    }
  }
};
