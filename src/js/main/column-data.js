ColumnData = Ember.Namespace.create();

ColumnData.ColumnDataGroup = Ember.Object.extend({
  init : function (){
    this._super();
    this.set("columns", this.get("columns") || []);
    ColumnData.Registry.store(this.get("name"), "columnDataGroup", this);
  },

  name : "",

  columns : Utils.hasMany("ColumnData.ColumnData"),

  list : Utils.belongsTo("ListGroup.ListColumnDataGroup"),
  tree : Utils.belongsTo("Tree.TreeColumnDataGroup"),
  sort : Utils.belongsTo("DragDrop.SortableColumnDataGroup"),
  panel : Utils.belongsTo("Panels.PanelColumnDataGroup"),

  lazyDisplay : Utils.belongsTo("LazyDisplay.LazyDisplayColumnDataGroup"),

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

/***  ColumnData  ***/

ColumnData.ColumnData = Ember.Object.extend({
  init : function () {
    this._super();
    ColumnData.Registry.store(this.get("name"), "columnData", this);
  },

  name : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),

  validation : Utils.belongsTo("ColumnData.ColumnDataValidation"),

  list : Utils.belongsToWithMixin(null, "ListGroup.ListColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),
  tree : Utils.belongsToWithMixin(null, "Tree.TreeColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),
  //sort : Utils.belongsToWithMixin(null, "DragDrop.SortableColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),
  panel : Utils.belongsToWithMixin(null, "Panels.PanelColumnDataMap", "moduleType", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  form : Utils.belongsTo(null, "Form.FormColumnDataMap", "type"),

  label : null,

  childCol : Utils.belongsTo("ColumnData.ColumnData"),
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childCol", ColumnData.Registry.retrieve(value, "columnData"));
      }
      return value;
    }
  }.property(),
  childColGroup : Utils.belongsTo("ColumnData.ColumnDataGroup"),
  childColGroupName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childColGroup", ColumnData.Registry.retrieve(value, "columnDataGroup"));
      }
      return value;
    }
  }.property(),
});


/***  ColumnDataValidation  ***/

ColumnData.ColumnDataValidationsMap = {};
ColumnData.ColumnDataValidation = Ember.Object.extend({
  init : function() {
    this._super();
    this.canBeEmpty();
  },

  validations : Utils.hasMany(null, ColumnData.ColumnDataValidationsMap, "type"),
  validate : Ember.computed.notEmpty('validations'),
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
      this.get("validations").forEach(function(item) {
        item.set('canBeEmpty', true);
      });
    }
  }.observes('validations.@each'),
});

/** ColumnDataValidations **/

ColumnData.EmptyValidation = Ember.Object.extend({
  invalidMessage : "",
  negate : false,

  validateValue : function(value, record) {
    var invalid = Ember.isEmpty(value) || /^\s*$/.test(value),
        negate = this.get("negate");
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },

  canBeEmpty : false,
});

ColumnData.RegexValidation = ColumnData.EmptyValidation.extend({
  regex : "",
  regexFlags : "",
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),

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

ColumnData.CSVRegexValidation = ColumnData.RegexValidation.extend({
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

ColumnData.DuplicateAcrossRecordsValidation = ColumnData.EmptyValidation.extend({
  duplicateCheckPath : "",
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

ColumnData.NumberRangeValidation = ColumnData.EmptyValidation.extend({
  minValue : 0,
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


/***  MISC   ***/

ColumnData.ColumnDataValueMixin = Ember.Mixin.create({
  columnData : null,
  record : null,

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

  value : function(key, val) {
    var columnData = this.get("columnData"), record = this.get("record"),
        parentForm = this.get("parentForm");
    if(!record || !columnData) return val;
    record._validation = record._validation || {};
    if(arguments.length > 1) {
      if(!(record instanceof DS.Model) || (record.currentState && !record.currentState.stateName.match("deleted"))) {
        var oldVal = record.get(columnData.get("key"));
        this.validateValue(val);
        //TODO : find a better way to fix value becoming null when selection changes
        if(val || !columnData.get("cantBeNull")) {
          record.set(columnData.get("key"), val);
        }
      }
      return val;
    }
    else {
      val = record.get(columnData.get("key"));
      this.validateValue(val);
      return val;
    }
  }.property('columnData', 'view.columnData'),

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
});

ColumnData.ColumnDataGroupPluginMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  type : "base",
  typeLookup : function() {
    return this.get("lookupMap")[this.get("groupType")][this.get("type")];
  }.property("type"),

  arrayProps : ['modules'],
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
