test("Test radio buttons component", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "groupRadioButton",
        label : "Vara",
        options : [
          {val : "v0", label : "l0"},
          {val : "v1", label : "l1"},
          {val : "v2", label : "l2"},
        ],
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  click(getColumnSelector("vara", "input")+"[value='v1']");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1", "Value of vara is 'v1', after clicking 'l1' radio button");
  });
  click(getColumnSelector("vara", "input")+"[value='v2']");
  wait();
  andThen(function() {
    equal(record.get("vara"), "v2", "Value of vara is 'v2', after clicking 'l2' radio button");
    form.destroy();
  });
});

test("Test group checkboxes", function() {
  var form = this.subject(), record, columnData;
  Ember.run(function() {
    record = Ember.Object.create({
      vara : "v1,v3",
    });
    columnData = [
      ColumnData.ColumnData.create({
        name : "vara",
        type : "groupCheckBox",
        label : "Vara",
        checkList : [
          { checkboxLabel : "l0", id : "v0", checked : false },
          { checkboxLabel : "l1", id : "v1", checked : true },
          { checkboxLabel : "l2", id : "v2", checked : false },
          { checkboxLabel : "l3", id : "v3", checked : true },
          { checkboxLabel : "l4", id : "v4", checked : false },
        ],
        displayInline : true,
      }),
    ];
    form.set("record", record);
    form.set("cols", columnData);
    form.appendTo("#ember-testing");
  });
  wait();
  andThen(function() {
    equal(record.get("vara"), "v1,v3", "Value of vara is initially 'v1,v3'");
  });
  click($(getColumnSelector("vara", "input"))[1]);
  click($(getColumnSelector("vara", "input"))[2]);
  wait();
  andThen(function() {
    equal(record.get("vara"), "v2,v3", "Value of vara is 'v2,v3', after checking 'v2' and unchecking 'v1'");
    form.destroy();
  });
});

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

test("Multi entry with Multi input", function() {
  var form = this.subject(), columnData,
      parentRec, childRecs = [],
      store = setupStoreAndReturnIt(this.container),
      formElement;
  Ember.run(function() {
    parentRec = store.find("testp", "test1");
  });
  wait();
  andThen(function() {
    Ember.run(function() {
      parentRec = parentRec.content;
      columnData = [
        ColumnData.ColumnData.create({
          name : "tests",
          type : "multiEntry",
          label : "Tests",
          arrayType : "test",
          copyAttrs : {
            varb : "varb",
          },
          staticAttrs : {
            varc : "varc_static",
          },
          valAttrs : {
            label : "vard",
          },
          childCol : {
            name : "test",
            type : "multiInput",
            childCols : [
              {
                name : "vara",
                type : "textInput",
                label : "VarA",
                validations : [
                  {type : 4, duplicateCheckPath : "testp.tests", duplicateCheckKey : "vara"},
                ],
                bubbleValues : true,
                listenForCols : ['vara'],
              },
              {
                name : "varb",
                type : "staticSelect",
                label : "VarB",
                options : [
                  {val : "vb0", label : "lb0"},
                  {val : "vb1", label : "lb1"},
                  {val : "vb2", label : "lb2"},
                ],
              },
            ],
          },
          eachMultiEntryClass : "test-each-multi-wrapper",
          multiEntryClass : "test-each-multi",
        }),
      ];
      form.set("record", parentRec);
      form.set("cols", columnData);
      form.appendTo("#ember-testing");
    });
  });
  wait();
  andThen(function() {
    formElement = $(form.get("element"));
    equal(formElement.find(getColumnSelector("vara", "input")).length, 3, "3 inputs for vara for the 3 'test' records");
    equal(formElement.find(getColumnSelector("varb", "select")).length, 3, "3 selects for varb for the 3 'test' records");
    click(formElement.find(getColumnSelector("tests", ".test-each-multi-wrapper:nth-of-type(2) .remove-entry a")))
  });
  wait();
  andThen(function() {
    checkElements(parentRec.get("tests"), "vara", ["test11", "test13"], 1);
    click(formElement.find(getColumnSelector("tests", ".test-each-multi-wrapper:nth-of-type(2) .add-entry a")))
  });
  wait();
  andThen(function() {
    fillFormElement("tests", ".test-each-multi-wrapper:nth-of-type(3) " + getColumnSelector("vara", "input"), "test11");
  });
  wait();
  andThen(function() {
    var tests = parentRec.get("tests"),
        first = tests.objectAt(0),
        last = tests.objectAt(2);
    equal(last.get("vara"), "test11", "vara got the right value from input");
    equal(last.get("varb"), "vb1", "varb was copied from 'parentRec'");
    equal(last.get("varc"), "varc_static", "varc was assigned a static value");
    ok(first.get("validationFailed") && first._validation.vara, "validation failed for first element for vara"),
    ok(last.get("validationFailed") && last._validation.vara, "validation failed for last element for vara"),
    form.destroy();
  });
});

};

});
