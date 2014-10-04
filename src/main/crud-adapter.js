CrudAdapter = Ember.Namespace.create()
CrudAdapter.loadAdaptor = function(app) {
  app.ApplicationAdapter = CrudAdapter.ApplicationAdapter;
  app.ApplicationSerializer = CrudAdapter.ApplicationSerializer;
};
CrudAdapter.GlobalData = Ember.Object.create();
CrudAdapter.endPoint = {
  find : "get",
};
CrudAdapter.allowedModelAttrs = [{
  attr : "keys",
  defaultValue : "emptyArray",
}, {
  attr : "apiName",
  defaultValue : "value",
  value : "data/generic",
}, {
  attr : "queryParams", 
  defaultValue : "emptyArray",
}, {
  attr : "findParams", 
  defaultValue : "emptyArray",
}, {
  attr : "extraAttrs", 
  defaultValue : "emptyArray",
}, {
  attr : "ignoreFieldsOnCreateUpdate", 
  defaultValue : "emptyArray",
}, {
  attr : "ignoreFieldsOnRetrieveBackup", 
  defaultValue : "emptyArray",
}, {
  attr : "removeAttrsFromBackupOnFind", 
  defaultValue : "emptyArray",
}, {
  attr : "retainId", 
  defaultValue : "value",
  value : false,
}, {
  attr : "useIdForBackup", 
  defaultValue : "value",
  value : false,
}, {
  attr : "paginatedAttribute", 
  defaultValue : "value",
  value : "id",
}, {
  attr : "normalizeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "preSerializeRelations", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "serializeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "backupData", 
  defaultValue : "value",
  value : function() {},
}, {
  attr : "retrieveBackup", 
  defaultValue : "value",
  value : function() {},
}];
CrudAdapter.ModelMap = {};

CrudAdapter.ApplicationAdapter = DS.RESTAdapter.extend({
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
        extraParams[type.extraAttrs[i]] = record.get(type.extraAttrs[i]) || CrudAdapter.GlobalData.get(type.extraAttrs[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.extraAttrs[i]] == 'all') delete query[type.extraAttrs[i]];
      }
      Ember.merge(query, extraParams);
      return "data="+JSON.stringify(query);
    }
    else {
      for(var i = 0; i < type.queryParams.length; i++) {
        extraParams[type.queryParams[i]] = record.get(type.queryParams[i]) || CrudAdapter.GlobalData.get(type.queryParams[i]);
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
      query[type.findParams[i]] = CrudAdapter.GlobalData.get(type.findParams[i]);
    }
    return query;
  },

  buildURL : function(type, id) {
    var ty = (Ember.typeOf(type) == 'string' ? type : type.apiName || type.typeKey), url = '/' + ty;
    return url;
  },

  createRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    CrudAdapter.backupData(record, type, "create");
    return this.ajax(this.buildURL(type)+"/create", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  find : function(store, type, id) {
    return this.ajax(this.buildURL(type, id)+"/"+CrudAdapter.endPoint.find, 'GET', { data : this.buildFindQuery(type, id, {}) });
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
    CrudAdapter.backupData(record, type);
    return this._findNext(record.store, type, query, CrudAdapter.getId(record, type), "getFullNext");
  },

  findNext : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    CrudAdapter.backupData(record, type);
    return this._findNext(record.store, type, query, CrudAdapter.getId(record, type), "getNext");
  },

  updateRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    CrudAdapter.backupData(record, type);
    return this.ajax(this.buildURL(type)+"/update", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  deleteRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true }), query = {};
    return this.ajax(this.buildURL(type)+"/delete", 'GET', { data : this.getQueryParams(type, query, record) });
  },
});

