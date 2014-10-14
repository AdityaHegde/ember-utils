DemoApp.IndexController = Ember.Controller.extend({
});

DemoApp.FormController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columnDataGroup", ColumnData.Registry.retrieve("formTest", "columnDataGroup"));
  },

  columnDataGroup : null,
});

DemoApp.LazydisplayController = Ember.Controller.extend({
  lazyDisplayConfig : LazyDisplay.LazyDisplayConfig.create({
    lazyDisplayMainClass : Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
      getRowView : function(row) {
        return Ember.View.createWithMixins(LazyDisplay.LazyDisplayRow, {
          row : row,
          template : Ember.Handlebars.compile('' +
            '{{view.row.id}} : {{view.row.vara}} - {{view.row.varb}}' +
          ''),
        });
      },
      getDummyView : function(row) {
        return Ember.View.createWithMixins(LazyDisplay.LazyDisplayDummyRow, {
          row : row,
          template : Ember.Handlebars.compile(''),
        });
      },
    }),
    rowHeight : 30,
  }),
});

DemoApp.ListgroupController = Ember.Controller.extend({
  columnDataGroup : ColumnData.ColumnDataGroup.create({
    columns : [
      {
        name : "vara",
        list : {
          type : "title",
        },
      },
      {
        name : "varb",
        list : {
          type : "desc",
        },
      },
      {
        name : "varc",
        list : {
          type : "rightBlock",
        },
      },
    ],
    list : {
    },
    name : "listTest",
  }),
});

DemoApp.TreeController = Ember.Controller.extend({
  init : function() {
    this._super();
    ColumnData.ColumnDataGroup.create({
      name : "treeTestLeaf",
      columns : [
        {
          name : "name",
          tree : {
            type : "label",
          },
        },
        {
          name : "nodeType",
          tree : {
            type : "node",
          },
        },
      ],
      tree : {
        nodeType : "leaf",
      },
    });
  },
  columnDataGroup : ColumnData.ColumnDataGroup.create({
    columns : [
      {
        name : "name",
        tree : {
          type : "label",
        },
      },
      {
        name : "nodeType",
        tree : {
          type : "node",
        },
      },
    ],
    tree : {
    },
    name : "treeTestNode",
  }),
});

DemoApp.DragdropController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columnDataGroup", ColumnData.Registry.retrieve("sortTest", "columnDataGroup"));
  },

  columnDataGroup : null
});

DemoApp.PanelsController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columnDataGroup", ColumnData.Registry.retrieve("panelTest", "columnDataGroup"));
  },

  columnDataGroup : null,

  standAlonePanel : Ember.Object.create({
    name : "Stand Alone",
    desc : "Collapsible with no siblings",
  }),
});

DemoApp.ProgressbarController = Ember.Controller.extend({
  minVal : 0,
  maxVal : 100,
  val : 33,
  style : "error",
  striped : true,
  animated : false,
});
