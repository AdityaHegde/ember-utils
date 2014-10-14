AppWrapper = Ember.Namespace.create();
AppWrapper.AppWrapper = Ember.Application.extend({
  ready : function() {
    this._super();
    ColumnData.initializer(this);
  },
});

AppWrapper.initialize = function(app) {
  CrudAdapter.loadAdaptor(app);
};
