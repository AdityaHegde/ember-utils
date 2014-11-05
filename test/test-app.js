define([
  "ember",
], function(Ember) {

TestApp = Ember.Application.create({
  rootElement : "#ember-testing",
});
window.TestApp = TestApp;

TestApp.setupForTesting();
Ember.Test.registerAsyncHelper("fillFormElement",
  function(app, column, inputType, text, context) {
    return fillIn(getColumnSelector(column, inputType), text, context);
  }
);
Ember.Test.registerAsyncHelper("selectFromElement",
  function(app, column, value, context) {
    var ele = findWithAssert(getColumnSelector(column, "select"), context);
    if(ele) {
      Ember.run(function() {
        var op = ele.find("option[value='"+value+"']");
        if(op[0]) op[0].click();
      });
    }
    return wait();
  }
);

Ember.Test.registerAsyncHelper("scrollHelper",
  function(app, element, scrollVal, context) {
    Ember.run(function() {
      element.scrollTop(scrollVal).change();
    });
  }
);
TestApp.injectTestHelpers();
//setResolver(Ember.DefaultResolver.create({ namespace: TestApp }));

});
