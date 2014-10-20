/**
 * Alert module for all stuff related to alerts.
 *
 * @module alerts
 */


Alerts = Ember.Namespace.create();
Alerts.AlertTypeMap = {
  info : {
    alertClass : 'alert-info',
    glyphiconClass : 'glyphicon-info-sign',
  },
  success : {
    alertClass : 'alert-success',
    glyphiconClass : 'glyphicon-ok-sign',
  },
  warning : {
    alertClass : 'alert-warning',
    glyphiconClass : 'glyphicon-warning-sign',
  },
  error : {
    alertClass : 'alert-danger',
    glyphiconClass : 'glyphicon-exclamation-sign',
  },
};

/**
 * View for alert message.
 * Usage : 
 *
 *     {{alert-message type="info" title="Title" message="Message"}}
 *
 * @class Alerts.AlertMessage
 */
Alerts.AlertMessage = Ember.Component.extend({
  init : function() {
    this._super();
    this.set("switchOnMessageListener", true);
  },

  /**
   * Type of alert message. Possible values are "success", "warning", "info", "error"
   *
   * @property type
   * @type String
   * @default "error"
   */
  type : 'error',

  /**
   * Title of the alert message.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Alert message.
   *
   * @property message
   * @type String
   */
  message : function(key, value) {
    if(arguments.length > 1) {
      if(!Ember.isEmpty(value) && this.get("switchOnMessageListener")) {
        var timeout = this.get("collapseTimeout"), that = this;
        this.set("showAlert", true);
        if(!Ember.isEmpty(timeout) && timeout > 0) {
          Timer.addToQue(this.get("elementId"), timeout).then(function() {
            that.set("showAlert", false);
          });
        }
      }
      else {
        this.set("showAlert", false);
      }
      return value;
    }
  }.property(),
  switchOnMessageListener : false,

  /**
   * Timeout after which to collapse the alert message. 0 to disable.
   *
   * @property collapseTimeout
   * @type Number
   * @default 0
   */
  collapseTimeout : 0,

  typeData : function() {
    var type = this.get("type");
    return Alerts.AlertTypeMap[type] || Alerts.AlertTypeMap.error;
  }.property('type'),

  showAlert : false,

  click : function(e) {
    if($(event.target).filter("button.close").length > 0) {
      var that = this;
      Ember.run(function() {
        that.set("showAlert", false);
      });
    }
  },

  classNameBindings : [":alert", "typeData.alertClass", ":fade", "showAlert:in"],

  layout : Ember.Handlebars.compile('' +
    '<button class="close">&times;</button>' +
    '<strong><span {{bind-attr class=":glyphicon typeData.glyphiconClass :btn-sm"}}></span>' +
    '<span class="alert-title">{{title}}</span></strong> <span class="alert-message">{{message}}</span>' +
    '{{yield}}' +
  ''),
});

Ember.Handlebars.helper('alert-message', Alerts.AlertMessage);
