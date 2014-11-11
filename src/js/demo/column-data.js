define([
  "ember",
  "./app",
  "ember-utils",
], function(Ember, DemoApp) {

DemoApp.ColumnData = [
  {
    columns : [
      {
        name : "vara",
        list : {
          moduleType : "title",
          viewType : "displayText",
        },
      },
      {
        name : "varb",
        list : {
          moduleType : "desc",
          viewType : "displayText",
        },
      },
      {
        name : "varc",
        list : {
          moduleType : "rightBlock",
          viewType : "displayText",
        },
      },
    ],
    list : {
      viewType : "base",
    },
    name : "listTest",
  },
  {
    name : "formTest",
    columns : [
      {
        name : "vara",
        label : "VarA",
        form : {
          moduleType : "textInput",
        },
      },
      {
        name : "varb",
        label : "VarB",
        form : {
          moduleType : "staticSelect",
          options : [
            {label : "Value1", val : "v1"},
            {label : "Value2", val : "v2"},
            {label : "Value3", val : "v3"},
          ],
          prompt : "select",
        },
      },
      {
        name : "varc",
        label : "VarC",
        form : {
          moduleType : "textInput",
          hideForCols : [
            {name : "varb", value : "v3", show : true},
          ],
        },
        columnListenerEntries : [{name : "varb"}],
      },
    ],
    form : {},
  },
  {
    name : "sortTest",
    columns : [
      {
        name : "eleId",
        label : "EleId",
        sort : {
          moduleType : "sortEleId",
        },
      },
      {
        name : "eles",
        label : "Eles",
        sort : {
          moduleType : "sortEleChildren",
        },
      },
      {
        name : "childrenClass",
        label : "ChildrenClass",
        sort : {
          moduleType : "sortEleChildrenClass",
        },
      },
      {
        name : "childColumnGroup",
        label : "ChildColumnGroup",
        sort : {
          moduleType : "sortEleChildrenColumnGroup",
        },
      },
    ],
    sort : {
      sortableDragableClassNames : ["sort-drag-test"],
      sortableDroppableClassNames : ["sort-drop-test"],
      sortablePlaceholderClassNames : ["sort-placeholder-test"],
      sortEleChildrenClassMapName : "DemoApp.SortableViewMap",
      placeholderClassName : "DemoApp.SortPlaceholderView",
    },
  },
  {
    name : "sortTestSameLevel",
    columns : [
      {
        name : "eleId",
        label : "EleId",
        sort : {
          moduleType : "sortEleId",
        },
      },
      {
        name : "eles",
        label : "Eles",
        sort : {
          moduleType : "sortEleChildren",
        },
      },
      {
        name : "childrenClass",
        label : "ChildrenClass",
        sort : {
          moduleType : "sortEleChildrenClass",
        },
      },
      {
        name : "childColumnGroup",
        label : "ChildColumnGroup",
        sort : {
          moduleType : "sortEleChildrenColumnGroup",
        },
      },
    ],
    sort : {
      sortableDragableClassNames : ["sort-drag-test-same"],
      sortableDroppableClassNames : ["sort-drop-test-same"],
      sortablePlaceholderClassNames : ["sort-placeholder-test-same"],
      sameLevel : true,
      sortEleChildrenClassMapName : "DemoApp.SortableViewMap",
      placeholderClassName : "DemoApp.SortPlaceholderView",
    },
  },
  {
    name : "panelTest",
    columns : [
      {
        name : "name",
        panel : {
          moduleType : "heading",
          viewType : "displayTextCollapsible",
        },
      },
      {
        name : "desc",
        panel : {
          moduleType : "body",
          viewType : "displayText",
        },
      },
    ],
    panel : {
      viewType : "collapsible",
      headingType : "displayTextCollapsible",
    },
  },
  {
    name : "lazyDisplayTest",
    columns : [],
    lazyDisplay : {
      lazyDisplayMainClass : "DemoApp.LazyDisplayMain",
      rowHeight : 30,
    },
  },
];

});
