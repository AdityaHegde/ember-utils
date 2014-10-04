Panels = Ember.Namespace.create();
Panels.Panel = Ember.Component.extend({
  classNames : ['panel', 'panel-default'],
  title : "",
  body : null,
  footer : null,
  obj : null,

  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading"><h3 class="panel-title">{{title}}</h3></div>' +
    '<div class="panel-body">' +
      '{{#if body}}' +
        '{{body}}' +
      '{{else}}' +
        '{{yield}}' +
      '{{/if}}' +
    '</div>' +
    '{{#if footer}}' +
      '{{footer}}' +
    '{{/if}}'),
});

Ember.Handlebars.helper('panel-comp', Panels.Panel);
