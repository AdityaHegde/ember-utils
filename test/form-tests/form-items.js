define([
  "ember",
  "ember_data",
  "ember_qunit",
  "lib/ember-test-utils",
], function(Ember, DS, emq, EmberTests) {

return function() {

EmberTests.TestCase.EmberTestSuit.create({
  suitName : "form-items", 
  param : "view:form/form", 
  moduleOpts : {
    setup : function() {
      EmberTests.TestUtils.setupAppForTesting(TestApp, this.container);
    },
    teardown : function() {
      TestApp.reset();
    },
    needs : [
      'model:test',
      'model:testp',
      'view:form/textInput',
      'view:form/staticSelect',
      'view:form/dynamicSelect',
      'view:form/dynamicMultiSelect',
      'view:form/cSVDataInput',
      'view:form/multiInput',
      'view:form/radioInput'
    ],
  },

  testCases : [{
    title : "Check propagation of text from text field to record",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "record", Ember.Object.create({vara : "Init"})],
        ["base", "", "columnDataGroup", ColumnData.ColumnDataGroup.create({
          name : "formTest",
          columns : [{
            name : "vara",
            label : "Vara",
            validation : {
              validations : [
                {type : 0},
                {type : 1, regex : "^[0-9a-zA-Z \\.\\-_]{1,50}$", negate : true, invalidMessage : "Vara cannot have special Characters"},
              ],
            },
            form : {moduleType : "textInput"},
          }],
          form : {},
        })],
      ]],
      ["initForm"],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.vara", "Init", "Value of vara is 'Init' intially"],
        ]],
        ["fillFormElement", "vara", "input", "From DOM"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.vara", "From DOM", "Value of vara is 'From DOM' after the input was filled"],
      ]],
      ["destroyForm"],
    ],
  }, {
    title : "Check that record becomes invalid if invalid text is entered",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "record", Ember.Object.create({vara : "Init"})],
        ["base", "", "columnDataGroup", ColumnData.ColumnDataGroup.create({
          name : "formTest",
          columns : [{
            name : "vara",
            label : "Vara",
            validation : {
              validations : [
                {type : 0},
                {type : 1, regex : "^[0-9a-zA-Z \\.\\-_]{1,50}$", negate : true, invalidMessage : "Vara cannot have special Characters"},
              ],
            },
            form : {moduleType : "textInput"},
          }],
          form : {},
        })],
      ]],
      ["initForm"],
      ["baseTestBlock", [
        ["fillFormElement", "vara", "input", "Invalid#"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.validationFailed", true, "Record's 'validationFailed' is true"],
        ]],
        ["fillFormElement", "vara", "input", "Valid"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.validationFailed", false, "Record's 'validationFailed' is false"],
      ]],
      ["destroyForm"],
    ],
  }, {
    title : "Test static select component",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "record", Ember.Object.create({vara : "Init"})],
        ["base", "", "columnDataGroup", ColumnData.ColumnDataGroup.create({
          name : "formTest",
          columns : [{
            name : "vara",
            label : "Vara",
            form : {
              moduleType : "staticSelect",
              options : [
                {val : "v0", label : "l0"},
                {val : "v1", label : "l1"},
                {val : "v2", label : "l2"},
              ],
              prompt : "Select",
            },
          }],
          form : {},
        })],
      ]],
      ["initForm"],
      ["baseTestBlock", [
        ["fillFormElement", "vara", "select", "v1"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.vara", "v1", "Value of vara is 'v1', after selecting 'l1'"],
        ]],
        ["destroyForm"],
      ]],
    ],
  }, {
    title : "Test dynamic select component",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "GlobalData", CrudAdapter.GlobalData],
        ["base", "GlobalData", "data", [
          Ember.Object.create({data_val : "v0", data_label : "l0"}),
        ]],
        ["base", "", "record", Ember.Object.create({vara : "Init"})],
        ["base", "", "columnDataGroup", ColumnData.ColumnDataGroup.create({
          name : "formTest",
          columns : [{
            name : "vara",
            label : "Vara",
            form : {
              moduleType : "dynamicSelect",
              dataPath : "CrudAdapter.GlobalData.data",
              dataValCol : "data_val",
              dataLabelCol : "data_label",
              prompt : "Select",
            },
          }],
          form : {},
        })],
      ]],
      ["initForm"],
      ["baseTestBlock", [
        ["fillFormElement", "vara", "select", "v0"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.vara", "v0", "Value of vara is 'v0', after selecting 'l0'"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "GlobalData.data", "", Ember.Object.create({data_val : "v1", data_label : "l1"}), "push"],
        ]],
      ]],
      ["baseTestBlock", [
        ["fillFormElement", "vara", "select", "v1"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.vara", "v1", "Value of vara is 'v1', after selecting 'l1'"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "form", "record", Ember.Object.create({vara : "v0"})],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "form.childViews.0.value", "v0", "'value' of form is 'v0' after changing record directly"],
          ["base", "form.record.vara",        "v0", "Value of vara is 'v0' after modifying record directly"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "GlobalData", "data", [
            Ember.Object.create({data_val : "v0", data_label : "l0"}),
            Ember.Object.create({data_val : "v1", data_label : "l1"}),
            Ember.Object.create({data_val : "v2", data_label : "l2"}),
          ]],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "form.childViews.0.value", "v0", "'value' of form is 'v0' after changing options directly"],
          ["base", "form.record.vara",        "v0", "Value of vara is 'v0' after modifying options directly"],
        ]],
        ["destroyForm"],
      ]],
    ],
  }, {
    title : "Test dynamic multi select component",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "GlobalData", CrudAdapter.GlobalData],
        ["base", "GlobalData", "data", [
          Ember.Object.create({data_val : "v0", data_label : "l0"}),
          Ember.Object.create({data_val : "v1", data_label : "l1"}),
          Ember.Object.create({data_val : "v2", data_label : "l2"}),
        ]],
        ["base", "", "columnDataGroup", ColumnData.ColumnDataGroup.create({
          name : "formTest",
          columns : [{
            name : "tests",
            label : "Tests",
            form : {
              moduleType : "dynamicMultiSelect",
              dataPath : "CrudAdapter.GlobalData.data",
              dataValCol : "data_val",
              dataLabelCol : "data_label",
              arrayCol : "vara",
              arrayType : "test",
              copyAttrs : {
                varb : "varb",
              },
              staticAttrs : {
                varc : "varc_static",
              },
              valAttrs : {
                label : "vard",
                val : "vara",
              },
              eachValidations : [
                {type : 0},
              ],
            },
          }],
          form : {},
        })],
        ["base", "", "ApplicationAdapter",    CrudAdapter.ApplicationAdapter],
        ["base", "", "ApplicationSerializer", CrudAdapter.ApplicationSerializer],
      ]],
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "testp", {vara : "test", varb : "test_varb"}],
      ]],
      ["initForm"],
      ["baseTestBlock", [
        ["fillFormElement", "tests", "select", ["v0", "v1"]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.tests.0.vara", "v0",          "'vara' of 1st element is 'v0'"                                               ],
          ["base", "record.tests.0.varb", "test_varb",   "'varb' of 1st element is 'test_varb' copied from 'record'"                   ],
          ["base", "record.tests.0.varc", "varc_static", "'varc' of 1st element is 'varc_static' assigned a static value"              ],
          ["base", "record.tests.0.vard", "l0",          "'vard' of 1st element is 'l0' copied from selected value from dynamic select"],
          ["base", "record.tests.1.vara", "v1",          "'vara' of 2nd element is 'v1'"                                               ],
          ["base", "record.tests.1.varb", "test_varb",   "'varb' of 2nd element is 'test_varb' copied from 'record'"                   ],
          ["base", "record.tests.1.varc", "varc_static", "'varc' of 2nd element is 'varc_static' assigned a static value"              ],
          ["base", "record.tests.1.vard", "l1",          "'vard' of 2nd element is 'l1' copied from selected value from dynamic select"],
        ]],
        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "record.tests.@", "", "", "pop"],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "form.childViews.0.selection.@.val", ["v0"], "selection was updated when value associated was directly updated"],
        ]],

      //TODO : fix this.
      /*  ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "GlobalData", "data", [
            Ember.Object.create({data_val : "v0", data_label : "l0"}),
          ]],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "form.childViews.0.selection.@.val", ["v0"], "selection was retained when options was updated"],
          ["base", "record.tests.@.vara",               ["v0"], "record value was retained when options was updated"],
        ]],*/

        ["assignValues", [
          //"type", "path", "putPath", "value", "param", "valuePath"
          ["base", "GlobalData", "data", [
            Ember.Object.create({data_val : "v1", data_label : "l1"}),
          ]],
        ]],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "form.childViews.0.selection.length", 0, "selection was emptied when options without the selected was updated"],
          ["base", "record.tests.length",                0, "record value was emptied when options without the selected was updated"],
        ]],
        ["destroyForm"],
      ]],
    ],
  }, {
    title : "Test csv data",
    type : "baseTestCase",
    testData : {},
    testBlocks : [
      ["assignValues", [
        //"type", "path", "putPath", "value", "param", "valuePath"
        ["base", "", "columnDataGroup", ColumnData.ColumnDataGroup.create({
          name : "formTest",
          columns : [{
            name : "tests",
            label : "Tests",
            form : {
              moduleType : "csvData",
              arrayCol : "vara",
              arrayType : "test",
              btnLabel : "Upload File",
              splitRegex : "\\s*[,\\n\\r]\\s*",
              accept : ".csv, .txt,text/csv",
              rows : "5",
              cols : "100",
              method : "ReadFileAsText",
              copyAttrs : {
                varb : "varb",
              },
              staticAttrs : {
                varc : "varc_static",
              },
              valAttrs : {
                label : "vard",
              },
              eachValidations : [
                {type : 0},
              ],
            },
            validation : {
              validations : [],
            },
          }],
          form : {},
        })],
        ["base", "", "ApplicationAdapter",    CrudAdapter.ApplicationAdapter],
        ["base", "", "ApplicationSerializer", CrudAdapter.ApplicationSerializer],
      ]],
      ["setupStore"],
      ["baseTestBlock", [
        ["createRecord", "testp", {vara : "test", varb : "test_varb"}],
      ]],
      ["initForm"],
      ["baseTestBlock", [
        ["fillFormElement", "tests", "textarea", "test1, test2, test3, test4, test5"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.tests.@.vara", ["test1", "test2", "test3", "test4", "test5"], "Right 'vara' values were assigned"],
        ]],
        ["fillFormElement", "tests", "textarea", "test6, test7, test8, test9, test10"],
      ]],
      ["baseTestBlock", [
        ["checkValues", [
          //"type", "path", "value", "message"
          ["base", "record.tests.@.vara", ["test6", "test7", "test8", "test9", "test10"],                              "Right 'vara' values were assigned"],
          ["base", "record.tests.@.varb", ["test_varb", "test_varb", "test_varb", "test_varb", "test_varb"],           "Right 'varb' values were assigned"],
          ["base", "record.tests.@.varc", ["varc_static", "varc_static", "varc_static", "varc_static", "varc_static"], "Right 'varc' values were assigned"],
        ]],
        ["fillFormElement", "tests", "textarea", "test11, test12"],
      ]],
      ["checkValues", [
        //"type", "path", "value", "message"
        ["base", "record.tests.@.vara", ["test11", "test12"], "Right 'vara' values were assigned"],
      ]],
      ["destroyForm"],
    ],
  }],
});

};

});
