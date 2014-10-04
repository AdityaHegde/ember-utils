EmberFile = Ember.Namespace.create();
EmberFile.FileInput = Ember.Component.extend({
  data : "",
  disabled : false,
  label : "Load File",

  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}}>{{label}}</button>' +
                                      '<input class="input-hidden" type="file" name="files[]">'),


  change : function(event) {
    var files = event.originalEvent.target.files, that = this;
    if(files && files.length > 0 && !Ember.isEmpty(files[0])) {
      this.set("disabled", "disabled");
      EmberFile.ReadFileAsText(files[0]).then(function(data) {
        that.set("data", data);
        that.set("disabled", false);
      }, function(message) {
        console.log(message);
        that.set("disabled", false);
      });
      $(this.get("element")).children("input")[0].value = "";
    }
  },

  actions : {
    loadFile : function() {
      fileInput = $(this.get("element")).children("input")[0];
      fileInput.click();
    },
  },
});

Ember.Handlebars.helper('file-input', EmberFile.FileInput);

EmberFile.ReadFileAsText = function(file) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var reader = new FileReader(), that = this;
    reader.onload = function(data) {
      resolve(data.target.result);
    };
    reader.readAsText(file);
  });
};
