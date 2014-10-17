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
 * Component for alert message.
 * Usage : 
 *
 *     {{alert-message type="info" title="Title" message="Message"}}
 *
 * @class Alerts.AlertMessage
 */
Alerts.AlertMessage = Ember.Component.extend({
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
      if(!Ember.isEmply(value)) {
        this.set("showAlert", true);
      }
      else {
        this.set("showAlert", false);
      }
      return value;
    }
  },

  typeData : function() {
    var type = this.get("type");
    return Alerts.AlertTypeMap[type] || Alerts.AlertTypeMap.error;
  }.property('type'),

  classNameBindings : ["view.showAlert:hidden"],

  showAlert : false,

  click : function(event) {
    if($(event.target).filter('button.close').length > 0) {
      this.set("message", "");
    }
  },

  template : Ember.Handlebars.compile('' +
  '<div {{bind-attr class=":alert typeData.alertClass :alert-dismissable"}}>' +
    '<button class="close" {{action "dismissed"}}>&times;</button>' +
    '<strong><span {{bind-attr class=":glyphicon typeData.glyphiconClass :btn-sm"}}></span> <span class="alert-title">{{title}}</span></strong> <span class="alert-message">{{message}}</span>' +
  '</div>'),
});

Ember.Handlebars.helper('alert-message', Alerts.AlertMessage);
