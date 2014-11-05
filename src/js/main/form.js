Form = Ember.Namespace.create();

Form.MultiColumnMixin = Ember.Mixin.create({
  parentForRows : function() {
    return this;
  }.property(),

  columnDataGroup : null,

  filteredCols : function() {
    var cols = this.get("columnDataGroup.columns"), record = this.get("record"), that = this;
    if(cols) {
      return cols.filter(function(col) {
        return that.canAddCol(col, record);
      });
    }
    return [];
  }.property('columnDataGroup.columns.@each.form', 'view.columnDataGroup.columns.@each.form', 'record.isNew', 'view.record.isNew'),

  canAddCol : function(col, record) {
    return !col.get('form.isOnlyTable') && (!col.get("form.removeOnEdit") || !record || record.get("isNew")) && (!col.get("form.removeOnNew") || !record || !record.get("isNew"));
  },

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.filteredCols}}' +
        '{{view form.formType record=thatView.record col=this labelWidthClass=thatView.columnDataGroup.form.labelWidthClass inputWidthClass=thatView.columnDataGroup.form.inputWidthClass ' +
                             'tagName=thatView.columnDataGroup.form.tagName showLabel=thatView.columnDataGroup.form.showLabel parentForm=thatView.parentForRows immediateParent=thatView}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

