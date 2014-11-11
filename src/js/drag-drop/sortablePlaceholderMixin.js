define([
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
  "./draggableMixin",
  "./droppableMixin",
], function(Ember, Utils, DragDropGlobals, DraggableMixin, DroppableMixin) {

/**
 * Placeholder mixin for empty sortable list.
 *
 * @class DragDrop.SortablePlaceholderMixin
 */
var SortablePlaceholderMixin = Ember.Mixin.create(DraggableMixin.DraggableMixin, DroppableMixin.DroppableMixin, {
  init : function() {
    this._super();
  },

  isPlaceholder : true,
  move : false,

  classNames : ['dragdrop-sortable-placeholder'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortablePlaceholderClassNames'),
  columnDataGroup : null,
  sortableView : null,
  groupId : 0,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
    if(dropView.get("sortableView") && dragView.get("sortableView")) {
      var
      columnDataGroup = this.get("columnDataGroup"),

      //sortable container and it's element id of the element dropped on
      dropViewSort = dropView.get("sortableView"),
      dropViewSortId = dropViewSort.get("elementId"),
      //siblings of the element dropped on
      dropViewEles = dropViewSort.get("sortEleChildren"),
      //sort id of the element dropped on
      dropViewSortEleId = dropView.get("sortEleId"),
      //index of the element dropped on in the array of siblings
      dropViewIdx = dropViewEles.indexOf(dropViewEles.findBy( columnDataGroup.get("sort.sortEleIdColumnData.key"), dropViewSortEleId)),

      //sort id of the element dragged
      dragViewSortEleId = dragView.get("sortEleId"),
      //sortable container and it's element id of the element dragged
      dragViewSort = dragView.get("sortableView"),
      dragViewSortId = dragViewSort.get("elementId"),
      //siblings of the element dragged
      dragViewEles = dragViewSort.get("sortEleChildren"),
      //index of the element dragged in the array of siblings
      dragViewIdx = dragViewEles.indexOf(dragViewEles.findBy( columnDataGroup.get("sort.sortEleIdColumnData.key"), dragViewSortEleId)),
      dragViewData = dragViewEles[dragViewIdx];

      dragView.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
      if(dropViewSort.get("effH") === dragViewSort.get("effH")) {
        //allow sortable on views with same hierarchy

        if(dragView.get("change")) {
          //process only if there is a change in the mouse position

          if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
            //if there only 1 element and its a placeholder, remove it
            dropViewSort.removeAt(0);
          }

          //remove the dragged ele from its siblings array
          dragViewEles.removeAt(dragViewIdx);
          //remove the dragged ele's view from sortable container
          dragViewSort.removeAt(dragViewIdx);
          //insert the dragViewData to siblings array at the end
          dropViewEles.pushObject(dragViewData);
          //insert the dragView to sortable container at the end
          dropViewSort.pushObject(dragView);
          //update the sortable container view of the drag ele to the drop's container
          dragView.set("sortableView", dropViewSort);

          //reset the change boolean
          dragView.set("change", false);
          //stop propagation if it was processed
          event.stopPropagation();
        }
      }
    }
  },
});

return {
  SortablePlaceholderMixin : SortablePlaceholderMixin,
};

});
