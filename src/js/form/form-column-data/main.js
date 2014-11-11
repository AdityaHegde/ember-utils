/**
 * Column data interface for form module.
 *
 * @submodule form-column-data
 * @module form
 */

define([
  "./formColumnDataGroup",
  "./formColumnData",
], function() {
  var FormColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        FormColumnData[k] = arguments[i][k];
      }
    }
  }

  FormColumnData.FormColumnDataMap = {
    textInput              : FormColumnData.FormColumnData,
    textareaInput          : FormColumnData.FormColumnData,
    staticSelect           : FormColumnData.FormColumnData,
    dynamicSelect          : FormColumnData.FormColumnData,
    selectiveSelect        : FormColumnData.FormColumnData,
    label                  : FormColumnData.FormColumnData,
    fileUpload             : FormColumnData.FormColumnData,
    imageUpload            : FormColumnData.FormColumnData,
    csvData                : FormColumnData.FormColumnData,
    multiEntry             : FormColumnData.FormColumnData,
    multiInput             : FormColumnData.FormColumnData,
    checkBox               : FormColumnData.FormColumnData,
    textareaSelectedInput  : FormColumnData.FormColumnData,
    groupRadioButton       : FormColumnData.FormColumnData,
    groupCheckBox          : FormColumnData.FormColumnData,
    sectionHeading         : FormColumnData.FormColumnData,
  };

  return FormColumnData;
});
