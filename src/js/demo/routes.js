DemoApp.IndexRoute = Ember.Route.extend({
  model : function(params, transition) {
    return {};
  },
});

DemoApp.FormRoute = Ember.Route.extend({
  model : function() {
    return this.store.createRecord("test");
  },
});

DemoApp.TreeRoute = Ember.Route.extend({
  model : function() {
    return Tree.NodeRecord.create({
      name : "root",
      nodeType : "treeTestNode",
      columnDataGroup : ColumnData.Registry.retrieve("treeTestNode", "columnDataGroup"),
      children : [{
        name : "n1",
        nodeType : "treeTestNode",
        children : [{
          name : "ln1",
          nodeType : "treeTestLeaf",
        }],
      }, {
        name : "ln2",
        nodeType : "treeTestLeaf",
      }],
    });
  },
});

DemoApp.LazydisplayRoute = Ember.Route.extend({
  model : function() {
    var rows = [];
    for(var i = 0; i < 10000; i++) {
      rows.push(Ember.Object.create({
        id : i,
        vara : "VarA"+i,
        varb : "VarB"+Math.round(Math.random()*10),
      }));
    }
    return rows;
  },
});

DemoApp.ListgroupRoute = Ember.Route.extend({
  model : function() {
    var rows = [];
    for(var i = 0; i < 10; i++) {
      rows.push(Ember.Object.create({
        id : i,
        vara : "VarA"+i,
        varb : "VarB"+Math.round(Math.random()*5),
      }));
    }
    return rows;
  },
});

DemoApp.DragdropRoute = Ember.Route.extend({
  model : function() {
    return Ember.Object.create({
      eleId : "root",
      childrenClass : "sorta",
      childColumnGroup : "sortTest",
      eles : [Ember.Object.create({
        eleId : "ele1",
        childrenClass : "sorta",
        childColumnGroup : "sortTestSameLevel",
        eles : [Ember.Object.create({
          eleId : "ele2",
          childrenClass : "sortb",
          childColumnGroup : "sortTestSameLevel",
        })],
      }), Ember.Object.create({
        eleId : "ele3",
        childrenClass : "sortb",
        childColumnGroup : "sortTestSameLevel",
      }), Ember.Object.create({
        eleId : "ele4",
        childrenClass : "sortb",
        childColumnGroup : "sortTestSameLevel",
      })],
    });
  },
});

DemoApp.PanelsRoute = Ember.Route.extend({
  model : function() {
    return [Ember.Object.create({
      name : "ele1",
      desc : "Ele1 Desc",
    }), Ember.Object.create({
      name : "ele2",
      desc : "Ele2 Desc",
    }), Ember.Object.create({
      name : "ele3",
      desc : "Ele3 Desc",
    }), Ember.Object.create({
      name : "ele4",
      desc : "Ele4 Desc",
    })];
  },
});
