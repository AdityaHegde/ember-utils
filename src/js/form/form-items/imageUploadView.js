define([
  "ember",
  "lib/ember-utils-core",
  "./fileUploadView",
  "jquery_ui",
], function(Ember, Utils, FileUploadView) {

/**
 * Form item to upload image.
 *
 * @class Form.ImageUploadView
 * @extends Form.FileUploadView
 * @module form
 * @submodule form-items
 */
var ImageUploadView = FileUploadView.FileUploadView.extend({
  template : Ember.Handlebars.compile('<p><button class="btn btn-default btn-sm" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>' +
                                        '{{view.columnData.form.btnLabel}}' +
                                      '</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.columnData.form.accept"}}></p>' +
                                      '<canvas class="hidden"></canvas>' +
                                      '<div {{bind-attr class="view.hasImage::hidden"}}>' +
                                        '<div class="image-container">' +
                                          '<div class="image-container-inner">' +
                                            '<img class="the-image" {{bind-attr src="view.imageSrc"}}>' +
                                            '<div class="image-cropper"></div>' +
                                          '</div>' +
                                        '</div>' +
                                        '<button class="btn btn-default btn-sm btn-crop" {{action "cropImage" target="view"}}>Crop</button>' +
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
          xM = x.match(/^(\d+)px$/), yM = y.match(/^(\d+)px$/),
          h = cropper.height(), w = cropper.width(),
          canvas = $(this.get("element")).find("canvas")[0],
          context = canvas.getContext("2d");
      x = (xM && Number(xM[1])) || 0;
      y = (yM && Number(yM[1])) || 0;
      context.drawImage($(this.get("element")).find(".the-image")[0], x, y, h, w, 0, 0, h, w);
      this.set("value", canvas.toDataURL());
      this.set("hasImage", false);
      cropper.css("left", 0);
      cropper.css("top", 0);
      cropper.height(100);
      cropper.width(100);
    },
  },

});

return {
  ImageUploadView : ImageUploadView,
};

});
