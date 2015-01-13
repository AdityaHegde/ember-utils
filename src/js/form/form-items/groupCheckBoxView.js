define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for a group of checkbox which translated to a single attribute.
 *
 * @class Form.GroupCheckBoxView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var GroupCheckBoxView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('' +
    '{{#each view.newCheckList}}' +
      '<div {{bind-attr class=":checkbox view.columnData.form.checkBoxClass view.columnData.form.displayInline:checkbox-inline"}}>' +
        '<label>' +
          '{{view "checkbox" checked=this.checked disabled=view.isDisabled}} {{this.checkboxLabel}}' +
        '</label>' +
      '</div>' +
    '{{/each}}' +
  ''),

  checkBoxDidChange : function (){
    var checkList = this.get("newCheckList");
    this.set("value", checkList.filterBy("checked", true).mapBy("id").join(","));
  }.observes('newCheckList.@each.checked'),

  newCheckList : function() {
    var ncl = Ember.A(), ocl = this.get("columnData.form.checkList"),
        val = this.get("record").get(this.get("columnData.key"))
        list = (val && val.split(",")) || [];
    for(var i = 0; i < ocl.get("length") ; i++) {
      var op = JSON.parse(JSON.stringify(ocl[i], ["checkboxLabel", "id"]));
      if(list.indexOf(op.id+"") == -1) {
        op.checked = false;
      }
      else op.checked = true;
      ncl.pushObject(Ember.Object.create(op));
    }
    return ncl;
  }.property('view.columnData.checkList'),

  notifyValChange : function(obj, value) {
    this._super();
    var list = this.get("record").get(this.get("columnData").name).split(","),
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

return {
  GroupCheckBoxView : GroupCheckBoxView,
};

});
