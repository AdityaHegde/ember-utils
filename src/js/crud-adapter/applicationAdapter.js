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
var endPoint = {
  find : "get",
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
      for(var i = 0; i < type.extraAttrs.length; i++) {
        extraParams[type.extraAttrs[i]] = record.get(type.extraAttrs[i]) || GlobalData.get(type.extraAttrs[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.extraAttrs[i]] == 'all') delete query[type.extraAttrs[i]];
      }
      Ember.merge(query, extraParams);
      //return "data="+JSON.stringify(query);
      return query;
    }
    else {
      for(var i = 0; i < type.queryParams.length; i++) {
        extraParams[type.queryParams[i]] = record.get(type.queryParams[i]) || GlobalData.get(type.queryParams[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.queryParams[i]] == 'all') delete query[type.queryParams[i]];
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

  buildURL : function(type, id) {
    var ty = (Ember.typeOf(type) == 'string' ? type : type.apiName || type.typeKey), url = '/' + ty;
    return url;
  },

  createRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    backupData(record, type, "create");
    return this.ajax(this.buildURL(type)+"/create", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  find : function(store, type, id) {
    return this.ajax(this.buildURL(type, id)+"/"+endPoint.find, 'GET', { data : this.buildFindQuery(type, id, {}) });
  },

  findAll : function(store, type) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET');
  },

  findQuery : function(store, type, query) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET', { data : query });
  },

  _findNext : function(store, type, query, id, queryType) {
    var adapter = store.adapterFor(type),
        serializer = store.serializerFor(type),
        label = "DS: Handle Adapter#find of " + type.typeKey;

    return $.ajax({
      url : adapter.buildURL(type)+"/"+queryType,
      method : 'GET', 
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

  updateRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    backupData(record, type);
    return this.ajax(this.buildURL(type)+"/update", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  deleteRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true }), query = {};
    return this.ajax(this.buildURL(type)+"/delete", 'GET', { data : this.getQueryParams(type, query, record) });
  },
});

return {
  ApplicationAdapter : ApplicationAdapter,
  GlobalData : GlobalData,
  endPoint : endPoint,
};

});
