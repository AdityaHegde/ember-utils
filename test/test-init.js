//Markup needed for testing
//TODO : find a way to add thru karma config
$("body").append("" +
  "<div id='qunit-main-container'>" +
    "<h1 id='qunit-header'>Tests</h1>" +
    "<h2 id='qunit-banner'></h2>" +
    "<div id='qunit-testrunner-toolbar'></div>" +
    "<h2 id='qunit-userAgent'></h2>" +
    "<ol id='qunit-tests'></ol>" +
    "<div id='qunit-fixture'></div>" +
  "</div>" +
  "<div id='ember-testing'></div>" +
"");

TestApp = Ember.Application.create({
  rootElement : "#ember-testing",
});

var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;

QUnit.config.reorder = false;
//workaroud for qunit not reporting toatal tests
var testCount = 0;
var qunitTest = QUnit.test;
QUnit.test = window.test = function () {
  testCount += 1;
  qunitTest.apply(this, arguments);
};
QUnit.begin(function (args) {
  args.totalTests = testCount;
});

emq.globalize();
TestApp.setupForTesting();
//TestApp.rootElement = '#ember-testing';
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
setResolver(Ember.DefaultResolver.create({ namespace: TestApp }))
