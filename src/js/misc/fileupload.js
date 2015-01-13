define([
  "ember",
], function(Ember) {

EmberFile = Ember.Namespace.create();
window.EmberFile = EmberFile;

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

EmberFile.ReadAsDataURI = function(file) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    var reader = new FileReader(), that = this;
    reader.onload = function(data) {
      resolve(data.target.result);
    };
    reader.readAsDataURL(file);
  });
};

return EmberFile;

});