Form.MultiInputViewParentMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.set("listenToMap", this.get("listenToMap") || {});
    this.set("duplicateCheckMap", this.get("duplicateCheckMap") || {});
  },
  listenToMap : null,

  bubbleValChange : function(col, val, oldVal, callingView) {
    var listenToMap = this.get("listenToMap"), thisCol = this.get("col"),
        parentForm = this.get("parentForm");
    if(thisCol) {
      var checkDuplicates = thisCol.get("checkDuplicates");
      if(checkDuplicates && checkDuplicates.contains(col.name)) {
        console.log(checkDuplicates);
      }
    }
    if(listenToMap[col.name]) {
      listenToMap[col.name].forEach(function(listening) {
        var listeningViews = listening.get("views");
        for(var i = 0; i < listeningViews.length; i++) {
          var view = listeningViews[i];
          if(view !== this.callingView) {
            view.colValueChanged(col, val, oldVal);
          }
          if(view.get("col.form.bubbleValues") && parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, val, oldVal, callingView);
        }
      }, {val : val, col : col, callingView : callingView});
    }
    if(!Ember.isNone(oldVal) && this.get("record")) {
      this.get("record").set("tmplPropChangeHook", col.name);
    }
  },

  registerForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), existing,
        callingCol = colView.get("col"),
        colName = callingCol.get("name"),
        parentForm = this.get("parentForm");
    if(callingCol.get("form.bubbleValues") && parentForm && parentForm.registerForValChange) parentForm.registerForValChange(colView, listenColName);
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
    var listenToMap = this.get("listenToMap"), callingCol = colView.get("col"),
        colName = callingCol.get("name"),
        colListener = listenToMap && listenToMap[listenColName],
        existing = colListener && listenToMap[listenColName].findBy("name", colName),
        parentForm = this.get("parentForm");
    if(callingCol.get("form.bubbleValues") && parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(colView, listenColName);
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

Form.FormView = Ember.View.extend(Form.MultiColumnMixin, Form.MultiInputViewParentMixin, {
  childTagNames : 'div',
  classNames : ['form-horizontal'],
});

Form.TextInputView = Ember.View.extend({
  init : function() {
    this._super();
    this.recordDidChange();
    this.registerForValChangeChild();
  },

  parentForm : null,
  immediateParent : null,

  layout : Ember.Handlebars.compile('' +
    '{{#if view.showLabelComp}}<div {{bind-attr class="view.labelClass"}} >' +
      '<label {{bind-attr for="view.col.name" }}>{{#if view.col.label}}{{view.col.label}}{{#if view.col.form.mandatory}}*{{/if}}{{/if}}</label>' +
      '{{#if view.col.form.helpText}}<div class="label-tooltip">' +
        '{{#tool-tip placement="right" title=view.col.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
      '</div>{{/if}}' +
    '</div>{{/if}}'+
    '<div {{bind-attr class="view.inputClass"}}> {{#if view.col.form.fieldDescription}}<span>{{view.col.form.fieldDescription}}</span>{{/if}}' +
      '<div class="validateField">'+
        '{{yield}}' +
        '{{#unless view.showLabelComp}}'+
          '{{#if view.col.form.helpText}}<div class="label-tooltip">' +
            '{{#tool-tip placement="right" title=view.col.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
          '</div>{{/if}}' +
        '{{/unless}}'+
        '{{#if view.invalid}}' +
          '{{#if view.invalidReason}}<span class="help-block text-danger">{{view.invalidReason}}</span>{{/if}}' +
        '{{/if}}' +
      '</div>'+
    '</div>' +
  ''),
  template : Ember.Handlebars.compile('{{input class="form-control" autofocus=view.col.form.autofocus type="text" value=view.val disabled=view.isDisabled ' +
                                                                   'placeholder=view.col.form.placeholderActual maxlength=view.col.form.maxlength}}'),
  classNames : ['form-group'],
  classNameBindings : ['col.form.additionalClass', 'col.validation.validations:has-validations', 'invalid:has-error', ':has-feedback', 'disabled:hidden', 'additionalClass'],
  attributeBindings : ['colName:data-column-name'],
  colName : Ember.computed.alias("col.name"),
  col : null,
  cols : null,
  record : null,
  labelWidthClass : "col-full",
  inputWidthClass : "col-sm-8",
  showLabel : true,
  labelClass : function() {
    var col = this.get("col"), labelWidthClass = this.get("labelWidthClass");
    return "control-label "+(col.labelWidthClass || labelWidthClass);
  }.property('view.col', 'view.labelWidthClass'),
  inputClass : function() {
    var col = this.get("col"), inputWidthClass = this.get("inputWidthClass");
    return "control-input "+(col.inputWidthClass || inputWidthClass);
  }.property('view.col', 'view.inputWidthClass'),

  isDisabled : function() {
    var col = this.get("col"),record = this.get("record");
    return col.get("form.fixedValue") || ((col.get("form.disableOnEdit") && record && !record.get("isNew")) || (col.get("form.disableOnNew") && record && record.get("isNew")));
  }.property('view.col','view.col.form.fixedValue','view.col.form.disableOnEdit','view.col.form.disableOnNew'),

  showLabelComp : function(){
    var col = this.get("col");
    if(col.showLabel === undefined ) return this.get("showLabel");
    return this.get("showLabel") && col.showLabel;
  }.property('showLabel','view.col'),

  invalid : false,
  invalidReason : false,

  disabled : false,
  disableCheck : function(changedCol, changedValue) {
    var col = this.get("col"), record = this.get("record"),
        disableEntry = col.get("form.disableForCols") && col.get("form.disableForCols").findBy("name", changedCol.get("name"));
    changedValue = changedValue || record.get(changedCol.get("key"));
    if(disableEntry) {
      var eq = disableEntry.value === changedValue, dis = disableEntry.disable, en = disableEntry.enable;
      this.set("disabled", (dis && eq) || (en && !eq));
    }
  },
  colValueChanged : function(changedCol, changedValue, oldValue) {
    this.disableCheck(changedCol, changedValue);
    if(changedCol.get("name") === this.get("col.name")) {
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

  validateValue : function(value) {
    var col = this.get("col"), record = this.get("record");
    if(col.get("validate")) {
      if(!this.get("disabled")) {
        var validVal = col.validateValue(value, record);
        if(validVal[0]) record._validation[col.name] = 1;
        else delete record._validation[col.name];
        this.set("invalid", validVal[0]);
        this.set("invalidReason", !Ember.isEmpty(validVal[1]) && validVal[1]);
      }
      else {
        delete record._validation[col.name];
      }
    }
    record.set("validationFailed", Utils.hashHasKeys(record._validation));
  },

  val : function(key, value) {
    var col = this.get("col"), record = this.get("record"),
        parentForm = this.get("parentForm");
    if(!record) return value;
    record._validation = record._validation || {};
    if(arguments.length > 1) {
      if(!(record instanceof DS.Model) || (record.currentState && !record.currentState.stateName.match("deleted"))) {
        var oldVal = record.get(col.get("key"));
        this.validateValue(value);
        if(record.get("isSaving")) {
          this.set("delayedUpdate", value);
        }
        else {
          //TODO : find a better way to fix value becoming null when selection changes
          //can be observed for repeatAdsFromSlot on adunit
          if(value || !col.get("form.cantBeNull")) {
            record.set(col.get("key"), value);
            this.valueDidChange(value);
            if(parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, value, oldVal, this);
          }
        }
      }
      return value;
    }
    else {
      value = record.get(col.get("key"));
      this.validateValue(value);
      if(parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(col, value, null, this);
      return value;
    }
  }.property('col', 'col.form.disabled', 'view.disabled', 'disabled'),

  valueDidChange : function(value) {
  },

  delayedUpdate : null,
  flushChanges : function() {
    var col = this.get("col"), record = this.get("record"),
        delayedUpdate = this.get("delayedUpdate");
    if(delayedUpdate && !record.get("isSaving")) {
      var oldVal = record.get(col.get("key"));
      //if(delayedUpdate.trim) delayedUpdate = delayedUpdate.trim();
      record.set(col.name, delayedUpdate);
      if(this.get("parentForm") && this.get("parentForm").bubbleValChange) this.get("parentForm").bubbleValChange(col, value, oldVal, this);
      this.set("delayedUpdate", null);
      this.valueDidChange(value);
    }
  }.observes('view.record.isSaving', 'record.isSaving'),

  prevRecord : null,
  recordDidChange : function() {
    var record = this.get("record"), prevRecord = this.get("prevRecord"),
        col = this.get("col");
    if(prevRecord) {
      Ember.removeObserver(prevRecord, col.name, this, "notifyValChange");
    }
    if(record) {
      this.recordChangeHook();
      Ember.addObserver(record, col.name, this, "notifyValChange");
      this.set("prevRecord", record);
      this.notifyPropertyChange("val");
      if(col.get("form.disableForCols")) {
        col.get("form.disableForCols").forEach(function(disableCol) {
          this.disableCheck(disableCol);
        }, this);
      }
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
  title : "test",

  notifyValChange : function(obj, val) {
    this.notifyPropertyChange("val");
    this.valueDidChange(this.get("val"));
  },

  registerForValChangeChild : function() {
    var col = this.get("col"), parentForm = this.get("parentForm");
    if(col.get("form.listenForCols")) {
      col.get("form.listenForCols").forEach(function(listenCol) {
        if(parentForm && parentForm.registerForValChange) parentForm.registerForValChange(this, listenCol);
      }, this);
    }
  },

  unregisterForValChangeChild : function() {
    var col = this.get("col"), parentForm = this.get("parentForm");
    if(col.get("form.listenForCols")) {
      col.get("form.listenForCols").forEach(function(listenCol) {
        if(parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(this, listenCol);
      }, this);
    }
  },

  destroy : function() {
    this._super();
    this.unregisterForValChangeChild();
  },
});

Form.TextAreaView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{textarea class="form-control" autofocus="view.col.form.autofocus" value=view.val disabled=view.isDisabled rows=view.col.rows cols=view.col.cols ' +
                                                                      'placeholder=view.col.form.placeholderActual maxlength=view.col.form.maxlength readonly=view.col.form.readonly}}'),
});

Form.MultipleValue = Ember.Object.extend({
  val : function(key, value) {
    var col = this.get("col");
    if(arguments.length > 1) {
      if(!Ember.isNone(col)) {
        var validation = col.validateValue(value, null, col.get("validation.eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
        }
        else {
          this.set("isInvalid", false);
        }
      }
      return value;
    }
  }.property('col'),
  label : "",
  isInvalid : false,
});
Form.CopyValuesToObject = function(obj, col, record, value) {
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        obj[copyAttrs[k]] = record.get(k);
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        obj[k] = staticAttrs[k];
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        obj[valAttrs[k]] = value.get(k);
      }
    }
  }
};
Form.CopyValuesToRecord = function(toRecord, col, fromRecord, value) {
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        toRecord.set(copyAttrs[k], fromRecord.get(k));
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        toRecord.set(k, staticAttrs[k]);
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        toRecord.set(valAttrs[k], value.get(k));
      }
    }
  }
};
Form.MultipleValueMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    var values = this.get("values");
    this.set("values", Ember.isEmpty(values) ? [] : values);
    if(this.get("val")) this.valArrayDidChange();
    else this.valuesArrayDidChange();
  },

  values : Utils.hasMany(Form.MultipleValue),

  valuesCount : function() {
    return this.get("values.length") || 0;
  }.property('values.@each'),

  valuesArrayDidChange : function() {
    if(!this.get("values") || this.get("lock")) return;
    var val = this.get("val"), values = this.get("values"),
        valLength = val && val.get("length"), valuesLength = values.get("length"),
        col = this.get("col"), record = this.get("record");
    if(val) {
      this.set("lock", true);
      values.forEach(function(value, idx) {
        var valObj = this.val.objectAt(idx);
        if(valObj) {
          valObj.set(this.col.get("form.arrayCol"), value.get("val"));
          Form.CopyValuesToRecord(valObj, this.col, this.record, value);
        }
        else {
          var data = { /*id : col.get("name")+"__"+csvid++*/ };
          data[this.col.get("form.arrayCol")] = value.get("val");
          Form.CopyValuesToObject(data, this.col, this.record, value);
          this.record.addToProp(this.col.get("key"), CrudAdapter.createRecordWrapper(this.record.store, this.col.get("form.arrayType"), data));
        }
      }, {val : val, col : col, record : record});
      if(valLength > valuesLength) {
        for(var i = valuesLength; i < valLength; i++) {
          val.popObject();
        }
      }
      this.set("lock", false);
    }
  }.observes('values.@each.val', 'view.values.@each.val'),

  valArrayDidChange : function() {
    if(this.get("lock")) return;
    var val = this.get("val"), col = this.get("col");
    if(val) {
      var values, val = this.get("val");
      values = this.valuesMultiCreateHook(val);
      this.set("lock", true);
      this.set("values", values);
      this.set("lock", false);
    }
  }.observes('val.@each', 'view.val.@each'),

  valuesMultiCreateHook : function(value) {
    if(value.map) {
      return value.map(function(e, i, a) {
        return this.valuesElementCreateHook(e);
      }, this);
    }
    return [];
  },

  valuesElementCreateHook : function(element) {
    var col = this.get("col");
    return {val : element.get(col.get("form.arrayCol")), col : col};
  },

  lock : false,

  valuesWereInvalid : function() {
    //for now arrayCol is present for all multi value columns
    //change this check if there are exceptions
    if(!this.get("col.form.arrayCol")) return;
    var values = this.get("values"),
        isInvalid = !values || values.get("length") === 0 || values.anyBy("isInvalid", true),
        record = this.get("record"), col = this.get("col");
    if(!record) return;
    if(this.get("disabled")) {
      delete record._validation[col.get("name")];
    }
    else {
      this.set("invalid", isInvalid);
      record._validation = record._validation || {};
      if(isInvalid) {
        record._validation[col.get("name")] = 1;
      }
      else {
        delete record._validation[col.get("name")];
      }
    }
    this.validateValue();
  }.observes('values.@each.isInvalid', 'view.values.@each.isInvalid', 'disabled', 'view.disabled'),
});

