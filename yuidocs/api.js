YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Alerts.AlertMessageComponent",
        "AppWrapper.AppWrapper",
        "ArrayMod.ArrayFilterGroup",
        "ArrayMod.ArrayFilterModifier",
        "ArrayMod.ArrayModController",
        "ArrayMod.ArrayModGroup",
        "ArrayMod.ArrayModifier",
        "ArrayMod.ArraySearchModifier",
        "ArrayMod.ArraySortGroup",
        "ArrayMod.ArraySortModifier",
        "ArrayMod.ArrayTagObjectModifier",
        "ArrayMod.ArrayTagSearchModifier",
        "CSVDuplicateValidation",
        "CSVRegexValidation",
        "ColumnData.CSVDuplicateValidation",
        "ColumnData.CSVRegexValidation",
        "ColumnData.ColumnData",
        "ColumnData.ColumnDataChangeCollectorMixin",
        "ColumnData.ColumnDataGroup",
        "ColumnData.ColumnDataGroupPluginMixin",
        "ColumnData.ColumnDataValidation",
        "ColumnData.ColumnDataValueMixin",
        "ColumnData.DuplicateAcrossRecordsValidation",
        "ColumnData.EmptyValidation",
        "ColumnData.NumberRangeValidation",
        "ColumnData.RegexValidation",
        "ColumnDataChangeCollectorMixin",
        "ColumnDataGroupPluginMixin",
        "ColumnDataValidation",
        "ColumnDataValueMixin",
        "DelayedAddToHasMany",
        "DragDrop.DraggableMixin",
        "DragDrop.DroppableMixin",
        "DuplicateAcrossRecordsValidation",
        "EmptyValidation",
        "GlobalModules.DisplayTextCollapsibleColumnDataMixin",
        "GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin",
        "GlobalModules.DisplayTextCollapsibleGlypiconView",
        "GlobalModules.DisplayTextCollapsibleView",
        "GlobalModules.DisplayTextColumnDataMixin",
        "GlobalModules.DisplayTextView",
        "GlobalModules.DisplayTextWithTooltipColumnDataMixin",
        "GlobalModules.DisplayTextWithTooltipView",
        "GlobalModules.GlobalModuleColumnDataGroupMixin",
        "LazyDisplay.LazyDisplayColumnDataGroup",
        "LazyDisplay.LazyDisplayView",
        "ListGroup.ListColumnData",
        "ListGroup.ListColumnDataGroup",
        "ListGroup.ListGroupView",
        "ListGroup.ListItemView",
        "ModelWrapper.ModelWrapper",
        "NumberRangeValidation",
        "ObjectWithArrayMixin",
        "Panels.PanelCollapsibleView",
        "Panels.PanelColumnDataGroup",
        "Panels.PanelView",
        "Panels.PanelsView",
        "RegexValidation",
        "Timer.AsyncQue",
        "Timer.Timer",
        "Tree.LeafView",
        "Tree.NodeRecordMixin",
        "Tree.NodeView",
        "Tree.TreeColumnData",
        "Tree.TreeColumnDataGroup"
    ],
    "modules": [
        "alerts",
        "app-wrapper",
        "array-modifier",
        "array-modifier-types",
        "column-data",
        "column-data-utils",
        "column-data-validation",
        "drag-drop",
        "ember-utils-core",
        "global-module",
        "global-module-column-data",
        "global-module-view",
        "lazy-display",
        "list-column-data",
        "list-group",
        "list-item",
        "model-wrapper",
        "panel-column-data",
        "panel-views",
        "panels",
        "timer",
        "tree",
        "tree-column-data",
        "tree-nodes"
    ],
    "allModules": [
        {
            "displayName": "alerts",
            "name": "alerts",
            "description": "Alert module for all stuff related to alerts."
        },
        {
            "displayName": "app-wrapper",
            "name": "app-wrapper",
            "description": "A module for wrapper over Ember.Application which initializes a few things automatically"
        },
        {
            "displayName": "array-modifier",
            "name": "array-modifier",
            "description": "Module to handle array modification like sorting, searching and filtering."
        },
        {
            "displayName": "array-modifier-types",
            "name": "array-modifier-types",
            "description": "Array modifier types"
        },
        {
            "displayName": "column-data",
            "name": "column-data",
            "description": "Module for meta data of a record type and its properties."
        },
        {
            "displayName": "column-data-utils",
            "name": "column-data-utils",
            "description": "Utility classes related to column data."
        },
        {
            "displayName": "column-data-validation",
            "name": "column-data-validation",
            "description": "Validations for property in record."
        },
        {
            "displayName": "drag-drop",
            "name": "drag-drop",
            "description": "A drag drop module for all operations related to drag and drop. Uses html5 drag drop feature."
        },
        {
            "displayName": "ember-utils-core",
            "name": "ember-utils-core",
            "description": "Core module for ember-utils."
        },
        {
            "displayName": "global-module",
            "name": "global-module",
            "description": "Global modules for certain tasks like displaying an attribute from the record."
        },
        {
            "displayName": "global-module-column-data",
            "name": "global-module-column-data",
            "description": "Column Data Interface or the global modules."
        },
        {
            "displayName": "global-module-view",
            "name": "global-module-view",
            "description": "Views for the global modules."
        },
        {
            "displayName": "lazy-display",
            "name": "lazy-display",
            "description": "A module to selective load views for a very large set of records. Will load the views around the point of view."
        },
        {
            "displayName": "list-column-data",
            "name": "list-column-data",
            "description": "Column data interface for list item views."
        },
        {
            "displayName": "list-group",
            "name": "list-group",
            "description": "An ember wrapper module for bootstrap's list group component."
        },
        {
            "displayName": "list-item",
            "name": "list-item",
            "description": "Different list item views."
        },
        {
            "displayName": "model-wrapper",
            "name": "model-wrapper",
            "description": "Ember Data Model wrapper to support crud adaptor shipped with this util package."
        },
        {
            "displayName": "panel-column-data",
            "name": "panel-column-data",
            "description": "Column data interface for panels."
        },
        {
            "displayName": "panel-views",
            "name": "panel-views",
            "description": "Different panel views."
        },
        {
            "displayName": "panels",
            "name": "panels",
            "description": "An ember wrapper module for bootstrap's list group component."
        },
        {
            "displayName": "timer",
            "name": "timer",
            "description": "Timer module with stuff related to timers."
        },
        {
            "displayName": "tree",
            "name": "tree",
            "description": "Module to show record in a tree format."
        },
        {
            "displayName": "tree-column-data",
            "name": "tree-column-data",
            "description": "Column data interface for tree."
        },
        {
            "displayName": "tree-nodes",
            "name": "tree-nodes",
            "description": "Different node views."
        }
    ]
} };
});