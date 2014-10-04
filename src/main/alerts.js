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
Alerts.AlertMessage = Ember.Component.extend({
  type : 'error',
  typeData : function() {
    var type = this.get("type");
    return Alerts.AlertTypeMap[type] || Alerts.AlertTypeMap.error;
  }.property('type'),
  title : "",
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
  showAlert : false,

  click : function(event) {
    if($(event.target).filter('button.close').length > 0) {
      this.set("message", "");
    }
  },

  template : Ember.Handlebars.compile('' +
  '{{#if showAlert}}' +
    '<div {{bind-attr class=":alert typeData.alertClass :alert-dismissable"}}>' +
      '<button class="close" {{action "dismissed"}}>&times;</button>' +
      '<strong><span {{bind-attr class=":glyphicon typeData.glyphiconClass :btn-sm"}}></span> {{title}}</strong> {{message}}' +
    '</div>' +
  '{{/if}}'),
});

Ember.Handlebars.helper('alert-message', Alerts.AlertMessage);
