ModelWrapper = Ember.Namespace.create();
ModelWrapper.AggregateFromChildrenMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps"), that = this;
    this.set("isDirty_alias", this.get("isDirty"));
    Ember.addObserver(this, "isDirty", this, "attributeDidChange");
    for(var i = 0; i < arrayProps.length; i++) {
      var arrayProp = arrayProps[i];
      this[arrayProp+"WillBeDeleted"] = that.childrenWillBeDeleted;
      this[arrayProp+"WasAdded"] = that.childrenWasAdded;
    }
  },

  childrenWillBeDeleted : function(props, idxs) {
    this._validation = this._validation || {};
    for(var i = 0; i < props.length; i++) {
      var propId = Utils.getEmberId(props[i]);
      delete this._validation[propId];
      Ember.removeObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.removeObserver(props[i], "isDirty", this, "attributeDidChange");
    }
  },

  childrenWasAdded : function(props, idxs) {
    for(var i = 0; i < props.length; i++) {
      this.validationFailedDidChanged(props[i], "validationFailed");
      this.attributeDidChange(props[i], "isDirty");
      Ember.addObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.addObserver(props[i], "isDirty", this, "attributeDidChange");
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
});

ModelWrapper.ModelWrapper = DS.Model.extend({
  isDirty_alias : Ember.computed.oneWay("isDirty"),
  disableSave : function() {
    return this.get("validationFailed") || !this.get("isDirty_alias");
  }.property("validationFailed", "isDirty_alias"),
});
ModelWrapper.createModelWrapper = function(object, config, mixins) {
  var args = mixins || [];
  args.push(object);
  var model = ModelWrapper.ModelWrapper.extend.apply(ModelWrapper.ModelWrapper, args);
  for(var i = 0; i < CrudAdapter.allowedModelAttrs.length; i++) {
    if(config[CrudAdapter.allowedModelAttrs[i].attr]) {
      model[CrudAdapter.allowedModelAttrs[i].attr] = config[CrudAdapter.allowedModelAttrs[i].attr];
    }
    else {
      if(CrudAdapter.allowedModelAttrs[i].defaultValue === "emptyArray") {
        model[CrudAdapter.allowedModelAttrs[i].attr] = Ember.A();
      }
      else if(CrudAdapter.allowedModelAttrs[i].defaultValue === "value") {
        model[CrudAdapter.allowedModelAttrs[i].attr] = CrudAdapter.allowedModelAttrs[i].value;
      }
    }
  }
  return model;
};

var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;