//TODO : support multiple on static select (no requirement for now)
Form.StaticSelectView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.col.form.options optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'prompt=view.col.form.prompt value=view.val disabled=view.isDisabled maxlength=view.col.form.maxlength}}' +
                                      '{{#if view.helpblock}}<p class="help-block">{{view.helpblock}}</p>{{/if}}'),

  helpblock : "",
});

Form.DynamicSelectView = Form.StaticSelectView.extend(Form.MultipleValueMixin, Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var col = this.get("col");
    Ember.addObserver(this,col.get("form.dataPath")+".@each",this,"dataDidChange");
  },

  classNameBindings : ['hideOnEmpty:hidden'],
  hideOnEmpty : false,

  selectOptions : function() {
    var col = this.get("col"), data = [], opts = [];
    if(col.dataPath) {
      data = Ember.get(col.dataPath) || this.get(col.dataPath);
    }
    else {
      data = col.data || [];
    }
    if(data) {
      data.forEach(function(item) {
        opts.push(Ember.Object.create({ val : item.get(col.dataValCol), label : item.get(col.dataLabelCol)}));
      }, this);
    }
    if(col.get("form.hideOnEmpty") && opts.length - col.get("form.hideEmptyBuffer") === 0) {
      this.set("hideOnEmpty", true);
    }
    else {
      this.set("hideOnEmpty", false);
    }
    return opts;
  }.property('view.col'),

  dataDidChange : function(){
    this.notifyPropertyChange("selectOptions");
    this.rerender();
  },

  selection : function(key, value) {
    if(arguments.length > 1) {
      if(this._state !== "preRender") {
        if(this.get("col.form.multiple")) {
          if(Ember.isEmpty(value[0])) {
            //initially the selection is an array with undef as its 1st element
            //this.set("values", []);
          }
          else {
            this.set("values", value); 
          }
        }
        else {
          this.set("val", value && value.val);
        }
      }
      return value;
    }
    else {
      var options = this.get("selectOptions"), sel;
      if(this.get("col.form.multiple")) {
        var values = this.get("values"), col = this.get("col");
        if(values && values.get("length")) {
          sel = options.filter(function(e, i, a) {
            return !!this.values.findBy("val", e.get("val"));
          }, {col : col, values : values});
        }
      }
      else {
        sel = options.findBy("val", this.get("val"));
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
    if(this.get("col.form.multiple") && !fromSetFunc) {
      this.set("values", this.get("selection"));
    }
  },

  arrayProps : ["selection"],

  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" multiple=view.col.form.multiple '+
                                                      'prompt=view.col.form.prompt selection=view.selection disabled=view.isDisabled maxlength=view.col.form.maxlength}}'),
});

