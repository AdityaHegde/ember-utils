define([
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
], function(Ember, Utils, ColumnData) {

/**
 * Base input view - a text input view.
 *
 * @class Form.TextInputView
 * @module form
 * @submodule form-items
 */
var TextInputView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  parentForm : null,
  immediateParent : null,
  parentForBubbling : Ember.computed.alias("parentForm"),

  layout : Ember.Handlebars.compile('' +
    '{{#if view.showLabelComp}}<div {{bind-attr class="view.labelClass"}} >' +
      '<label {{bind-attr for="view.columnData.name" }}>{{#if view.columnData.label}}{{view.columnData.label}}{{#if view.columnData.form.mandatory}}*{{/if}}{{/if}}</label>' +
      '{{#if view.columnData.form.helpText}}<div class="label-tooltip">' +
        '{{#tool-tip placement="right" title=view.columnData.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
      '</div>{{/if}}' +
    '</div>{{/if}}'+
    '<div {{bind-attr class="view.inputClass"}}> {{#if view.columnData.form.fieldDescription}}<span>{{view.columnData.form.fieldDescription}}</span>{{/if}}' +
      '<div class="validateField">'+
        '{{yield}}' +
        '{{#unless view.showLabelComp}}'+
          '{{#if view.columnData.form.helpText}}<div class="label-tooltip">' +
            '{{#tool-tip placement="right" title=view.columnData.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
          '</div>{{/if}}' +
        '{{/unless}}'+
        '{{#if view.invalid}}' +
          '{{#if view.invalidReason}}<span class="help-block text-danger">{{view.invalidReason}}</span>{{/if}}' +
        '{{/if}}' +
      '</div>'+
    '</div>' +
  ''),
  template : Ember.Handlebars.compile('{{input class="form-control" autofocus=view.columnData.form.autofocus type="text" value=view.value disabled=view.isDisabled ' +
                                                                   'placeholder=view.columnData.form.placeholderActual maxlength=view.columnData.form.maxlength}}'),
  classNames : ["form-group"],
  classNameBindings : ["columnData.form.additionalClass", "columnData.validation.validations:has-validations", "invalid:has-error", ":has-feedback", "hidden:hidden", "additionalClass"],
  attributeBindings : ["colName:data-column-name"],
  colName : Ember.computed.alias("columnData.name"),
  labelWidthClass : "col-full",
  inputWidthClass : "col-sm-8",
  showLabel : true,
  labelClass : function() {
    var columnData = this.get("columnData"), labelWidthClass = this.get("labelWidthClass");
    return "control-label "+(columnData.labelWidthClass || labelWidthClass);
  }.property("view.columnData", "view.labelWidthClass"),
  inputClass : function() {
    var columnData = this.get("columnData"), inputWidthClass = this.get("inputWidthClass");
    return "control-input "+(columnData.inputWidthClass || inputWidthClass);
  }.property("view.columnData", "view.inputWidthClass"),

  isDisabled : function() {
    var columnData = this.get("columnData"),record = this.get("record");
    this.notifyPropertyChange("value");
    return columnData.get("form.fixedValue") || ((columnData.get("form.disableOnEdit") && record && !record.get("isNew")) || (columnData.get("form.disableOnNew") && record && record.get("isNew")));
  }.property("view.columnData", "view.columnData.form.fixedValue", "view.columnData.form.disableOnEdit", "view.columnData.form.disableOnNew"),

  showLabelComp : function() {
    var columnData = this.get("columnData");
    if(columnData.showLabel === undefined ) return this.get("showLabel");
    return this.get("showLabel") && columnData.showLabel;
  }.property("showLabel", "view.columnData"),

  invalid : false,
  invalidReason : false,

  hidden : false,
  hideCheck : function(changedCol, changedValue) {
    var columnData = this.get("columnData"), record = this.get("record"),
        hideEntry = columnData.get("form.hideForCols") && columnData.get("form.hideForCols").findBy("name", changedCol.get("name"));
    changedValue = changedValue || record.get(changedCol.get("key"));
    if(hideEntry) {
      var eq = hideEntry.value === changedValue, dis = hideEntry.hide, en = hideEntry.show;
      this.set("hidden", (dis && eq) || (en && !eq));
    }
  },
  disableValidation : Ember.computed.alias("hidden"),

  listenedColumnChangedHook : function(changedCol, changedValue, oldValue) {
    this.hideCheck(changedCol, changedValue);
  },

  valueDidChange : function(value) {
  },

  prevRecord : null,
  recordChangeHook : function() {
    this.notifyPropertyChange("isDisabled");
    var hideForCols = this.get("columnData.form.hideForCols");
    if(hideForCols) {
      for(var i = 0; i < hideForCols.length; i++) {
        this.hideCheck(hideForCols[i], this.get("record."+hideForCols[i].get("key")));
      }
    }
  },
  recordRemovedHook : function(){
  },
  title : "test",
});

return {
  TextInputView : TextInputView,
};

});
