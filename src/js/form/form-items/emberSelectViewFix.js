define([
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

Ember.Select.reopen({
  _selectionDidChangeSingle: function() {
    //overriding this to fix a problem where ember was checking the actual selected object (ember object with val and label) and not the selected value
    var el = this.get('element');
    if (!el) { return; }

    var content = this.get('content'),
        selection = this.get('selection'),
        selectionIndex = content && content.findBy && selection ? content.indexOf(content.findBy("val", selection.val)) : -1,
        prompt = this.get('prompt');

    if (prompt) { selectionIndex += 1; }
    if (el) { el.selectedIndex = selectionIndex; }
  },
});

return {
  Select : Ember.Select,
};

});
