define([
  "ember",
  "lib/ember-utils-core",
  "./multipleValue",
  "./copyValuesToObject",
  "./copyValuesToRecord",
], function(Ember, Utils, MultipleValue, CopyValuesToObject, CopyValuesToRecord) {

/**
 * Mixin which enables views to have multiple values.
 *
 * @class Form.MultipleValueMixin
 * @module form
 * @submodule form-items
 */
var MultipleValueMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    var values = this.get("values");
    this.set("values", Ember.isEmpty(values) ? [] : values);
    if(this.get("value")) this.valArrayDidChange();
    else this.valuesArrayDidChange();
  },

  values : Utils.hasMany(MultipleValue.MultipleValue),

  valuesCount : function() {
    return this.get("values.length") || 0;
  }.property('values.@each'),

  valuesArrayDidChange : function() {
    if(!this.get("values") || this.get("lock")) return;
    var value = this.get("value"), values = this.get("values"),
        valLength = value && value.get("length"), valuesLength = values.get("length"),
        columnData = this.get("columnData"), record = this.get("record");
    if(value) {
      this.set("lock", true);
      values.forEach(function(val, idx) {
        var valObj = value.objectAt(idx);
        if(valObj) {
          valObj.set(columnData.get("form.arrayCol"), val.get("value"));
          CopyValuesToRecord(valObj, columnData, record, val);
        }
        else {
          var data = { /*id : columnData.get("name")+"__"+csvid++*/ };
          data[columnData.get("form.arrayCol")] = val.get("value");
          CopyValuesToObject(data, columnData, record, val);
          if(record.addToProp) {
            record.addToProp(columnData.get("key"), CrudAdapter.createRecordWrapper(record.store, columnData.get("form.arrayType"), data));
          }
          else {
            value.pushObject(CrudAdapter.createRecordWrapper(record.store, columnData.get("form.arrayType"), data));
          }
        }
      });
      if(valLength > valuesLength) {
        for(var i = valuesLength; i < valLength; i++) {
          value.popObject();
        }
      }
      this.set("lock", false);
    }
  }.observes('values.@each.value', 'view.values.@each.value'),

  valArrayDidChange : function() {
    if(this.get("lock")) return;
    var value = this.get("value"), columnData = this.get("columnData");
    if(value) {
      var values, val = this.get("value");
      values = this.valuesMultiCreateHook(value);
      this.set("lock", true);
      this.set("values", values);
      this.set("lock", false);
    }
  }.observes('value.@each', 'view.value.@each'),

  valuesMultiCreateHook : function(value) {
    if(value.map) {
      return value.map(function(e, i, a) {
        return this.valuesElementCreateHook(e);
      }, this);
    }
    return [];
  },

  valuesElementCreateHook : function(element) {
    var columnData = this.get("columnData");
    return {val : element.get(columnData.get("form.arrayCol")), columnData : columnData};
  },

  lock : false,

  valuesWereInvalid : function() {
    //for now arrayCol is present for all multi value cols
    //change this check if there are exceptions
    if(!this.get("columnData.form.arrayCol")) return;
    var values = this.get("values"),
        isInvalid = !values || values.get("length") === 0 || values.anyBy("isInvalid", true),
        record = this.get("record"), columnData = this.get("columnData");
    if(!record) return;
    if(this.get("disabled")) {
      delete record._validation[columnData.get("name")];
    }
    else {
      this.set("invalid", isInvalid);
      record._validation = record._validation || {};
      if(isInvalid) {
        record._validation[columnData.get("name")] = 1;
      }
      else {
        delete record._validation[columnData.get("name")];
      }
    }
    this.validateValue();
  }.observes('values.@each.isInvalid', 'view.values.@each.isInvalid', 'disabled', 'view.disabled'),
});

return {
  MultipleValueMixin : MultipleValueMixin,
};

});
