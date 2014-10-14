DemoApp.Test = ModelWrapper.createModelWrapper({
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
mockjaxData.test.modelClass = DemoApp.Test;

DemoApp.Testp = ModelWrapper.createModelWrapper({
  vara : attr(),
  varb : attr(),

  tests : hasMany("test", {async : true}),

  arrayProps : ["tests"],
}, {
  keys : ["vara"],
  apiName : "testparent",
  queryParams : ["vara"],
}, [Utils.DelayedAddToHasMany]);
mockjaxData.testparent.modelClass = DemoApp.Testp;
