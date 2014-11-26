define([
  "ember",
], function(Ember) {

/**
 * Base modal window.
 *
 * @class Modal.ModalWindowView
 */
var ModalWindowView = Ember.View.extend({
  classNames : ['modal'],
  classNameBindings : ['animate:fade'],
  /**
   * Animate modal open/close.
   *
   * @property animate
   * @type Boolean
   * @default true
   */
  animate : true,

  attributeBindings : ['titleId:aria-labelledby', 'role', 'zIndex:data-zindex', 'backdrop:data-backdrop'],

  titleId : function() {
    return this.get("elementId")+"-title";
  }.property(),

  role : 'dialog',

  loaded : true,

  /**
   * Z-index of the modal window. Use this to handle stacks of modal windows.
   *
   * @property zIndex
   * @type Number
   * @default 1000
   */
  zIndex : 1000,

  /**
   * Show a dark backdrop or not.
   *
   * @property backdrop
   * @type String
   * @default "true"
   */
  backdrop : "true",

  /**
   * Width of the modal window.
   *
   * @property width
   * @type String
   * @default "300px"
   */
  width : "600px",
  widthStyle : function() {
    return "width:"+this.get("width")+";";
  }.property('view.width', 'width'),

  messageLabel : "",
  message : "",
  template : Ember.Handlebars.compile('' +
    '<div class="modal-dialog" {{bind-attr style="view.widthStyle"}}>' +
      '<div class="modal-content" tabindex=-1>' +
        '{{view view.columnDataGroup.modal.titleLookup record=view.record columnData=view.columnDataGroup.modal.titleColumnData ' +
                                                      'tagName=view.columnDataGroup.modal.titleColumnData.modal.tagName columnDataKey="modal" ' +
                                                      'titleId=view.titleId modalView=view}}' +
        '{{view view.columnDataGroup.modal.bodyLookup record=view.record columnData=view.columnDataGroup.modal.bodyColumnData ' +
                                                     'tagName=view.columnDataGroup.modal.bodyColumnData.modal.tagName columnDataKey="modal" '+
                                                     'message=view.message messageLabel=view.messageLabel modalView=view}}' +
        '{{view view.columnDataGroup.modal.footerLookup record=view.record columnData=view.columnDataGroup.modal.footerColumnData ' +
                                                       'tagName=view.columnDataGroup.modal.footerColumnData.modal.tagName columnDataKey="modal" ' +
                                                       'modalView=view disableAlias=view.disableAlias}}' +
      '</div>' +
    '</div>'),

  /**
   * Callback called when ok is pressed.
   *
   * @method onOk
   */
  onOk : null,

  /**
   * Callback called when cancel is pressed.
   *
   * @method onCancel
   */
  onCancel : null,

  /**
   * Context to use when calling ok/cancel callbacks
   *
   * @property actionContext
   * @default {the modal view}
   */
  actionContext : null,

  fromButton : false,

  /**
   * Alias to disable the ok button.
   *
   * @property disableAlias
   * @default {'record.disableSave'}
   */
  disableAlias : Ember.computed.alias("record.disableSave"),

  showModalMesssage : function(label, message) {
    this.set("messageLabel", label);
    this.set("message", message);
  },

  showHidePromise : null,
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
    this.set("showHidePromise", promise);
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
        if(!that.get("fromButton") && onCancel) {
          onCancel.call(context);
        }
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
      this.set("fromButton", false);
    },

    cancelClicked : function(event) {
      var onCancel = this.get("onCancel");
    },
  },

  onCancel : function(){
    $('.tooltip').hide();
  },

  /**
   * Callback called after the modal window is shown.
   *
   * @method postShowHook
   */
  postShowHook : function() {
  },

  /**
   * Callback called after the modal window is hidden.
   *
   * @method postHideHook
   */
  postHideHook : function() {
  },

});

/**
 * Static method to show a modal widnow using a selector.
 *
 * @method showModalWindow
 * @static
 * @param {String} modalSelector Selector to select the modal window.
 * @param {Boolean} [hide] Pass this to hide the window.
 * @returns {Promise} A promise that will resolve after the widnow is shown.
 */
ModalWindowView.showModalWindow = function(modalSelector, hide) {
  var ele = $(modalSelector), modalView = Ember.View.views[ele.attr("id")];
  return modalView.showModalWindow(hide);
};

return {
  ModalWindowView : ModalWindowView,
};

});
