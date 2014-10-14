DemoApp.DragView = Ember.View.extend(DragDrop.DragableMixin, {
  template : Ember.Handlebars.compile('Drag - {{view.elementId}}'),
});

DemoApp.DropView = Ember.View.extend(DragDrop.DroppableMixin, {
  template : Ember.Handlebars.compile('Drop - {{view.elementId}}'),

  dragEnterCallback : function(event, dragView, dragEle, dropView, dropEle) {
    dropEle.attr("style", "background-color:blue");
  },
  dragLeaveCallback : function(event, dragView, dragEle, dropView, dropEle) {
    dropEle.attr("style", "");
  },
  dropCallback : function(event, dragView, dragEle, dropView, dropEle) {
    dropEle.attr("style", "");
  },
});

DemoApp.SortDraggableAView = Ember.View.extend(DragDrop.SortableDraggableMixin, {
  classNames : ["sort-demo-draggable-main"],
  template : Ember.Handlebars.compile('' +
    '<h5>Drag - {{view.elementId}} - {{view.effH}}</h5>' +
    '{{view "sortDroppable" record=view.record columnDataGroup=view.columnDataGroup stateData=view.stateData}}' +
  ''),
});

DemoApp.SortDraggableBView = Ember.View.extend(DragDrop.SortableDraggableMixin, {
  classNames : ["sort-demo-draggable"],
  template : Ember.Handlebars.compile('Drag - {{view.elementId}} - {{view.effH}}'),
});

DemoApp.SortDroppableView = Ember.ContainerView.extend(DragDrop.SortableDroppableMixin, {
  classNames : ["sort-demo-droppable"],
});

DemoApp.SortPlaceholderView = Ember.View.extend(DragDrop.SortablePlaceholderMixin, {
  template : Ember.Handlebars.compile('Placeholder'),
});

DemoApp.SortableViewMap = {
  sorta : DemoApp.SortDraggableAView,
  sortb : DemoApp.SortDraggableBView,
};
