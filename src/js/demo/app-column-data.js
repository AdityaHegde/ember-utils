DemoApp.ColumnData = [
  {
    name : "formTest",
    columns : [
      {
        name : "vara",
        label : "VarA",
        form : {
          type : "textInput",
        },
      },
      {
        name : "varb",
        label : "VarB",
        form : {
          type : "staticSelect",
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
          type : "textInput",
          disableForCols : [
            {name : "varb", value : "v3", enable : true},
          ],
          listenForCols : ["varb"],
        },
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
          type : "sortEleId",
        },
      },
      {
        name : "eles",
        label : "Eles",
        sort : {
          type : "sortEleChildren",
        },
      },
      {
        name : "childrenClass",
        label : "ChildrenClass",
        sort : {
          type : "sortEleChildrenClass",
        },
      },
      {
        name : "childColumnGroup",
        label : "ChildColumnGroup",
        sort : {
          type : "sortEleChildrenColumnGroup",
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
          type : "sortEleId",
        },
      },
      {
        name : "eles",
        label : "Eles",
        sort : {
          type : "sortEleChildren",
        },
      },
      {
        name : "childrenClass",
        label : "ChildrenClass",
        sort : {
          type : "sortEleChildrenClass",
        },
      },
      {
        name : "childColumnGroup",
        label : "ChildColumnGroup",
        sort : {
          type : "sortEleChildrenColumnGroup",
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
          type : "heading",
        },
      },
      {
        name : "desc",
        panel : {
          type : "body",
        },
      },
    ],
    panel : {
      type : "collapsible",
      headingType : "collapsible",
    },
  },
];
