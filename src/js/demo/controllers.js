DemoApp.IndexController = Ember.Controller.extend({
});

DemoApp.DemoAppController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columnDataGroup", ColumnData.Registry.retrieve(this.get("columnDataGroupName"), "columnDataGroup"));
  },

  columnDataGroup : null,
  columnDataGroupName : "",
});

DemoApp.FormController = DemoApp.DemoAppController.extend({
  columnDataGroupName : "formTest",
  collapseTimeout : 0,
  message : "-",
});

DemoApp.LazydisplayController = DemoApp.DemoAppController.extend({
  columnDataGroupName : "lazyDisplayTest",
});

DemoApp.ListgroupController = DemoApp.DemoAppController.extend({
  columnDataGroupName : "listTest",
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
            moduleType : "label",
            viewType : "displayText",
          },
        },
        {
          name : "nodeType",
          tree : {
            moduleType : "node",
            viewType : "leaf",
          },
        },
        {
          name : "leftBar",
          tree : {
            moduleType : "leftBar",
            viewType : "displayTextCollapsibleGlypicon",
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
          moduleType : "label",
          viewType : "displayText",
        },
      },
      {
        name : "nodeType",
        tree : {
          moduleType : "node",
          viewType : "node",
        },
      },
      {
        name : "leftBar",
        tree : {
          moduleType : "leftBar",
          viewType : "displayTextCollapsibleGlypicon",
        },
      },
    ],
    tree : {
      nodeType : "node",
      leftBarType : "displayTextCollapsibleGlypicon",
    },
    name : "treeTestNode",
  }),
});

DemoApp.DragdropController = DemoApp.DemoAppController.extend({
  columnDataGroupName : "sortTest",
});

DemoApp.PanelsController = DemoApp.DemoAppController.extend({
  columnDataGroupName : "panelTest",

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
