ProgressBars = Ember.Namespace.create();
ProgressBars.ProgressBar = Ember.Component.extend({
  classNames : ["progress"],
  maxVal : "100",
  minVal : "0",
  val : "0",
  progressStyle : function() {
    var maxVal = this.get("maxVal"), minVal = this.get("minVal"), val = this.get("val"),
        v = ( Number(val) - Number(minVal) ) * 100 / ( Number(maxVal) - Number(minVal) );
    return "width: "+v+"%;";
  }.property("val", "maxVal", "minVal"),

  layout : Ember.Handlebars.compile('' +
    '<div role="progressbar" {{bind-attr aria-valuenow=val aria-valuemin=minVal aria-valuemax=maxVal style=progressStyle class=":progress-bar complete:progress-bar-success"}}>' +
      '<div class="progressbar-tag">{{val}} / {{maxVal}}</div>' +
    '</div>'),
});

Ember.Handlebars.helper('progress-bar', ProgressBars.ProgressBar);
