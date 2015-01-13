define([
  "ember",
  "../column-data/main",
], function(Ember, ColumnData) {

var BaseController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columnDataGroup", ColumnData.Registry.retrieve(this.get("columnDataGroupName"), "columnDataGroup"));
  },

  columnDataGroup : null,
  columnDataGroupName : "",
});

window.BaseController = {
  BaseController : BaseController,
};

return BaseController;

});
