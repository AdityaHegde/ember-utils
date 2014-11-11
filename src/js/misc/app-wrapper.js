define([
  "ember",
], function(Ember) {

/**
 * A module for wrapper over Ember.Application which initializes a few things automatically
 * 
 * @module app-wrapper
 */

AppWrapper = Ember.Namespace.create();

/**
 * A wrapper class over Ember.Application which initializes CrudAdapter and ColumnData.
 *
 * @class AppWrapper.AppWrapper
 */
AppWrapper.AppWrapper = Ember.Application.extend({
  init : function() {
    this._super();
    CrudAdapter.loadAdaptor(this);
  },

  ready : function() {
    this._super();
    ColumnData.initializer(this);
  },
});

return AppWrapper;

});
