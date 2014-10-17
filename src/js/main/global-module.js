/**
 * Global modules for certain tasks like displaying an attribute from the record.
 *
 * @module global-module
 */

GlobalModules = Ember.Namespace.create();

/**
 * Views for the global modules.
 *
 * @module global-module
 * @submodule global-module-view
 */


/**
 * Module for a simple display of text.
 *
 * @class GlobalModules.DisplayTextView
 */
GlobalModules.DisplayTextView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  /**
   * Key for the configurations on columnData.
   *
   * @property columnDataKey
   * @type String
   */
  columnDataKey : '',

  //tagName : '',

  classNameBindings : ['moduleClassName'],
  moduleClassName : function() {
    var classNames = this.get("columnData."+this.get("columnDataKey")+".classNames") || [];
    if(classNames.join) {
      classNames = classNames.join(" ");
    }
    return classNames;
  }.property("view.columnData", "view.columnDataKey"),

  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});

/**
 * Module for a simple display of text with tooltip.
 *
 * @class GlobalModules.DisplayTextWithTooltipView
 */
GlobalModules.DisplayTextWithTooltipView = GlobalModules.DisplayTextView.extend({
  tooltip : function() {
    return this.get("columnData."+this.get("columnDataKey")+".tooltip") || this.get("record"+this.get("columnData."+this.get("columnDataKey")+".tooltipKey")) || "";
  }.property("view.columnData"),

  template : Ember.Handlebars.compile('' +
    '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
  ''),
});

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleView
 */
GlobalModules.DisplayTextCollapsibleView = GlobalModules.DisplayTextWithTooltipView.extend({
  groupId : null,
  groupIdHref : function() {
    return "#"+this.get("groupId");
  }.property('view.groupId'),
  collapseId : null,
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
    '</a>' +
  ''),
});

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconView
 */
GlobalModules.DisplayTextCollapsibleGlypiconView = GlobalModules.DisplayTextCollapsibleView.extend({
  glyphiconCollapsed : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),
  glyphiconOpened : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),

  glyphicon : function() {
    return this.get( this.get("collapsed") ? "glyphiconCollapsed" : "glyphiconOpened" );
  }.property("view.collpased"),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}<span {{bind-attr class=":glyphicon view.glyphicon"}}></span>{{/tool-tip}}' +
    '</a>' +
  ''),
});


GlobalModules.GlobalModulesMap = {
  "displayText" : "globalModules/displayText",
  "displayTextWithTooltip" : "globalModules/displayTextWithTooltip",
  "displayTextCollapsible" : "globalModules/displayTextCollapsible",
  "displayTextCollapsibleGlypicon" : "globalModules/displayTextCollapsibleGlypicon",
};


/**
 * Column Data Interface or the global modules.
 *
 * @module global-module
 * @submodule global-module-column-data
 */


/**
 * Column Data Group for global modules.
 *
 * @class GlobalModules.GlobalModuleColumnDataGroupMixin
 */
GlobalModules.GlobalModuleColumnDataGroupMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  /**
   * The type of base module.
   *
   * @property type
   * @type String
   */
  type : "base",

  /**
   * The view type of base module.
   *
   * @property viewType
   * @type String
   * @default "base"
   */
  viewType : "base",

  /**
   * Lookup map for the base module type to view's path.
   *
   * @property modules
   * @type Array
   */
  lookupMap : null,

  viewLookup : function() {
    return this.get("lookupMap")[this.get("viewType")];
  }.property("viewType", "lookupMap"),

  arrayProps : ['modules'],

  /**
   * Modules base module supports.
   *
   * @property modules
   * @type Array
   */
  modules : null,

  modulesWillBeDeleted : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.removeObserver(modules[i]+"Type", this, "moduleTypeDidChange");
    }
  },
  modulesWasAdded : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.addObserver(modules[i]+"Type", this, "moduleTypeDidChange");
      this.moduleTypeDidChange(this, modules[i]+"Type");
    }
    this.columnsChanged();
  },

  moduleTypeDidChange : function(obj, moduleType) {
    var module = moduleType.match(/^(\w*)Type$/)[1];
    this.set(module+"Lookup", GlobalModules.GlobalModulesMap[this.get(moduleType) || "displayText"]);
  },

  columnsChanged : function() {
    var columns = this.get("parentObj.columns"), modules = this.get("modules");
    if(columns) {
      for(var i = 0; i < modules.length; i++) {
        this.set(modules[i]+"ColumnData", columns.findBy(this.get("type")+".moduleType", modules[i]));
      }
    }
  }.observes("parentObj.columns.@each"),
});

/**
 * Column Data for display text module.
 *
 * @class GlobalModules.DisplayTextColumnDataMixin
 */
GlobalModules.DisplayTextColumnDataMixin = Ember.Mixin.create({
  //viewType : "displayText",

  /**
   * Class names to use for the module.
   *
   * @property classNames
   * @type String
   */
  //classNames : [],

  /**
   * Tag name used by the module.
   *
   * @property tagName
   * @type String
   * @default "div"
   */
  //tagName : 'div',
});

/**
 * Column Data for display text with tooltip module.
 *
 * @class GlobalModules.DisplayTextWithTooltipColumnDataMixin
 */
GlobalModules.DisplayTextWithTooltipColumnDataMixin = Ember.Mixin.create(GlobalModules.DisplayTextColumnDataMixin, {
  //viewType : "displayTextWithTooltip",

  /**
   * Static tooltip for the module.
   *
   * @property tooltip
   * @type String
   */
  //tooltip : null,

  /**
   * Key to the value on the record for dynamic tooltip.
   *
   * @property tooltipKey
   * @type String
   */
  //tooltipKey : null,
});

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleColumnDataMixin
 */
GlobalModules.DisplayTextCollapsibleColumnDataMixin = Ember.Mixin.create(GlobalModules.DisplayTextWithTooltipColumnDataMixin, {
  //viewType : "displayTextCollapsible",
});

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin
 */
GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin = Ember.Mixin.create(GlobalModules.DisplayTextCollapsibleColumnDataMixin, {
  //viewType : "displayTextCollapsibleGlypicon",

  /**
   * Glypicon class when open.
   *
   * @property glyphiconOpened
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconOpened : "glyphicon-chevron-down",

  /**
   * Glypicon class when collapsed.
   *
   * @property glyphiconCollapsed
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconCollapsed : "glyphicon-chevron-right",
});


GlobalModules.GlobalModulesColumnDataMixinMap = {
  "displayText" : GlobalModules.DisplayTextColumnDataMixin,
  "displayTextWithTooltip" : GlobalModules.DisplayTextWithTooltipColumnDataMixin,
  "displayTextCollapsible" : GlobalModules.DisplayTextCollapsibleColumnDataMixin,
  "displayTextCollapsibleGlypicon" : GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin,
};
