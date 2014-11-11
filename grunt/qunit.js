module.exports = {
  options : {
    coverage : {
      disposeCollector : true,
      src : ["src/js/array-modifier/*.js", "src/js/column-data/*.js"],
      instrumentedFiles : "tmp",
      lcovReport : "coverage",
    },
  },

  all : [
    "unit_test.html",
  ],
};
