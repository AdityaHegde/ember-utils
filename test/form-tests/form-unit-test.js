test("Test dependent columns", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "v0",
      varb : "",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "staticSelect",
        label : "Vara",
        validations : [
          {type : 0},
        ],
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
        prompt : "Select",
      }),
      ColumnData.ColumnData.create({
        name : "varb_input",
        keyName : "varb",
        type : "textInput",
        label : "Varb",
        disableForCols : [
          {name : "vara", value : "v0", enable : true},
        ],
        listenForCols : ['vara'],
      }),
      ColumnData.ColumnData.create({
        name : "varb_select",
        keyName : "varb",
        type : "staticSelect",
        label : "Varb",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
        disableForCols : [
          {name : "vara", value : "v1", enable : true},
        ],
        listenForCols : ['vara'],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  //TODO : click on the option instead of setting value
  fillFormElement("vara", "select", "v0");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v0", "Value of vara is 'v0', after selecting 'l0'");
    ok(!form._childViews[1].get("disabled"), "2nd column data is enabled");
    ok(form._childViews[2].get("disabled"), "3nd column data is disabled");
  });
  fillFormElement("varb_input", "input", "v0");
  wait();
  andThen(function() {
    equal(record.get("varb"), "v0", "Value of varb is 'v0'");
  });
  fillFormElement("vara", "select", "v1");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "Value of vara is 'v1', after selecting 'l1'");
    ok(form._childViews[1].get("disabled"), "2nd column data is disabled");
    ok(!form._childViews[2].get("disabled"), "3nd column data is enabled");
  });
  fillFormElement("varb_select", "select", "v1");
  wait();
  andThen(function() {
    equal(record.get("varb"), "v1", "Value of varb is 'v1'");
  });
  fillFormElement("vara", "select", "v2");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v2", "Value of vara is 'v2', after selecting 'l2'");
    equal(record.get("varb"), "v1", "Value of varb is still 'v1'");
    form.destroy();
  });
});

test("Dynamic changes to record", function() {
  var form = this.subject(), record, columnData,
      formElement,
      store = setupStoreAndReturnIt(this.container);
  Ember.run(function() {
    record = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
        removeOnEdit : true,
      }),
      ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "Varb",
        removeOnNew : true,
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    formElement = $(form.get("element"));
    equal(formElement.find(getColumnSelector("vara", "input")).length, 1, "input for vara is present");
    equal(formElement.find(getColumnSelector("varb", "input")).length, 0, "input for varb is not present");
  });
  wait();
  andThen(function() {
    CrudAdapter.saveRecord(record, TestApp.Test);
  });
  wait();
  andThen(function() {
    equal(formElement.find(getColumnSelector("vara", "input")).length, 0, "input for vara is removed");
    equal(formElement.find(getColumnSelector("varb", "input")).length, 1, "input for varb is added");
  });
  wait();
  andThen(function() {
    form.destroy();
  });
});

test("Dynamic changes to column", function() {
  var form = this.subject(), record, columnData,
      formElement;
  Ember.run(function() {
    record = Ember.Object.create();
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      formElement = $(form.get("element"));
      columnData.pushObject(ColumnData.ColumnData.create({
        name : "varb",
        type : "textInput",
        label : "VarB",
      }));
      columnData.replace(0, 1, [ColumnData.ColumnData.create({
        name : "vara",
        type : "staticSelect",
        label : "VarA",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
      })]);
    });
  });
  wait();
  andThen(function() {
    equal(formElement.find(getColumnSelector("vara", "input")).length, 0, "input for vara was removed");
    fillFormElement("vara", "select", "v1");
    fillFormElement("varb", "input", "varb");
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "select was added for vara and value was updated");
    equal(record.get("varb"), "varb", "input was added for varb and value was updated");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      columnData.removeAt(1);
    });
  });
  wait();
  andThen(function() {
    equal(formElement.find(getColumnSelector("varb", "input")).length, 0, "input for varb was removed");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      columnData.pushObject(ColumnData.ColumnData.create({
        name : "vara",
        type : "textInput",
        label : "Vara",
      }));
    });
  });
  wait();
  andThen(function() {
    //adding column with same name remove the older form element
    equal(formElement.find(getColumnSelector("vara", "select")).length, 0, "select for vara was removed");
    equal(formElement.find(getColumnSelector("vara", "input")).length, 1, "input for vara was added");
    form.destroy();
  });
});

};

});
