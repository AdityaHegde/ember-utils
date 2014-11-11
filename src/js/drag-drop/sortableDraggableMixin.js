define([
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
  "./draggableMixin",
  "./droppableMixin",
], function(Ember, Utils, DragDropGlobals, DraggableMixin, DroppableMixin) {

/**
 * Draggable mixin for the sortable component.
 *
 * @class DragDrop.SortableDraggableMixin
 */
var SortableDraggableMixin = Ember.Mixin.create(DraggableMixin.DraggableMixin, DroppableMixin.DroppableMixin, {
  init : function() {
    this._super();
    this.set("lastXY", [0, 0]);
  },
  classNames : ['dragdrop-sortable-element'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortableDragableClassNames'),
  sortEleId : function() {
    return this.get("record."+this.get("columnDataGroup.sort.sortEleIdColumnData.key"));
  }.property("view.columnData.key"),
  sortableView : null,
  groupId : 0,
  hasElements : false,
  curGrpId : function() {
    return this.get("groupId");
  }.property('view.groupId', 'view.columnDataGroup.sort.sameLevel'),
  stateData : null,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  isPlaceholder : false,
  move : false,
  calcAppendPosition : function(xy) {
    var lxy = this.get("lastXY"),
        dx = xy[0] - lxy[0], adx = Math.abs(dx),
        dy = xy[1] - lxy[1], ady = Math.abs(dy),
        rd = dx, ard = adx;
    if(ady > adx) {
      rd = dy;
      ard = ady;
    }
    if(ard > DragDropGlobals.MOVE_THRESHOLD) {
      if(rd < 0) {
        this.set("appendNext", false);
      }
      else {
        this.set("appendNext", true);
      }
      this.set("lastXY", xy);
      this.set("change", true);
    }
    else {
      this.set("change", false);
    }
  },
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
    if(dropView.get("sortableView") && dragView.get("sortableView")) {
      var
      columnDataGroup = this.get("columnDataGroup"),
      sortEleIdKey = columnDataGroup.get("sort.sortEleIdColumnData.key"),

      //sortable container and it's element id of the element dropped on
      dropViewSort = dropView.get("sortableView"),
      dropViewSortId = dropViewSort.get("elementId"),
      //siblings of the element dropped on
      dropViewEles = dropViewSort.get("sortEleChildren"),
      //sort id of the element dropped on
      dropViewSortEleId = dropView.get("sortEleId"),
      //index of the element dropped on in the array of siblings
      dropViewIdx = dropViewEles.indexOf(dropViewEles.findBy( sortEleIdKey, dropViewSortEleId )),

      //sort id of the element dragged
      dragViewSortEleId = dragView.get("sortEleId"),
      //sortable container and it's element id of the element dragged
      dragViewSort = dragView.get("sortableView"),
      dragViewSortId = dragViewSort.get("elementId"),
      //siblings of the element dragged
      dragViewEles = dragViewSort.get("sortEleChildren"),
      //index of the element dragged in the array of siblings
      dragViewIdx = dragViewEles.indexOf(dragViewEles.findBy( sortEleIdKey, dragViewSortEleId )),
      dragViewData = dragViewEles[dragViewIdx];

      dragView.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
      if(dropViewSort.get("effH") === dragViewSort.get("effH")) {
        //allow sortable on views with same hierarchy

        if(dragView.get("change")) {
          //process only if there is a change in the mouse position

          if(dropViewSortId === dragViewSortId) {
            //if both eles are from the same sortable container (siblings)

            if(dropViewSortEleId !== dragViewSortEleId && dropViewIdx !== dragViewIdx) {
              //process only if the eles are not the same
              //return;

              if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
                //if there only 1 element and its a placeholder, remove it
                dropViewSort.removeAt(0);
              }

              //remove the dragged ele from its siblings array
              dropViewEles.removeAt(dragViewIdx);
              //remove the dragged ele's view from sortable container
              dropViewSort.removeAt(dragViewIdx);
              //if need to append after (calculated based on mouse position difference), increment dropViewIdx
              if(dragView.get("appendNext")) dropViewIdx++;
              //correct dropViewIdx to dropViewEles.length if needed
              if(dropViewIdx > dropViewEles.length) dropViewIdx = dropViewEles.length;
              else if(dropViewIdx === -1) dropViewIdx = 0;
              //insert the dragViewData to siblings array at the new index
              dropViewEles.insertAt(dropViewIdx, dragViewData);
              //insert the dragView to sortable container at the new index
              dropViewSort.insertAt(dropViewIdx, dragView);

              //reset the change boolean
              dragView.set("change", false);
              //stop propagation if it was processed
              event.stopPropagation();
            }
          }
          else {
            if(dropViewEles.indexOf(dragViewData) === -1 && !Utils.deepSearchArray(dragViewData, dropViewSortEleId, sortEleIdKey, columnDataGroup.get("sort.sortEleChildrenColumnData.key"))) {
              //process only if dropViewEles doesnt have dragViewData and dragViewData doesnt have dropViewSortEleId somewhere at a deeper level
              //this is to prevent a parent being dropped on its child
              //return;

              if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
                //if there only 1 element and its a placeholder, remove it
                dropViewSort.removeAt(0);
              }

              //remove the dragged ele from its siblings array
              dragViewEles.removeAt(dragViewIdx);
              //remove the dragged ele's view from sortable container
              dragViewSort.removeAt(dragViewIdx);
              //if need to append after (calculated based on mouse position difference), increment dropViewIdx
              if(dragView.get("appendNext")) dropViewIdx++;
              //correct dropViewIdx to dropViewEles.length if needed
              if(dropViewIdx > dropViewEles.length) dropViewIdx = dropViewEles.length;
              else if(dropViewIdx === -1) dropViewIdx = 0;
              //insert the dragViewData to siblings array at the new index
              dropViewEles.insertAt(dropViewIdx, dragViewData);
              //update the sortable container view of the drag ele to the drop's container
              dragView.set("sortableView", dropViewSort);
              //insert the dragView to sortable container at the new index
              dropViewSort.insertAt(dropViewIdx, dragView);
              if(dragViewSort.get("length") === 0) {
                //if the drag ele's sortable container is empty, leave a placeholder in it's place
                dragViewSort.pushObject(columnDataGroup.get("sort.placeholderClass").create({
                  sortableView : dragViewSort,
                  hierarchy : dragView.get("hierarchy"),
                  groupId : dragView.get("stateData.grpId"),
                  columnDataGroup : columnDataGroup,
                }));
              }

              //reset the change boolean
              dragView.set("change", false);
              //stop propagation if it was processed
              event.stopPropagation();
            }
          }
        }
      }
    }
  },
  change : false,
  appendNext : false,
  lastXY : null,
});

return {
  SortableDraggableMixin : SortableDraggableMixin,
};

});
