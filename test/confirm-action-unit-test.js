moduleFor("view:confirmAction/confirm-action", "confirm-action.js", {
  setup : function() {
    setupAppForTesting(TestApp);
  },
  teardown : function() {
    TestApp.reset();
  },
});

test("Sanity Test", function() {
  var confirmAction = this.subject();
  Ember.run(function() {
    confirmAction.setProperties({
      entity : "Test",
      action : "TestAction",
      actionEffectText : "TestAction will result in a test!",
      entityValue : "Test",
      id : "confirm-action-test",
      attributeBindings : ["id"],
    });
    confirmAction.appendTo("#ember-testing");
  });

  wait();

  fillIn("#confirm-action-test input", "TestInvalid");

  andThen(function() {
    ok(confirmAction.get("invalid"), "Is marked as invalid");
    ok($("#confirm-action-test button.btn.btn-primary").attr("disabled"), "Confirm button is disabled");
  });

  wait();

  andThen(function() {
    fillIn("#confirm-action-test input", "Test");
  });

  andThen(function() {
    ok(!confirmAction.get("invalid"), "Is marked as valid");
    ok(!$("#confirm-action-test button.btn.btn-primary").attr("disabled"), "Confirm button is enabled");
  });
});

test("Callbacks test", function() {
  var confirmAction = this.subject(),
      successCallbackCalled = false,
      successContextPassed = false,
      cancelCallbackCalled = false,
      cancelContextPassed = false;
  Ember.run(function() {
    confirmAction.setProperties({
      entity : "Test",
      action : "TestAction",
      actionEffectText : "TestAction will result in a test!",
      entityValue : "Test",
      id : "confirm-action-test",
      attributeBindings : ["id"],

      onSuccess : function() {
        successCallbackCalled = true;
        successContextPassed = this.test === "test";
      },
      onCancel : function() {
        cancelCallbackCalled = true;
        cancelContextPassed = this.test === "test";
      },
      callbackContext : {test : "test"},
    });
    confirmAction.appendTo("#ember-testing");
  });

  wait();

  fillIn("#confirm-action-test input", "Test");
  click("#confirm-action-test button.btn.btn-default");

  andThen(function() {
    ok(cancelCallbackCalled, "Cancel callback called");
    ok(cancelContextPassed, "Context was passed to callback");
    equal($("#confirm-action-test input").text(), "", "Entered value was reset");
  });

  wait();

  fillIn("#confirm-action-test input", "Test");
  click("#confirm-action-test button.btn.btn-primary");

  andThen(function() {
    ok(successCallbackCalled, "Success callback called");
    ok(successContextPassed, "Context was passed to callback");
    equal($("#confirm-action-test input").text(), "", "Entered value was reset");
  });
});
