ListGroup = Ember.Namespace.create();

ListGroup.ListItemView = Ember.View.extend({
  init : function() {
    this._super();
    var toBindProperties = this.get("toBindProperties");
    toBindProperties.forEach(function(item) {
      Ember.oneWay(this, item.toProp, "data."+item.fromProp);
    }, this);
  },

  toBindProperties : [],
  data : null,
});

ListGroup.ListGroup = Ember.View.extend({
  classNames : ['list-group'],

  objects : [],
  listgroupTemplate : "",

  template : Ember.Handlebars.compile('' +
    '{{#each view.objects}}' +
      '{{view ListGroup.ListGroupItem this templateName=view.listgroupTemplate}}' +
    '{{else}}' +
      'No {{name}} found' +
    '{{/each}}'),
});
ListGroup.ListGroupItem = Ember.View.extend({
  classNames : ['list-group-item'],

  name : "",
  desc : "",
  rightText : "",
  active : false,
  hasActive : false,
  layout : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '<span class="group-item-name">{{view.name}}</span>' +
      '{{#if view.hasActive}}' +
        '{{view Views.ActiveLabel value=view.active}}' +
      '{{/if}}' +
      '<div class="pull-right text-right">' +
        '{{yield}}' +
      '</div>' +
    '</h4>' +
    '<p class="list-group-item-text">{{view.desc}}</p>'),

  template : Ember.Handlebars.compile('{{view.rightText}}'),
});
ListGroup.ListGroupItemView = ListGroup.ListItemView.extend({
  classNames : ['list-group-item'],

  name : "",
  desc : "",
  rightText : "",
  active : false,
  hasActive : false,
  layout : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '<span class="group-item-name">{{view.name}}</span>' +
      '{{#if view.hasActive}}' +
        '{{view Views.ActiveLabel value=view.active}}' +
      '{{/if}}' +
      '<div class="pull-right text-right">' +
        '{{yield}}' +
      '</div>' +
    '</h4>' +
    '<p class="list-group-item-text">{{view.desc}}</p>'),

  template : Ember.Handlebars.compile('{{view.rightText}}'),
});

ListGroup.ListGroupView = Ember.ContainerView.extend({
  init : function() {
    this._super();
    this.addBeforeObserver('view.array', this, 'arrayWillChange', this);
    this.addObserver('view.array', this, 'arrayDidChange', this);
    var array = this.get("array");
    if(array && array.length > 0) {
      this.createViews(array);
    }
  },

  array : null,
  toBindProperties : [],
  arrayArrayDidChange1 : function() {
    console.log(1);
  }.observes('view.array.@each'),

  arrayWillChange : function() {
    var array = this.get("array");
    if(array) {
      array.removeArrayObserver(this);
    }
  },

  arrayDidChnage : function() {
    var array = this.get("array");
    if(array) {
      array.addArrayObserver(this, {
        willChange : this.arrayArrayWillChange,
        didChange : this.arrayArrayDidChange,
      });
    }
  },

  groupItemView : ListGroup.ListGroupItemView,

  createViews : function(array) {
    var groupItemView = this.get("groupItemView");
    this.groupItemView = groupItemView;
    array.forEach(function(item) {
      var view = this.groupItemView.create({ data : item, toBindProperties : this.get("toBindProperties") });
      item.listGroupItemView = view;
      this.addObject(view);
    }, this);
  },

  removeViews : function(array) {
    array.forEach(function(item, idx, array) {
      this.removeObject(item.listGroupItemView);
    }, this);
  },

  arrayArrayWillChange : function(array, idx, removedCount, addedCount) {
    var removedObjects = array.slice(idx, idx + removedCount);
    if(removedObjects || removedObjects.length > 0) {
      this.removeViews(removedObjects);
    }
  },

  arrayArrayDidChange : function(array, idx, removedCount, addedCount) {
    var addedObjects = array.splice(idx, idx + addedCount);
    if(addedObjects || addedObjects.length > 0) {
      this.createViews(addedObjects);
    }
  },
});
