/**
 * Module with all the form items.
 *
 * @submodule form-items
 * @module form
 */

define([
  "./textInputView",
  "./textAreaView",
  "./multipleValue",
  "./multipleValueMixin",
  "./multiEntryView",
  "./multiInputView",
  "./emberSelectViewFix",
  "./staticSelectView",
  "./dynamicSelectView",
  "./dynamicMultiSelectView",
  "./fileUploadView",
  "./imageUploadView",
  "./csvDataInputView",
  "./radioInputView",
  "./groupRadioButtonView",
  "./checkBoxView",
  "./groupCheckBoxView",
  "./labelView",
  "./legendView",
  "./wrapperView",
], function() {
  var FormItems = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        FormItems[k] = arguments[i][k];
      }
    }
  }

  FormItems.TypeToCellNameMap = {
    textInput             : "form/textInput",
    textareaInput         : "form/textArea",
    staticSelect          : "form/staticSelect",
    dynamicSelect         : "form/dynamicSelect",
    dynamicMultiSelect    : "form/dynamicMultiSelect",
    label                 : "form/label",
    legend                : "form/legend",
    fileUpload            : "form/fileUpload",
    imageUpload           : "form/imageUpload",
    csvData               : "form/cSVDataInput",
    multiEntry            : "form/multiEntry",
    multiInput            : "form/multiInput",
    checkBox              : "form/checkBox",
    textareaSelectedInput : "form/textAreaSelected",
    groupRadioButton      : "form/groupRadioButton",
    groupCheckBox         : "form/groupCheckBox",
    sectionHeading        : "form/mediumHeading",
  };

  return FormItems;
});
