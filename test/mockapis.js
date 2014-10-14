$.mockjaxSettings.logging = false;
$.mockjaxSettings.responseTime = 50;

var mockjaxSettings = {
  throwServerError : false,
  throwProcessError : 0,
  returnId : false,
  modelChangeMap : {
  },
},
mockjaxData = {
  test : {
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
    createUpdateData : {
      varc : "test_varc",
    },
    getAllAdditionalData : {
    },
    //modelClass : TestApp.Test,
  },

  testparent : {
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
    createUpdateData : {
    },
    getAllAdditionalData : {
    },
    //modelClass : TestApp.Testp,
  },
},
urlPartsExtractRegex = new RegExp("^/(.*)/(.*?)$");

function getDataForModelType(settings, model, type) {
  var retData = {
    result : {
      status : mockjaxSettings.throwProcessError,
      message : mockjaxSettings.throwProcessError ? "Failed" : "Success",
    }
  }, parts = settings.url.match(urlPartsExtractRegex),
  params = Ember.typeOf(settings.data) === "string" ? JSON.parse(settings.data.replace(/^data=/, "")) : settings.data;
  model = model || (parts && parts[1]);
  type = type || (parts && parts[2]);
  if(mockjaxSettings.modelChangeMap[model]) {
    model = mockjaxSettings.modelChangeMap[model];
  }
  mockjaxData.lastPassedData = {
    model : model,
    type : type,
    params : params,
  };
  if(model && type) {
    var modelData = mockjaxData[model];
    if(type === "getAll") {
      retData.result.data = modelData.data;
      if(modelData.getAllAdditionalData) {
        Utils.merge(retData.result, modelData.getAllAdditionalData);
      }
    }
    else if(type === "get") {
      retData.result.data = modelData.data.findBy("id", CrudAdapter.getId(params, modelData.modelClass));
      if(modelData.getAdditionalData) {
        Utils.merge(retData.result, modelData.getAdditionalData);
      }
    }
    else if(type === "delete") {
      retData.result.data = {
        id : CrudAdapter.getId(params, modelData.modelClass),
      };
    }
  }
  return retData;
}

$.mockjax({
  url: /\/.*?\/.*?/,
  type : "GET",
  response : function(settings) {
    this.responseText = getDataForModelType(settings);
  },
});

$.mockjax({
  url: /\/.*?\/.*?/,
  type : "POST",
  response : function(settings) {
    //console.log(settings.data);
    if(mockjaxSettings.throwServerError) {
      this.status = 500;
      this.statusText = "Server Error";
    }
    else {
      var retData = {
        result : {
          status : mockjaxSettings.throwProcessError,
          message : mockjaxSettings.throwProcessError ? "Failed" : "Success",
        }
      }, parts = settings.url.match(urlPartsExtractRegex),
      model = parts && parts[1],
      type = parts && parts[2],
      params = Ember.typeOf(settings.data) === "string" ? JSON.parse(settings.data) : settings.data,
      modelData = model && mockjaxData[model];
      mockjaxData.lastPassedData = {
        model : model,
        type : type,
        params : params,
      };
      retData.result.data = {
        id : type === "update" ? CrudAdapter.getId(params, modelData.modelClass) : null,
      };
      if(modelData.createUpdateData) {
        Utils.merge(retData.result.data, modelData.createUpdateData);
      }
      this.responseText = retData;
    }
  },
});
