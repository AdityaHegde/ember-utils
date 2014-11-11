module.exports = {
  compile : {
    options : {
      baseUrl : "src/js",
      dir : "build",
      mainConfigFile : "src/js/config.js",

      fileExclusionRegExp : /^(?:\.|_)/,
      findNestedDependencies : true,
      skipDirOptimize : true,
      removeCombined : true,
      optimize : "none",
      wrap: {
        startFile: ["wrap/start.frag", "wrap/almond.js"],
        endFile: "wrap/end.frag"
      },

      modules : [
        {
          name : "ember-utils",
          exclude : [
            "jquery",
            "handlebars",
            "ember",
          ],
          insertRequire : ["ember-utils"],
        },
        {
          name : "demo/demo",
          insertRequire : ["demo/demo"],
        },
      ],
    },
  },
};
