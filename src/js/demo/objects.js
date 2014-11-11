define([
  "ember",
  "./app",
  "lib/ember-test-utils",
  "lib/ember-utils-core",
  "ember-utils",
], function(Ember, DemoApp, EmberTests, Utils) {

DemoApp.Test = CrudAdapter.createModelWrapper({
  vara : attr(),
  varb : attr(),
  varc : attr(),
  vard : attr(),

  testp : belongsTo("testp", {async : true}),
}, {
  keys : ["vara"],
  apiName : "test",
  queryParams : ["vara"],
});
EmberTests.MockjaxUtils.addMockjaxData({
  name : "test",
  data : [{
    id : "test",
    vara : "test",
    varb : "test_varb",
  }, {
    id : "test2",
    vara : "test2",
  }, {
    id : "test3",
    vara : "test3",
  }, {
    id : "test4",
    vara : "test4",
  }, {
    id : "test5",
    vara : "test5",
  }],
  createUpdateAdditionalData : {
    varc : "test_varc",
  },
  modelClass : DemoApp.Test,
});

DemoApp.Testp = CrudAdapter.createModelWrapper({
  vara : attr(),
  varb : attr(),

  tests : hasMany("test", {async : true}),

  arrayProps : ["tests"],
}, {
  keys : ["vara"],
  apiName : "testparent",
  queryParams : ["vara"],
}, [Utils.DelayedAddToHasManyMixin]);
EmberTests.MockjaxUtils.addMockjaxData({
  name : "testparent",
  data : [
    {
      id : "test",
      vara : "test",
      tests : [{
        id : "test1",
        vara : "test1",
        varb : "test_varb",
      }, {
        id : "test2",
        vara : "test2",
      }, {
        id : "test3",
        vara : "test3",
      }, {
        id : "test4",
        vara : "test4",
      }, {
        id : "test5",
        vara : "test5",
      }],
    },
    {
      id : "test1",
      vara : "test1",
      varb : "vb1",
      tests : [{
        id : "test11",
        vara : "test11",
        varb : "vb1",
      }, {
        id : "test12",
        vara : "test12",
        varb : "vb1",
      }, {
        id : "test13",
        vara : "test13",
        varb : "vb1",
      }],
    },
  ],
  modelClass : DemoApp.Testp,
});

});
