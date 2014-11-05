define([
  "jquery",
  "ember",
  //"ember_data",
  "ember_qunit",
], function() {

/**
 * Utility funcitons for testing.
 *
 * @module test-utils
 */

TestUtils = Ember.Namespace.create();
window.TestUtils = TestUtils;

/**
 * @class TestUtils
 */

/**
 * Check a list of elements in an array.
 *
 * @method TestUtils.checkElements
 * @static
 * @param {Array} array The array to check in.
 * @param {String} path The path in array to compare to.
 * @param {Array} expected The array of expected values to be present in array.
 * @param {Boolean} [exactCheck=false] Checks the exact position of elements in expected in array if true.
 * @returns {Boolean} Returns true if the check passes, else false.
 */
TestUtils.checkElements = function(array, path, expected, exactCheck) {
  //equal(array.get("length"), expected.length, expected.length+" elements are there");
  if(array.get("length") !== expected.length) {
    return false;
  }
  for(var i = 0; i < expected.length; i++) {
    if(exactCheck) {
      var arrayObj = array.objectAt(i);
      //TestUtils.equal(arrayObj.get(path), expected[i], "element at index "+i+" has "+path+" = "+expected[i]);
      if(arrayObj.get(path) !== expected[i]) {
        return false;
      }
    }
    else {
      var found = array.findBy(path, expected[i]);
      //TestUtils.ok(found, "element with "+path+" = "+expected[i]+" is present in arrangedContent");
      if(!found) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Deep check an object. Doesnt fail if objSrc has more keys that objCheck in case of object but checks for array length equivalance.
 *
 * @method TestUtils.deepCheck
 * @static
 * @param {any} objSrc The object to check in.
 * @param {any} objCheck The object to check with.
 * @returns {Boolean} Returns true if the check passes, else false.
 */
TestUtils.deepCheck = function(objSrc, objCheck) {
  if(Ember.isEmpty(objSrc)) {
    return false;
  }
  if(Ember.typeOf(objCheck) === "object") {
    for(var k in objCheck) {
      var val = objSrc.get ? objSrc.get(k) : objSrc[k];
      if(Ember.isEmpty(val) || !TestUtils.deepCheck(val, objCheck[k])) {
        return false;
      }
    }
  }
  else if(Ember.typeOf(objCheck) === "array") {
    if(objCheck.length !== (objSrc.get ? objSrc.get("length") : objSrc.length)) {
      return false;
    }
    for(var i = 0; i < objCheck.length; i++) {
      var val = objSrc.objectAt ? objSrc.objectAt(i) : objSrc[i];
      if(Ember.isEmpty(val) || !TestUtils.deepCheck(val, objCheck[i])) {
        return false;
      }
    }
  }
  else {
    return objSrc === objCheck;
  }
  return true;
}

/**
 * Get current date with offset.
 *
 * @method TestUtils.getCurDate
 * @static
 * @param {Number} [offset] Offset from current date. Can be negative.
 * @returns {Date} Returns local date + time.
 */
TestUtils.getCurDate = function(offset) {
  var d = new Date();
  if(offset) {
    d = new Date(d.getTime() + offset*1000);
  }
  return d.toLocaleDateString()+" "+d.toTimeString();
}

/**
 * Setup app to start emmiting events without passing advance readinies to save time. Also registers a few views missing by default (bug?).
 *
 * @method TestUtils.setupAppForTesting
 * @static
 * @param {Class} app App object.
 * @param {Class} container Container object.
 */
TestUtils.setupAppForTesting = function(app, container) {
  Ember.run(function() {
    app.setupEventDispatcher();
    app.resolve(app);
    container.register('view:select', Ember.Select);
    container.register('view:checkbox', Ember.Checkbox);
  });
}

/**
 * Advanced getter with a few extra features.
 * Use .i. to get into indiex i.
 * Use [a=b] to run findBy(a, b).
 *
 * @method TestUtils.getter
 * @static
 * @param {Class} obj Object to get from.
 * @param {String} path Path to get from.
 * @return {Array} Returns an array with [value, lastObj extracted, last part of path]
 */
TestUtils.getter = function(obj, path) {
  var parts = path.split(/\.(?:\d+|@|\[.*?\])\./),
      directives = path.match(/\b(\d+|@|\.\[.*?\]\.?)(?:\b|$)/g),
      ret = obj, lastobj, i;
  if(parts.length > 0) {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/\.(?:\d+|@|\[.*?\])$/, "");
  }
  if(parts.length > 1) {
    parts[0] = parts[0].replace(/\.(?:\d+|@|\[.*?\])$/, "");
  }
  for(i = 0; i < parts.length; i++) {
    if(!ret) return ret;
    lastobj = ret;
    ret = ret.get(parts[i]);
    if(directives && directives[i]) {
      var matches, idx = Number(directives[i]);
      if(idx === 0 || !!idx) {
        if(ret.objectAt) {
          ret = ret.objectAt(directives[i]);
        }
        else {
          return null;
        }
      }
      else if((matches = directives[i].match(/^\.\[(.*?)(?:=(.*?))?\]\.?$/))) {
        if(ret.findBy) {
          ret = ret.findBy(matches[1], matches[2]);
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    }
  }
  return [ret, lastobj, parts[i - 1]];
};

/**
 * Advanced setter with call to TestUtils.getter
 *
 * @method TestUtils.setter
 * @static
 * @param {Class} obj Object to put to.
 * @param {String} path Path to object at the last part. If the last object is array, array modification is fired.
 * @param {String} putPath Path to put to at the object at last part. In case of array modification like push putPath will be an array with 0th element as the operation (allowed - push, pop, unshift, shift, remove, insertAt, removeAt) and 1st element as the index.
 * @param {any} value Value to put.
 */
TestUtils.setter = function(obj, path, putPath, value, param) {
  var getVal = TestUtils.getter(obj, path);
  if(getVal && getVal[0]) {
    if(Ember.typeOf(getVal[0]) === "array" || Ember.typeOf(getVal[0].get("length")) === "number") {
      switch(param) {
        case "push" :
          getVal[0].pushObject(value);
          break;

        case "pop" :
          getVal[0].popObject();
          break;

        case "unshift" :
          getVal[0].unshiftObject(value);
          break;

        case "shift" :
          getVal[0].shiftObject();
          break;

        case "remove" :
          getVal[0].removeObject(value);
          break;

        case "insertAt" :
          getVal[0].insertAt(putPath, value);
          break;

        case "removeAt" :
          getVal[0].removeAt(putPath);
          break;

        case "addToProp" :
          getVal[0].addToProp(putPath, value);
          break;

        default: break;
      }
    }
    else {
      getVal[0].set(putPath, value);
    }
  }
};

//Markup needed for testing
//TODO : find a way to add thru karma config
/*$("body").append("" +
  "<div id='qunit-main-container'>" +
    "<h1 id='qunit-header'>Tests</h1>" +
    "<h2 id='qunit-banner'></h2>" +
    "<div id='qunit-testrunner-toolbar'></div>" +
    "<h2 id='qunit-userAgent'></h2>" +
    "<ol id='qunit-tests'></ol>" +
    "<div id='qunit-fixture'></div>" +
  "</div>" +
  "<div id='ember-testing'></div>" +
"");*/

var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;

QUnit.config.reorder = false;
QUnit.config.autostart = false;
//workaroud for qunit not reporting toatal tests
var testCount = 0;
var qunitTest = QUnit.test;
QUnit.test = window.test = function () {
  testCount += 1;
  qunitTest.apply(this, arguments);
};
QUnit.begin(function (args) {
  args.totalTests = testCount;
  TestUtils.equal = equal;
  TestUtils.ok = ok;
  TestUtils.wait = wait;
  TestUtils.andThen = andThen;
});

emq.globalize();

/**
 * Test Case Helper module.
 *
 * @module test-case
 */
TestCase = Ember.Namespace.create();

/**
 * A simple test case suit class.
 *
 * @class TestCase.TestSuit
 */
TestCase.TestSuit = Ember.Object.extend({
  init : function() {
    this._super();
    this.modularize();
    var testCases = this.get("testCases");
    if(testCases) {
      for(var i = 0; i < testCases.length; i++) {
        testCases[i].register();
      }
    }
  },

  /**
   * Name of the test suit.
   *
   * @property suitName
   * @type String
   */
  suitName : "",

  /**
   * Options to be passed to the qunit module.
   *
   * @property moduleOpts
   * @type Object
   */
  moduleOpts : {},

  /**
   * Array of test cases. Will be automatically be converted to TestCase classes based on "testCase" attribute.
   *
   * @property testCases
   * @type Array
   */
  testCases : Utils.hasManyWithHierarchy("TestCase.TestHierarchyMap", 0, "type"),

  modularize : function() {
    module(this.get("suitName"), this.get("moduleOpts"));
  },
});

/**
 * Test suit which call moduleFor* module initializer provided by ember-qunit.
 *
 * @class TestCase.EmberTestSuit
 */
TestCase.EmberTestSuit = TestCase.TestSuit.extend({
  /**
   * Module initializer function. Can have moduleFor, moduleForComponent or moduleForModel.
   *
   * @property moduleFunction
   * @type String
   * @default "moduleFor"
   */
  moduleFunction : "moduleFor",

  /**
   * The 1st param passed to moduleFunction.
   *
   * @property param
   * @type String
   */
  param : "",

  modularize : function() {
    window[this.get("moduleFunction")](this.get("param"), this.get("suitName"), this.get("moduleOpts"));
  },
});

/**
 * Test Case class.
 *
 * @class TestCase.TestCase
 */
TestCase.TestCase = Ember.Object.extend({
  register : function() {
    var testCase = this;
    test(this.get("title"), function() {
      testCase.set("testData.testContext", this);
      testCase.run();
    });
  },

  /**
   * Title of the test case.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Object of data to be shared within test case.
   *
   * @property testData
   * @type Object
   */
  testData : Utils.belongsTo(),

  /**
   * Array of test blocks. Will be automatically be converted to TestBlock classes based on "block" attribute.
   *
   * @property testBlocks
   * @type Array
   */
  testBlocks : Utils.hasManyWithHierarchy("TestCase.TestHierarchyMap", 1, "type"),

  initialize : function() {
  },

  run : function() {
    expect(this.get("assertions"));
    this.initialize();
    var blocks = this.get("testBlocks");
    for(var i = 0; i < blocks.length; i++) {
      blocks[i].run(this.get("testData"));
    }
    wait();
  },

  //assertions : Ember.computed.sum("testBlocks.@each.assertions"),
  assertions : function() {
    var assertions = 0, testBlocks = this.get("testBlocks");
    if(testBlocks) {
      testBlocks.forEach(function(block) {
        assertions += block.get("assertions");
      });
    }
    return assertions;
  }.property("testBlocks.@each.assertions"),
});

TestCase.TestCaseMap = {
  "baseTestCase" : TestCase.TestCase,
};

/**
 * Test Case Block. A block of operations run synchronously. They are preeceded by a wait() and enclosed in andThen().
 *
 * @class TestCase.TestBlock
 */
TestCase.TestBlock = Ember.Object.extend({
  testOperations : Utils.hasManyWithHierarchy("TestCase.TestHierarchyMap", 2, "type"),

  run : function(testData) {
    var block = this;

    TestUtils.wait();
    TestUtils.andThen(function() {
      Ember.run(function() {
        var operations = block.get("testOperations");
        for(var i = 0; i < operations.length; i++) {
          operations[i].run(testData);
        }
      });
    });
  },

  //assertions : Ember.computed.sum("testOperations.@each.assertions"),
  assertions : function() {
    var assertions = 0, testOperations = this.get("testOperations");
    if(testOperations) {
      testOperations.forEach(function(oprn) {
        assertions += oprn.get("assertions");
      });
    }
    return assertions;
  }.property("testOperations.@each.assertions"),
});

TestCase.TestBlocksMap = {
  "baseTestBlock" : TestCase.TestBlock,
};

/**
 * Test Operations submodule.
 *
 * @module test-case
 * @submodule test-case-operation
 */

/**
 * Test Opertaion base class.
 *
 * @class TestCase.TestOperation
 */
TestCase.TestOperation = Ember.Object.extend({
  run : function(testData) {
  },

  assertions : 0,
});

/**
 * Test Operation to check a set of values.
 *
 * @class TestCase.TestValues
 */
TestCase.TestValuesCheck = TestCase.TestOperation.extend({
  values : Utils.hasManyWithHierarchy("TestCase.TestValueCheckHierarchy", 0, "type"),

  run : function(testData) {
    var values = this.get("values");
    for(var i = 0; i < values.length; i++) {
      var path = values[i].get("path"),
          value = values[i].get("valuePath") ? 
                    TestUtils.getter(testData, values[i].get("valuePath"))[0] :
                    values[i].get("value"),
          message = values[i].get("message"),
          getValue = TestUtils.getter(testData, path);
      if(Ember.typeOf(value) === "object") {
        TestUtils.ok(TestUtils.deepCheck(getValue[0], value), message);
      }
      else if(Ember.typeOf(value) === "array") {
        TestUtils.ok(TestUtils.checkElements(getValue[1], getValue[2], value), message);
      }
      else if(Ember.typeOf(value) === "class") {
        TestUtils.ok(getValue[0] instanceof value, message);
      }
      else {
        TestUtils.equal(getValue[0], value, message);
      }
    }
  },

  attr1 : function(key, value) {
    if(arguments.length > 1) {
      this.set("values", value);
      return value;
    }
  }.property(),

  assertions : Ember.computed.alias("values.length"),
});

/**
 * Object that has config for checking a value.
 *
 * @class TestCase.TestValueCheckObject
 */
TestCase.TestValueCheckObject = Ember.Object.extend({
  /**
   * Path of the value to check. Can have indices also!
   *
   * @property path
   * @type String
   */
  path : "",

  /**
   * Value to check against.
   *
   * @property value
   * @type Number|Boolean|String|Object
   */
  value : "",

  /**
   * Path to get value from.
   *
   * @property value
   * @type String
   */
  valuePath : null,
  
  /**
   * Message to show when the assertion passes.
   *
   * @property message
   * @type String
   */
  message : "",
});

TestCase.TestValueCheckHierarchy = [
  {
    classes : {
      "base" : TestCase.TestValueCheckObject,
    },
    base : "base",
    keysInArray : ["type", "path", "value", "message", "valuePath"],
  },
];
Utils.registerHierarchy(TestCase.TestValueCheckHierarchy);


/**
 * Test Operation to check a set of values.
 *
 * @class TestCase.TestAssignValues
 */
TestCase.TestAssignValues = TestCase.TestOperation.extend({
  values : Utils.hasManyWithHierarchy("TestCase.TestValueAssignHierarchy", 0, "type"),

  run : function(testData) {
    var values = this.get("values");
    for(var i = 0; i < values.length; i++) {
      var path = values[i].get("path"),
          putPath = values[i].get("putPath"),
          value = values[i].get("valuePath") ? 
                    TestUtils.getter(testData, values[i].get("valuePath"))[0] :
                    values[i].get("value");
      TestUtils.setter(testData, path, putPath, value, values[i].get("param"));
    }
  },

  attr1 : function(key, value) {
    if(arguments.length > 1) {
      this.set("values", value);
      return value;
    }
  }.property(),
});


/**
 * Object that has config for checking a value.
 *
 * @class TestCase.TestValueAssignObject
 */
TestCase.TestValueAssignObject = Ember.Object.extend({
  /**
   * Path of the value to assign to. Can have indices also!
   *
   * @property path
   * @type String
   */
  path : "",

  /**
   * Path within value gotten by path to assign to.
   *
   * @property putPath
   * @type String
   */
  putPath : "",

  /**
   * Value to assign.
   *
   * @property value
   * @type Number|Boolean|String|Object
   */
  value : "",

  /**
   * Path to get value from.
   *
   * @property value
   * @type String
   */
  valuePath : null,
  
  /**
   * Param used in various operations. 
   * For array operations, 0th element is operation, 1st element is additional param to operation.
   *
   * @property params
   * @type Array
   */
  param : [],
});

TestCase.TestValueAssignHierarchy = [
  {
    classes : {
      "base" : TestCase.TestValueAssignObject,
    },
    base : "base",
    keysInArray : ["type", "path", "putPath", "value", "param", "valuePath"],
  },
];
Utils.registerHierarchy(TestCase.TestValueAssignHierarchy);


/**
 * Test Operation to setup ember data store.
 *
 * @class TestCase.SetupStore
 */
TestCase.SetupStore = TestCase.TestOperation.extend({
  run : function(testData) {
    var testContext = testData.get("testContext"),
        container = (testContext.get ? testContext.get("container") : testContext.container),
        store;
    if(testContext.store) {
      store = testContext.store();
      container = store.container;
    }
    else if (DS._setupContainer) {
      DS._setupContainer(container);
    }
    else {
      container.register('store:main', DS.Store);
    }

    container.register('adapter:application', CrudAdapter.ApplicationAdapter);
    container.register('serializer:application', CrudAdapter.ApplicationSerializer);

    testData.set("store", container.lookup('store:main'));
  },
});

Ember.Test.registerAsyncHelper("asyncOprnWrapper", function(app, context, callback, testData) {
  return callback.call(context, testData);
});
/**
 * Test Operation base class for async operations. Override asyncRun.
 *
 * @class TestCase.AsyncOperation
 */
TestCase.AsyncOperation = TestCase.TestOperation.extend({
  run : function(testData) {
    asyncOprnWrapper(this, this.get("asyncRun"), testData);
  },

  /**
   * Method called from inside a async test helper.
   *
   * @method asyncRun
   * @returns {Class} A promise object.
   */
  asyncRun : function(testData) {
    return new Ember.RSVP.promise(function(resolve, reject) {
      resolve();
    });
  },
});

TestCase.TestHierarchyMap = [
  {
    classes : {
      "baseTestCase" : TestCase.TestCase,
    },
    base : "baseTestCase",
    keysInArray : ["type", "title", "testBlocks", "testData"],
    childrenKey : "testBlocks",
  },
  {
    classes : {
      "baseTestBlock" : TestCase.TestBlock,
    },
    base : "baseTestBlock",
    keysInArray : ["type", "testOperations", "attr1", "attr2", "attr3", "attr4", "attr5"],
    childrenKey : "testOperations",
  },
  {
    classes : {
      "baseOperation" : TestCase.TestOperation,
      "checkValues" : TestCase.TestValuesCheck,
      "assignValues" : TestCase.TestAssignValues,
      "setupStore" : TestCase.SetupStore,
    },
    base : "baseOperation",
    keysInArray : ["type", "attr1", "attr2", "attr3", "attr4", "attr5"],
  },
];
Utils.registerHierarchy(TestCase.TestHierarchyMap);

/**
 * Wrapper to mock ajax request from CrudAdaptor module.
 *
 * @module mockjax-utils
 */
MockjaxUtils = Ember.Namespace.create();
MockjaxUtils.RESPONSE_TIME = 100;
$.mockjaxSettings.responseTime = MockjaxUtils.RESPONSE_TIME;
$.mockjaxSettings.logging = false;

/**
 * Mockjax settings class.
 *
 * @class MockjaxUtils.MockjaxSettings
 */
MockjaxUtils.MockjaxSettings = Ember.Object.extend({
  init : function() {
    this._super();
    this.get("responseTime");
    this.get("logging");
  },

  /**
   * If set to true, all calls will throw server error with error code 'serverErrorCode'.
   *
   * @property throwServerError
   * @type Boolean
   * @default false
   */
  throwServerError : false,

  /**
   * Server error code to throw when 'throwServerError' is set to true.
   *
   * @property serverErrorCode
   * @type Number
   * @default 500
   */
  serverErrorCode : 500,

  /**
   * Setting to 1 is equivalent to throwing a error by server in processing request.
   *
   * @property throwProcessError
   * @type Number
   * @default 0
   */
  throwProcessError : 0,

  /**
   * A map to change the model settings used for the call.
   *
   * @property modelChangeMap
   * @type Object
   */
  modelChangeMap : {},

  /**
   * An object which contains data used in the last call. Has 'model', 'type' and 'params' from last call.
   *
   * @property lastPassedData
   * @readonly
   * @type Class
   */
  lastPassedData : Ember.Object.create(),

  /**
   * Response time to use. This is a jquerymockjax setting.
   *
   * @property responseTime
   * @type Number
   * @default 50
   */
  responseTime : function(key, val) {
    if(arguments.length > 1) {
      $.mockjaxSettings.responseTime = val || MockjaxUtils.RESPONSE_TIME;
    }
  }.property(),

  /**
   * If set to true, every call will be logged. This is a jquerymockjax setting.
   *
   * @property logging
   * @type Boolean
   * @default false
   */
  logging : function(key, val) {
    if(arguments.length > 1) {
      $.mockjaxSettings.logging = Ember.isEmpty(val) ? false : val;
    }
  }.property(),
});
MockjaxUtils.MockjaxSettingsInstance = MockjaxUtils.MockjaxSettings.create();

/**
 * Model data used to process a call to the model.
 *
 * @class MockjaxUtils.MockjaxData
 */
MockjaxUtils.MockjaxData = Ember.Object.extend({
  /**
   * Model name as seen by ember-data.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Array of fixture data for the model.
   *
   * @property data
   * @type Array
   */
  data : [],

  /**
   * Ember Data model class created using ModelWrapper.createModelWrapper.
   *
   * @property modelClass
   * @type Class
   */
  modelClass : null,

  /**
   * Additional data to be sent during a get call.
   *
   * @property getAdditionalData
   * @type Object
   */
  getAdditionalData : {},

  /**
   * Additional data to be sent during a getAll call.
   *
   * @property getAdditionalData
   * @type Object
   */
  getAllAdditionalData : {},

  /**
   * Additional data to be sent during a create/update call.
   *
   * @property getAdditionalData
   * @type Object
   */
  createUpdateAdditionalData : {},
});

/**
 * Method to add mockjax model data.
 *
 * @method MockjaxUtils.addMockjaxData
 * @param {Object} mockjaxData Object which will be used to create MockjaxUtils.MockjaxData instance.
 */
MockjaxUtils.addMockjaxData = function(mockjaxData) {
  MockjaxUtils.MockjaxDataMap[mockjaxData.name] = MockjaxUtils.MockjaxData.create(mockjaxData);
};
MockjaxUtils.MockjaxDataMap = {};


urlPartsExtractRegex = new RegExp("^/(.*)/(.*?)$");

MockjaxUtils.getDataForModelType = function(mockObj, settings, model, type) {
  if(MockjaxUtils.MockjaxSettingsInstance.get("throwServerError")) {
    mockObj.status = MockjaxUtils.MockjaxSettingsInstance.get("serverErrorCode");
    mockObj.statusText = "Server Error";
  }
  else {
    var retData = {
      result : {
        status : MockjaxUtils.MockjaxSettingsInstance.get("throwProcessError"),
        message : MockjaxUtils.MockjaxSettingsInstance.get("throwProcessError") ? "Failed" : "Success",
      }
    }, parts = settings.url.match(urlPartsExtractRegex),
    params = Ember.typeOf(settings.data) === "string" ? JSON.parse(settings.data.replace(/^data=/, "")) : settings.data;
    model = model || (parts && parts[1]);
    type = type || (parts && parts[2]);
    if(MockjaxUtils.MockjaxSettingsInstance.get("modelChangeMap")[model]) {
      model = MockjaxUtils.MockjaxSettingsInstance.get("modelChangeMap")[model];
    }
    MockjaxUtils.MockjaxSettingsInstance.lastPassedData = {
      model : model,
      type : type,
      params : params,
    };
    if(model && type && !MockjaxUtils.MockjaxSettingsInstance.get("throwProcessError")) {
      var modelData = MockjaxUtils.MockjaxDataMap[model];
      if(type === "getAll") {
        retData.result.data = modelData.get("data");
        Utils.merge(retData.result, modelData.get("getAllAdditionalData"));
      }
      else if(type === "get") {
        retData.result.data = modelData.get("data").findBy("id", CrudAdapter.getId(params, modelData.get("modelClass")));
        Utils.merge(retData.result, modelData.get("getAdditionalData"));
      }
      else if(type === "delete") {
        retData.result.data = {
          id : CrudAdapter.getId(params, modelData.get("modelClass")),
        };
      }
    }
    mockObj.responseText = retData;
  }
};
MockjaxUtils.createUpdateDataForModelType = function(mockObj, settings, model, type) {
  if(MockjaxUtils.MockjaxSettingsInstance.get("throwServerError")) {
    mockObj.status = MockjaxUtils.MockjaxSettingsInstance.get("serverErrorCode");
    mockObj.statusText = "Server Error";
  }
  else {
    var retData = {
      result : {
        status : MockjaxUtils.MockjaxSettingsInstance.get("throwProcessError"),
        message : MockjaxUtils.MockjaxSettingsInstance.get("throwProcessError") ? "Failed" : "Success",
      }
    }, parts = settings.url.match(urlPartsExtractRegex),
    params = Ember.typeOf(settings.data) === "string" ? JSON.parse(settings.data) : settings.data;
    model = model || (parts && parts[1]);
    type = type || (parts && parts[2]);
    if(MockjaxUtils.MockjaxSettingsInstance.get("modelChangeMap")[model]) {
      model = MockjaxUtils.MockjaxSettingsInstance.get("modelChangeMap")[model];
    }
    MockjaxUtils.MockjaxSettingsInstance.lastPassedData = {
      model : model,
      type : type,
      params : params,
    };
    if(model && type && !MockjaxUtils.MockjaxSettingsInstance.get("throwProcessError")) {
      var modelData = MockjaxUtils.MockjaxDataMap[model];
      retData.result.data = {
        id : CrudAdapter.getId(params, modelData.get("modelClass")) || "someid",
      };
      Utils.merge(retData.result.data, modelData.get("createUpdateAdditionalData"));
    }
    mockObj.responseText = retData;
  }
};

$.mockjax({
  url: /\/.*?\/.*?/,
  type : "GET",
  response : function(settings) {
    MockjaxUtils.getDataForModelType(this, settings);
  },
});

$.mockjax({
  url: /\/.*?\/.*?/,
  type : "POST",
  response : function(settings) {
    MockjaxUtils.createUpdateDataForModelType(this, settings);
  },
});

return TestUtils;

});
