/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module panels
 */


Panels = Ember.Namespace.create();

/**
 * A view for a set of panels.
 *
 * @class Panels.PanelsView
 */
Panels.PanelsView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property panels
   * @type Array
   */
  panels : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.panels}}' +
        '{{view thatView.columnDataGroup.panel.viewLookup record=this columnDataGroup=thatView.columnDataGroup groupId=thatView.elementId}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});


/**
 * Different panel views.
 *
 * @module panels
 * @submodule panel-views
 */


/**
 * Basic panel view.
 *
 * @class Panels.PanelView
 */
Panels.PanelView = Ember.View.extend({
  /**
   * The record that holds all the data.
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

  classNames : ['panel', 'panel-default'],

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData '+
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div class="panel-body">' +
      '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData '+
                                                   'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
      '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData '+
                                                     'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>{{/if}}' +
  ''),
});


/**
 * Panel view for a collapsible.
 *
 * @class Panels.PanelCollapsibleView
 */
Panels.PanelCollapsibleView = Panels.PanelView.extend({
  groupId : null,
  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property('view.elementId'),
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  isFirst : function() {
    var panels = this.get("parentView.panels");
    return !panels || panels.objectAt(0) === this.get("record");
  }.property("view.parentView.panels.@each", "view.record"),

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div {{bind-attr id="view.collapseId" class=":panel-collapse :collapse view.isFirst:in"}}>' +
      '<div class="panel-body">' +
        '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                     'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>' +
      '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                       'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>{{/if}}' +
    '</div>' +
  ''),
});


/***   Name to Lookup map  ***/

Panels.NameToLookupMap = {
  "base" : "panels/panel",
  "collapsible" : "panels/panelCollapsible",
};


/**
 * Column data interface for panels.
 *
 * @module panels
 * @submodule panel-column-data
 */

/**
 * A column data group for the panels module.
 *
 * @class Panels.PanelColumnDataGroup
 */
Panels.PanelColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "panel",
  modules : ["heading", "body", "footer"],
  lookupMap : Panels.NameToLookupMap,

  /**
   * Type of heading view.
   *
   * @property headingType
   * @type String
   * @default "displayText"
   */
  //headingType : "displayText",

  /**
   * Type of body view.
   *
   * @property bodyType
   * @type String
   * @default "displayText"
   */
  //bodyType : "displayText",

  /**
   * Type of footer view.
   *
   * @property footerType
   * @type String
   */
  //footerType : "",
});

/**
 * Column data for the list group modules (title, rightBlock or desc based on 'type')
 *
 * @class ListGroup.ListColumnData
 */
Panels.PanelColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

Panels.PanelHeadingColumnData = Panels.PanelColumnData.extend({
  tagName : "h3",
  classNames : ["panel-title"],
});

Panels.PanelBodyColumnData = Panels.PanelColumnData.extend({
});

Panels.PanelFooterColumnData = Panels.PanelColumnData.extend({
});

Panels.PanelColumnDataMap = {
  heading : Panels.PanelHeadingColumnData,
  body : Panels.PanelBodyColumnData,
  footer : Panels.PanelFooterColumnData,
};
