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
