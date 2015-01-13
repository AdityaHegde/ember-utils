define([
  "ember",
  "lib/ember-utils-core",
  "../../lazy-display/main",
  "./fileUploadView",
  "./multipleValueMixin",
  "./multipleValue",
], function(Ember, Utils, LazyDisplay, FileUploadView, MultipleValueMixin, MultipleValue) {

/**
 * Input to accept csv data. Can be uploaded from a file or entered manually. INCOMPLETE!
 *
 * @class Form.CSVDataInputView
 * @extends Form.FileUploadView
 * @module form
 * @submodule form-items
 */
//TODO : find a better way to set id
var csvid = 0;
var CSVDataValue = Ember.View.extend(LazyDisplay.LazyDisplayRow, {
  template : Ember.Handlebars.compile('' +
                                      '<div {{bind-attr class=":form-group view.data.isInvalid:has-error view.data.showInput:has-input view.data.showInput:has-feedback :csv-value"}}>' +
                                        '{{#if view.data.showInput}}' +
                                          '{{view Ember.TextField class="form-control input-sm" value=view.data.val}}' +
                                          '<span {{bind-attr class=":form-control-feedback"}}></span>' +
                                        '{{else}}' +
                                          '<p class="form-control-static">{{view.data.val}}</p>' +
                                        '{{/if}}' +
                                      '</div>' +
                                      ''),

  data : null,
});

var CSVEntry = MultipleValue.MultipleValue.extend({
  val : function(key, value) {
    var col = this.get("col");
    if(arguments.length > 1) {
      if(!Ember.isNone(col)) {
        var validation = col.validateValue(value, null, col.get("validation.eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
          if(!this.get("validated")) {
            this.set("showInput", true);
          }
        }
        else {
          this.set("isInvalid", false);
        }
        this.set("validated", true);
      }
      return value;
    }
  }.property('col'),
  showInput : false,
  validated : false,
  col : null,
});

var CSVDataDummyValue = Ember.View.extend(LazyDisplay.LazyDisplayDummyRow, {
  classNames : ["csv-dummy-value"],
  template : Ember.Handlebars.compile(''),
});

var CSVDataValues = Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
  getRowView : function(row) {
    return CSVDataValue.create({
      data : row,
    });
  },

  getDummyView : function() {
    return CSVDataDummyValue.create();
  },
});

var CSVDataInputView = FileUploadView.FileUploadView.extend(MultipleValueMixin.MultipleValueMixin, {
  template : Ember.Handlebars.compile('' +
                                      '{{view.columnData.form.description}}' +
                                      '{{#if view.hasFile}}' +
                                        '{{view.fileName}} ({{view.valuesCount}} {{view.columnData.form.entityPlural}})' +
                                        '<button class="btn btn-link" {{action "remove" target="view"}}>Remove</button> | ' +
                                        '<button class="btn btn-link" {{action "replace" target="view"}}>Replace</button>' +
                                        '{{view "lazyDisplay/lazyDisplay" classNameBindings=":form-sm :csv-values-wrapper" columnDataGroup=view.columnData.childColGroup rows=view.valuesTransformed}}' +
                                      '{{else}}' +
                                        '{{textarea class="form-control" autofocus="view.columnData.form.autofocus" value=view.csvVal rows=view.columnData.rows cols=view.columnData.cols ' +
                                                                        'placeholder=view.columnData.form.placeholderActual maxlength=view.columnData.form.maxlength ' +
                                                                        'readonly=view.columnData.form.readonly}}' +
                                        '<div class="upload-help-text">'+
                                        '<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.columnData.form.btnLabel}}</button>' +
                                        '</div>'+
                                      '{{/if}}' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.columnData.form.accept"}}>' +
                                      ''),

  hasFile : false,

  values : Utils.hasMany(CSVEntry),
  valuesTransformed : function() {
    var values = this.get("values"), valuesTransformed = [];
    valuesTransformed.pushObjects(values.filterBy("showInput", true));
    valuesTransformed.pushObjects(values.filterBy("showInput", false));
    //console.log("valuesTransformed");
    return valuesTransformed;
  }.property("view.values.@each.showInput", "values.@each.showInput"),
  setToValues : function(value) {
    var columnData = this.get("columnData"), values = value.split(new RegExp(columnData.get("form.splitRegex")));
    //this.set("value", value);
    for(var i = 0; i < values.length;) {
      if(Ember.isEmpty(values[i])) {
        values.splice(i, 1);
      }
      else {
        values.splice(i, 1, {columnData : columnData, value : values[i++]});
      }
    }
    this.set("values", values);
  },

  csvVal : function(key, value) {
    var columnData = this.get("columnData"), that = this;
    if(arguments.length > 1) {
      //calculate 'values' after a delay to avoid multiple calcuations for every keystroke
      Timer.addToQue("csvvalues-"+columnData.get("name"), 1500).then(function() {
        if(!that.get("isDestroyed")) {
          that.setToValues(value);
        }
      });
      return value;
    }
    else {
      var values = this.get("values");
      return values && values.mapBy("value").join(", ");
    }
  }.property("view.values.@each", "values.@each", "view.row", "row"),

  recordChangeHook : function() {
    this._super();
    this.set("hasFile", false);
    //this.set("csvVal", "");
    //this.set("values", []);
    //the validation happens after a delay. so initially set invalid to true if its a new record else false
    this.set("invalid", this.get("record.isNew"));
  },

  postRead : function(data) {
    this.setToValues(data);
    this.set("hasFile", true);
  },

  postFail : function(message) {
    this.set("hasFile", false);
  },

  actions : {
    remove : function() {
      this.set("hasFile", false);
      this.set("csvVal", "");
      this.setToValues("");
    },

    replace : function() {
      $(this.get("element")).find("input[type='file']").click();
    },
  },
});

return {
  CSVDataInputView : CSVDataInputView,
  CSVDataValues : CSVDataValues,
};

});
