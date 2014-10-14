Tree = Ember.Namespace.create();

Tree.NodeRecord = Ember.Object.extend(Ember.ActionHandler, {
  children : Utils.hasMany("Tree.NodeRecord"),

  columnDataGroup : function() {
    var nodeColumnData = this.get("parentObj.columnDataGroup.tree.nodeColumnData");
    if(nodeColumnData) {
      return ColumnData.Registry.retrieve(this.get(nodeColumnData.get("key")), "columnDataGroup");
    }
    return null;
  }.property("parentObj.columnDataGroup"),
});


/***    Nodes    ***/

Tree.NodeView = Ember.View.extend({
  record : null,
  columnDataGroup : null,

  idSelector : function() {
    return "#"+this.get("elementId");
  }.property("elementId"),
  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property("elementId"),
  collapseIdSelector : function() {
    return "#"+this.get("elementId")+"-inner";
  }.property("elementId"),

  collapsed : false,

  template : Ember.Handlebars.compile('' +
    '<div class="tree-node-leftbar">' +
      '<a data-toggle="collapse" {{bind-attr data-parent=view.idSelector href=view.collapseIdSelector class=":glyphicon view.collapsed:glyphicon-chevron-right:glyphicon-chevron-down"}}></a>' +
    '</div>' +
    '<div class="tree-node-main">' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData}}' +
      '<div class="tree-node-children collapse in" {{bind-attr id=view.collapseId}}>' +
        '{{#each view.record.children}}' +
          '{{view columnDataGroup.tree.nodeLookup record=this columnDataGroup=columnDataGroup}}' +
        '{{/each}}' +
      '</div>' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),

  didInsertElement : function() {
    var ele = $(this.get("element")).find(this.get("collapseIdSelector")), that = this;
    ele.on("shown.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", false);
      });
      e.stopPropagation();
    });
    ele.on("hidden.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", true);
      });
      e.stopPropagation();
    });
  },
});

Tree.LeafView = Tree.NodeView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="tree-node-leftbar leaf-node"></div>' +
    '<div class="tree-node-main leaf-node">' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData}}' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),
});


/***   Labels   ***/

Tree.LabelView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  record : null,
  columnData : null,

  tagName : "h4",
  classNames : ['tree-node-name'],

  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});


/***   Name to Lookup map  ***/

Tree.NameToLookupMap = {
  label : {
    basic : "tree/label",
  },
  node : {
    "node" : "tree/node",
    "leaf" : "tree/leaf",
  },
};


/***   TreeColumnInterface   ***/

Tree.TreeColumnDataGroup = Ember.Object.extend({
  labelType : "basic",
  labelLookup : function() {
    return Tree.NameToLookupMap.label[this.get("labelType")];
  }.property("labelType"),
  labelColumnData : function() {
    return this.get("parentObj.columns").findBy("tree.type", "label");
  }.property("parentObj.columns.@each.tree"),

  nodeType : "node",
  nodeLookup : function() {
    return Tree.NameToLookupMap.node[this.get("nodeType")];
  }.property("nodeType"),
  nodeColumnData : function() {
    return this.get("parentObj.columns").findBy("tree.type", "node");
  }.property("parentObj.columns.@each.tree"),
});

Tree.TreeLabelColumnData = Ember.Object.extend({
});

Tree.TreeNodeColumnData = Ember.Object.extend({
});

Tree.TreeColumnDataMap = {
  "label" : Tree.TreeLabelColumnData,
  "node" : Tree.TreeNodeColumnData,
};
