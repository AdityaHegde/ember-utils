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

DemoApp.LazyDisplayMain = Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
  getRowView : function(row) {
    return Ember.View.createWithMixins(LazyDisplay.LazyDisplayRow, {
      row : row,
      template : Ember.Handlebars.compile('' +
        '{{view.row.id}} : {{view.row.vara}} - {{view.row.varb}}' +
      ''),
    });
  },
  getDummyView : function(row) {
    return Ember.View.createWithMixins(LazyDisplay.LazyDisplayDummyRow, {
      row : row,
      template : Ember.Handlebars.compile(''),
    });
  },
});

DemoApp.TreeRecord = Ember.Object.extend(Tree.NodeRecordMixin, {
  children : Utils.hasMany("DemoApp.TreeRecord"),
});
