define([
  "ember",
  "ember_data",
], function(Ember, DS) {

var isDirty = function(record) {
  //isDirty_alias is populated by ROSUI.AggregateFromChildren mixin with child records' isDirty
  return record.get("isDirty") || record.get("isDirty_alias");
};

var validationFailed = function(record) {
  //created a wrapper to do other stuff if needed
  return record.get("validationFailed");
};

/**
 * Wrapper to save record.
 *
 * @method saveRecord
 * @for CrudAdapter
 * @param {Instance} record
 * @param {Class|String} type Model class of the record
 */
var saveRecord = function(record, type) {
  var promise;
  //Ember.run(function() {
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
              hasManyArray.then(function() {
                var map = {};
                for(var i = 0; i < hasManyArray.get("length");) {
                  var item = hasManyArray.objectAt(i), emberId = Utils.getEmberId(item);
                  if(map[emberId]) {
                    hasManyArray.removeAt(i);
                  }
                  else if(item.get("isNew")) {
                    hasManyArray.removeAt(i);
                    item.unloadRecord();
                  }
                  else {
                    map[emberId] = 1;
                    i++;
                  }
                }
              });
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
  //});
  return promise;
};

return {
  saveRecord : saveRecord,
};

});
