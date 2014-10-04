Components = Ember.Namespace.create();
Components.TestComponent = Ember.Component.extend({
  name : "",
  desc : "",
  layout : Ember.Handlebars.compile("<div>{{name}} - {{desc}}</div>{{yield}}"),
});

Ember.Handlebars.helper('comp-test', Components.TestComponent);