Form.SelectiveSelectView = Ember.Select.extend({
  options : [],
  filterColumn : "",
  content : function() {
    var filterColumn = this.get("filterColumn");
    return this.get("options").filter(function(item) {
      return !Ember.isEmpty(item.get(this.filterColumn));
    }, {filterColumn : filterColumn});
  }.property('view.overallOptions.@each'),
});

Form.LabelView = Form.TextInputView.extend({
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('<label>{{view.col.label}}</label>'),
  col : null,
  record : null,
});

Form.Legend = Ember.View.extend({
  classNameBindings : ['col.disabled:hidden'],
  template : Ember.Handlebars.compile('<legend>{{view.col.label}}</legend>'),
  col : null,
  record : null,
});

Form.FileUploadView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.form.accept"}}>'),

  disableBtn : false,
  fileName : "",

  btnLabel : function(){
    return this.get('uploadBtnLabel') || this.get('col').get('form.btnLabel');
  }.property('col','col.form.btnLabel'),

  postRead : function(data) {
    this.set("val", data);
  },

  postFail : function(message) {
    this.set("val", null);
  },

  change : function(event) {
    var files = event.originalEvent && event.originalEvent.target.files, that = this, col = this.get("col");
    if(files && files.length > 0 && !Ember.isEmpty(files[0])) {
      this.set("disableBtn", "disabled");
      this.set("fileName", files[0].name);
      EmberFile[col.get("method")](files[0]).then(function(data) {
        that.postRead(data);
        that.set("disableBtn", false);
      }, function(message) {
        that.postFail(message);
        that.set("disableBtn", false);
      });
      $(this.get("element")).find("input[type='file']")[0].value = "";
    }
  },

  actions : {
    loadFile : function() {
      fileInput = $(this.get("element")).find("input[type='file']");
      fileInput.click();
    },
  },
});

