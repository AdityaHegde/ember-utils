define([
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
], function(Ember, Utils, DragDropGlobals) {

/**
 * A draggable mixin when included enables the view to be dragged.
 *
 * @class DragDrop.DraggableMixin
 */
var DraggableMixin = Ember.Mixin.create({
  classNames : ['dragdrop-draggable'],

  attributeBindings : 'draggable',
  draggable : 'true',
  move : true,
  dragStart : function(event) {
    var dataTransfer = event.originalEvent.dataTransfer, viewid = this.get("elementId");
    dataTransfer.setData('ViewId', viewid);
    dataTransfer.dropEffect = 'move';
    DragDropGlobals.VIEW_ID = viewid;
    if(this.get("move")) {
      var ele = this.get("element");
      this.set("mouseOffset", { left : Utils.getOffset(ele, "Left") - event.originalEvent.x, top : Utils.getOffset(ele, "Top") - event.originalEvent.y });
    }
    this.dragStartCallback(event);
    event.stopPropagation();
  },

  /**
   * A callback method that is called when a drag starts.
   *
   * @method dragStartCallback
   * @param {Object} event The event object of the dragStart event.
   */
  dragStartCallback : function(event) {
  },

  /**
   * Targets that are allowed to be dropped on. Can be a selector or an array of selectors.
   *
   * @property allowedDropTargets
   * @type String|Array
   * @default '.dragdrop-droppable'
   */
  allowedDropTargets : '.dragdrop-droppable',
});

return {
  DraggableMixin : DraggableMixin,
};

});
