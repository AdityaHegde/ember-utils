define([
  "ember",
  "ember_data",
  "lib/ember-utils-core",
], function(Ember, DS, Utils) {

/**
 * Model wrapper model class. No used directly. Instead use createModelWrapper.
 *
 * @class ModelWrapper
 * @for CrudAdapter
 */
var ModelWrapper = DS.Model.extend(Utils.ObjectWithArrayMixin, {
  recordReady : function() {
    var arrayProps = this.get("arrayProps") || [];
    Ember.addObserver(this, "isDirty", this, "attributeDidChange");
    for(var i = 0; i < arrayProps.length; i++) {
      var arrayProp = arrayProps[i];
      this[arrayProp+"WillBeDeleted"] = this.childrenWillBeDeleted;
      this[arrayProp+"WasAdded"] = this.childrenWasAdded;
    }
    this.set("isDirty_alias", this.get("isDirty"));
  },

  childrenWillBeDeleted : function(props, idxs) {
    this._validation = this._validation || {};
    for(var i = 0; i < props.length; i++) {
      var propId = Utils.getEmberId(props[i]);
      delete this._validation[propId];
      Ember.removeObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.removeObserver(props[i], "isDirty", this, "attributeDidChange");
      Ember.removeObserver(props[i], "isLoading", this, "attributeDidChange");
      Ember.removeObserver(props[i], "isReloading", this, "attributeDidChange");
      Ember.removeObserver(props[i], "isSaving", this, "attributeDidChange");
    }
  },

  childrenWasAdded : function(props, idxs) {
    for(var i = 0; i < props.length; i++) {
      this.validationFailedDidChanged(props[i], "validationFailed");
      this.attributeDidChange(props[i], "isDirty");
      Ember.addObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.addObserver(props[i], "isDirty", this, "attributeDidChange");
      Ember.addObserver(props[i], "isLoading", this, "attributeDidChange");
      Ember.addObserver(props[i], "isReloading", this, "attributeDidChange");
      Ember.addObserver(props[i], "isSaving", this, "attributeDidChange");
    }
  },

  validationFailedDidChanged : function(obj, attr) {
    var val = obj.get(attr), objId = Utils.getEmberId(obj);
    this._validation = this._validation || {};
    if(val) {
      this._validation[objId] = 1;
    }
    else {
      delete this._validation[objId];
    }
    this.set("validationFailed", Utils.hashHasKeys(this._validation));
  },

  attributeDidChange : function(obj, attr) {
    this.set(attr+"_alias", this.get(attr) || obj.get(attr));
  },

  /**
   * Boolean to denote validation failure. Poppulated by form module.
   *
   * @property validationFailed
   * @for ModelWrapper
   * @type Boolean
   */
  validationFailed : false,

  /**
   * Bubbled isLoading boolean from child records.
   *
   * @property isLoading_alias
   * @type Boolean
   */
  isLoading_alias : false,

  /**
   * Bubbled isReloading boolean from child records.
   *
   * @property isReloading_alias
   * @type Boolean
   */
  isReloading_alias : Ember.computed.oneWay("isReloading"),

  /**
   * Bubbled isSaving boolean from child records.
   *
   * @property isSaving_alias
   * @type Boolean
   */
  isSaving_alias : Ember.computed.oneWay("isSaving"),

  /**
   * Bubbled isDirty boolean from child records.
   *
   * @property isDirty_alias
   * @type Boolean
   */
  isDirty_alias : Ember.computed.oneWay("isDirty"),
  isNotDirty : Ember.computed.not("isDirty_alias"),

  /**
   * Boolean to denote disabling of save based on isDirty_alias, validationFailed, isLoading_alias, isReloading_alias, isSaving_alias.
   *
   * @property disableSave
   * @type Boolean
   */
  disableSave : Ember.computed.or("isNotDirty", "validationFailed", "isLoading_alias", "isReloading_alias", "isSaving_alias"),
});

var allowedModelAttrs = [{
  /**
   * Array of primary keys for the model. The values of these keys will be joined with '__' and will be assigned to 'id'.
   *
   * @property keys
   * @type Array
   * @static
   */
  attr : "keys",
  defaultValue : "emptyArray",
}, {
  /**
   * API end point on server for transactions for this model.
   *
   * @property apiName
   * @type String
   * @default "data/generic"
   * @static
   */
  attr : "apiName",
  defaultValue : "value",
  value : "data/generic",
}, {
  /**
   * Keys needed to make delete calls. These values will be taken from either the record or 'CrudAdapter.GlobalData'
   *
   * @property deleteParams
   * @type Array
   * @static
   */
  attr : "deleteParams", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys needed to make find calls. These values will be taken from either the record or 'CrudAdapter.GlobalData'
   *
   * @property findParams
   * @type Array
   * @static
   */
  attr : "findParams", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys for extra attributes to be passed along with record attrs during create/update call. These values will be taken from either the record or 'CrudAdapter.GlobalData'
   *
   * @property createUpdateParams
   * @type Array
   * @static
   */
  attr : "createUpdateParams", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys from record to be deleted when making create/update call.
   *
   * @property ignoreFieldsOnCreateUpdate
   * @type Array
   * @static
   */
  attr : "ignoreFieldsOnCreateUpdate", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys from backup data to be deleted when data is recieved from server after a create/update call.
   *
   * @property ignoreFieldsOnRetrieveBackup
   * @type Array
   * @static
   */
  attr : "ignoreFieldsOnRetrieveBackup", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys from record data to be deleted when data is being backed up during a find call.
   *
   * @property removeAttrsFromBackupOnFind
   * @type Array
   * @static
   */
  attr : "removeAttrsFromBackupOnFind", 
  defaultValue : "emptyArray",
}, {
  /**
   * Retain id when backing up data.
   *
   * @property retainId
   * @type Boolean
   * @default false
   * @static
   */
  attr : "retainId", 
  defaultValue : "value",
  value : false,
}, {
  /**
   * Use id from record while backing up (default is to use "new" when creating record and id when updating). Used when records are child records and are not saved directly, in which case the child records must have an id and should be used when backing up.
   *
   * @property useIdForBackup
   * @type Boolean
   * @default false
   * @static
   */
  attr : "useIdForBackup", 
  defaultValue : "value",
  value : false,
}, {
  /**
   * Attribute that will be paginated. Applies during findNext calls.
   *
   * @property paginatedAttribute
   * @type String
   * @default "id"
   * @static
   */
  attr : "paginatedAttribute", 
  defaultValue : "value",
  value : "id",
}, {
  /**
   * Callback called when normalizing record. Will be called twice. Once before serializeRelations is called another by ember-data to normalize payload.
   *
   * @property normalizeFunction
   * @type Function
   * @param {Object} [hash] JSON object of the data returned from server.
   * @static
   */
  attr : "normalizeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called before serializing child records.
   *
   * @property preSerializeRelations
   * @type Function
   * @param {Object} [data] JSON object of the data returned from server.
   * @static
   */
  attr : "preSerializeRelations", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called for serializing data being sent to server.
   *
   * @property serializeFunction
   * @type Function
   * @param {Class} [record] Record being sent to server.
   * @param {Object} [json] JSON object of the data to be sent to server.
   * @static
   */
  attr : "serializeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called after backing up data.
   *
   * @property backupData
   * @type Function
   * @param {Class} [record] Record being backed up.
   * @param {String|Class} [type] Record type.
   * @param {Object} [data] JSON object being backed up.
   * @static
   */
  attr : "backupData", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called after retrieving backup data.
   *
   * @property retrieveBackup
   * @type Function
   * @param {Object} [hash] JSON object returned by server.
   * @param {String|Class} [type] Record type.
   * @param {Object} [data] JSON object stored in backup.
   * @static
   */
  attr : "retrieveBackup", 
  defaultValue : "value",
  value : function() {},
}];

/**
 * Function that returns an ember data model.
 *
 * @method createModelWrapper
 * @fro CrudAdapter
 * @param {Object} [object] JSON that are member attributes.
 * @param {Object} [config] JSON that are static attributes.
 * @param {Array} [mixins] Array of mixins to include.
 */
var createModelWrapper = function(object, config, mixins) {
  var args = mixins || [];
  args.push(object);
  var model = ModelWrapper.extend.apply(ModelWrapper, args);
  for(var i = 0; i < allowedModelAttrs.length; i++) {
    if(config[allowedModelAttrs[i].attr]) {
      model[allowedModelAttrs[i].attr] = config[allowedModelAttrs[i].attr];
    }
    else {
      if(allowedModelAttrs[i].defaultValue === "emptyArray") {
        model[allowedModelAttrs[i].attr] = Ember.A();
      }
      else if(allowedModelAttrs[i].defaultValue === "value") {
        model[allowedModelAttrs[i].attr] = allowedModelAttrs[i].value;
      }
    }
  }
  return model;
};

window.attr = DS.attr;
window.hasMany = DS.hasMany;
window.belongsTo = DS.belongsTo;

return {
  createModelWrapper : createModelWrapper,
};

});