Form.ImageUploadView = Form.FileUploadView.extend({
  template : Ember.Handlebars.compile('<p><button class="btn btn-default btn-sm" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.col.form.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.form.accept"}}></p>' +
                                      '<canvas class="hidden"></canvas>' +
                                      '<div {{bind-attr class="view.hasImage::hidden"}}>' +
                                        '<div class="image-container">' +
                                          '<div class="image-container-inner">' +
                                            '<img class="the-image" {{bind-attr src="view.imageSrc"}}>' +
                                            '<div class="image-cropper"></div>' +
                                          '</div>' +
                                        '</div>' +
                                        '<button class="btn btn-default btn-sm" {{action "cropImage" target="view"}}>Crop</button>' +
                                      '</div>' +
                                      '<div class="clearfix"></div>'),

  imageSrc : "",
  hasImage : false,

  postRead : function(data) {
    this.set("imageSrc", data);
    this.set("hasImage", true);
  },

  postFail : function(message) {
    this.set("imageSrc", null);
    this.set("hasImage", false);
  },

  didInsertElement : function() {
    this._super();
    var cropper = $(this.get("element")).find(".image-cropper");
    cropper.draggable({
      containment: "parent",
    });
    cropper.resizable({
      containment: "parent",
    });
  },

  actions : {
    cropImage : function() {
      var cropper = $(this.get("element")).find(".image-cropper"),
          x = cropper.css("left"), y = cropper.css("top"),
          h = cropper.height(), w = cropper.width(),
          canvas = $(this.get("element")).find("canvas")[0],
          context = canvas.getContext("2d");
      x = Number(x.match(/^(\d+)px$/)[1]);
      y = Number(y.match(/^(\d+)px$/)[1]);
      context.drawImage($(this.get("element")).find(".the-image")[0], x, y, h, w, 0, 0, h, w);
      this.set("val", canvas.toDataURL());
      this.set("hasImage", false);
      cropper.css("left", 0);
      cropper.css("top", 0);
      cropper.height(100);
      cropper.width(100);
    },
  },

});

