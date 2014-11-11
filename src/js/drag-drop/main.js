/**
 * A drag drop module for all operations related to drag and drop. Uses html5 drag drop feature.
 *
 * @module drag-drop
 */
define([
  "./drag-drop-globals",
  "./draggableMixin",
  "./droppableMixin",
  "./sortableDraggableMixin",
  "./sortableDroppableMixin",
  "./sortablePlaceholderMixin",
  "./drag-drop-column-data-interface",
], function() {
  var DragDrop = Ember.Namespace.create();
  window.DragDrop = DragDrop;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        DragDrop[k] = arguments[i][k];
      }
    }
  }

  return DragDrop;
});
