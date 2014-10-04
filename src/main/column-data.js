ColumnData = Ember.Namespace.create();
ColumnData.ColumnValidation = Ember.Object.extend({
  type : 0,
  regex : "",
  regexFlags : "",
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),
  invalidMessage : "",
  negate : false,

  minValue : 0,
  maxValue : 999999,

  validateValue : function(value, record) {
    var type = this.get("type"), invalid = false, negate = this.get("negate"),
        emptyRegex = new RegExp("^\\s*$"), value = value || "";
    if(value.trim) value = value.trim();
    Ember.run.begin();
    switch(type) {
      case 0:  Ember.run.begin();
               invalid = Ember.isEmpty(value); invalid = invalid || emptyRegex.test(value);
               Ember.run.end();
               break;

      case 1:  Ember.run.begin();
               invalid = ( Ember.isEmpty(value.trim()) && this.get("canBeEmpty") )||this.get("regexObject").test(value);
               Ember.run.end();
               break;

      case 2:  Ember.run.begin();
               if(Ember.isEmpty(value.trim()) && this.get("canBeEmpty")){invalid=true; break;}
               value.split(this.get("delimeter")).some(function(item){ 
                 item=item.trim();
                 invalid= this.get("regexObject").test(item); 
                 return negate ? !invalid : invalid; 
               },this); 
               Ember.run.end();
               break;

      case 3:  Ember.run.begin();
               arrVals ={};invalid=false; 
               value.split(this.get("delimeter")).some(function(item){
                 item = item.trim();
                 if(arrVals[item]) return negate ? invalid=false : invalid=true; 
                 else arrVals[item]=true;
               },this);
               Ember.run.end();
               break;

      case 4:  Ember.run.begin();
               var arr = record.get(this.get("duplicateCheckPath")), values = arr && arr.filterBy(this.get("duplicateCheckKey"), value);
               invalid = values && values.get("length") > 1;
               Ember.run.end();
               break;

      case 5:  Ember.run.begin();
               var num = Number(value);
               if(num < this.get("minValue") || num > this.get("maxValue")) invalid = true;
               Ember.run.end();
               break;

      default: invalid = true;
    }
    Ember.run.end();
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

ColumnData.DisableForCol = Ember.Object.extend({
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

ColumnData.ColumnData = Ember.Object.extend({
  init : function (){
    this._super();
    this.canBeEmpty();
  },
  name : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
  label : null,
  placeholder : null,
  placeholderActual : function() {
    var placeholder = this.get("placeholder"), label = this.get("label");
    if(placeholder) return placeholder;
    return label;
  }.property('label', 'placeholder'),
  type : "",
  fixedValue : null,
  options : [],
  data : [],
  dataValCol : "",
  dataLabelCol : "",
  bubbleValues : false,
  cantBeNull : false,
  canManipulateEntries : true,
  validations : Utils.hasMany(ColumnData.ColumnValidation),
  eachValidations : Utils.hasMany(ColumnData.ColumnValidation),
  checkList : Utils.hasMany(),
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
  canBeEmpty : function(){
    if(this.get("validations"))
    if(!this.get("validations").mapBy("type").contains('0')){
      this.get("validations").forEach(function(item){item.set('canBeEmpty',true)});
    }
  }.observes('validations.@each'),
  mandatory : Ember.computed('validations.@each.type', function() {
    var validations = this.get("validations"), isMandatory = false;
    if(validations) {
      validations.forEach(function(item) {
        isMandatory = isMandatory || item.get("type") == 0;
      });
    }
    return isMandatory;
  }),

  multiEntryContainerClass : "multi-entry-container",
  eachMultiEntryClass : "each-multi-entry",
  multiEntryClass : "multi-entry",
  showChildrenLabel : false,
  childrenLabelWidthClass : "",
  childrenInputWidthClass : "col-md-12",

  childCol : Utils.belongsTo("ColumnData.ColumnData"),
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value && ColumnData.ColumnDataMap[value]) {
        this.set("childCol", ColumnData.ColumnDataMap[value]);
      }
      return value;
    }
  }.property(),
  childCols : Utils.hasMany("ColumnData.ColumnData"),
  childColsName : function(key, value) {
    if(arguments.length > 1) {
      if(value && ColumnData.ColumnDataMap[value]) {
        this.set("childCols", ColumnData.ColumnDataMap[value]);
      }
      return value;
    }
  }.property(),
  exts : Utils.hasMany(),
  disableForCols : Utils.hasMany(ColumnData.DisableForCol),
});

