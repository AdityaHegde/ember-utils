module.exports = {
  dist : {
    src : ["src/js/main/ember-utils.js", "src/js/main/async-que.js", "src/js/main/lazy-display.js", "src/js/main/alerts.js", "src/js/main/alerts.js", "src/js/main/panels.js", "src/js/main/form.js", "src/js/main/collapsibles.js", "src/js/main/listgroups.js", "src/js/main/tooltips.js", "src/js/main/carousel.js", "src/js/main/dragdrop.js", "src/js/main/array-modifier.js", "src/js/main/column-data.js", "src/js/main/progress-bars.js", "src/js/main/fileupload.js", "src/js/main/modal.js", "src/js/main/crud-adapter.js", "src/js/main/model-wrapper.js", "src/js/main/popover.js"],
    dest : "dist/ember-utils.js",
  },
  test : {
    src : ["test/mockapis.js", "test/test-utils.js", "test/test-init.js", "test/async-que-unit-test.js", "test/array-modifier-unit-test.js", "test/columndata-unit-test.js", "test/form-unit-test.js", "test/modal-unit-test.js", "test/crud-adaptor-unit-test.js"],
    dest : "test/tests-merged.js",
  },
};
