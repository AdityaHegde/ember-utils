YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "APIConfig",
        "Alerts.AlertMessageComponent",
        "AppWrapper.AppWrapper",
        "ApplicationAdapter",
        "ApplicationSerializer",
        "ArrayMod.ArrayFilterGroup",
        "ArrayMod.ArrayFilterModifier",
        "ArrayMod.ArrayModController",
        "ArrayMod.ArrayModGroup",
        "ArrayMod.ArrayModMixin",
        "ArrayMod.ArrayModifier",
        "ArrayMod.ArraySearchModifier",
        "ArrayMod.ArraySortGroup",
        "ArrayMod.ArraySortModifier",
        "ArrayMod.ArrayTagSearchModifier",
        "ArrayMod.TagObject",
        "AsyncQue",
        "CSVDuplicateValidation",
        "CSVRegexValidation",
        "ColumnData.ColumnData",
        "ColumnData.ColumnDataGroup",
        "ColumnDataChangeCollectorMixin",
        "ColumnDataValidation",
        "ColumnDataValueMixin",
        "ColumnListenerEntry",
        "CrudAdapter",
        "CrudAdaptor",
        "DelayedAddToHasManyMixin",
        "DragDrop.DraggableMixin",
        "DragDrop.DroppableMixin",
        "DragDrop.SortableDraggableMixin",
        "DragDrop.SortableDroppableMixin",
        "DragDrop.SortablePlaceholderMixin",
        "DuplicateAcrossRecordsValidation",
        "EmptyValidation",
        "Form.CSVDataInputView",
        "Form.CheckBoxView",
        "Form.DisableForCol",
        "Form.DynamicMultiSelectView",
        "Form.DynamicSelectView",
        "Form.FileUploadView",
        "Form.FormColumnData",
        "Form.FormColumnDataGroup",
        "Form.GroupCheckBoxView",
        "Form.GroupRadioButtonView",
        "Form.ImageUploadView",
        "Form.LabelView",
        "Form.Legend",
        "Form.MultiEntryView",
        "Form.MultiInputView",
        "Form.MultipleValue",
        "Form.MultipleValueMixin",
        "Form.RadioInputView",
        "Form.StaticSelectView",
        "Form.TextAreaView",
        "Form.TextInputView",
        "Form.WrapperView",
        "FormView",
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
        "LazyDisplay.PassValueObject",
        "ListGroup.ListColumnData",
        "ListGroup.ListColumnDataGroup",
        "ListGroup.ListGroupView",
        "ListGroup.ListItemView",
        "Modal.FormWindowView",
        "Modal.ModalBodyColumnDataMixin",
        "Modal.ModalBodyView",
        "Modal.ModalColumnData",
        "Modal.ModalColumnDataGroup",
        "Modal.ModalFooterColumnDataMixin",
        "Modal.ModalFooterView",
        "Modal.ModalFormBodyView",
        "Modal.ModalTitleColumnDataMixin",
        "Modal.ModalTitleView",
        "Modal.ModalWindowView",
        "ModelWrapper",
        "MultiColumnMixin",
        "NumberRangeValidation",
        "PanelGroup.PanelColumnData",
        "Panels.PanelCollapsibleView",
        "Panels.PanelColumnDataGroup",
        "Panels.PanelView",
        "Panels.PanelsView",
        "Popovers.PopoverComponent",
        "ProgressBars.ProgressBar",
        "RegexValidation",
        "Timer",
        "TimerObj",
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
        "array-modifier-groups",
        "array-modifier-types",
        "column-data",
        "column-data-utils",
        "column-data-validation",
        "crud-adapter",
        "drag-drop",
        "form",
        "form-column-data",
        "form-items",
        "global-module",
        "global-module-column-data",
        "global-module-view",
        "lazy-display",
        "list-column-data",
        "list-group",
        "list-item",
        "modal",
        "modal-column-data",
        "modal-item",
        "panel-column-data",
        "panel-views",
        "panels",
        "popover",
        "progress-bar",
        "timer",
        "tooltip",
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
            "displayName": "array-modifier-groups",
            "name": "array-modifier-groups",
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
            "displayName": "crud-adapter",
            "name": "crud-adapter",
            "description": "Wrapper module around ember data."
        },
        {
            "displayName": "drag-drop",
            "name": "drag-drop",
            "description": "A drag drop module for all operations related to drag and drop. Uses html5 drag drop feature."
        },
        {
            "displayName": "form",
            "name": "form",
            "description": "A module for a form."
        },
        {
            "displayName": "form-column-data",
            "name": "form-column-data",
            "description": "Column data interface for form module."
        },
        {
            "displayName": "form-items",
            "name": "form-items",
            "description": "Module with all the form items."
        },
        {
            "displayName": "global-module",
            "name": "global-module",
            "description": "Global modules for certain tasks like displaying an attribute from the record."
        },
        {
            "displayName": "global-module-column-data",
            "name": "global-module-column-data",
            "description": "Views for the global modules."
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
            "description": "Different list item views."
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
            "displayName": "modal",
            "name": "modal",
            "description": "A module for a modal windows."
        },
        {
            "displayName": "modal-column-data",
            "name": "modal-column-data",
            "description": "Modal items submodule."
        },
        {
            "displayName": "modal-item",
            "name": "modal-item",
            "description": "Modal items submodule."
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
            "displayName": "popover",
            "name": "popover",
            "description": "Module for popovers."
        },
        {
            "displayName": "progress-bar",
            "name": "progress-bar",
            "description": "Progress bar module."
        },
        {
            "displayName": "timer",
            "name": "timer",
            "description": "Timer module with stuff related to timers."
        },
        {
            "displayName": "tooltip",
            "name": "tooltip",
            "description": "Module for the tooltip component."
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