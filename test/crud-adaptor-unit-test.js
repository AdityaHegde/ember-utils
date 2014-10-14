TestApp.Test = ModelWrapper.createModelWrapper({
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
mockjaxData.test.modelClass = TestApp.Test;

TestApp.Testp = ModelWrapper.createModelWrapper({
  vara : attr(),
  varb : attr(),

  tests : hasMany("test", {async : true}),

  arrayProps : ["tests"],
}, {
  keys : ["vara"],
  apiName : "testparent",
  queryParams : ["vara"],
}, [Utils.DelayedAddToHasMany]);
mockjaxData.testparent.modelClass = TestApp.Testp;

moduleForModel("test", "crud-adaptor.js", {
  setup : function() {
    CrudAdapter.loadAdaptor(TestApp);
  },
  teardown : function() {
  },

  needs : ["model:testp"],
});

test("Create Record", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
      varc : "test",
    });
    CrudAdapter.saveRecord(data);
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varc"), "test_varc", "'varc' has correct value : 'test_varc' as returned from server after update");
  });
});

test("Create Record on existing id", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
    });
    CrudAdapter.saveRecord(data);
  });

  wait();

  andThen(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      id : "test",
      vara : "test",
    });
    CrudAdapter.saveRecord(data);
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
  });
});

test("Create Record with server error status", function() {
  var
  store = this.store(), data, failed = "";

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
    });
    mockjaxSettings.throwServerError = true;
    CrudAdapter.saveRecord(data).then(function() {
    }, function(message) {
      failed = message;
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Server Error", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    mockjaxSettings.throwServerError = false;
  });
});

test("Create Record with processing error on server", function() {
  var
  store = this.store(), data, failed = "";

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "test", {
      vara : "test",
    });
    mockjaxSettings.throwProcessError = true;
    CrudAdapter.saveRecord(data).then(function() {
    }, function(message) {
      failed = message;
      CrudAdapter.retrieveFailure(data);
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Failed", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    mockjaxSettings.throwProcessError = false;
  });
});

test("Create Record with hasMany", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    }), tests = data.get("tests");
    tests.then(function() {
      for(var i = 0; i < 5; i++) {
        tests.pushObject(CrudAdapter.createRecordWrapper(store, "test", {
          vara : "test"+i,
        }));
      }
      CrudAdapter.saveRecord(data);
    });
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("tests.length"), 5, "Has 5 'test' child records");
  });
});

test("Create Record with hasMany, server error", function() {
  var
  store = this.store(), data, failed = false;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    }), tests = data.get("tests");
    tests.then(function() {
      for(var i = 0; i < 5; i++) {
        tests.pushObject(CrudAdapter.createRecordWrapper(store, "test", {
          vara : "test"+i,
        }));
      }
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Server Error", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    equal(data.get("tests.length"), 5, "Has 5 'test' child records");
    mockjaxSettings.throwServerError = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Create Record with hasMany, server processing error", function() {
  var
  store = this.store(), data, failed = false;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = CrudAdapter.createRecordWrapper(store, "testp", {
      vara : "test",
    }), tests = data.get("tests");
    tests.then(function() {
      for(var i = 0; i < 5; i++) {
        tests.pushObject(CrudAdapter.createRecordWrapper(store, "test", {
          vara : "test"+i,
        }));
      }
      mockjaxSettings.throwProcessError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Failed", "Failure message captured");
    ok(!data.get("id"), "No id assigned as save failed");
    equal(data.get("tests.length"), 5, "Has 5 'test' child records");
    mockjaxSettings.throwProcessError = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Update Record", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("test", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      equal(data.get("varb"), "test_varb", "Initial value of 'varb' is 'test_varb'");
      data.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      CrudAdapter.saveRecord(data);
    });
  });

  wait();

  andThen(function() {
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varb"), "test_update", "'varb' has correct value : 'test_update'");
    mockjaxSettings.returnId = false;
  });
});

test("Update Record with server error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("test", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      equal(data.get("varb"), "test_varb", "Initial value of 'varb' is 'test_varb'");
      data.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Server Error", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varb"), "test_update", "'varb' has correct value : 'test_update'");
    mockjaxSettings.throwServerError = false;
    mockjaxSettings.returnId = false;
  });
});

test("Update Record with server process error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("test", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      equal(data.get("varb"), "test_varb", "Initial value of 'varb' is 'test_varb'");
      data.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwProcessError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    equal(failed, "Failed", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(data.get("varb"), "test_update", "'varb' has correct value : 'test_update'");
    mockjaxSettings.throwProcessError = false;
    mockjaxSettings.returnId = false;
  });
});

test("Update Record with hasMany", function() {
  var
  store = this.store(), data;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      CrudAdapter.saveRecord(data);
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.returnId = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Update Record with hasMany, server process error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwProcessError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Failed", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.throwProcessError = false;
    mockjaxSettings.returnId = false;
    CrudAdapter.rollbackRecord(data);
  });
});

test("Update Record with hasMany, server error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Server Error", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.throwServerError = false;
    mockjaxSettings.returnId = false;
    CrudAdapter.rollbackRecord(data);
  });
});

//simple deletes are already handled in ember-data testing

test("Delete Record with hasMany, server process error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwProcessError = true;
      data.deleteRecord();
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
        CrudAdapter.retrieveFailure(data);
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Failed", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    mockjaxSettings.throwProcessError = false;
    mockjaxSettings.returnId = false;
  });
});

test("Delete Record with hasMany, server error", function() {
  var
  store = this.store(), data, failed;

  store.container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  store.container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  Ember.run(function() {
    data = store.find("testp", "test");
  });

  wait();

  andThen(function() {
    Ember.run(function() {
      //take the actual record as some stuff will be extracted from __proto__ to get Model Class
      data = data.content;
      var tests = data.get("tests"), first = tests.objectAt(0);
      equal(first.get("varb"), "test_varb", "Initial value of 'varb' of 1st child record is 'test_varb'");
      first.set("varb", "test_update");
      mockjaxSettings.returnId = true;
      mockjaxSettings.throwServerError = true;
      CrudAdapter.saveRecord(data).then(function() {
      }, function(message) {
        failed = message;
      });
    });
  });

  wait();

  andThen(function() {
    var tests = data.get("tests"), first = tests.objectAt(0);
    equal(failed, "Server Error", "Failure message captured");
    equal(data.get("id"), "test", "Has proper id : 'test'");
    equal(data.get("vara"), "test", "'vara' has correct value : 'test'");
    equal(tests.get("length"), 5, "Has 5 'test' child records");
    equal(first.get("varb"), "test_update", "'varb' of 1st child record has correct value : 'test_update'");
    mockjaxSettings.throwServerError = false;
    mockjaxSettings.returnId = false;
  });
});