Form.CSVEntry = Form.MultipleValue.extend({
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

//TODO : find a better way to set id
var csvid = 0;
Form.CSVDateValue = Ember.View.extend(LazyDisplay.LazyDisplayRow, {
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
Form.CSVDateDummyValue = Ember.View.extend(LazyDisplay.LazyDisplayDummyRow, {
  classNames : ["csv-dummy-value"],
  template : Ember.Handlebars.compile(''),
});
Form.CSVDateValues = Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
  getRowView : function(row) {
    return Form.CSVDateValue.create({
      data : row,
    });
  },

  getDummyView : function() {
    return Form.CSVDateDummyValue.create();
  },
});
Form.CSVDataInputView = Form.FileUploadView.extend(Form.MultipleValueMixin, {
  template : Ember.Handlebars.compile('' +
                                      '{{view.col.form.description}}' +
                                      '{{#if view.hasFile}}' +
                                        '{{view.fileName}} ({{view.valuesCount}} {{view.col.form.entityPlural}})' +
                                        '<button class="btn btn-link" {{action "remove" target="view"}}>Remove</button> | ' +
                                        '<button class="btn btn-link" {{action "replace" target="view"}}>Replace</button>' +
                                        '{{view "lazyDisplay/lazyDisplay" classNameBindings=":form-sm :csv-values-wrapper" columnDataGroup=view.columnDataGroup rows=view.valuesTransformed}}' +
                                      '{{else}}' +
                                        '{{textarea class="form-control" autofocus="view.col.form.autofocus" value=view.csvVal rows=view.col.rows cols=view.col.cols ' +
                                                                        'placeholder=view.col.form.placeholderActual maxlength=view.col.form.maxlength ' +
                                                                        'readonly=view.col.form.readonly}}' +
                                        '<div class="upload-help-text">'+
                                        '<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.col.form.btnLabel}}</button>' +
                                        '</div>'+
                                      '{{/if}}' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.col.form.accept"}}>' +
                                      ''),

  /*lazyDisplayConfig : LazyDisplay.LazyDisplayConfig.create({
    rowHeight : 28,
    lazyDisplayMainClass : "Form.CSVDateValues",
  }),*/
  hasFile : false,

  values : Utils.hasMany(Form.CSVEntry),
  valuesTransformed : function() {
    var values = this.get("values"), valuesTransformed = [];
    valuesTransformed.pushObjects(values.filterBy("showInput", true));
    valuesTransformed.pushObjects(values.filterBy("showInput", false));
    //console.log("valuesTransformed");
    return valuesTransformed;
  }.property("view.values.@each.showInput", "values.@each.showInput"),
  setToValues : function(value) {
    var col = this.get("col"), values = value.split(new RegExp(col.get("splitRegex")));
    //this.set("val", value);
    for(var i = 0; i < values.length;) {
      if(Ember.isEmpty(values[i])) {
        values.splice(i, 1);
      }
      else {
        values.splice(i, 1, {col : col, val : values[i++]});
      }
    }
    this.set("values", values);
  },

  csvVal : function(key, value) {
    var col = this.get("col"), that = this;
    if(arguments.length > 1) {
      //calculate 'values' after a delay to avoid multiple calcuations for every keystroke
      Timer.addToQue("csvvalues-"+col.get("name"), 1500).then(function() {
        if(!that.get("isDestroyed")) {
          that.setToValues(value);
        }
      });
      return value;
    }
    else {
      var values = this.get("values");
      return values && values.mapBy("val").join(", ");
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

var mulid = 0;
Form.MultiEntryView = Form.TextInputView.extend(Form.MultiInputViewParentMixin, {
  childView : function() {
    var col = this.get("col");
    return Form.TypeToCellNameMap[col.get("childCol").type];
  }.property("view.col.childCol.type"),
  template : Ember.Handlebars.compile('' +
    '<div {{bind-attr class="view.col.form.multiEntryContainerClass"}}>' +
    '{{#with view as outerView}}' +
      '{{#each outerView.val}}' +
        '<div {{bind-attr class="outerView.col.form.eachMultiEntryClass"}}>' +
          '<div {{bind-attr class="outerView.col.form.multiEntryClass"}}>' +
            '{{view outerView.childView record=this col=outerView.col.childCol parentForm=outerView showLabel=column.form.showChildrenLabel immediateParent=outerView}}' +
          '</div>' +
          '{{#if outerView.col.form.canManipulateEntries}}' +
            '<div class="remove-entry" rel="tooltip" title="Delete Condition"><a {{action "deleteEntry" this target="outerView"}}>' +
              '<span class="glyphicon glyphicon-trash"></span>' +
            '</a></div>' +
            '<div class="add-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
              '<span class="glyphicon glyphicon-plus"></span>'+
            '</a></div>'+
          '{{/if}}' +
        '</div>' +
      '{{else}}'+
        '{{#if outerView.col.form.canManipulateEntries}}' +
          '<div class="add-first-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
            '<span class="glyphicon glyphicon-plus"></span>'+
          '</a></div>'+
        '{{/if}}' +
      '{{/each}}'+
    '{{/with}}' +
    '</div>'+
    '<p class="tp-rules-end-msg">{{view.col.form.postInputText}}</p>'
    ),

  valuesArrayDidChange : function() {
    if(this.get("record")) this.validateValue(this.get("val"));
  }.observes("val.@each", "view.val.@each"),

  actions : {
    addEntry : function() {
      var record = this.get("record"), col = this.get("col"),
          entry, val = this.get("val"), data = { /*id : col.get("name")+"__"+mulid++*/ };
      $('.tooltip').hide();
      Form.CopyValuesToObject(data, col, record);
      entry = CrudAdapter.createRecordWrapper(record.store, col.get("form.arrayType"), data);
      if(!val) {
        val = [];
        this.set("val", val);
      }
      val.pushObject(entry);
    },

    deleteEntry : function(entry) {
      $('.tooltip').hide();
      var val = this.get("val");
      val.removeObject(entry);
    },
  },
});

Form.MultiInputView = Ember.View.extend(Form.MultiColumnMixin, Form.MultiInputViewParentMixin, {
  classNames : ['clearfix'],
  classNameBindings : ['col.form.additionalClass'],
  parentForRows : function() {
    if(this.get("col.form.propogateValChange")) {
      return this.get("parentForm");
    }
    else {
      return this;
    }
  }.property(),

  columnDataGroup : Ember.computed.alias("col.childColGroup"),
});

Form.CheckBoxView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<div class="checkbox"><label>{{view "checkbox" checked=view.val disabled=view.isDisabled}}<label></label> {{view.col.form.checkboxLabel}}</label></div>'),
});

Form.TextAreaSelectedView = Form.TextAreaView.extend({
  init : function() {
    this._super();
    this.get("val");
  },

  valChanged : function(e) {
    var textarea = $(e.target);
    textarea.focus().select();
    Ember.run.later(function() {
      textarea.scrollTop(0);
    }, 1);
  },

  didInsertElement : function() {
    var textarea = $(this.get("element")).find("textarea"), that = this;
    this._super();
    textarea.change(this.valChanged);
    Ember.run.later(function() {
      that.valChanged({target : textarea});
    }, 1000);
  },
});

Form.GroupRadioButtonView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{#each view.col.form.options}}<div {{bind-attr class="radio view.col.form.displayInline:radio-inline"}}>'
    + '<label>{{view "form/radioInput" name=view.groupName value=this.val selection=view.val}}<span></span>{{{this.label}}}</label></div> {{/each}}'
  ),
  groupName : function(){
    return Utils.getEmberId(this);
  }.property(),
});

Form.RadioInputView = Ember.View.extend({
  tagName : "input",
  type : "radio",
  attributeBindings : [ "name", "type", "value", "checked:checked" ],
  click : function() {
    this.set("selection", this.$().val());
  },
  checked : function() {
    return this.get("value") == this.get("selection");
  }.property('selection')
});

Form.GroupCheckBoxView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('{{#each view.newCheckList}}<div {{bind-attr class="checkbox col-md-4 view.col.form.displayInline:checkbox-inline"}}>'
    + '<label>{{view "checkbox" checked=this.checked disabled=view.isDisabled}}<label></label> {{this.checkboxLabel}}</label></div>{{/each}}'),

  checkBoxDidChange : function (){
    var checkList = this.get("newCheckList");
    this.set("val",checkList.filterBy("checked",true).mapBy("id").join(","));
  }.observes('newCheckList.@each.checked'),
  newCheckList : function() {
    var ncl = Ember.A(), ocl = this.get("col.form.checkList"),
        list = this.get("record").get(this.get("col").name).split(",");
    for(var i = 0; i < ocl.get("length") ; i++) {
      var op = JSON.parse(JSON.stringify(ocl[i], ["checkboxLabel", "id"]));
      if(list.indexOf(op.id+"") == -1) {
        op.checked = false;
      }
      else op.checked = true;
      ncl.pushObject(Ember.Object.create(op));
    }
    return ncl;
  }.property('view.col.checkList'),
  notifyValChange : function(obj, val) {
    this._super();
    var list = this.get("record").get(this.get("col").name).split(","),
        newCheckList = this.get("newCheckList");
    if(newCheckList) {
      newCheckList.forEach(function(ele){
        if(list.indexOf(ele.get("id")+"")==-1){
          ele.set("checked",false);
        }
        else ele.set("checked",true);
      },this);
    }
  },
});

