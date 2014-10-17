/**
 * Module to show record in a tree format.
 *
 * @module tree
 */

Tree = Ember.Namespace.create();


/**
 * Mixin to define behaviour of a record in the tree module.
 *
 * @class Tree.NodeRecordMixin
 */
Tree.NodeRecordMixin = Ember.Mixin.create(Ember.ActionHandler, {
  /**
   * Array of children records.
   *
   * @property children
   */
  children : null,

  columnDataGroup : function() {
    var nodeColumnData = this.get("parentObj.columnDataGroup.tree.nodeColumnData");
    if(nodeColumnData) {
      return ColumnData.Registry.retrieve(this.get(nodeColumnData.get("key")), "columnDataGroup");
    }
    return null;
  }.property("parentObj.columnDataGroup"),
});


/**
 * Different node views.
 *
 * @module tree
 * @submodule tree-nodes
 */


/**
 * Node view for a non leaf node.
 *
 * @class Tree.NodeView
 */
Tree.NodeView = Ember.View.extend({
  /**
   * Record for the node.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['tree-node'],

  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property("elementId"),

  collapsed : false,

  template : Ember.Handlebars.compile('' +
    '{{view view.columnDataGroup.tree.leftBarLookup record=view.record columnData=view.columnDataGroup.tree.leftBarColumnData collapseId=view.collapseId groupId=view.elementId ' +
                                                   'tagName=view.columnDataGroup.tree.leftBarColumnData.tree.tagName columnDataKey="tree" collapsed=view.collapsed}}' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
      '<div {{bind-attr id=view.collapseId class="view.columnDataGroup.tree.nodeChildrenClass :tree-node-children :collapse :in"}}>' +
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

/**
 * Node view for a leaf node.
 *
 * @class Tree.LeafView
 */
Tree.LeafView = Tree.NodeView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="tree-node-leftbar leaf-node"></div>' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main :leaf-node"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),
});


/***   Name to Lookup map  ***/

Tree.NameToLookupMap = {
  "node" : "tree/node",
  "leaf" : "tree/leaf",
};
GlobalModules.GlobalModulesMap.node = "tree/node";
GlobalModules.GlobalModulesMap.leaf = "tree/leaf";


/**
 * Column data interface for tree.
 *
 * @module tree
 * @submodule tree-column-data
 */

/**
 * A column data group for the tree module.
 *
 * @class Tree.TreeColumnDataGroup
 */
Tree.TreeColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "tree",
  modules : ["leftBar", "label", "node"],
  lookupMap : Tree.NameToLookupMap,

  /**
   * Type of left bar view.
   *
   * @property leftBarType
   * @type String
   * @default "displayText"
   */
  //leftBarType : "displayTextCollapsibleGlypicon",

  /**
   * Type of label view.
   *
   * @property labelType
   * @type String
   * @default "displayText"
   */
  //labelType : "displayText",

  /**
   * Type of node view.
   *
   * @property nodeType
   * @type String
   * @default "displayText"
   */
  //nodeType : "node",
});

/**
 * Column data for the tree modules (leftBar, label or node based on 'type')
 *
 * @class Tree.TreeColumnData
 */
Tree.TreeColumnData = Ember.Object.extend({
});

Tree.TreeLeftBarColumnData = Tree.TreeColumnData.extend({
  classNames : ["tree-node-leftbar"],
});

Tree.TreeLabelColumnData = Tree.TreeColumnData.extend({
  tagName : "h4",
  classNames : ['tree-node-name'],
});

Tree.TreeNodeColumnData = Tree.TreeColumnData.extend({
});

Tree.TreeColumnDataMap = {
  "leftBar" : Tree.TreeLeftBarColumnData,
  "label" : Tree.TreeLabelColumnData,
  "node" : Tree.TreeNodeColumnData,
};
