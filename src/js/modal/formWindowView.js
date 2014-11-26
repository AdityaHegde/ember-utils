define([
  "ember",
  "./modalWindowView",
], function(Ember, ModalWindowView) {

/**
 * Modal window that encapsulates form view.
 *
 * @class Modal.FormWindowView
 * @extends Modal.ModalWindowView
 */
var FormWindowView = ModalWindowView.ModalWindowView.extend({
  /**
   * Callback called when save is successfull. 'callbackContext' is used as context.
   *
   * @method saveSuccessCallback
   * @param {Instance} record
   * @param {String} message
   * @param {String} title
   */
  saveSuccessCallback : null,

  /**
   * To close on success or not.
   *
   * @property closeOnSuccess
   * @type Boolean
   * @default true
   */
  closeOnSuccess : true,

  /**
   * Callback called when save fails. 'callbackContext' is used as context.
   *
   * @method saveFailureCallback
   * @param {Instance} record
   * @param {String} message
   * @param {String} title
   */
  saveFailureCallback : null,

  /**
   * To close on failure or not.
   *
   * @property closeOnSuccess
   * @type Boolean
   * @default false
   */
  closeOnFailure : false,

  /**
   * Context used to call the callbacks.
   *
   * @property callbackContext
   */
  callbackContext : null,

  /**
   * Status of last operation.
   *
   * @property operationStatus
   * @type {String}
   * @protected
   */
  operationStatus : "",

  messageToPass : "",

  /**
   * Callback called when form editing is cancelled. 'callbackContext' is used as context.
   *
   * @method postCancelCallback
   * @param {Instance} record
   */
  postCancelCallback : null,

  postShowHook : function() {
    if($('.modal-body:visible [autofocus]')[0]) $('.modal-body:visible [autofocus]')[0].focus();
  },
  postHideHook : function() {
    if(!Ember.isEmpty(this.get("operationStatus"))) {
      var
      isSuccess = this.get("operationStatus") === "success";
      record = this.get("record." + this.get("columnDataGroup.modal.bodyColumnData.key")),
      callbackContext = this.get("callbackContext");
      if(isSuccess && this.get("closeOnSuccess") && this.get("saveSuccessCallback")) {
        this.get("saveSuccessCallback").call(callbackContext, record, this.get("messageToPass"), record.__proto__.constructor.title || "Data");
      }
      else if(!isSuccess && this.get("closeOnFailure") && this.get("saveFailureCallback")) {
        this.get("saveFailureCallback").call(callbackContext, record, this.get("messageToPass"), record.__proto__.constructor.title || "Data");
      }
      this.set("operationStatus", "");
    }
  },

  onOk : function() {
    var
    record = this.get("record." + this.get("columnDataGroup.modal.bodyColumnData.key")),
    that = this,
    callbackContext = this.get("callbackContext");
    this.set("saving", true);
    CrudAdapter.saveRecord(record).then(function(response) {
      that.set("operationStatus", "success");
      if(that.get("closeOnSuccess")) {
        that.set("messageToPass", "Saved successfully!");
        that.set("fromButton", true);
        $(that.get("element")).modal('hide');
      }
      else if(that.get("saveSuccessCallback")) {
        that.get("saveSuccessCallback").call(callbackContext, record, "Saved successfully!", record.__proto__.constructor.title || "Data");
      }
    }, function(response) {
      that.set("operationStatus", "failure");
      CrudAdapter.retrieveFailure(record);
      CrudAdapter.backupDataMap = {};
      if(that.get("closeOnFailure")) {
        that.set("fromButton", true);
        that.set("messageToPass", response.statusText || response);
        $(that.get("element")).modal('hide');
      }
      else if(that.get("saveFailureCallback")) {
        that.get("saveFailureCallback").call(callbackContext, record, response.statusText || response, record.__proto__.constructor.title);
      }
    });
  },

  onCancel : function() {
    this._super();
    var 
    record = this.get("record." + this.get("columnDataGroup.modal.bodyColumnData.key")),
    postCancelCallback = this.get("postCancelCallback"),
    callbackContext = this.get("callbackContext");
    this.set("showAlert", false);
    if(record && !record.get("isSaving")) {
      if(record.get("isNew")) {
        record.deleteRecord();
      }
      else {
        record._validation = {};
        record.set("validationFailed", false);
        CrudAdapter.rollbackRecord(record);
      }
      if(postCancelCallback) {
        postCancelCallback.call(callbackContext, record);
      }
      this.set("record", null);
    }
    this.set("fromButton", true);
  },
});

return {
  FormWindowView : FormWindowView,
};

});
