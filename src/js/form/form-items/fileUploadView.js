define([
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * Form item for a file upload input.
 *
 * @class Form.FileUploadView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var FileUploadView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.columnData.form.accept"}}>'),

  disableBtn : false,
  fileName : "",

  btnLabel : function(){
    return this.get('uploadBtnLabel') || this.get('columnData').get('form.btnLabel');
  }.property('columnData.form.btnLabel', 'view.columnData.form.btnLabel'),

  postRead : function(data) {
    this.set("value", data);
  },

  postFail : function(message) {
    this.set("value", null);
  },

  change : function(event) {
    var files = event.originalEvent && event.originalEvent.target.files, that = this, columnData = this.get("columnData");
    if(files && files.length > 0 && !Ember.isEmpty(files[0])) {
      this.set("disableBtn", "disabled");
      this.set("fileName", files[0].name);
      EmberFile[columnData.get("method")](files[0]).then(function(data) {
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

return {
  FileUploadView : FileUploadView,
};

});
