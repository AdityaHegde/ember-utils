function checkElements(arrayController, key, expected, exactCheck) {
  equal(arrayController.get("length"), expected.length, expected.length+" elements are there");
  for(var i = 0; i < expected.length; i++) {
    if(exactCheck) {
      var arrayObj = arrayController.objectAt(i);
      equal(arrayObj.get(key), expected[i], "element at index "+i+" has "+key+" = "+expected[i]);
    }
    else {
      var found = arrayController.findBy(key, expected[i]);
      ok(found, "element with "+key+" = "+expected[i]+" is present in arrangedContent");
    }
  }
}

function checkTableRowElements(column, expected) {
  var rowEles = [];
  for(var i = 1; i <= expected.length; i++) {
    rowEles.push(Ember.Object.create({
      text : $(getCellByColumn(column, i)).text(),
    }));
  }
  checkElements(rowEles, "text", expected, 1);
}

function closeAlert(alert) {
  alert.set("switchAlert", false);
  var timer = alert.get("windowTimer");
  alert.set("windowTimer", null);
  Ember.run.cancel(timer);
}

function getColumnSelector(column, inputType) {
  return ".ember-view[data-column-name='"+column+"'] "+inputType;
}

function getCellByColumn(column, row, isHead) {
  return (isHead ? "th" : getRowByPos(row)) + ".ember-view[data-column-name='"+column+"']";
}

function getRowByPos(row) {
  return ".main-table tbody tr:nth-of-type("+row+") td";
}

function getCurDate(offset) {
  var d = new Date();
  if(offset) {
    d = new Date(d.getTime() + offset*1000);
  }
  return d.toLocaleDateString()+" "+d.toTimeString();
};

function setupStoreAndReturnIt(container) {
  if (DS._setupContainer) {
    DS._setupContainer(container);
  } else {
    container.register('store:main', DS.Store);
  }

  container.register('adapter:application', CrudAdapter.ApplicationAdapter);
  container.register('serializer:application', CrudAdapter.ApplicationSerializer);

  return container.lookup('store:main');
}

function setupAppForTesting(app, container) {
  Ember.run(function() {
    app.setupEventDispatcher();
    app.resolve(app);
    container.register('view:select', Ember.Select);
    container.register('view:checkbox', Ember.Checkbox);
  });
}
