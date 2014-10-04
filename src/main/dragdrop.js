Sortable = Ember.Namespace.create();
//temp solution for chrome's buggy event.dataTransfer, v31.x.x
Sortable.VIEW_ID = "";
Sortable.MOVE_THRESHOLD = 2;
Sortable.DisplayElement = Ember.View.extend({
  Name : null,
  template : Ember.Handlebars.compile('{{view.Name}}'),
  tagName : '',
});
Sortable.Dragable = Ember.ContainerView.extend({
  init : function() {
    this._super();
    var Name = this.get("Name"), data = this.get("data");
    if(!data.Children) {
      this.pushObject(Sortable.DisplayElement.create({Name : Name}));
    }
    this.set("lastXY", [0, 0]);
  },
  attributeBindings: 'draggable',
  classNames : ['sortable-dragable'],
  classNameBindings : ['effH'],
  draggable: 'true',
  data : null,
  Name : Ember.computed.oneWay('data.Name'),
  sortable : null,
  tagName : 'li',
  groupId : 0,
  hasElements : false,
  curGrpId : function() {
    return this.get("groupId");
  }.property('groupId', 'data.sameLevel'),
  stateData : null,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  calcAppendPosition : function(xy) {
    var lxy = this.get("lastXY"),
        dx = xy[0] - lxy[0], adx = Math.abs(dx),
        dy = xy[1] - lxy[1], ady = Math.abs(dy),
        rd = dx, ard = adx;
    if(ady > adx) {
      rd = dy;
      ard = ady;
    }
    if(ard > Sortable.MOVE_THRESHOLD) {
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
  dragOver: function(event) {
    //console.log("view Id : "+Sortable.VIEW_ID);
    var dataTransfer = event.originalEvent.dataTransfer,
        thisSort = this.get("sortable"), thisSortId = thisSort.get("elementId"),
        thiseles = thisSort.get("Children"), thisName = this.get("Name"), thisidx = thiseles.indexOf(thiseles.findBy('Name', thisName)),
        thatId = dataTransfer.getData('ViewId') || Sortable.VIEW_ID, that = Ember.View.views[thatId],
        thatName = that.get("Name"), thatSort = that.get("sortable"), thatSortId = thatSort.get("elementId"),
        thateles = thatSort.get("Children"), thatidx = thateles.indexOf(thateles.findBy('Name', thatName)),
        thatdata = thateles[thatidx];
    that.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
    if(thisSort.get("effH") === thatSort.get("effH")) {
      if(that.get("change")) {
        if(thisSortId === thatSortId) {
          if(thisName !== thatName && thisidx !== thatidx) {
            //console.log("**1**");
            if(thisSort._childViews.length == 1 && thisSort._childViews[0] instanceof Sortable.Placeholder) {
              thisSort.removeAt(0);
              //console.log("remove placeholder");
            }
            //console.log("thatidx "+thatidx);
            thiseles.splice(thatidx, 1);
            //console.log("thatidx inserted "+thatidx);
            thisSort.removeAt(thatidx);
            //console.log("thatidx view "+thatidx);
            if(that.get("appendNext")) thisidx++;
            if(thisidx > thiseles.length) thisidx = thiseles.length;
            else if(thisidx === -1) thisidx = 0;
            //console.log("thisidx "+thisidx);
            thiseles.splice(thisidx, 0, thatdata);
            //console.log("thisidx inserted "+thisidx+".."+thisSort._childViews.length);
            thisSort.insertAt(thisidx, that);
            //console.log("thisidx view "+thisidx+".."+thisSort._childViews.length);
          }
        }
        else {
          if(thiseles.indexOf(thatName) === -1 && !Utils.deepSearchArray(thatdata, thisName, 'Name', 'Children')) {
            //console.log("**2**");
            if(thisSort._childViews.length == 1 && thisSort._childViews[0] instanceof Sortable.Placeholder) {
              thisSort.removeAt(0);
              //console.log("remove placeholder");
            }
            //console.log("thatidx "+thatidx);
            thateles.splice(thatidx, 1);
            //console.log("thatidx inserted "+thatidx);
            thatSort.removeAt(thatidx);
            //console.log("thatidx view "+thatidx);
            if(that.get("appendNext")) thisidx++;
            if(thisidx > thiseles.length) thisidx = thiseles.length;
            else if(thisidx === -1) thisidx = 0;
            //console.log("thisidx "+thisidx);
            thiseles.splice(thisidx, 0, thatdata);
            //console.log("thisidx inserted "+thisidx+".."+thisSort._childViews.length);
            that.set("sortable", thisSort);
            thisSort.insertAt(thisidx, that);
            //console.log("thisidx view "+thisidx+".."+thisSort._childViews.length);
            //console.log(thatidx+".."+thisidx+".."+thatSort._childViews.length);
            if(thatSort._childViews.length == 0) {
              thatSort.pushObject(Sortable.Placeholder.create({
                sortable : thatSort,
                hierarchy : that.get("hierarchy"),
                groupId : that.get("stateData").grpId,
              }));
              //console.log("add placeholder");
            }
          }
        }
        that.set("change", false);
      }
      event.stopPropagation();
    }
  },
  dragStart: function(event) {
    var dataTransfer = event.originalEvent.dataTransfer, viewid = this.get("elementId");
    dataTransfer.setData('ViewId', viewid);
    dataTransfer.dropEffect = 'move';
    Sortable.VIEW_ID = viewid;
    event.stopPropagation();
  },
  drop : function(event) {
    event.preventDefault();
  },
  change : false,
  appendNext : false,
  lastXY : null,
  tagName : 'li',
});
Sortable.Droppable = Ember.ContainerView.extend({
  classNames : ['sortable-droppable'],
  Children : [],
  parentData : null,
  elesIsEmpty : Ember.computed.empty('Children.@each'),
  groupId : 0,
  hierarchy : "",
  stateData : null,
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragEnter: function(event) {
    event.preventDefault();
  },
  dragOver : function(event) {
    event.preventDefault();
  },
  drop: function(event) {
    event.preventDefault();
  },
  tagName : 'ul',
});
Sortable.Placeholder = Ember.ContainerView.extend({
  init : function() {
    this._super();
    this.pushObject(Ember.View.create({
      template : Ember.Handlebars.compile('Placeholder'),
    }));
  },

  classNames : ['sortable-placeholder'],
  sortable : null,
  groupId : 0,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragEnter: function(event) {
    event.preventDefault();
  },
  dragOver : function(event) {
    event.preventDefault();
    var dataTransfer = event.originalEvent.dataTransfer,
        thisSort = this.get("sortable"), thisSortId = thisSort.get("elementId"),
        thiseles = thisSort.get("Children"), thisName = this.get("Name"), thisidx = thiseles.indexOf(thiseles.findBy('Name', thisName)),
        thatId = dataTransfer.getData('ViewId') || Sortable.VIEW_ID, that = Ember.View.views[thatId],
        thatName = that.get("Name"), thatSort = that.get("sortable"), thatSortId = thatSort.get("elementId"),
        thateles = thatSort.get("Children"), thatidx = thateles.indexOf(thateles.findBy('Name', thatName)),
        thatdata = thateles[thatidx];
    //console.log("Name : "+thisName+".."+thatName);
    that.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
    if(thisSort.get("effH") === thatSort.get("effH")) {
      if(that.get("change")) {
        if(thisSort._childViews.length == 1 && thisSort._childViews[0] instanceof Sortable.Placeholder) {
          thisSort.removeAt(0);
          //console.log("remove placeholder");
        }
        thateles.splice(thatidx, 1);
        thatSort.removeAt(thatidx);
        thiseles.push(thatdata);
        that.set("sortable", thisSort);
        thisSort.pushObject(that);
      }
      event.stopPropagation();
    }
  },
  drop: function(event) {
    event.preventDefault();
  },
  //tagName : 'li',
});
