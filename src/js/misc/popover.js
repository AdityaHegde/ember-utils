define([
  "ember",
], function(Ember) {

/**
 * Module for popovers.
 *
 * @module popover
 */
Popovers = Ember.Namespace.create();

/**
 * Component for popover.
 * Usage:
 *
 *     {{#pop-over title="Title" body="Body of the popover"}}Some body{{/pop-over}}
 *
 * @class Popovers.PopoverComponent
 */
Popovers.PopoverComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'trigger:data-trigger', 'title:data-original-title', 'body:data-content', 'delay:data-delay', 'role'],

  /**
   * Property to enable animation. Can have "true"/"false".
   *
   * @property animation
   * @type String
   * @default "true"
   */
  animation : "true",

  /**
   * Placement of the popover. Can have "top"/"right"/"bottom"/"left".
   *
   * @property placement
   * @type String
   * @default "top"
   */
  placement : "top",

  /**
   * The trigger of the popover. Can have "click"/"hover"/"focus". Multiple triggers can be passed seperated with space.
   *
   * @property trigger
   * @type String
   * @default "click"
   */
  trigger : "click",

  /**
   * Title of the tooltip.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Body of the tooltip.
   *
   * @property body
   * @type String
   */
  body : "",

  /**
   * Delay to display tooltip.
   *
   * @property delay
   * @type Number
   * @default 0
   */
  delay : 0,

  role : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),

  didInsertElement : function() {
    $(this.get("element")).popover();
  },
});

Ember.Handlebars.helper('pop-over', Popovers.PopoverComponent);

return Popovers;

});
