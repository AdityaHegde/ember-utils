Panels = Ember.Namespace.create();

Panels.PanelsView = Ember.View.extend({
  classNames : ['panel-group'],
  columnDataGroup : null,
  panels : null,

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.panels}}' +
        '{{view thatView.columnDataGroup.panel.typeLookup record=this columnDataGroup=thatView.columnDataGroup groupId=thatView.elementId}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});


/***    Panel Types   ***/

Panels.PanelView = Ember.View.extend({
  classNames : ['panel', 'panel-default'],
  columnDataGroup : null,

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData}}' +
    '</div>' +
    '<div class="panel-body">' +
      '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData}}' +
    '</div>' +
    '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
      '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData}}' +
    '</div>{{/if}}' +
  ''),
});

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
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData collapseId=view.collapseId groupId=view.groupId}}' +
    '</div>' +
    '<div {{bind-attr id="view.collapseId" class=":panel-collapse :collapse view.isFirst:in"}}>' +
      '<div class="panel-body">' +
        '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData collapseId=view.collapseId groupId=view.groupId}}' +
      '</div>' +
      '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData collapseId=view.collapseId groupId=view.groupId}}' +
      '</div>{{/if}}' +
    '</div>' +
  ''),
});


/***   Panel Heading   ***/

Panels.PanelHeadingView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  tagName : "h3",
  classNames : ["panel-title"],
  tooltip : function() {
    return this.get("record"+this.get("columnData.panel.tooltipKey")) || "Panel Heading";
  }.property("view.columnData.panel"),

  template : Ember.Handlebars.compile('' +
    '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
  ''),
});

Panels.PanelCollapsibleHeadingView = Panels.PanelHeadingView.extend({
  groupId : null,
  groupIdHref : function() {
    return "#"+this.get("groupId");
  }.property('view.groupId'),
  collapseId : null,
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  template : Ember.Handlebars.compile('' +
    '<a class="group-item-name" data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
    '</a>' +
  ''),
});


/*** Panel Body   ***/

Panels.PanelBodyView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  tagName : '',
  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});


/*** Panel Footer   ***/

Panels.PanelFooterView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  tagName : '',
  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});


/***   Name to Lookup map  ***/

Panels.NameToLookupMap = {
  panel : {
    "base" : "panels/panel",
    "collapsible" : "panels/panelCollapsible",
  },
  heading : {
    "base" : "panels/panelHeading",
    "collapsible" : "panels/panelCollapsibleHeading",
  },
  body : {
    "base" : "panels/panelBody",
  },
  footer : {
    "base" : "panels/panelFooter",
  },
};


/***   Panel Column Data Interface   ***/

Panels.PanelColumnDataGroup = Ember.Object.extend(ColumnData.ColumnDataGroupPluginMixin, {
  groupType : "panel",
  modules : ["heading", "body", "footer"],
  lookupMap : Panels.NameToLookupMap,
});

Panels.PanelHeadingColumnData = Ember.Object.extend({
});

Panels.PanelBodyColumnData = Ember.Object.extend({
});

Panels.PanelFooterColumnData = Ember.Object.extend({
});

Panels.PanelColumnDataMap = {
  heading : Panels.PanelHeadingColumnData,
  body : Panels.PanelBodyColumnData,
  footer : Panels.PanelFooterColumnData,
};
