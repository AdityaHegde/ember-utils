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
var DynamicSelectView = StaticSelectView.StaticSelectView.extend(MultipleValueMixin.MultipleValueMixin, Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var columnData = this.get("columnData");
    Ember.addObserver(this,columnData.get("form.dataPath")+".@each",this,"dataDidChange");
  },

  classNameBindings : ['hideOnEmpty:hidden'],
  hideOnEmpty : false,

  selectOptions : function() {
    var columnData = this.get("columnData"), data = [], opts = [];
    if(columnData.dataPath) {
      data = Ember.get(columnData.dataPath) || this.get(columnData.dataPath);
    }
    else {
      data = columnData.data || [];
    }
    if(data) {
      data.forEach(function(item) {
        opts.push(Ember.Object.create({ val : item.get(columnData.dataValCol), label : item.get(columnData.dataLabelCol)}));
      }, this);
    }
    if(columnData.get("form.hideOnEmpty") && opts.length - columnData.get("form.hideEmptyBuffer") === 0) {
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

  selection : function(key, value) {
    if(arguments.length > 1) {
      if(this._state !== "preRender") {
        if(this.get("columnData.form.multiple")) {
          if(Ember.isEmpty(value[0])) {
            //initially the selection is an array with undef as its 1st element
            //this.set("values", []);
          }
          else {
            this.set("values", value); 
          }
        }
        else {
          this.set("value", value && value.val);
        }
      }
      return value;
    }
    else {
      var options = this.get("selectOptions"), sel;
      if(this.get("columnData.form.multiple")) {
        var values = this.get("values"), columnData = this.get("columnData");
        if(values && values.get("length")) {
          sel = options.filter(function(e, i, a) {
            return !!values.findBy("value", e.get("value"));
          });
        }
      }
      else {
        sel = options.findBy("value", this.get("value"));
      }
      return sel;
    }
  }.property("view.values.@each", "values.@each"),

  recordChangeHook : function() {
    this._super();
    this.notifyPropertyChange("selection");
  },

  valueDidChange : function() {
    this.notifyPropertyChange("selection");
  },

  selectionWasAdded : function(addedSels, idxs, fromSetFunc) {
    if(this.get("columnData.form.multiple") && !fromSetFunc) {
      this.set("values", this.get("selection"));
    }
  },

  arrayProps : ["selection"],

  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'multiple=view.columnData.form.multiple prompt=view.columnData.form.prompt selection=view.selection disabled=view.isDisabled}}'),
});

return {
  DynamicSelectView : DynamicSelectView,
};

});
