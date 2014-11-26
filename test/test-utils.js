define([], function() {

window.checkTableRowElements = function(column, expected) {
  var rowEles = [];
  for(var i = 1; i <= expected.length; i++) {
    rowEles.push(Ember.Object.create({
      text : $(getCellByColumn(column, i)).text(),
    }));
  }
  checkElements(rowEles, "text", expected, 1);
}

window.closeAlert = function(alert) {
  alert.set("switchAlert", false);
  var timer = alert.get("windowTimer");
  alert.set("windowTimer", null);
  Ember.run.cancel(timer);
}

window.getColumnSelector = function(column, inputType) {
  return ".ember-view[data-column-name='"+column+"'] "+inputType;
}

window.getCellByColumn = function(column, row, isHead) {
  return (isHead ? "th" : getRowByPos(row)) + ".ember-view[data-column-name='"+column+"']";
}

window.getRowByPos = function(row) {
  return ".main-table tbody tr:nth-of-type("+row+") td";
}

});