CrudAdapter.ApplicationSerializer = DS.RESTSerializer.extend({
  serializeRelations : function(type, payload, data, parent) {
    type.preSerializeRelations(data);
    type.eachRelationship(function(name, relationship) {
      var plural = Ember.String.pluralize(relationship.type.typeKey);
      this.payload[plural] = this.payload[plural] || [];
      if(this.data[relationship.key]) {
        if(relationship.kind === "hasMany") {
          for(var i = 0; i < this.data[relationship.key].length; i++) {
            var childData = this.data[relationship.key][i], childModel, childType;
            if(relationship.options.polymorphic) {
              childType = CrudAdapter.ModelMap[relationship.type.typeKey][this.data[relationship.key][i].type];
            }
            else {
              childType = (CrudAdapter.ModelMap[relationship.type.typeKey] && CrudAdapter.ModelMap[relationship.type.typeKey][data.type]) || relationship.type.typeKey;
            }
            childModel = this.serializer.store.modelFor(childType);
            this.serializer.serializeRelations(childModel, payload, childData, this.data);
            childData = this.serializer.normalize(childModel, childData, childType);
            this.payload[plural].push(childData);
            if(relationship.options.polymorphic) {
              this.serializer.store.push(childType, childData);
              this.data[relationship.key][i] = {
                id : childData.id,
                type : childType,
              };
            }
            else {
              this.serializer.store.push(childType, childData);
              this.data[relationship.key][i] = childData.id;
            }
          }
        }
      }
      else if(relationship.kind === "belongsTo" && parent) {
        if(relationship.options.polymorphic) {
        }
        else {
          this.data[relationship.key] = CrudAdapter.getId(parent, relationship.type);
        }
      }
    }, {payload : payload, data : data, serializer : this});
  },

  extractSingle : function(store, type, payload, id, requestType) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");
    if(Ember.typeOf(payload.result.data) == 'array') payload.result.data = payload.result.data[0];

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[type.typeKey] = payload.result.data || {};
    CrudAdapter.retrieveBackup(payload[type.typeKey], type, requestType !== 'createRecord');
    this.normalize(type, payload[type.typeKey], type.typeKey);
    this.serializeRelations(type, payload, payload[type.typeKey]);
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractArray : function(store, type, payload, id, requestType) {
    var plural = Ember.String.pluralize(type.typeKey);
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[plural] = payload.result.data || [];
    for(var i = 0; i < payload[plural].length; i++) {
      this.normalize(type, payload[plural][i], type.typeKey);
      CrudAdapter.retrieveBackup(payload[plural][i], type, requestType !== 'createRecord');
      this.serializeRelations(type, payload, payload[plural][i]);
    }
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractFindNext : function(store, type, payload) {
    var id = CrudAdapter.getId(payload.result.data, type);
    payload.result.data[type.paginatedAttribute].replace(0, 0, CrudAdapter.backupDataMap[type.typeKey][id][type.paginatedAttribute]);
    delete CrudAdapter.backupDataMap[type.typeKey][id];
    return this.extractSingle(store, type, payload);
  },

  extractDeleteRecord : function(store, type, payload) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    return null;
  },

  extractCreateRecord : function(store, type, payload) {
    return this.extractSingle(store, type, payload, null, "createRecord");
  },

  extractFindHasMany : function(store, type, payload) {
    return this._super(store, type, payload);
  },

  extract : function(store, type, payload, id, requestType) {
    return this._super(store, type, payload, id, requestType);
  },

  normalize : function(type, hash, prop) {
    //generate id property for ember data
    hash.id = CrudAdapter.getId(hash, type);
    this.normalizeAttributes(type, hash);
    this.normalizeRelationships(type, hash);

    this.normalizeUsingDeclaredMapping(type, hash);

    if(type.normalizeFunction) {
      type.normalizeFunction(hash);
    }

    return hash;
  },

  serialize : function(record, options) {
    var json = this._super(record, options), type = record.__proto__.constructor;

    if(type.serializeFunction) {
      type.serializeFunction(record, json);
    }

    return json;
  },

  serializeHasMany : function(record, json, relationship) {
    var key = relationship.key;

    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    json[key] = record.get(key);
    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      json[key] = json[key].mapBy('id');
    }
    else if (relationshipType === 'manyToOne') {
      json[key] = json[key].map(function(r) {
        return this.serialize(r, {});
      }, this);
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    //do nothing!
  },

  typeForRoot : function(root) {
    if(/data$/.test(root)) {
      return root;
    }
    return Ember.String.singularize(root);
  }
});

CrudAdapter.getId = function(record, type) {
  var id = record.id;
  if(!id) {
    var keys = type.keys || [], ids = [];
    for(var i = 0; i < keys.length; i++) {
      var attr = (record.get && record.get(keys[i])) || record[keys[i]];
      if(null !== attr || undefined !== attr) {
        ids.push(attr);
      }
      else {
        return null;
      }
    }
    return ids.join("__");
  }
  else {
    return id;
  }
};

