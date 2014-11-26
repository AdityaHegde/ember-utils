define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-utils-core",
  "lib/ember-test-utils",
  "source/column-data/main",
  "source/modal/main",
], function(Ember, DS, emq, Utils, EmberTests, ColumnData, Modal) {

EmberTests.TestCase.addToTestHierarchy("initModalWindow", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var 
    actionContext = Ember.Object.create({ok : false, cancel : false}),
    columnDataGroup = ColumnData.ColumnDataGroup.create({
      name : "modalTest",
      columns : [{
        name : "title",
        label : "Title",
        modal : {
          moduleType : "title",
          viewType : "modalTitle",
        },
      }, {
        name : "body",
        label : "Body",
        modal : {
          moduleType : "body",
          viewType : "modalBody",
        },
      }, {
        name : "footer",
        label : "Footer",
        modal : {
          moduleType : "footer",
          viewType : "modalFooter",
          okLabel : "Ok Label",
          cancelLabel : "Cancel Label",
        },
      }],
      modal : {},
    }),
    modal = testData.get("testContext").subject({
      record : testData.get("record"),
      columnDataGroup : columnDataGroup,
      onOk : function() {
        this.set("okPressed", true);
      },
      onCancel : function() {
        this.set("cancelPressed", true);
      },
      actionContext : actionContext,
    });
    modal.appendTo("#ember-testing");
    testData.set("columnDataGroup", columnDataGroup);
    testData.set("modal", modal);
    actionContext.set("modal", modal);
    testData.set("actionContext", actionContext);
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("initFormModalWindow", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var 
    actionContext = Ember.Object.create({ok : false, cancel : false}),
    columnDataGroup = ColumnData.ColumnDataGroup.create({
      name : "modalFormTest",
      columns : [{
        name : "title",
        label : "Title",
        modal : {
          moduleType : "title",
          viewType : "modalTitle",
        },
      }, {
        name : "rec",
        label : "Body",
        modal : {
          moduleType : "body",
          viewType : "modalFormBody",
        },
        childColGroup : {
          name : "innerForm",
          form : {},
          columns : [{
            name : "vara",
            label : "Vara",
            form : {
              moduleType : "textInput",
            },
          }, {
            name : "varb",
            label : "Varb",
            form : {
              moduleType : "textInput",
            },
          }],
        },
      }, {
        name : "footer",
        label : "Footer",
        modal : {
          moduleType : "footer",
          viewType : "modalFooter",
          okLabel : "Ok Label",
          cancelLabel : "Cancel Label",
        },
      }],
      modal : {
        bodyType : "modalFormBody",
      },
    }),
    modal = testData.get("testContext").subject({
      record : testData.get("record"),
      columnDataGroup : columnDataGroup,
      saveSuccessCallback : function(record, message, title) {
        this.set("saveSuccessCallback", true);
        this.set("saveSuccessCallbackRecord", record);
        this.set("saveSuccessCallbackMessage", message);
        this.set("saveSuccessCallbackTitle", title);
      },
      closeOnFailure : true,
      saveFailureCallback : function(record, message, title) {
        this.set("saveFailureCallback", true);
        this.set("saveFailureCallbackRecord", record);
        this.set("saveFailureCallbackMessage", message);
        this.set("saveFailureCallbackTitle", title);
      },
      postCancelCallback : function() {
        this.set("saveCancelCallback", true);
      },
      callbackContext : actionContext,
    });
    modal.appendTo("#ember-testing");
    testData.set("modal", modal);
    testData.set("columnDataGroup", columnDataGroup);
    actionContext.set("modal", modal);
    testData.set("actionContext", actionContext);
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("showModalWindow", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return Modal.ModalWindowView.showModalWindow("#"+testData.get("modal.elementId"), this.get("attr1"));
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("loadElementFromModal", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    testData.set("element", $(testData.get("modal.element")));
  },
}), "to");
EmberTests.TestCase.addToTestHierarchy("checkTextFromElement", EmberTests.TestCase.TestOperation.extend({
  run : function(testData) {
    var element = testData.get("element");
    EmberTests.TestUtils.equal(element.find(this.get("attr1")).text(), this.get("attr2"), this.get("attr3"));
  },

  assertions : 1,
}), "to");
EmberTests.TestCase.addToTestHierarchy("clickElement", EmberTests.TestCase.AsyncOperation.extend({
  asyncRun : function(testData) {
    return click(testData.get("element").find(this.get("attr1")));
  },
}), "to");

});
