Tooltip = Ember.Namespace.create();

Tooltip.TooltipComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'title', 'delay:data-delay', 'type'],
  animation : "true",
  placement : "top",
  title : "",
  delay : 0,
  type : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),
  data : null,

  didInsertElement : function() {
    $(this.get("element")).tooltip();
  },
});

Ember.Handlebars.helper('tool-tip', Tooltip.TooltipComponent);