CrudAdapter.backupDataMap = {};
CrudAdapter.backupData = function(record, type, operation) {
  //TODO : make 'new' into a custom new tag extracted from 'type'
  var data = record.toJSON(), 
      backupId = operation === "create" ? "New" : CrudAdapter.getId(record, type);
      id = CrudAdapter.getId(record, type) || "New";
  if(type.useIdForBackup) backupId = id;
  CrudAdapter.backupDataMap[type.typeKey] = CrudAdapter.backupDataMap[type.typeKey] || {};
  CrudAdapter.backupDataMap[type.typeKey][backupId] = data;
  if(type.retainId) data.id = id;
  for(var i = 0; i < type.keys.length; i++) {
    if(Ember.isEmpty(data[type.keys[i]])) delete data[type.keys[i]];
  }
  type.eachRelationship(function(name, relationship) {
    var a = record.get(relationship.key);
    if(a) {
      if(relationship.kind == 'hasMany') {
        this.data[relationship.key] = [];
        a.forEach(function(item) {
          this.data[relationship.key].push(CrudAdapter.backupData(item, relationship.type, operation));
        }, this);
      }
      else if(relationship.kind === "belongsTo") {
        a = a.content;
        this.data[relationship.key] = a ? a.get("id") || a : a;
      }
    }
  }, {data : data, record : record, operation : operation});
  if(type.backupData) {
    type.backupData(record, type, data);
  }
  if(operation === "find") {
    for(var i = 0; i < type.removeAttrsFromBackupOnFind.length; i++) {
      delete data[type.removeAttrsFromBackupOnFind[i]];
    }
  }
  return data;
};

CrudAdapter.retrieveBackup = function(hash, type, hasId) {
  var backupId = hasId ? CrudAdapter.getId(hash, type) : "New",
      id = CrudAdapter.getId(hash, type) || "New";
  if(type.useIdForBackup) backupId = id;
  if(CrudAdapter.backupDataMap[type.typeKey] && CrudAdapter.backupDataMap[type.typeKey][backupId]) {
    var data = CrudAdapter.backupDataMap[type.typeKey][backupId];
    delete CrudAdapter.backupDataMap[type.typeKey][backupId];
    for(var i = 0; i < type.ignoreFieldsOnRetrieveBackup.length; i++) {
      delete data[type.ignoreFieldsOnRetrieveBackup[i]];
    }
    hash = Utils.merge(hash, data);
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var da = this.data[relationship.key], ha = this.hash[relationship.key];
        if(da) {
          for(var i = 0; i < da.length; i++) {
            var ele = ha.findBy(relationship.type.keys[0], da[i][relationship.type.keys[0]]);
            da[i].id = CrudAdapter.getId(da[i], relationship.type);
            if(ele) Ember.merge(ele, da[i]);
            else ha.push(da[i]);
          }
        }
      }
    }, {data : data, hash : hash});
  }
  if(type.retrieveBackup) {
    type.retrieveBackup(hash, type, data);
  }
  return hash;
};

