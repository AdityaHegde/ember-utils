module.exports = {
  compile : {
    options : {
      baseUrl : "src/js",
      dir : "build",
      mainConfigFile : "src/js/config.js",
      modules : [
        {
          name : "core/main",
          out : "build/core.js",
          exclude : [
            "jquery",
            "handlebars",
            "ember",
          ],
        },
        {
          name : "main",
          out : "build/ember-utils.js",
          exclude : [
            "jquery",
            "handlebars",
            "ember",
          ],
        },
      ],
      fileExclusionRegExp : /^(?:\.|_)/,
      skipDirOptimize : true,
      removeCombined : true,
      optimize : "none",
      wrap: true,
    },
  },
};
