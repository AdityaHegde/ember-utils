define([
  "ember",
  "ember_data",
  "./getId",
  "./backupData",
], function(Ember, DS, getId, backupData) {
getId = getId.getId;
var backupDataMap = backupData.backupDataMap;
backupData = backupData.backupData;

var GlobalData = Ember.Object.create();
/**
 * API configuration
 *
 * @class APIConfig
 * @for CrudAdapter
 */
var
APIConfig = {
  /**
   * Additional end point to add based on the call type.
   *
   * @property END_POINT_MAP
   * @for APIConfig
   */
  END_POINT_MAP : {
    find    : "get",
    findAll : "getAll",
    create  : "create",
    update  : "update",
    delete  : "delete",
  },

  /**
   * Enable additional end point appending.
   *
   * @property ENABLE_END_POINT
   * @default 0
   * @for APIConfig
   */
  ENABLE_END_POINT : 0,

  /**
   * Boolean to eable appending of id based on call type.
   *
   * @property APPEND_ID_MAP
   * @for APIConfig
   */
  APPEND_ID_MAP : {
    find    : 1,
    findAll : 0,
    create  : 0,
    update  : 1,
    delete  : 1,
  },

  /**
   * Enable appending of id.
   *
   * @property APPEND_ID
   * @default 1
   * @for APIConfig
   */
  APPEND_ID : 1,

  /**
   * http(s) method based on call type.
   *
   * @property HTTP_METHOD_MAP
   * @for APIConfig
   */
  HTTP_METHOD_MAP : {
    find    : "GET",
    findAll : "GET",
    create  : "POST",
    update  : "PUT",
    delete  : "DELETE",
  },

  /**
   * Base for the api.
   *
   * @property API_BASE
   * @for APIConfig
   */
  API_BASE : "",
};

/**
 * ApplicationAdapter for CRUD adapter. Not used direcrlty.
 *
 * @class ApplicationAdapter
 * @for CrudAdapter
 */
var ApplicationAdapter = DS.RESTAdapter.extend({
  getQueryParams : function(type, query, record, inBody) {
    var extraParams = {};
    //delete generated field
    if(!type.retainId) delete query.id;
    if(inBody) {
      //only sent for create / update
      for(var i = 0; i < type.ignoreFieldsOnCreateUpdate.length; i++) {
        delete query[type.ignoreFieldsOnCreateUpdate[i]];
      }
      for(var i = 0; i < type.createUpdateParams.length; i++) {
        extraParams[type.createUpdateParams[i]] = record.get(type.createUpdateParams[i]) || GlobalData.get(type.createUpdateParams[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.createUpdateParams[i]] == 'all') delete query[type.createUpdateParams[i]];
      }
      Ember.merge(query, extraParams);
      //return "data="+JSON.stringify(query);
      return query;
    }
    else {
      for(var i = 0; i < type.deleteParams.length; i++) {
        extraParams[type.deleteParams[i]] = record.get(type.deleteParams[i]) || GlobalData.get(type.deleteParams[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.deleteParams[i]] == 'all') delete query[type.deleteParams[i]];
      }
      Ember.merge(query, extraParams);
    }
    return query;
  },

  buildFindQuery : function(type, id, query) {
    var keys = type.keys || [], ids = id.split("__");
    for(var i = 0; i < keys.length; i++) {
      query[keys[i]] = (ids.length > i ? ids[i] : "");
    }
    for(var i = 0; i < type.findParams.length; i++) {
      query[type.findParams[i]] = GlobalData.get(type.findParams[i]);
    }
    return query;
  },

  buildURL : function(type, query, requestType) {
    var 
    ty = (Ember.typeOf(type) == 'string' ? type : type.apiName || type.typeKey),
    model = (Ember.typeOf(type) == 'string' ? type : type),
    url = "";
    if(type.customApiMap) {
      url = type.customApiMap[requestType];
    }
    else {
      url = APIConfig.API_BASE + "/" + ty;
      if(APIConfig.APPEND_ID === 1 && APIConfig.APPEND_ID_MAP[requestType] === 1) {
        url += "/" + getId(query, model);
      }
      if(APIConfig.ENABLE_END_POINT === 1) {
        url += "/" + APIConfig.END_POINT_MAP[requestType];
      }
    }
    return url;
  },

  createRecord : function(store, type, record) {
    var 
    data = this.serialize(record, { includeId: true }),
    query = this.getQueryParams(type, data, record, true);
    backupData(record, type, "create");
    return this.ajax(this.buildURL(type, query, "create"), APIConfig.HTTP_METHOD_MAP.create, { data : query });
  },

  find : function(store, type, id) {
    var
    query = this.buildFindQuery(type, id, {});
    return this.ajax(this.buildURL(type, query, "find"), APIConfig.HTTP_METHOD_MAP.find, { data : query });
  },

  findAll : function(store, type) {
    return this.ajax(this.buildURL(type, {}, "findAll"), APIConfig.HTTP_METHOD_MAP.find);
  },

  findQuery : function(store, type, query) {
    return this.ajax(this.buildURL(type, query, "findAll"), APIConfig.HTTP_METHOD_MAP.find, { data : query });
  },

  //TODO revisit this
  /*_findNext : function(store, type, query, id, queryType) {
    var adapter = store.adapterFor(type),
        serializer = store.serializerFor(type),
        label = "DS: Handle Adapter#find of " + type.typeKey;

    return $.ajax({
    //TODO : fix the way url built
      url : adapter.buildURL(type)+"/"+queryType,
      method : APIConfig.HTTP_METHOD_MAP.find, 
      data : { id : id, cur : Ember.get("CrudAdapter.GlobalData.cursor."+id) },
      dataType : "json",
    }).then(function(adapterPayload) {
      Ember.assert("You made a request for a " + type.typeKey + " with id " + id + ", but the adapter's response did not have any data", adapterPayload);
      var payload = serializer.extract(store, type, adapterPayload, id, "findNext");

      return store.push(type, payload);
    }, function(error) {
      var record = store.getById(type, id);
      record.notFound();
      throw error;
    }, "DS: Extract payload of '" + type + "'");
  },

  findNextFull : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    backupData(record, type);
    return this._findNext(record.store, type, query, getId(record, type), "getFullNext");
  },

  findNext : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    backupData(record, type);
    return this._findNext(record.store, type, query, getId(record, type), "getNext");
  },
  */

  updateRecord : function(store, type, record) {
    var
    data = this.serialize(record, { includeId: true }),
    query = this.getQueryParams(type, data, record, true);
    backupData(record, type);
    return this.ajax(this.buildURL(type, query, "update"), APIConfig.HTTP_METHOD_MAP.update, { data : query });
  },

  deleteRecord : function(store, type, record) {
    var
    data = this.serialize(record, { includeId: true }),
    query = this.getQueryParams(type, {}, record);
    return this.ajax(this.buildURL(type, query, "delete"), APIConfig.HTTP_METHOD_MAP.delete, { data : this.getQueryParams(type, query, record) });
  },
});

return {
  ApplicationAdapter : ApplicationAdapter,
  GlobalData : GlobalData,
  APIConfig : APIConfig,
};

});
