define([
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
], function(Ember, Utils, DragDropGlobals) {

/**
 * A droppable mixin when included enables the view to be dropped on.
 *
 * @class DragDrop.DroppableMixin
 */
var DroppableMixin = Ember.Mixin.create({
  classNames : ['dragdrop-droppable'],

  selectorsPass : function(ele, selectors) {
    if(Ember.typeOf(selectors)  !== 'array') {
      selectors = [selectors];
    }
    for(var i = 0; i < selectors.length; i++) {
      if(!Ember.isEmpty(ele.filter(selectors[i]))) {
        return true;
      }
    }
    return false;
  },
  canInteract : function(dragView, dragEle, dropView, dropEle) {
    return this.selectorsPass(dropEle, dragView.get("allowedDropTargets")) && this.selectorsPass(dragEle, dropView.get("acceptDropFrom"));
  },

  dragEnter: function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragEnterCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  dragOver : function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragOverCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  dragLeave : function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragLeaveCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  drop: function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      if(dragView.get("move")) {
        var mouseOffset = dragView.get("mouseOffset");
        dragEle.offset({ left : mouseOffset.left + event.originalEvent.x, top : mouseOffset.top + event.originalEvent.y });
      }
      this.dropCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },

  /**
   * A callback method that is called when the view being dragged enters this view.
   *
   * @method dragEnterCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragEnterCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged is over this view.
   *
   * @method dragOverCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged leaves this view.
   *
   * @method dragLeaveCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragLeaveCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged is dropped on this view.
   *
   * @method dropCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dropCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * Accept drops from elements passing the selectors. Can be a single selectors or an array of it.
   *
   * @property acceptDropFrom
   * @type String|Array
   * @default '.dragdrop-draggable'
   */
  acceptDropFrom : '.dragdrop-draggable',
});

return {
  DroppableMixin : DroppableMixin,
};

});
