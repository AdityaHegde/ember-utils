define([
  "ember",
  "lib/ember-utils-core",
  "./staticSelectView",
  "./multipleValueMixin",
], function(Ember, Utils, StaticSelectView, MultipleValueMixin) {

/**
 * View for a select tag with dynamic options.
 *
 * @class Form.DynamicSelectView
 * @extends Form.StaticSelectView
 * @module form
 * @submodule form-items
 */
var DynamicSelectView = StaticSelectView.StaticSelectView.extend({
  init : function() {
    this._super();
    var columnData = this.get("columnData");
    Ember.addObserver(this,columnData.get("form.dataPath")+".@each",this,"dataDidChange");
  },

  classNameBindings : ['hideOnEmpty:hidden'],
  hideOnEmpty : false,

  selectOptions : function() {
    var columnData = this.get("columnData.form"), data = [], opts = [],
        dataPath = columnData.get("dataPath");
    if(dataPath) {
      data = Ember.get(dataPath) || this.get(dataPath);
    }
    else {
      data = columnData.data || [];
    }
    if(data) {
      data.forEach(function(item) {
        opts.push(Ember.Object.create({ val : item.get(columnData.get("dataValCol")), label : item.get(columnData.get("dataLabelCol"))}));
      }, this);
    }
    if(columnData.get("hideOnEmpty") && opts.length - columnData.get("hideEmptyBuffer") === 0) {
      this.set("hideOnEmpty", true);
    }
    else {
      this.set("hideOnEmpty", false);
    }
    return opts;
  }.property('view.columnData'),

  dataDidChange : function(){
    this.notifyPropertyChange("selectOptions");
    this.rerender();
  },

  recordChangeHook : function() {
    this._super();
    this.notifyPropertyChange("selection");
  },

  valueDidChange : function() {
    this.notifyPropertyChange("selection");
  },

  selection : function(key, value) {
    var columnData = this.get("columnData.form");
    if(arguments.length > 1) {
      this.set("value", value && columnData && value.get("val"));
      return value;
    }
    else {
      return columnData && this.get("selectOptions").findBy("val", this.get("value"));
    }
  }.property(),

  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'prompt=view.columnData.form.prompt selection=view.selection disabled=view.isDisabled}}'),
});

return {
  DynamicSelectView : DynamicSelectView,
};

});