Form.MediumHeadingView = Form.TextInputView.extend({
  template : Ember.Handlebars.compile('<label>{{view.col.label}}</label>'),
  layout : Ember.Handlebars.compile('{{yield}}'),
});

//extend this to add extra content before views like Form.MultiEntryView or Form.MultiInputView
Form.WrapperView = Ember.View.extend({
  childView : function() {
    var col = this.get("col");
    return Form.TypeToCellNameMap[col.get("childCol").type];
  }.property("view.col.childCol.type"),
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('{{create-view view.childView record=view.record col=view.col.childCol parentForm=view.parentForm immediateParent=view.immediateParent}}'),
});

Form.TypeToCellNameMap = {
  textInput : "form/textInput",
  textareaInput : "form/textArea",
  staticSelect : "form/staticSelect",
  dynamicSelect : "form/dynamicSelect",
  selectiveSelect : "form/selectiveSelect",
  label : "form/label",
  fileUpload : "form/fileUpload",
  imageUpload : "form/imageUpload",
  csvData : "form/csvDataInput",
  multiEntry : "form/multiEntry",
  multiInput : "form/multiInput",
  checkBox : "form/checkBox",
  textareaSelectedInput : "form/textAreaSelected",
  groupRadioButton : "form/groupRadioButton",
  groupCheckBox : "form/groupCheckBox",
  sectionHeading : "form/mediumHeading",
};