CrudAdapter.retrieveFailure = function(record) {
  var type = record.__proto__.constructor,
      backupId = record.get("isNew") ? "New" : record.get("id"),
      id = record.get("id") || "New";
  if(CrudAdapter.backupDataMap[type.typeKey] && CrudAdapter.backupDataMap[type.typeKey][backupId]) {
    var data = CrudAdapter.backupDataMap[type.typeKey][backupId],
        attrs = record._inFlightAttributes;
    delete CrudAdapter.backupDataMap[type.typeKey][backupId];
    if(!record.get("isDeleted")) record.rollback();
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, attrs[f]);
    }
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var arr = this.record.get(relationship.key), darr = this.data[relationship.key];
        if(darr) {
          for(var i = 0; i < darr.length; i++) {
            var rid = CrudAdapter.getId(darr[i], relationship.type), rrec = this.record.store.getById(relationship.type, rid);
            if(rrec) {
              CrudAdapter.retrieveFailure(rrec);
              if(this.record.addToProp) {
                this.record.addToProp(relationship.key, rrec);
              }
              else {
                arr.pushObject(rrec);
              }
            }
            else if(CrudAdapter.backupDataMap[relationship.type.typeKey] && CrudAdapter.backupDataMap[relationship.type.typeKey][rid]) {
              var crdata = CrudAdapter.backupDataMap[relationship.type.typeKey][rid], parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete crdata[parentKey];
              }
              if(!rrec) {
                this.record.addToProp(relationship.key, CrudAdapter.createRecordWrapper(this.record.store, relationship.type, crdata));
              }
              delete CrudAdapter.backupDataMap[relationship.type.typeKey][rid];
            }
            else {
              var parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete darr[i][parentKey];
              }
              this.record.addToProp(relationship.key, CrudAdapter.createRecordWrapper(this.record.store, relationship.type, darr[i]));
            }
          }
        }
      }
    }, {record : record, data : data});
  }
  if(record.get("isDeleted")) {
    record.transitionTo('loaded.updated.uncommitted');
  }
  else {
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
};

CrudAdapter.isDirty = function(record) {
  //isDirty_alias is populated by ROSUI.AggregateFromChildren mixin with child records' isDirty
  return record.get("isDirty") || record.get("isDirty_alias");
};

CrudAdapter.validationFailed = function(record) {
  //created a wrapper to do other stuff if needed
  return record.get("validationFailed");
};

CrudAdapter.saveRecord = function(record, type) {
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      if(!record.get("isDeleted")) {
        record.eachAttribute(function(attr) {
          var val = this.get(attr);
          if(Ember.typeOf(val) === "string") {
            val = val.replace(/^\s*/, "");
            val = val.replace(/\s*$/, "");
            this.set(attr, val);
          }
        }, record);
      }
      var isNew = record.get("isNew");
      new Ember.RSVP.Promise(function(resolvei, rejecti) {
        record.save().then(function(data) {
          resolvei(data);
        }, function(message) {
          //Accessing the ember-data internal state machine directly. Might change with change in the ember-data version
          rejecti(message.message || message.statusText || message);
        });
      }).then(function(data) {
        resolve(data);
        if(!record.get("isDeleted")) {
          record.eachRelationship(function(name, relationship) {
            if(relationship.kind === "hasMany") {
              var hasManyArray = record.get(relationship.key);
              for(var i = 0; i < hasManyArray.get("length");) {
                var item = hasManyArray.objectAt(i);
                if(item.get("isNew")) {
                  hasManyArray.removeObject(item);
                  item.unloadRecord();
                }
                else {
                  i++;
                }
              }
            }
          }, record);
          var model = record.__proto__.constructor;
          if(model.attrsByServer) {
            /* attrs returned by server are not updated on the model for some reason */
            for(var i = 0; i < model.attrsByServer.length; i++) {
              record.set(model.attrsByServer[i], record._data[model.attrsByServer[i]]);
            }
            record.adapterDidCommit();
          }
        }
      }, function(message) {
        reject(message.message || message.statusText || message);
      });
    });
  });
  return promise;
};

CrudAdapter.forceReload = function(store, type, id) {
  if(store.recordIsLoaded(type, id)) {
    var record = store.recordForId(type, id);
    CrudAdapter.backupData(record, record.__proto__.constructor, "find");
    return record.reload();
  }
  else {
    return store.find(type, id);
  }
};

CrudAdapter.createRecordWrapper = function(store, type, data) {
  if(data.id && store.recordIsLoaded(type, data.id)) {
    var record = store.recordForId(type, data.id);
    record.unloadRecord();
  }
  return store.createRecord(type, data);
};

CrudAdapter.rollbackRecord = function(record) {
  if(record.get("isError") || record.get("isInvalid") || record.get("isSaving")) {
    var attrs = record._inFlightAttributes, data = record._data;
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, data[f]);
    }
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
  else {
    record.rollback();
  }
  record.__proto__.constructor.eachRelationship(function(name, relationship) {
    if(relationship.kind === "hasMany") {
      var rarr = record.get(relationship.key);
      rarr.then(function() {
        rarr.forEach(function(rec) {
          CrudAdapter.rollbackRecord(rec);
        });
      });
    }
  });
};
