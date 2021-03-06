define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * A mixin that aliases the value of the attribute given by 'columnData' in 'record' to 'value'.
 *
 * @class ColumnDataValueMixin
 * @module column-data
 * @submodule column-data-utils
 */
var ColumnDataValueMixin = Ember.Mixin.create({
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
  /**
   * Callback callled when the column listened on changes.
   *
   * @method listenedColumnChangedHook
   * @param {ColumnData} changedColumnData ColumnData instance of the changed column.
   * @param {any} changedValue
   * @param {any} oldValue
   */
  listenedColumnChangedHook : function(changedColumnData, changedValue, oldValue) {
  },

  disableValidation : false,
  validateValue : function(value) {
    var columnData = this.get("columnData"), record = this.get("record"),
        validation = columnData.get("validation");
    if(validation) {
      if(!this.get("disableValidation")) {
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
        //if(val || !columnData.get("cantBeNull")) {
          record.set(columnData.get("key"), val);
          this.valueChangeHook(val);
          if(parentForBubbling && parentForBubbling.bubbleValChange) parentForBubbling.bubbleValChange(columnData, val, oldVal, this); 
        //}
      }
      return val;
    }
    else {
      val = record.get(columnData.get("key"));
      this.validateValue(val);
      if(parentForBubbling && parentForBubbling.bubbleValChange) parentForBubbling.bubbleValChange(columnData, val, oldVal, this); 
      return val;
    }
  }.property("columnData.key", "view.columnData.key", "disableValidation", "view.disableValidation"),

  /**
   * Callback called when the value changes.
   *
   * @method valueChangeHook
   * @param {any} val
   */
  valueChangeHook : function(val) {
  },

  prevRecord : null,
  recordDidChange : function() {
    var record = this.get("record"), prevRecord = this.get("prevRecord"),
        columnData = this.get("columnData");
    if(prevRecord) {
      Ember.removeObserver(prevRecord, columnData.get("key"), this, "notifyValChange");
    }
    if(record) {
      this.recordChangeHook();
      Ember.addObserver(record, columnData.get("key"), this, "notifyValChange");
      this.set("prevRecord", record);
    }
    else if(prevRecord) {
      this.recordRemovedHook();
    }
    this.notifyPropertyChange("value");
  }.observes("record", "view.record"),
  /**
   * Callback called when record changes.
   *
   * @method recordChangeHook
   */
  recordChangeHook : function() {
  },
  /**
   * Callback called when record is removed (set to null).
   *
   * @method recordRemovedHook
   */
  recordRemovedHook : function(){
  },

  notifyValChange : function(obj, key) {
    this.notifyPropertyChange("value");
    this.valueChangeHook(this.get("value"));
  },

  registerForValChangeChild : function() {
    var columnData = this.get("columnData"), parentForBubbling = this.get("parentForBubbling");
    if(columnData && columnData.get("columnListenerEntries")) {
      columnData.get("columnListenerEntries").forEach(function(listenCol) {
        if(parentForBubbling && parentForBubbling.registerForValChange) parentForBubbling.registerForValChange(this, listenCol);
      }, this);
    }
  }.observes("columnData", "view.columnData"),

  unregisterForValChangeChild : function() {
    var columnData = this.get("columnData"), parentForBubbling = this.get("parentForBubbling");
    if(columnData.get("columnListenerEntries")) {
      columnData.get("columnListenerEntries").forEach(function(listenCol) {
        if(parentForBubbling && parentForBubbling.unregisterForValChange) parentForBubbling.unregisterForValChange(this, listenCol);
      }, this);
    }
  },

  /**
   * Parent object with mixin ColumnData.ColumnDataChangeCollectorMixin to bubble to.
   *
   * @property parentForBubbling
   * @type Instance
   */
  parentForBubbling : null,

  destroy : function() {
    this._super();
    this.unregisterForValChangeChild();
  },
});

return {
  ColumnDataValueMixin : ColumnDataValueMixin,
};

});
