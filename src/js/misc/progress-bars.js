define([
  "ember",
], function(Ember) {

/**
 * Progress bar module.
 *
 * @module progress-bar
 */
ProgressBars = Ember.Namespace.create();
ProgressBars.StyleMap = {
  "success" : {
    "class" : "progress-bar-success",
  },
  "info" : {
    "class" : "progress-bar-info",
  },
  "warning" : {
    "class" : "progress-bar-warning",
  },
  "error" : {
    "class" : "progress-bar-danger",
  },
};

/**
 * View for progress bars.
 * Used as:
 *
 *     {{#progress-bar maxVal=150 minVal=50 val=100 style="info" animated=true striped=true}}{{val}}/{{maxVal}}{{/progress-bar}}
 *
 * @class ProgressBars.ProgressBar
 */
ProgressBars.ProgressBar = Ember.Component.extend({
  classNames : ["progress"],

  /**
   * Max value for the progress.
   *
   * @property maxVal
   * @type Number
   * @default 100
   */
  maxVal : 100,

  /**
   * Min value for the progress.
   *
   * @property minVal
   * @type Number
   * @default 0
   */
  minVal : 0,

  /**
   * Cur value for the progress.
   *
   * @property val
   * @type Number
   * @default 0
   */
  val : 0,

  /**
   * Style of the progress bar. Can be default/success/info/error/warning.
   *
   * @property style
   * @type String
   * @default ""
   */
  style : "",
  styleClass : function() {
    var style = ProgressBars.StyleMap[this.get("style")];
    return style && style["class"];
  }.property("style"),

  /**
   * Property to enable striped progress bar.
   *
   * @property striped
   * @type Boolean
   * @default false
   */
  striped : false,

  /**
   * Property to enable animated progress bar.
   *
   * @property striped
   * @type Boolean
   * @default false
   */
  animated : false,

  progressStyle : function() {
    var maxVal = this.get("maxVal"), minVal = this.get("minVal"), val = this.get("val"),
        v = ( Number(val) - Number(minVal) ) * 100 / ( Number(maxVal) - Number(minVal) );
    return "width: "+v+"%;";
  }.property("val", "maxVal", "minVal"),

  layout : Ember.Handlebars.compile('' +
    '<div role="progressbar" {{bind-attr aria-valuenow=val aria-valuemin=minVal aria-valuemax=maxVal style=progressStyle ' +
                                        'class=":progress-bar styleClass striped:progress-bar-striped animated:active"}}>' +
      '<div class="progressbar-tag">{{yield}}</div>' +
    '</div>' +
  ''),
});

Ember.Handlebars.helper('progress-bar', ProgressBars.ProgressBar);

return ProgressBars;

});
