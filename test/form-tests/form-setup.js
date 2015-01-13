define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/form/main",
], function(Ember, DS, emq, Utils, EmberTests, Form) {

//FileReader shim
var FileReader = function() {
};
FileReader.prototype.readAsText = function(file) {
  var that = this;
  Ember.run.later(function() {
    that.onload({
      target : {
        result : file.data,
      }
    });
  }, 100)
};
FileReader.prototype.readAsDataURL = function(file) {
  var that = this;
  Ember.run.later(function() {
    that.onload({
      target : {
        result : file.data,
      }
    });
  }, 100)
};

EmberTests.TestCase.addToTestHierarchy("initForm", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var form = testData.get("testContext").subject();
    form.set("record", testData.get("record"));
    form.set("columnDataGroup", testData.get("columnDataGroup"));
    form.appendTo("#ember-testing");
    testData.set("form", form);
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("destroyForm", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.get("form").destroy();
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("fillFormElement", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return fillFormElement(this.get("attr1"), this.get("attr2"), this.get("attr3"));
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("clickFormElement", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return click(getColumnSelector(this.get("attr1"), this.get("attr2"))+this.get("attr3"));
  },
  attr3 : "",
}), "to");
EmberTests.TestCase.addToTestHierarchy("raiseFileUploadEvent", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var
    //files = [new File(this.get("attr2"), this.get("attr3"), {type : this.get("attr4"), lastModified : new Date()})],
    files = [{
      name : this.get("attr1"),
      type : this.get("attr2"),
      size : this.get("attr3").length,
      data : this.get("attr3"),
    }],
    inputView = testData.get("form.childViews").objectAt(0);
    inputView.change({
      originalEvent : {
        target : {
          files : files,
        },
      },
    });
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("shimReader", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("FileReader", window.FileReader);
    window.FileReader = FileReader;
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("restoreReader", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    window.FileReader = testData.get("FileReader");
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("setCropperDimensions", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var
    cropper = $(testData.get("form.element")).find(".image-cropper");
    cropper.css("left", this.get("attr1"));
    cropper.css("top", this.get("attr2"));
    cropper.width(this.get("attr3"));
    cropper.height(this.get("attr4"));
  },
  attr1 : "20px",
  attr2 : "20px",
  attr3 : "50px",
  attr4 : "50px",
}), "to");

});
