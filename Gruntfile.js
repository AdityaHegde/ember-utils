module.exports = function(grunt) {
  require('time-grunt')(grunt);
  require('load-grunt-config')(grunt, {
    loadGruntTasks : false,
    jitGrunt : {
      staticMappings : {
        qunit : "grunt-qunit-istanbul",
      },
    },
  });
};
