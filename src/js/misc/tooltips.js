define([
  "ember",
], function(Ember) {

/**
 * Module for the tooltip component.
 *
 * @module tooltip
 */

Tooltip = Ember.Namespace.create();

/**
 * Component for the tooltip.
 * Usage:
 *
 *     {{#tool-tip title="Tooltip"}}Heading{{/tool-tip}}
 */
Tooltip.TooltipComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'title', 'delay:data-delay', 'type'],

  /**
   * Property to enable animation. Can be "true"/"false"
   *
   * @property animation
   * @type String
   * @default "true"
   */
  animation : "true",

  /**
   * Placement of the tooltip. Can be "top"/"right"/"bottom"/"left".
   *
   * @property placement
   * @type String
   * @default "top"
   */
  placement : "top",

  /**
   * Title of the tooltip.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Delay to display tooltip.
   *
   * @property delay
   * @type Number
   * @default 0
   */
  delay : 0,

  type : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),
  tagName : "span",

  didInsertElement : function() {
    $(this.get("element")).tooltip();
  },
});

Ember.Handlebars.helper('tool-tip', Tooltip.TooltipComponent);

return Tooltip;

});
