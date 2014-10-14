moduleFor("view:modal/modalWindow", "modal.js - ModalWindow", {
  setup : function() {
    setupAppForTesting(TestApp, this.container);
  },
  teardown : function() {
    TestApp.reset();
  },
});

test("Sanity Test", function() {
  var actionContext = {ok : false, cancel : false},
  modal = this.subject({
    title : "Title Test",
    okLabel : "Ok Test",
    cancelLabel : "Cancel Test",
    onOk : function() {
      this.ok = true;
      modal.set("fromButton", false);
    },
    onCancel : function() {
      this.cancel = true;
    },
    actionContext : actionContext,
  });
  Ember.run(function() {
    modal.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    click($(modal.get("element")).find(".ok-btn"));
    click($(modal.get("element")).find(".cancel-btn"));
  });
  wait();
  andThen(function() {
    var element = $(modal.get("element"))
    ok(actionContext.ok, "Ok callback called and context was passed");
    ok(actionContext.cancel, "Cancel callback called and context was passed");
    equal(element.find(".modal-title").text(), "Title Test");
    equal(element.find(".ok-btn").text(), "Ok Test");
    equal(element.find(".cancel-btn").text(), "Cancel Test");
    modal.destroy();
  });
});

moduleFor("view:modal/addEditWindow", "modal.js - AddEditWindow", {
  setup : function() {
    setupAppForTesting(TestApp, this.container);
  },
  teardown : function() {
    TestApp.reset();
  },
  needs : ['model:test', 'model:testp'],
});

test("Click Ok", function() {
  var actionContext = {ok : false, cancel : false},
  store = setupStoreAndReturnIt(this.container),
  record, columnData, modal, that = this;
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test_vara",
      varb : "test_varb",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "VarA",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }),
    ];
    modal = that.subject({
      data : record,
      columns : columnData,
      saveCallback : function(rec) {
        actionContext.ok = rec;
      },
      postCancelCallback : function() {
        actionContext.cancel = true;
      },
    });
    modal.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    fillFormElement("varb", "input", "test_varb_changed");
    click($(modal.get("element")).find(".ok-btn"));
  });
  wait();
  andThen(function() {
    equal(actionContext.ok, record, "Save was called and record passed to callback");
    equal(record.get("vara"), "test_vara");
    equal(record.get("varb"), "test_varb_changed");
    modal.destroy();
  });
});

test("Click Ok but failed", function() {
  var actionContext = {ok : false, cancel : false},
  store = setupStoreAndReturnIt(this.container),
  record, columnData, modal, that = this;
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test_vara",
      varb : "test_varb",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "VarA",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }),
    ];
    modal = that.subject({
      data : record,
      columns : columnData,
      saveCallback : function(rec) {
        actionContext.ok = rec;
      },
      postCancelCallback : function() {
        actionContext.cancel = true;
      },
    });
    modal.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    fillFormElement("varb", "input", "test_varb_changed");
    mockjaxSettings.throwProcessError = 1;
    click($(modal.get("element")).find(".ok-btn"));
  });
  wait();
  andThen(function() {
    equal($(modal.get("element")).find(".alert-message").text(), "Failed");
    mockjaxSettings.throwProcessError = 0;
    click($(modal.get("element")).find(".ok-btn"));
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "test_vara");
    equal(record.get("varb"), "test_varb_changed");
    modal.destroy();
  });
});

test("Click Cancel and verify rollback", function() {
  var actionContext = {ok : false, cancel : false},
  store = setupStoreAndReturnIt(this.container),
  record, columnData, modal, that = this;
  Ember.run(function() {
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "VarA",
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }),
    ];
    modal = that.subject({
      columns : columnData,
      saveCallback : function(rec) {
        actionContext.ok = rec;
      },
      postCancelCallback : function(rec) {
        actionContext.cancel = rec;
      },
    });
    modal.appendTo("#ember-testing");
    record = store.find("test", "test");
  });
  wait();
  andThen(function() {
    record = record.content;
    modal.set("data", record);
    $(modal.get("element")).modal();
  });
  wait();
  andThen(function() {
    record.set("varb", "test_varb_changed");
  });
  wait();
  andThen(function() {
    click($(modal.get("element")).find(".cancel-btn"));
  });
  wait();
  andThen(function() {
    equal(record.get("varb"), "test_varb", "'varb' is reverted back to 'test_varb'");
    modal.destroy();
  });
});
