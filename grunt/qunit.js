module.exports = {
  options : {
    coverage : {
      disposeCollector : true,
      //src : ["src/js/array-modifier/*.js", "src/js/column-data/*.js", "src/js/crud-adapter/*.js"],
      src : ["src/js/*/*.js", "src/js/*/*/*.js", "!src/js/lib/*.js"],
      instrumentedFiles : "tmp",
      lcovReport : "coverage",
    },
  },

  all : [
    "unit_test.html",
  ],
};
