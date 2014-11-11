Modal = Ember.Namespace.create();

Modal.showModalWindow = function(modalSelector, hide) {
  var ele = $(modalSelector), modalView = Ember.View.views[ele.attr("id")];
  return modalView.showModalWindow(hide);
};

Modal.ModalContainer = Ember.ContainerView.extend({
  tagName : '',
});

Modal.ModalWindowView = Ember.View.extend({
  classNames : ['modal'],
  classNameBindings : ['animate:fade'],
  animate : true,

  attributeBindings : ['titleid:aria-labelledby', 'role', 'zIndex:data-zindex', 'backdrop:data-backdrop'],
  titleid : "title-id",
  role : 'dialog',
  loaded : true,
  zIndex : 1000,
  backdrop : "true",
  width : "600px",
  widthStyle : function() {
    return "width:"+this.get("width")+";";
  }.property('view.width', 'width'),

  title : "Title",
  okLabel : "OK",
  showOk : true,
  cancelLabel : "Cancel",
  showCancel : true,
  messageLabel : "",
  message : "",
  layout : Ember.Handlebars.compile('' +
    '<div class="modal-dialog" {{bind-attr style="view.widthStyle"}}>' +
      '<div class="modal-content" tabindex=-1>' +
        '<div class="modal-header">' +
          '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
          '<h4 class="modal-title" {{bind-attr id="view.titleid"}}>{{view.title}}</h4>' +
          '<h5 class="custom-font">{{view.windowMessage}}</h5>'+
        '</div>' +
        '<div class="modal-body">' +
          '{{alert-message message=view.message title=view.messageLabel}}' +
          '{{yield}}' +
        '</div>' +
        '<div class="modal-footer">' +
          '{{#if view.showOk}}' +
            '<button type="button" class="btn btn-primary ok-btn" {{bind-attr disabled=view.disableAlias}} {{action "okClicked" target="view"}}>{{view.okLabel}}</button>' +
          '{{/if}}' +
          '{{#if view.showCancel}}' +
            '<button type="button" class="btn btn-default cancel-btn" data-dismiss="modal" {{action "cancelClicked" target="view"}}>{{view.cancelLabel}}</button>' +
          '{{/if}}' +
        '</div>' +
      '</div>' +
    '</div>'),

  onOk : null,
  onCancel : null,
  actionContext : null,
  fromButton : false,

  disableAlias : Ember.computed.alias("data.disableSave"),

  showModalMesssage : function(label, message) {
    this.set("messageLabel", label);
    this.set("message", message);
  },

  showHidePriomise : null,
  showHideResolve : null,
  showHideReject : null,
  showModalWindow : function(hide) {
    var ele = $(this.get("element")), that = this,
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      that.setProperties({
        showHideResolve : resolve,
        showHideReject : reject,
      });
    });
    this.set("showHidePriomise", promise);
    ele.modal(hide ? "hide" : null);
    return promise;
  },
  didInsertElement : function() {
    var onCancel = this.get("onCancel"), context = this.get("actionContext") || this,
        that = this, element = $(this.get("element"));
    element.on("show.bs.modal", function(e) {
      Ember.run.begin();
    });
    element.on("shown.bs.modal", function(e) {
      Ember.run.end();
      Ember.run(function() {
        that.get("showHideResolve")();
        that.postShowHook();
      });
    });
    element.on("hide.bs.modal", function(e) {
      Ember.run(function() {
        if(!that.get("fromButton") && onCancel) onCancel.call(context);
        that.set("fromButton", false);
      });
      if($(e.currentTarget).hasClass("in")) {
        Ember.run.begin();
      }
    });
    element.on("hidden.bs.modal", function(e) {
      Ember.run.end();
      Ember.run(function() {
        that.get("showHideResolve")();
        that.postHideHook();
      });
    });
  },

  actions : {
    okClicked : function(event) {
      var onOk = this.get("onOk");
      this.set("fromButton", true);
      if(onOk) onOk.call(this.get("actionContext") || this);
    },

    cancelClicked : function(event) {
      var onCancel = this.get("onCancel");
    },
  },

  onCancel : function(){
    $('.tooltip').hide();
  },
  postShowHook : function() {
  },
  postHideHook : function() {
  },

});

Modal.AddEditWindowView = Modal.ModalWindowView.extend({
  columnDataGroup : [],
  record : null,

  saveCallback : null,
  postCancelCallback : null,
  closeOnSuccess : true,

  disableAlias : Ember.computed.or("record.disableSave", "saving"),

  saving : false,

  postShowHook : function() {
    this.set("saving", false);
  },
  postHideHook : function() {
    if(this.get("closeOnSuccess") && this.get("saveCallback")) {
      var record = this.get("record");
      this.get("saveCallback")(record, "Saved successfully!", record.__proto__.constructor.title || "Data");
    }
  },

  didInsertElement : function() {
    this._super();
    $(this.get("element")).on("shown.bs.modal", function(e){
      if($('.modal-body:visible [autofocus]')[0]) $('.modal-body:visible [autofocus]')[0].focus();
    });
  },

  template : Ember.Handlebars.compile('' +
    '{{#unless view.loaded}}Loading...{{/unless}}' +
    '{{view "form/form" record=view.record columnDataGroup=view.columnDataGroup classNameBindings="view.loaded::hidden"}}' +
  ''),

  onOk : function() {
    var record = this.get("record"), that = this;
    this.set("saving", true);
    CrudAdapter.saveRecord(record).then(function(response) {
      if(that.get("closeOnSuccess")) {
        that.set("showAlert", false);
        that.set("loaded", false);
        that.set("saving", false);
        $(that.get("element")).modal('hide');
      }
      else if(that.get("saveCallback")) {
        that.get("saveCallback")(record, "Saved successfully!", record.__proto__.constructor.title || "Data");
      }
    }, function(response) {
      that.showModalMesssage(record.__proto__.constructor.title, response.statusText || response);
      CrudAdapter.retrieveFailure(record);
      CrudAdapter.backupDataMap = {};
      that.set("fromButton", false);
      that.set("saving", false);
    });
  },

  onCancel : function() {
    this._super();
    var record = this.get("record"), postCancelCallback = this.get("postCancelCallback");
    this.set("showAlert", false);
    this.set("loaded", false);
    if(record && !record.get("isSaving")) {
      if(record.get("isNew")) record.deleteRecord();
      else {
        record._validation = {};
        record.set("validationFailed", false);
        CrudAdapter.rollbackRecord(record);
      }
      if(postCancelCallback) {
        postCancelCallback(record);
      }
      this.set("record", null);
    }
  },
});
