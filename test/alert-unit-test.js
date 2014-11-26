define([
  "ember",
  "ember_qunit",
  "source/misc/main",
], function() {

return function() {

moduleForComponent("alerts/alert-message", "alerts", {
  setup : function() {
  },
  teardown : function() {
    TestApp.reset();
  },
});

test("Sanity Test", function() {
  var component = this.subject(), ele = this.$();

  ok(ele.hasClass("alert alert-danger fade") && !ele.hasClass("in"), "Alert message has the right classes initially.");

  Ember.run(function() {
    component.set("message", "Test");
  });

  wait();
  andThen(function() {
    ok(ele.hasClass("alert alert-danger fade in"), "Alert message has the right class after message was shown.");
    equal(ele.find(".alert-message").text(), "Test", "Alert message was updated.");
  });
});

test("Clicking on close button", function() {
  var component = this.subject(), ele = this.$();

  Ember.run(function() {
    component.set("message", "Test");
  });

  wait();
  andThen(function() {
    click(ele.find("button.close"));
  });

  wait();
  andThen(function() {
    ok(ele.hasClass("alert alert-danger fade") && !ele.hasClass("in"), "Alert message has the right classes after closed.");
    ok(!component.get("showAlert"), "'showAlert' was set to false");
  });
});

test("Auto collapse after message change", function() {
  var component = this.subject(), ele = this.$(), d;

  Ember.run(function() {
    component.set("collapseTimeout", 250);
    component.set("message", "Test");
    d = new Date();
  });

  wait();
  andThen(function() {
    ok(new Date() - d >= 250, "Alert message closed after 250ms");
    ok(!component.get("showAlert"), "'showAlert' was set to false");

    component.set("collapseTimeout", 1000);
    component.set("message", "Test1");
    d = new Date();
  });

  wait();
  andThen(function() {
    ok(new Date() - d >= 1000, "Alert message closed after 1000ms");
    ok(!component.get("showAlert"), "'showAlert' was set to false");
  });
});

};

});