Ember.Select.reopen({
  _selectionDidChangeSingle: function() {
    //overriding this to fix a problem where ember was checking the actual selected object (ember object with val and label) and not the selected value
    var el = this.get('element');
    if (!el) { return; }

    var content = this.get('content'),
        selection = this.get('selection'),
        selectionIndex = content && content.findBy && selection ? content.indexOf(content.findBy("val", selection.val)) : -1,
        prompt = this.get('prompt');

    if (prompt) { selectionIndex += 1; }
    if (el) { el.selectedIndex = selectionIndex; }
  },
});


/***    FormColumnDataInterface    ***/

Form.FormColumnDataGroup = Ember.Object.extend({
  labelWidthClass : "col-sm-4",
  inputWidthClass : "col-sm-8",
  showLabel : true,
});

Form.FormColumnData = Ember.Object.extend({
  placeholder : null,
  placeholderActual : function() {
    var placeholder = this.get("placeholder"), label = this.get("parentObj.label");
    if(placeholder) return placeholder;
    return label;
  }.property('parentObj.label', 'placeholder'),
  type : "",
  formType : function() {
    return Form.TypeToCellNameMap[this.get("type")];
  }.property('type'),
  fixedValue : null,
  options : [],
  data : [],
  dataValCol : "",
  dataLabelCol : "",
  bubbleValues : false,
  cantBeNull : false,
  canManipulateEntries : true,

  multiEntryContainerClass : "multi-entry-container",
  eachMultiEntryClass : "each-multi-entry",
  multiEntryClass : "multi-entry",
  showChildrenLabel : false,
  childrenLabelWidthClass : "",
  childrenInputWidthClass : "col-md-12",

  exts : Utils.hasMany(),
  disableForCols : Utils.hasMany("Form.DisableForCol"),
});

Form.FormColumnDataMap = {
  textInput              : Form.FormColumnData,
  textareaInput          : Form.FormColumnData,
  staticSelect           : Form.FormColumnData,
  dynamicSelect          : Form.FormColumnData,
  selectiveSelect        : Form.FormColumnData,
  label                  : Form.FormColumnData,
  fileUpload             : Form.FormColumnData,
  imageUpload            : Form.FormColumnData,
  csvData                : Form.FormColumnData,
  multiEntry             : Form.FormColumnData,
  multiInput             : Form.FormColumnData,
  checkBox               : Form.FormColumnData,
  textareaSelectedInput  : Form.FormColumnData,
  groupRadioButton       : Form.FormColumnData,
  groupCheckBox          : Form.FormColumnData,
  sectionHeading         : Form.FormColumnData,
};

Form.DisableForCol = Ember.Object.extend({
  name : "",
  value : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
  enable : false,
  disable : false,
});
