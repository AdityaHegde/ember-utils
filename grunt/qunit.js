module.exports = {
  options : {
    coverage : {
      disposeCollector : true,
      src : ["src/js/core/*.js"],
      instrumentedFiles : "tmp",
      lcovReport : "coverage",
    },
  },

  all : [
    "unit_test.html",
  ],
};
