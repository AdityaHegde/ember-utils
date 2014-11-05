module.exports = {
  dist: {
    options : {
      mangle : {
        except: ["jQuery", "Ember", "Em", "DS"],
      },
    },
    files: {
      "dist/ember-utils-core.min.js": "dist/ember-utils-core.js",
      "dist/ember-utils.min.js": "dist/ember-utils.js",
      //"build/templates.min.js" : "build/templates.js",
      //"dist/demo-app.min.js" : "dist/demo-app.js",
    }
  }
};

