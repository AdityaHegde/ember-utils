(function () {

/**
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define('lib/ember-utils-core',['jquery', 'ember'], factory);
  } else {
    // Browser globals.
    root.Utils = factory(root.$);
  }
}(this, function($) {
/**
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("lib/almond.js", function(){});

define('hasMany',[
  "ember",
], function() {

/**
 * Creates a computed property for an array that when set with array of native js object will return an array of instances of a class.
 *
 * The class is decided by the 1st param 'modelClass'. If it is not a class but an object and 'modelClassKey', the 2nd parameter is a string,
 * then the 'modelClassKey' in the object is used as a key in 'modelClass' the object to get the class.
 * 'defaultKey' the 3rd parameter is used as a default if object[modelClassKey] is not present.
 *
 * @method hasMany
 * @for Utils
 * @static
 * @param {Class|Object} modelClass
 * @param {String} [modelClassKey]
 * @param {String} [defaultKey]
 * @returns {Instance}
 */
function hasMany(modelClass, modelClassKey, defaultKey) {
  modelClass = modelClass || Ember.Object;
  var hasInheritance = Ember.typeOf(modelClass) !== "class";

  return Ember.computed(function(key, newval) {
    if(Ember.typeOf(modelClass) === 'string') {
      modelClass = Ember.get(modelClass);
      hasInheritance = Ember.typeOf(modelClass) !== "class";
    }
    if(arguments.length > 1) {
      if(newval && newval.length) {
        newval.beginPropertyChanges();
        for(var i = 0; i < newval.length; i++) {
          var obj = newval[i], classObj = modelClass;
          if(hasInheritance) classObj = modelClass[Ember.isEmpty(obj[modelClassKey]) ? defaultKey : obj[modelClassKey]];
          if(!(obj instanceof classObj)) {
            obj = classObj.create(obj);
            obj.set("parentObj", this);
          }
          newval.splice(i, 1, obj);
        }
        newval.endPropertyChanges();
      }
      return newval;
    }
  });
};

return {
  hasMany : hasMany,
};


});

define('belongsTo',[
  "ember",
], function() {

/**
 * Creates a computed property for an object that when set with native js object will return an instances of a class.
 *
 * The class is decided by the 1st param 'modelClass'. If it is not a class but an object and 'modelClassKey', the 2nd parameter is a string,
 * then the 'modelClassKey' in the object is used as a key in 'modelClass' the object to get the class.
 * 'defaultKey' the 3rd parameter is used as a default if object[modelClassKey] is not present.
 *
 * Optionally can create the instance with mixin. A single mixin can be passed or a map of mixins as 4th parameter with key extracted from object using mixinKey (5th parameter) can be passed.
 * 'defaultMixin' (6th parameter) is used when object[mixinKey] is not present.
 *
 * @method belongsTo
 * @for Utils
 * @static
 * @param {Class|Object} modelClass
 * @param {String} [modelClassKey]
 * @param {String} [defaultKey]
 * @param {Mixin|Object} [mixin]
 * @param {String} [mixinKey]
 * @param {String} [defaultMixin]
 * @returns {Instance}
 */
function belongsTo(modelClass, modelClassKey, defaultKey, mixin, mixinKey, defaultMixin) {
  modelClass = modelClass || Ember.Object;
  var hasInheritance = Ember.typeOf(modelClass) !== "class",
      hasMixin = mixin instanceof Ember.Mixin;
  return Ember.computed(function(key, newval) {
    if(Ember.typeOf(modelClass) === 'string') {
      modelClass = Ember.get(modelClass);
      hasInheritance = Ember.typeOf(modelClass) !== "class";
    }
    if(Ember.typeOf(mixin) === 'string') {
      mixin = Ember.get(mixin);
      hasMixin = mixin instanceof Ember.Mixin;
    }
    if(arguments.length > 1) {
      if(newval) {
        var classObj = modelClass;
        if(hasInheritance) classObj = modelClass[Ember.isEmpty(newval[modelClassKey]) ? defaultKey : newval[modelClassKey]];
        if(!(newval instanceof classObj)) {
          if(hasMixin) {
            newval = classObj.createWithMixins(newval, mixinMap[newval[mixinKey] || defaultMixin]);
          }
          else {
            newval = classObj.create(newval);
          }
          newval.set("parentObj", this);
        }
      }
      return newval;
    }
  });
};

return {
  belongsTo : belongsTo,
}


});

define('hierarchy',[
  "ember",
], function() {


function getMetaFromHierarchy(hasManyHierarchy) {
  var meta = {};
  for(var i = 0; i < hasManyHierarchy.length; i++) {
    for(var c in hasManyHierarchy[i].classes) {
      if(hasManyHierarchy[i].classes.hasOwnProperty(c)) {
        meta[c] = {
          level : i,
        };
      }
    }
  }
  hasManyHierarchy.hierarchyMeta = meta;
  return meta;
}

/**
 * Register a hierarchy. This will setup the meta of the hierarchy.
 *
 * @method registerHierarchy
 * @for Utils
 * @static
 * @param {Object} hierarchy
 */
function registerHierarchy(hierarchy) {
  hierarchy.hierarchyMeta = getMetaFromHierarchy(hierarchy);
};

/**
 * Add an entry to the hierarchy. It takes care of updating meta also.
 *
 * @method addToHierarchy
 * @static
 * @param {Object} hierarchy
 * @param {String} type
 * @param {Class} classObj
 * @param {Number} level
 */
function addToHierarchy(hierarchy, type, classObj, level) {
  var meta = hierarchy.hierarchyMeta;
  hierarchy[level].classes[type] = classObj;
  meta[type] = {
    level : level,
  };
};

function getObjForHierarchyLevel(obj, meta, hierarchy, level) {
  var param = {};
  param[hierarchy[level].childrenKey] = Ember.typeOf(obj) === "array" ? obj : [obj];
  return hierarchy[level].classes[hierarchy[level].base].create(param);
}

function getObjTillLevel(obj, meta, hierarchy, fromLevel, toLevel) {
  for(var i = fromLevel - 1; i >= toLevel; i--) {
    obj = getObjForHierarchyLevel(obj, meta, hierarchy, i);
  }
  return obj;
}

/**
 * Creates a computed property which creates a class for every element in the set array based on hierarchy.
 * The objects in the array can be of any level at or below the current level. An instance with the basic class is automatically wrapped around the objects at lower level.
 *
 * @method hasManyWithHierarchy
 * @static
 * @param {Object} hasManyHierarchy Assumed to be already initialized by calling 'registerHierarchy'.
 * @param {Number} level Level of the computed property.
 * @param {String} key Key used to get the key used in retrieving the class object in the classes map.
 * @returns {Instance}
 */
function hasManyWithHierarchy(hasManyHierarchy, level, hkey) {
  var meta;
  if(Ember.typeOf(hasManyHierarchy) === "array") {
    meta = hasManyHierarchy.hierarchyMeta;
  }
  return Ember.computed(function(key, newval) {
    if(arguments.length > 1) {
      if(Ember.typeOf(hasManyHierarchy) === "string") {
        hasManyHierarchy = Ember.get(hasManyHierarchy);
        meta = hasManyHierarchy.hierarchyMeta;
      }
      if(newval) {
        //curLevel, curLevelArray
        var cl = -1, cla = [];
        for(var i = 0; i < newval.length; i++) {
          var obj = newval[i], _obj = {},
              type = Ember.typeOf(obj) === "array" ? obj[0] : obj[hkey],
              objMeta = meta[type];
          if(Ember.typeOf(obj) !== "instance") {
            if(objMeta && objMeta.level >= level) {
              if(Ember.typeOf(obj) === "array") {
                for(var j = 0; j < hasManyHierarchy[objMeta.level].keysInArray.length; j++) {
                  if(j < obj.length) {
                    _obj[hasManyHierarchy[objMeta.level].keysInArray[j]] = obj[j];
                  }
                }
              }
              else {
                _obj = obj;
              }
              _obj = hasManyHierarchy[objMeta.level].classes[type].create(_obj);
              if(cl === -1 || cl === objMeta.level) {
                cla.push(_obj);
                cl = objMeta.level;
              }
              else if(cl < objMeta.level) {
                cla.push(getObjTillLevel(_obj, meta, hasManyHierarchy, objMeta.level, cl));
              }
              else {
                var curObj = getObjForHierarchyLevel(cla, meta, hasManyHierarchy, objMeta.level);
                cl = objMeta.level;
                cla = [curObj, _obj];
              }
            }
          }
          else {
            cla.push(obj);
          }
        }
        if(cl === level || cl === -1) {
          newval = cla;
        }
        else {
          newval = [getObjTillLevel(cla, meta, hasManyHierarchy, cl, level)];
        }
      }
      return newval;
    }
  });
};


return {
  registerHierarchy : registerHierarchy,
  addToHierarchy : addToHierarchy,
  hasManyWithHierarchy : hasManyWithHierarchy,
};

});

define('objectWithArrayMixin',[
  "ember",
], function() {


/**
 * A mixin to add observers to array properties.
 *
 * @class Utils.ObjectWithArrayMixin
 * @static
 */
var ObjectWithArrayMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    Ember.set(this, "arrayProps", this.get("arrayProps") || []);
    this.addArrayObserverToProp("arrayProps");
    Ember.set(this, "arrayProps.propKey", "arrayProps");
    this.arrayPropsWasAdded(this.get("arrayProps") || []);
  },

  addBeforeObserverToProp : function(propKey) {
    Ember.addBeforeObserver(this, propKey, this, "propWillChange");
  },

  removeBeforeObserverFromProp : function(propKey) {
    Ember.removeBeforeObserver(this, propKey, this, "propWillChange");
  },

  addObserverToProp : function(propKey) {
    Ember.addObserver(this, propKey, this, "propDidChange");
  },

  removeObserverFromProp : function(propKey) {
    Ember.removeObserver(this, propKey, this, "propDidChange");
  },

  propWillChange : function(obj, key) {
    this.removeArrayObserverFromProp(key);
    var prop = this.get(key);
    if(prop && prop.objectsAt) {
      var idxs = Utils.getArrayFromRange(0, prop.get("length"));
      this[key+"WillBeDeleted"](prop.objectsAt(idxs), idxs, true);
    }
  },

  propDidChange : function(obj, key) {
    this.addArrayObserverToProp(key);
    var prop = this.get(key);
    if(prop) {
      this.propArrayNotifyChange(prop, key);
    }
  },

  propArrayNotifyChange : function(prop, key) {
    if(prop.objectsAt) {
      var idxs = Utils.getArrayFromRange(0, prop.get("length"));
      this[key+"WasAdded"](prop.objectsAt(idxs), idxs, true);
    }
  },

  addArrayObserverToProp : function(propKey) {
    var prop = this.get(propKey);
    if(prop && prop.addArrayObserver) {
      prop.set("propKey", propKey);
      prop.addArrayObserver(this, {
        willChange : this.propArrayWillChange,
        didChange : this.propArrayDidChange,
      });
    }
  },

  removeArrayObserverFromProp : function(propKey) {
    var prop = this.get(propKey);
    if(prop && prop.removeArrayObserver) {
      prop.removeArrayObserver(this, {
        willChange : this.propArrayWillChange,
        didChange : this.propArrayDidChange,
      });
    }
  },

  propArrayWillChange : function(array, idx, removedCount, addedCount) {
    if((array.content || array.length) && array.get("length") > 0) {
      var propKey = array.get("propKey"), idxs = Utils.getArrayFromRange(idx, idx + removedCount);
      this[propKey+"WillBeDeleted"](array.objectsAt(idxs), idxs);
    }
  },
  propArrayDidChange : function(array, idx, removedCount, addedCount) {
    if((array.content || array.length) && array.get("length") > 0) {
      var propKey = array.get("propKey"),
          addedIdxs = [], removedObjs = [],
          rc = 0;
      for(var i = idx; i < idx + addedCount; i++) {
        var obj = array.objectAt(i);
        if(!this[propKey+"CanAdd"](obj, i)) {
          removedObjs.push(obj);
          rc++;
        }
        else {
          addedIdxs.push(i);
        }
      }
      if(addedIdxs.length > 0) {
        this[propKey+"WasAdded"](array.objectsAt(addedIdxs), addedIdxs);
      }
      if(removedObjs.length > 0) {
        array.removeObjects(removedObjs);
      }
    }
  },

  /**
   * Method called just before array elements will be deleted. This is a fallback method. A method with name <propKey>WillBeDeleted can be added to handle for 'propKey' seperately.
   *
   * @method propWillBeDeleted
   * @param {Array} eles The elements that will be deleted.
   * @param {Array} idxs The indices of the elements that will be deleted.
   */
  propWillBeDeleted : function(eles, idxs) {
  },
  /**
   * Method called when deciding whether to add an ele or not. This is a fallback method. A method with name <propKey>CanAdd can be added to handle for 'propKey' seperately.
   *
   * @method propCanAdd
   * @param {Object|Instance} ele The element that can be added or not.
   * @param {Number} idx The indice of the element that can be added or not.
   * @returns {Boolean}
   */
  propCanAdd : function(ele, idx) {
    return true;
  },
  /**
   * Method called after array elements are added. This is a fallback method. A method with name <propKey>WasAdded can be added to handle for 'propKey' seperately.
   *
   * @method propWasAdded
   * @param {Array} eles The elements that are added.
   * @param {Array} idxs The indices of the elements that are added.
   */
  propWasAdded : function(eles, idxs) {
  },

  /**
   * List of keys to array properties.
   *
   * @property arrayProps
   * @type Array
   */
  arrayProps : null,
  arrayPropsWillBeDeleted : function(arrayProps) {
    for(var i = 0; i < arrayProps.length; i++) {
      this.removeArrayObserverFromProp(arrayProps[i]);
      this.removeBeforeObserverFromProp(arrayProps[i]);
      this.removeObserverFromProp(arrayProps[i]);
    }
  },
  arrayPropsCanAdd : function(ele, idx) {
    return true;
  },
  arrayPropsWasAdded : function(arrayProps) {
    for(var i = 0; i < arrayProps.length; i++) {
      this.arrayPropWasAdded(arrayProps[i]);
    }
  },
  arrayPropWasAdded : function(arrayProp) {
    var prop = this.get(arrayProp);
    if(!this[arrayProp+"WillBeDeleted"]) this[arrayProp+"WillBeDeleted"] = this.propWillBeDeleted;
    if(!this[arrayProp+"CanAdd"]) this[arrayProp+"CanAdd"] = this.propCanAdd;
    if(!this[arrayProp+"WasAdded"]) this[arrayProp+"WasAdded"] = this.propWasAdded;
    if(!prop) {
      this.set(arrayProp, []);
    }
    else {
      this.propArrayNotifyChange(prop, arrayProp);
    }
    this.addArrayObserverToProp(arrayProp);
    this.addBeforeObserverToProp(arrayProp);
    this.addObserverToProp(arrayProp);
  },

});


return {
  ObjectWithArrayMixin : ObjectWithArrayMixin,
};

});

define('delayedAddToHasManyMixin',[
  "ember",
  "./objectWithArrayMixin",
], function(objectWithArrayMixin) {


/**
 * A mixin to add observers to array properties. Used in belongsTo of a ember-data model.
 * Adds after the HasMany object is resolved.
 *
 * @class Utils.DelayedAddToHasManyMixin
 * @extends Utils.ObjectWithArrayMixin
 * @static
 */
var delayAddId = 0;
var DelayedAddToHasManyMixin = Ember.Mixin.create(objectWithArrayMixin, {
  init : function() {
    this._super();
    Ember.set(this, "arrayPropDelayedObjs", {});
  },

  arrayPropDelayedObjs : null,

  addDelayObserverToProp : function(propKey, method) {
    method = method || "propWasUpdated";
    Ember.addObserver(this, propKey, this, method);
  },

  removeDelayObserverFromProp : function(propKey) {
    method = method || "propWasUpdated";
    Ember.removeObserver(this, propKey, this, method);
  },

  propArrayNotifyChange : function(prop, key) {
    if(prop.then) {
      prop.set("canAddObjects", false);
      prop.then(function() {
        prop.set("canAddObjects", true);
      });
    }
    else {
      for(var i = 0; i < prop.get("length"); i++) {
        this[key+"WasAdded"](prop.objectAt(i), i, true);
      }
    }
  },

  /**
   * Method to add a property after the array prop loads.
   *
   * @property addToProp
   * @param {String} prop Property of array to add to.
   * @param {Instance} propObj Object to add to array.
   */
  addToProp : function(prop, propObj) {
    var arrayPropDelayedObjs = this.get("arrayPropDelayedObjs"), propArray = this.get(prop);
    if(propArray.get("canAddObjects")) {
      if(!propArray.contains(propObj)) {
        propArray.pushObject(propObj);
      }
    }
    else {
      arrayPropDelayedObjs[prop] = arrayPropDelayedObjs[prop] || [];
      if(!arrayPropDelayedObjs[prop].contains(propObj)) {
        arrayPropDelayedObjs[prop].push(propObj);
      }
    }
  },

  hasArrayProp : function(prop, findKey, findVal) {
    var arrayPropDelayedObjs = this.get("arrayPropDelayedObjs"), propArray = this.get(prop);
    if(propArray.get("canAddObjects")) {
      return !!propArray.findBy(findKey, findVal);
    }
    else if(arrayPropDelayedObjs && arrayPropDelayedObjs[prop]) {
      return !!arrayPropDelayedObjs[prop].findBy(findKey, findVal);
    }
    return false;
  },

  addToContent : function(prop) {
    var arrayPropDelayedObjs = this.get("arrayPropDelayedObjs"), propArray = this.get(prop);
    if(propArray.get("canAddObjects") && arrayPropDelayedObjs[prop]) {
      arrayPropDelayedObjs[prop].forEach(function(propObj) {
        if(!propArray.contains(propObj)) {
          propArray.pushObject(propObj);
        }
      }, propArray);
      delete arrayPropDelayedObjs[prop];
    }
  },

  arrayProps : null,
  arrayPropsWillBeDeleted : function(arrayProp) {
    this._super(arrayProp);
    this.removeDelayObserverFromProp(arrayProp+".canAddObjects");
  },
  arrayPropWasAdded : function(arrayProp) {
    this._super(arrayProp);
    var prop = this.get(arrayProp), that = this;
    if(!this["addTo_"+arrayProp]) this["addTo_"+arrayProp] = function(propObj) {
      that.addToProp(arrayProp, propObj);
    };
    this.addDelayObserverToProp(arrayProp+".canAddObjects", function(obj, key) {
      that.addToContent(arrayProp);
    });
  },

});


return {
  DelayedAddToHasManyMixin : DelayedAddToHasManyMixin,
};

});

define('misc',[
  "ember",
], function() {

/**
 * Search in a multi level array.
 *
 * @method deepSearchArray
 * @for Utils
 * @static
 * @param {Object} d Root object to search from.
 * @param {any} e Element to search for.
 * @param {String} k Key of the element in the object.
 * @param {String} ak Key of the array to dig deep.
 * @returns {Object} Returns the found object.
 */
function deepSearchArray(d, e, k, ak) { //d - data, e - element, k - key, ak - array key
  if(e === undefined || e === null) return null;
  if(d[k] === e) return d;
  if(d[ak]) {
    for(var i = 0; i < d[ak].length; i++) {
      var ret = Utils.deepSearchArray(d[ak][i], e, k, ak);
      if(ret) {
        return ret;
      }
    }
  }
  return null;
};

/**
 * Binary insertion within a sorted array.
 *
 * @method binaryInsert
 * @static
 * @param {Array} a Sorted array to insert in.
 * @param {any} e Element to insert.
 * @param {Function} [c] Optional comparator to use.
 */
var cmp = function(a, b) {
  return a - b;
};
var binarySearch = function(a, e, l, h, c) {
  var i = Math.floor((h + l) / 2), o = a.objectAt(i);
  if(l > h) return l;
  if(c(e, o) >= 0) {
    return binarySearch(a, e, i + 1, h, c);
  }
  else {
    return binarySearch(a, e, l, i - 1, c);
  }
};
function binaryInsert(a, e, c) {
  c = c || cmp;
  var len = a.get("length");
  if(len > 0) {
    var i = binarySearch(a, e, 0, len - 1, c);
    a.insertAt(i, e);
  }
  else {
    a.pushObject(e);
  }
};

/**
 * Merge a src object to a tar object and return tar.
 *
 * @method merge
 * @static
 * @param {Object} tar Target object.
 * @param {Object} src Source object.
 * @param {Boolean} [replace=false] Replace keys if they already existed.
 * @returns {Object} Returns the target object.
 */
function merge(tar, src, replace) {
  for(var k in src) {
    if(!src.hasOwnProperty(k) || !Ember.isNone(tar[k])) {
      continue;
    }
    if(Ember.isEmpty(tar[k]) || replace) {
      tar[k] = src[k];
    }
  }
  return tar;
};

/**
 * Checks if an object has any key.
 *
 * @method hashHasKeys
 * @static
 * @param {Object} hash Object to check for keys.
 * @returns {Boolean}
 */
function hashHasKeys(hash) {
  for(var k in hash) {
    if(hash.hasOwnProperty(k)) return true;
  }
  return false;
};

/**
 * Returns an array of integers from a starting number to another number with steps.
 *
 * @method getArrayFromRange
 * @static
 * @param {Number} l Starting number.
 * @param {Number} h Ending number.
 * @param {Number} s Steps.
 * @returns {Array}
 */
function getArrayFromRange(l, h, s) {
  var a = [];
  s = s || 1;
  for(var i = l; i < h; i += s) {
    a.push(i);
  }
  return a;
};

var extractIdRegex = /:(ember\d+):?/;
/**
 * Get the ember assigned id to the instance.
 *
 * @method getEmberId
 * @static
 * @param {Instance} obj
 * @returns {String} Ember assigned id.
 */
function getEmberId(obj) {
  var str = obj.toString(), match = str.match(extractIdRegex);
  return match && match[1];
};

/**
 * Recursively return the offset of an element relative to a parent element.
 *
 * @method getOffset
 * @static
 * @param {DOMElement} ele
 * @param {String} type Type of the offset.
 * @param {String} parentSelector Selector for the parent.
 * @param {Number} Offset.
 */
function getOffset(ele, type, parentSelector) {
  parentSelector = parentSelector || "body";
  if(!Ember.isEmpty($(ele).filter(parentSelector))) {
    return 0;
  }
  return ele["offset"+type] + Utils.getOffset(ele.offsetParent, type, parentSelector);
};

function emberDeepEqual(src, tar) {
  for(var k in tar) {
    var kObj = src.get(k);
    if(Ember.typeOf(tar[k]) === "object" || Ember.typeOf(tar[k]) === "instance") {
      return Utils.emberDeepEqual(kObj, tar[k]);
    }
    else if(Ember.typeOf(tar[k]) === "array") {
      for(var i = 0; i < tar[k].length; i++) {
        if(!Utils.emberDeepEqual(kObj.objectAt(i), tar[k][i])) {
          return false;
        }
      }
    }
    else if(tar[k] !== kObj) {
      console.log(kObj + " not equal to " + tar[k] + " for key : " + k);
      return false;
    }
  }
  return true;
};

return {
  deepSearchArray : deepSearchArray,
  binaryInsert : binaryInsert,
  merge : merge,
  hashHasKeys : hashHasKeys,
  getArrayFromRange : getArrayFromRange,
  getEmberId : getEmberId,
  getOffset : getOffset,
  emberDeepEqual : emberDeepEqual,
};

});

/**
 * @module ember-utils-core
 */
define('ember-utils-core',[
  "./hasMany",
  "./belongsTo",
  "./hierarchy",
  "./delayedAddToHasManyMixin",
  "./objectWithArrayMixin",
  //"./hashMapArray",
  "./misc",
], function() {
  /**
   * Global class
   *
   * @class Utils
   */
  var Utils = Ember.Namespace.create();
  window.Utils = Utils;

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Utils[k] = arguments[i][k];
      }
    }
  }

  return Utils;
});

  // Register in the values from the outer closure for common dependencies
  // as local almond modules
  define('jquery', function() {
    return $;
  });
  define('ember', function() {
    return Ember;
  });
 
  // Use almond's special top level synchronous require to trigger factory
  // functions, get the final module, and export it as the public api.
  return require('ember-utils-core');
}));

/*!
 * Bootstrap v3.2.0 (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

if (typeof jQuery === 'undefined') { throw new Error('Bootstrap\'s JavaScript requires jQuery') }

/* ========================================================================
 * Bootstrap: transition.js v3.2.0
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false
    var $el = this
    $(this).one('bsTransitionEnd', function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: alert.js v3.2.0
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '3.2.0'

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = $(selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.hasClass('alert') ? $this : $this.parent()
    }

    $parent.trigger(e = $.Event('close.bs.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(150) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.alert')

      if (!data) $this.data('bs.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.alert

  $.fn.alert             = Plugin
  $.fn.alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);

/* ========================================================================
 * Bootstrap: button.js v3.2.0
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '3.2.0'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state = state + 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    $el[val](data[state] == null ? this.options[state] : data[state])

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked') && this.$element.hasClass('active')) changed = false
        else $parent.find('.active').removeClass('active')
      }
      if (changed) $input.prop('checked', !this.$element.hasClass('active')).trigger('change')
    }

    if (changed) this.$element.toggleClass('active')
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.button

  $.fn.button             = Plugin
  $.fn.button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document).on('click.bs.button.data-api', '[data-toggle^="button"]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    Plugin.call($btn, 'toggle')
    e.preventDefault()
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: carousel.js v3.2.0
 * http://getbootstrap.com/javascript/#carousel
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element).on('keydown.bs.carousel', $.proxy(this.keydown, this))
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options     = options
    this.paused      =
    this.sliding     =
    this.interval    =
    this.$active     =
    this.$items      = null

    this.options.pause == 'hover' && this.$element
      .on('mouseenter.bs.carousel', $.proxy(this.pause, this))
      .on('mouseleave.bs.carousel', $.proxy(this.cycle, this))
  }

  Carousel.VERSION  = '3.2.0'

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true
  }

  Carousel.prototype.keydown = function (e) {
    switch (e.which) {
      case 37: this.prev(); break
      case 39: this.next(); break
      default: return
    }

    e.preventDefault()
  }

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item')
    return this.$items.index(item || this.$active)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'))

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid.bs.carousel', function () { that.to(pos) }) // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active')
    var $next     = next || $active[type]()
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var fallback  = type == 'next' ? 'first' : 'last'
    var that      = this

    if (!$next.length) {
      if (!this.options.wrap) return
      $next = this.$element.find('.item')[fallback]()
    }

    if ($next.hasClass('active')) return (this.sliding = false)

    var relatedTarget = $next[0]
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    })
    this.$element.trigger(slideEvent)
    if (slideEvent.isDefaultPrevented()) return

    this.sliding = true

    isCycling && this.pause()

    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active')
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
      $nextIndicator && $nextIndicator.addClass('active')
    }

    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
    if ($.support.transition && this.$element.hasClass('slide')) {
      $next.addClass(type)
      $next[0].offsetWidth // force reflow
      $active.addClass(direction)
      $next.addClass(direction)
      $active
        .one('bsTransitionEnd', function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () {
            that.$element.trigger(slidEvent)
          }, 0)
        })
        .emulateTransitionEnd($active.css('transition-duration').slice(0, -1) * 1000)
    } else {
      $active.removeClass('active')
      $next.addClass('active')
      this.sliding = false
      this.$element.trigger(slidEvent)
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  var old = $.fn.carousel

  $.fn.carousel             = Plugin
  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  $(document).on('click.bs.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var href
    var $this   = $(this)
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7
    if (!$target.hasClass('carousel')) return
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false

    Plugin.call($target, options)

    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex)
    }

    e.preventDefault()
  })

  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this)
      Plugin.call($carousel, $carousel.data())
    })
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: collapse.js v3.2.0
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element)
    this.options       = $.extend({}, Collapse.DEFAULTS, options)
    this.transitioning = null

    if (this.options.parent) this.$parent = $(this.options.parent)
    if (this.options.toggle) this.toggle()
  }

  Collapse.VERSION  = '3.2.0'

  Collapse.DEFAULTS = {
    toggle: true
  }

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width')
    return hasWidth ? 'width' : 'height'
  }

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return

    var startEvent = $.Event('show.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var actives = this.$parent && this.$parent.find('> .panel > .in')

    if (actives && actives.length) {
      var hasData = actives.data('bs.collapse')
      if (hasData && hasData.transitioning) return
      Plugin.call(actives, 'hide')
      hasData || actives.data('bs.collapse', null)
    }

    var dimension = this.dimension()

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0)

    this.transitioning = 1

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('')
      this.transitioning = 0
      this.$element
        .trigger('shown.bs.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    var scrollSize = $.camelCase(['scroll', dimension].join('-'))

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(350)[dimension](this.$element[0][scrollSize])
  }

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return

    var startEvent = $.Event('hide.bs.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var dimension = this.dimension()

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight

    this.$element
      .addClass('collapsing')
      .removeClass('collapse')
      .removeClass('in')

    this.transitioning = 1

    var complete = function () {
      this.transitioning = 0
      this.$element
        .trigger('hidden.bs.collapse')
        .removeClass('collapsing')
        .addClass('collapse')
    }

    if (!$.support.transition) return complete.call(this)

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(350)
  }

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']()
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.collapse')
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && option == 'show') option = !option
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.collapse

  $.fn.collapse             = Plugin
  $.fn.collapse.Constructor = Collapse


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var href
    var $this   = $(this)
    var target  = $this.attr('data-target')
        || e.preventDefault()
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7
    var $target = $(target)
    var data    = $target.data('bs.collapse')
    var option  = data ? 'toggle' : $this.data()
    var parent  = $this.attr('data-parent')
    var $parent = parent && $(parent)

    if (!data || !data.transitioning) {
      if ($parent) $parent.find('[data-toggle="collapse"][data-parent="' + parent + '"]').not($this).addClass('collapsed')
      $this[$target.hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
    }

    Plugin.call($target, option)
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.2.0
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.2.0'

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.trigger('focus')

      $parent
        .toggleClass('open')
        .trigger('shown.bs.dropdown', relatedTarget)
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27)/.test(e.keyCode)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive || (isActive && e.keyCode == 27)) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.divider):visible a'
    var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc)

    if (!$items.length) return

    var index = $items.index($items.filter(':focus'))

    if (e.keyCode == 38 && index > 0)                 index--                        // up
    if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
    if (!~index)                                      index = 0

    $items.eq(index).trigger('focus')
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $parent = getParent($(this))
      var relatedTarget = { relatedTarget: this }
      if (!$parent.hasClass('open')) return
      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))
      if (e.isDefaultPrevented()) return
      $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget)
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle + ', [role="menu"], [role="listbox"]', Dropdown.prototype.keydown)

}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.2.0
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options        = options
    this.$body          = $(document.body)
    this.$element       = $(element)
    this.$backdrop      =
    this.isShown        = null
    this.scrollbarWidth = 0

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.VERSION  = '3.2.0'

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.$body.addClass('modal-open')

    this.setScrollbar()
    this.escape()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element
        .addClass('in')
        .attr('aria-hidden', false)

      that.enforceFocus()

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$element.find('.modal-dialog') // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(300) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.bs.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.$body.removeClass('modal-open')

    this.resetScrollbar()
    this.escape()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .attr('aria-hidden', true)
      .off('click.dismiss.bs.modal')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(300) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keyup.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keyup.dismiss.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus.call(this.$element[0])
          : this.hide.call(this)
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(150) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(150) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  Modal.prototype.checkScrollbar = function () {
    if (document.body.clientWidth >= window.innerWidth) return
    this.scrollbarWidth = this.scrollbarWidth || this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    if (this.scrollbarWidth) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', '')
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin
  $.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: tooltip.js v3.2.0
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       =
    this.options    =
    this.enabled    =
    this.timeout    =
    this.hoverState =
    this.$element   = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.2.0'

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(document.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var $parent      = this.$element.parent()
        var parentDim    = this.getPosition($parent)

        placement = placement == 'bottom' && pos.top   + pos.height       + actualHeight - parentDim.scroll > parentDim.height ? 'top'    :
                    placement == 'top'    && pos.top   - parentDim.scroll - actualHeight < 0                                   ? 'bottom' :
                    placement == 'right'  && pos.right + actualWidth      > parentDim.width                                    ? 'left'   :
                    placement == 'left'   && pos.left  - actualWidth      < parentDim.left                                     ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(150) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  = offset.top  + marginTop
    offset.left = offset.left + marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var arrowDelta          = delta.left ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowPosition       = delta.left ? 'left'        : 'top'
    var arrowOffsetPosition = delta.left ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], arrowPosition)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, position) {
    this.arrow().css(position, delta ? (50 * (1 - delta / dimension) + '%') : '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function () {
    var that = this
    var $tip = this.tip()
    var e    = $.Event('hide.bs.' + this.type)

    this.$element.removeAttr('aria-describedby')

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      that.$element.trigger('hidden.bs.' + that.type)
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && this.$tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(150) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof ($e.attr('data-original-title')) != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element
    var el     = $element[0]
    var isBody = el.tagName == 'BODY'
    return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : null, {
      scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop(),
      width:  isBody ? $(window).width()  : $element.outerWidth(),
      height: isBody ? $(window).height() : $element.outerHeight()
    }, isBody ? { top: 0, left: 0 } : $element.offset())
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width   }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    return (this.$tip = this.$tip || $(this.options.template))
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.validate = function () {
    if (!this.$element[0].parentNode) {
      this.hide()
      this.$element = null
      this.options  = null
    }
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
  }

  Tooltip.prototype.destroy = function () {
    clearTimeout(this.timeout)
    this.hide().$element.off('.' + this.type).removeData('bs.' + this.type)
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.2.0
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.2.0'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').empty()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }

  Popover.prototype.tip = function () {
    if (!this.$tip) this.$tip = $(this.options.template)
    return this.$tip
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.2.0
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    var process  = $.proxy(this.process, this)

    this.$body          = $('body')
    this.$scrollElement = $(element).is('body') ? $(window) : $(element)
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)
    this.selector       = (this.options.target || '') + ' .nav li > a'
    this.offsets        = []
    this.targets        = []
    this.activeTarget   = null
    this.scrollHeight   = 0

    this.$scrollElement.on('scroll.bs.scrollspy', process)
    this.refresh()
    this.process()
  }

  ScrollSpy.VERSION  = '3.2.0'

  ScrollSpy.DEFAULTS = {
    offset: 10
  }

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  }

  ScrollSpy.prototype.refresh = function () {
    var offsetMethod = 'offset'
    var offsetBase   = 0

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.offsets = []
    this.targets = []
    this.scrollHeight = this.getScrollHeight()

    var self     = this

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this)
        var href  = $el.data('target') || $el.attr('href')
        var $href = /^#./.test(href) && $(href)

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        self.offsets.push(this[0])
        self.targets.push(this[1])
      })
  }

  ScrollSpy.prototype.process = function () {
    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
    var scrollHeight = this.getScrollHeight()
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
    var offsets      = this.offsets
    var targets      = this.targets
    var activeTarget = this.activeTarget
    var i

    if (this.scrollHeight != scrollHeight) {
      this.refresh()
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop <= offsets[0]) {
      return activeTarget != (i = targets[0]) && this.activate(i)
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
        && this.activate(targets[i])
    }
  }

  ScrollSpy.prototype.activate = function (target) {
    this.activeTarget = target

    $(this.selector)
      .parentsUntil(this.options.target, '.active')
      .removeClass('active')

    var selector = this.selector +
        '[data-target="' + target + '"],' +
        this.selector + '[href="' + target + '"]'

    var active = $(selector)
      .parents('li')
      .addClass('active')

    if (active.parent('.dropdown-menu').length) {
      active = active
        .closest('li.dropdown')
        .addClass('active')
    }

    active.trigger('activate.bs.scrollspy')
  }


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.scrollspy

  $.fn.scrollspy             = Plugin
  $.fn.scrollspy.Constructor = ScrollSpy


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.bs.scrollspy.data-api', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      Plugin.call($spy, $spy.data())
    })
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: tab.js v3.2.0
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.VERSION = '3.2.0'

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.dropdown-menu)')
    var selector = $this.data('target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return

    var previous = $ul.find('.active:last a')[0]
    var e        = $.Event('show.bs.tab', {
      relatedTarget: previous
    })

    $this.trigger(e)

    if (e.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $this.trigger({
        type: 'shown.bs.tab',
        relatedTarget: previous
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active')
    var transition = callback
      && $.support.transition
      && $active.hasClass('fade')

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
        .removeClass('active')

      element.addClass('active')

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      if (element.parent('.dropdown-menu')) {
        element.closest('li.dropdown').addClass('active')
      }

      callback && callback()
    }

    transition ?
      $active
        .one('bsTransitionEnd', next)
        .emulateTransitionEnd(150) :
      next()

    $active.removeClass('in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab             = Plugin
  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


  // TAB DATA-API
  // ============

  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  })

}(jQuery);

/* ========================================================================
 * Bootstrap: affix.js v3.2.0
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      =
    this.unpin        =
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '3.2.0'

  Affix.RESET    = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.unpin   != null && (scrollTop + this.unpin <= position.top) ? false :
                offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ? 'bottom' :
                offsetTop    != null && (scrollTop <= offsetTop) ? 'top' : false

    if (this.affixed === affix) return
    if (this.unpin != null) this.$element.css('top', '')

    var affixType = 'affix' + (affix ? '-' + affix : '')
    var e         = $.Event(affixType + '.bs.affix')

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

    this.$element
      .removeClass(Affix.RESET)
      .addClass(affixType)
      .trigger($.Event(affixType.replace('affix', 'affixed')))

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - this.$element.height() - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin
  $.fn.affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom) data.offset.bottom = data.offsetBottom
      if (data.offsetTop)    data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

define("bootstrap", function(){});

define('column-data/registry',[
  "ember",
], function(Ember) {

return Ember.Object.create({
  map : {},

  store : function(name, parent, columnData) {
    this.get("map")[parent+":"+name] = columnData;
  },

  retrieve : function(name, parent) {
    return this.get("map")[parent+":"+name];
  },
});

});

define('column-data/validations/emptyValidation',[
  "ember",
], function() {


/**
 * Not empty validation class. Pass type = 0 to get this.
 *
 * @class EmptyValidation
 * @module column-data
 * @submodule column-data-validation
 */
var EmptyValidation = Ember.Object.extend({
  /**
   * Message to show when the validation fails.
   *
   * @property invalidMessage
   * @type String
   */
  invalidMessage : "",

  /**
   * Boolean that says whether to negate the result or not.
   *
   * @property negate
   * @type Boolean
   */
  negate : false,

  validateValue : function(value, record) {
    var invalid = Ember.isEmpty(value) || /^\s*$/.test(value),
        negate = this.get("negate");
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },

  canBeEmpty : false,
});

return EmptyValidation;

});

define('column-data/validations/regexValidation',[
  "ember",
  "./emptyValidation",
], function(Ember, EmptyValidation) {

/**
 * Validate on a regex. Pass type = 1 to get this.
 *
 * @class RegexValidation
 * @module column-data
 * @submodule column-data-validation
 */
var RegexValidation = EmptyValidation.extend({
  /**
   * Regex to valide with.
   *
   * @property regex
   * @type String
   */
  regex : "",

  /**
   * Regex flags to use while creating the regex object.
   *
   * @property regexFlags
   * @type String
   */
  regexFlags : "",

  /**
   * RegExp object create using regex and regexFlags.
   *
   * @property regexObject
   * @type RegExp
   */
  regexObject : function() {
    return new RegExp(this.get("regex"), this.get("regexFlags"));
  }.property('regex'),

  /**
   * Method to validate.
   *
   * @method validateValue
   * @param {any} value Value to validate.
   * @param {Class} record Record to validate on.
   * @returns {Boolean}
   * @private
   */
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    emptyBool = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    invalid = (isEmpty && emptyBool) || this.get("regexObject").test(value);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

return RegexValidation;

});

define('column-data/validations/csvRegexValidation',[
  "ember",
  "./regexValidation",
], function(Ember, RegexValidation) {

/**
 * Validate on a regex on each value in a Comma Seperated Value. Pass type = 2 to get this.
 *
 * @class CSVRegexValidation
 * @module column-data
 * @submodule column-data-validation
 */
var CSVRegexValidation = RegexValidation.extend({
  /**
   * Delimeter to use to split values in the CSV.
   *
   * @property delimeter
   * @type String
   */
  delimeter : ",",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool;
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        invalid = this.get("regexObject").test(item); 
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

return CSVRegexValidation;

});

define('column-data/validations/csvDuplicateValidation',[
  "ember",
  "./csvRegexValidation",
], function(Ember, CSVRegexValidation) {


/**
 * Validate duplication in a CSV. Pass type = 3 to get this.
 *
 * @class CSVDuplicateValidation
 * @module column-data
 * @submodule column-data-validation
 */
var CSVDuplicateValidation = CSVRegexValidation.extend({
  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        isEmpty, emptyBool, valuesMap = {};
    if(value && value.trim) value = value.trim();
    isEmpty = Ember.isEmpty(value);
    if(!isEmpty) {
      value.split(this.get("delimeter")).some(function(item) { 
        item = item.trim();
        if(valuesMap[item]) {
          invalid = true;
        }
        else {
          valuesMap[item] = 1;
        }
        return negate ? !invalid : invalid; 
      }, this); 
      invalid = (negate && !invalid) || (!negate && invalid);
    }
    return [invalid, this.get("invalidMessage")];
  },
});

return CSVDuplicateValidation;

});

define('column-data/validations/duplicateAcrossRecordsValidation',[
  "ember",
  "./emptyValidation",
], function(Ember, EmptyValidation) {


/**
 * Validate duplication across siblings of the record. Pass type = 4 to get this.
 *
 * @class DuplicateAcrossRecordsValidation
 * @module column-data
 * @submodule column-data-validation
 */
var DuplicateAcrossRecordsValidation = EmptyValidation.extend({
  /**
   * Path relative to record to check duplication under.
   *
   * @property duplicateCheckPath
   * @type String
   */
  duplicateCheckPath : "",

  /**
   * Key in the object to check duplicate for.
   *
   * @property duplicateCheckKey
   * @type String
   */
  duplicateCheckKey : "id",

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate"),
        arr = record.get(this.get("duplicateCheckPath")),
        values = arr && arr.filterBy(this.get("duplicateCheckKey"), value);
    invalid = (values && values.get("length") > 1) || (values.get("length") === 1 && values[0] !== record);
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

return DuplicateAcrossRecordsValidation;

});

define('column-data/validations/numberRangeValidation',[
  "ember",
  "./emptyValidation",
], function(Ember, EmptyValidation) {


/**
 * Validate number ranges. Pass type = 5 to get this.
 *
 * @class NumberRangeValidation
 * @module column-data
 * @submodule column-data-validation
 */
var NumberRangeValidation = EmptyValidation.extend({
  /**
   * Min value of a number.
   *
   * @property minValue
   * @type Number
   */
  minValue : 0,

  /**
   * Max value of a number.
   *
   * @property maxValue
   * @type Number
   */
  maxValue : 999999,

  validateValue : function(value, record) {
    var invalid = false, negate = this.get("negate");
    if(value && value.trim) value = value.trim();
    if(Ember.isEmpty(value)) {
      invalid = (this.get("canBeEmpty") && negate) || (!this.get("canBeEmpty") && !negate);
    }
    else {
      var num = Number(value);
      if(num < this.get("minValue") || num > this.get("maxValue")) invalid = true;
    }
    invalid = (negate && !invalid) || (!negate && invalid);
    return [invalid, this.get("invalidMessage")];
  },
});

return NumberRangeValidation;

});

define('column-data/validations/columnDataValidation',[
  "ember",
  "lib/ember-utils-core",
  "./emptyValidation",
  "./regexValidation",
  "./csvRegexValidation",
  "./csvDuplicateValidation",
  "./duplicateAcrossRecordsValidation",
  "./numberRangeValidation",
], function(Ember, Utils) { 

var ColumnDataValidationsMap = {};
for(var i = 2; i < arguments.length; i++) {
  ColumnDataValidationsMap[i - 2] = arguments[i];
}

/**
 * Validation class that goes as 'validation' on column data.
 *
 * @class ColumnDataValidation
 * @module column-data
 * @submodule column-data-validation
 */
var ColumnDataValidation = Ember.Object.extend({
  init : function() {
    this._super();
    this.canBeEmpty();
  },

  /**
   * Array of validations to run. Passed as objects while creating.
   *
   * @property validations
   * @type Array
   */
  validations : Utils.hasMany(ColumnDataValidationsMap, "type"),

  /**
   * @property validate
   * @type Boolean
   * @private
   */
  validate : Ember.computed.notEmpty('validations'),

  /**
   * Method to validate a value on record.
   *
   * @method validateValue
   * @param {any} value Value to validate.
   * @param {Class} record Record to validate on.
   * @param {Array} [validations] Optional override of the validations to run.
   * @returns {Array} Returns an array with 1st element as a boolean which says whether validations passed or not, 2nd element is the invalid message if it failed.
   */
  validateValue : function(value, record, validations) {
    var invalid = [false, ""];
    validations = validations || this.get("validations");
    for(var i = 0; i < validations.length; i++) {
      invalid = validations[i].validateValue(value, record);
      if(invalid[0]) break;
    }
    return invalid;
  },

  canBeEmpty : function() {
    if(this.get("validations") && !this.get("validations").mapBy("type").contains(0)) {
      this.set("mandatory", false);
      this.get("validations").forEach(function(item) {
        item.set('canBeEmpty', true);
      });
    }
    else {
      this.set("mandatory", true);
    }
  }.observes('validations.@each'),

  /**
   * Boolean to denote whether the property is mandatory or not.
   *
   * @property mandatory
   * @type Boolean
   */
  mandatory : false,
});

return ColumnDataValidation;

});

define('column-data/columnListenerEntry',[
  "ember",
], function(Ember) {

/**
 * Entry for column listeners.
 *
 * @class ColumnListenerEntry
 */
var ColumnListenerEntry = Ember.Object.extend({
  /**
   * A name to uniquely identify column data.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Key name of the attribute in the record. If not provided, 'name' is used a key.
   *
   * @property keyName
   * @type String
   */
  keyName : "",

  /**
   * Key of the attribute based on keyName or name if keyName is not provided.
   *
   * @property key
   * @type String
   * @private
   */
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
});

return ColumnListenerEntry;

});

define('column-data/columnData',[
  "ember",
  "./registry",
  "./validations/columnDataValidation",
  "./columnListenerEntry",
  "lib/ember-utils-core",
], function(Ember, Registry, ColumnDataValidation, ColumnListenerEntry, Utils) {

/**
 * Class for meta data for a property on a record.
 *
 * @class ColumnData.ColumnData
 */
var ColumnData = Ember.Object.extend({
  init : function () {
    this._super();
    Registry.store(this.get("name"), "columnData", this);
  },

  /**
   * A name to uniquely identify column data.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Key name of the attribute in the record. If not provided, 'name' is used a key.
   *
   * @property keyName
   * @type String
   */
  keyName : "",

  /**
   * Key of the attribute based on keyName or name if keyName is not provided.
   *
   * @property key
   * @type String
   * @private
   */
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),

  /**
   * Meta data for the validation of the attribute on the record. Passed as an object while creating.
   *
   * @property validation
   * @type Class
   */
  validation : Utils.belongsTo(ColumnDataValidation),

  /**
   * Meta data used by list-group module. Passed as an object while creating.
   *
   * @property list
   * @type Class
   */
  list : Utils.belongsTo("ListGroup.ListColumnDataMap", "moduleType", "default", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by tree module. Passed as an object while creating.
   *
   * @property tree
   * @type Class
   */
  tree : Utils.belongsTo("Tree.TreeColumnDataMap", "moduleType", "default", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by sortable module. Passed as an object while creating.
   *
   * @property sort
   * @type Class
   */
  sort : Utils.belongsTo("DragDrop.SortableColumnDataMap", "moduleType", "default", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by panels module. Passed as an object while creating.
   *
   * @property panel
   * @type Class
   */
  panel : Utils.belongsTo("Panels.PanelColumnDataMap", "moduleType", "default", "GlobalModules.GlobalModulesColumnDataMixinMap", "viewType", "GlobalModules.DisplayTextColumnDataMixin"),

  /**
   * Meta data used by form module. Passed as an object while creating.
   *
   * @property form
   * @type Class
   */
  form : Utils.belongsTo("Form.FormColumnDataMap", "moduleType"),

  /**
   * A suitable label for the attribute used in displaying in certain places.
   *
   * @property label
   * @type String
   */
  label : null,

  /**
   * A nested child column data.
   *
   * @property childCol
   * @type Class
   * @private
   */
  childCol : Utils.belongsTo("ColumnData.ColumnData"),

  /**
   * A name for the nesting of a column data.
   *
   * @property childColName
   * @type String
   */
  childColName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childCol", Registry.retrieve(value, "columnData"));
      }
      return value;
    }
  }.property(),

  /**
   * A nested child column data group.
   *
   * @property childColGroup
   * @type Class
   * @private
   */
  childColGroup : Utils.belongsTo("ColumnData.ColumnDataGroup"),

  /**
   * A name for the nesting of a column data group.
   *
   * @property childColGroupName
   * @type String
   * @private
   */
  childColGroupName : function(key, value) {
    if(arguments.length > 1) {
      if(value) {
        this.set("childColGroup", Registry.retrieve(value, "columnDataGroup"));
      }
      return value;
    }
  }.property(),

  columnListenerEntries : Utils.hasMany(ColumnListenerEntry),
});

return {
  ColumnData : ColumnData,
};

});

define('column-data/columnDataGroup',[
  "ember",
  "./registry",
  "./columnData",
  "lib/ember-utils-core",
], function(Ember, Registry, ColumnData, Utils) {

/**
 * Class with meta data of a record type.
 *
 * @class ColumnData.ColumnDataGroup
 */
var ColumnDataGroup = Ember.Object.extend({
  init : function (){
    this._super();
    this.set("columns", this.get("columns") || []);
    Registry.store(this.get("name"), "columnDataGroup", this);
  },

  /**
   * A name to uniquely identify the column data group.
   *
   * @property name
   * @type String
   */
  name : "",

  /**
   * Array of columns. Each element is an object which will be passed to ColumnData.ColumnData.create.
   *
   * @property columns
   * @type Array
   */
  columns : Utils.hasMany(ColumnData.ColumnData),

  /**
   * Meta data used by list-group module. Passed as an object while creating.
   *
   * @property list
   * @type Class
   */
  list : Utils.belongsTo("ListGroup.ListColumnDataGroup"),

  /**
   * Meta data used by tree module. Passed as an object while creating.
   *
   * @property tree
   * @type Class
   */
  tree : Utils.belongsTo("Tree.TreeColumnDataGroup"),

  /**
   * Meta data used by sortable module. Passed as an object while creating.
   *
   * @property sort
   * @type Class
   */
  sort : Utils.belongsTo("DragDrop.SortableColumnDataGroup"),

  /**
   * Meta data used by panels module. Passed as an object while creating.
   *
   * @property panel
   * @type Class
   */
  panel : Utils.belongsTo("Panels.PanelColumnDataGroup"),

  /**
   * Meta data used by lazy-display module. Passed as an object while creating.
   *
   * @property lazyDisplay
   * @type Class
   */
  lazyDisplay : Utils.belongsTo("LazyDisplay.LazyDisplayColumnDataGroup"),

  /**
   * Meta data used by form module. Passed as an object while creating.
   *
   * @property form
   * @type Class
   */
  form : Utils.belongsTo("Form.FormColumnDataGroup"),
});

return {
  ColumnDataGroup : ColumnDataGroup,
  Registry : Registry,
};

});

/**
 * Validations for property in record.
 *
 * @submodule column-data-validation
 * @module column-data
 */

define('column-data/validations/main',[
  "ember",
  "./columnDataValidation",
], function(Ember, ColumnDataValidation) {
  return {
    ColumnDataValidation : ColumnDataValidation,
  };
});

define('column-data/utils/columnDataChangeCollectorMixin',[
  "ember",
], function(Ember) {

/**
 * A mixin that is a parent of ColumnDataValueMixin that collects value changes and fires listeners on the column.
 *
 * @class ColumnDataChangeCollectorMixin
 * @module column-data
 * @submodule column-data-utils
 */
var ColumnDataChangeCollectorMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.set("listenToMap", this.get("listenToMap") || {});
  },
  listenToMap : null,

  bubbleValChange : function(columnData, val, oldVal, callingView) {
    var listenToMap = this.get("listenToMap"), thisCol = this.get("columnData"),
        parentForm = this.get("parentForm");
    if(listenToMap[columnData.name]) {
      listenToMap[columnData.name].forEach(function(listening) {
        var listeningViews = listening.get("views");
        for(var i = 0; i < listeningViews.length; i++) {
          var view = listeningViews[i];
          if(view !== callingView) {
            view.listenedColumnChanged(columnData, val, oldVal);
          }
          if(view.get("columnData.bubbleValues") && parentForm && parentForm.bubbleValChange) parentForm.bubbleValChange(columnData, val, oldVal, callingView);
        }
      });
    }
    if(!Ember.isNone(oldVal) && this.get("record")) {
      this.get("record").set("tmplPropChangeHook", columnData.name);
    }
  },

  registerForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), existing,
        callingCol = colView.get("columnData"),
        colName = callingCol.get("name"),
        parentForm = this.get("parentForm");
    listenColName = (listenColName && listenColName.get ? listenColName.get("name") : listenColName);
    if(callingCol.get("bubbleValues") && parentForm && parentForm.registerForValChange) parentForm.registerForValChange(colView, listenColName);
    if(!listenToMap) {
      listenToMap = {};
      this.set("listenToMap", listenToMap);
    }
    listenToMap[listenColName] = listenToMap[listenColName] || [];
    existing = listenToMap[listenColName].findBy("name", colName);
    if(existing) {
      existing.get("views").pushObject(colView);
    }
    else {
      listenToMap[listenColName].pushObject(Ember.Object.create({views : [colView], name : colName}));
    }
  },

  unregisterForValChange : function(colView, listenColName) {
    var listenToMap = this.get("listenToMap"), callingCol = colView.get("columnData"),
        colName = callingCol.get("name"),
        colListener = listenToMap && listenToMap[listenColName],
        existing = colListener && listenToMap[listenColName].findBy("name", colName),
        parentForm = this.get("parentForm");
    listenColName = (listenColName && listenColName.get ? listenColName.get("name") : listenColName);
    if(callingCol.get("bubbleValues") && parentForm && parentForm.unregisterForValChange) parentForm.unregisterForValChange(colView, listenColName);
    if(existing) {
      var existingViews = existing.get("views");
      existingViews.removeObject(colView);
      if(existingViews.length === 0) {
        colListener.removeObject(existing);
      }
      else {
        for(var i = 0; i < existingViews.length; i++) {
          existingViews[i].colValueChanged(Ember.Object.create({name : listenColName, key : listenColName}), null, null);
        }
      }
    }
  },
});

return {
  ColumnDataChangeCollectorMixin : ColumnDataChangeCollectorMixin,
};

});

define('column-data/utils/columnDataValueMixin',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * A mixin that aliases the value of the attribute given by 'columnData' in 'record' to 'value'.
 *
 * @class ColumnDataValueMixin
 * @module column-data
 * @submodule column-data-utils
 */
var ColumnDataValueMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    this.recordDidChange();
    this.registerForValChangeChild();
  },

  /**
   * Column data instance to be used to extract value.
   *
   * @property columnData
   * @type Class
   */
  columnData : null,

  /**
   * Record to extract the value from.
   *
   * @property record
   * @type Class
   */
  record : null,

  listenedColumnChanged : function(changedColumnData, changedValue, oldValue) {
    this.listenedColumnChangedHook(changedColumnData, changedValue, oldValue);
    if(changedColumnData.get("name") === this.get("columnData.name")) {
      var that = this;
      //The delay is added cos destroy on the view of removed record is called before it is actually removed from array
      //TODO : find a better way to do this check
      Timer.addToQue("duplicateCheck-"+Utils.getEmberId(this), 100).then(function() {
        if(!that.get("isDestroyed")) {
          that.validateValue(that.get("val"));
        }
      });
    }
  },
  /**
   * Callback callled when the column listened on changes.
   *
   * @method listenedColumnChangedHook
   * @param {ColumnData} changedColumnData ColumnData instance of the changed column.
   * @param {any} changedValue
   * @param {any} oldValue
   */
  listenedColumnChangedHook : function(changedColumnData, changedValue, oldValue) {
  },

  validateValue : function(value) {
    var columnData = this.get("columnData"), record = this.get("record"),
        validation = columnData.get("validation");
    if(validation) {
      if(!this.get("disableValidation")) {
        var validVal = validation.validateValue(value, record);
        if(validVal[0]) record._validation[columnData.name] = 1;
        else delete record._validation[columnData.name];
        this.set("invalid", validVal[0]);
        this.set("invalidReason", !Ember.isEmpty(validVal[1]) && validVal[1]);
      }
      else {
        delete record._validation[columnData.name];
      }
    }
    record.set("validationFailed", Utils.hashHasKeys(record._validation));
  },

  /**
   * An alias to the value in attribute. It undergoes validations and the change will be bubbled.
   *
   * @property value
   */
  value : function(key, val) {
    var columnData = this.get("columnData"), record = this.get("record"),
        parentForBubbling = this.get("parentForBubbling");
    if(!record || !columnData) return val;
    record._validation = record._validation || {};
    if(arguments.length > 1) {
      if(!(record instanceof DS.Model) || (record.currentState && !record.currentState.stateName.match("deleted"))) {
        var oldVal = record.get(columnData.get("key"));
        this.validateValue(val);
        //TODO : find a better way to fix value becoming null when selection changes
        //if(val || !columnData.get("cantBeNull")) {
          record.set(columnData.get("key"), val);
          this.valueChangeHook(val);
          if(parentForBubbling && parentForBubbling.bubbleValChange) parentForBubbling.bubbleValChange(columnData, val, oldVal, this); 
        //}
      }
      return val;
    }
    else {
      val = record.get(columnData.get("key"));
      this.validateValue(val);
      if(parentForBubbling && parentForBubbling.bubbleValChange) parentForBubbling.bubbleValChange(columnData, val, oldVal, this); 
      return val;
    }
  }.property("columnData.key", "view.columnData.key", "disableValidation", "view.disableValidation"),

  /**
   * Callback called when the value changes.
   *
   * @method valueChangeHook
   * @param {any} val
   */
  valueChangeHook : function(val) {
  },

  prevRecord : null,
  recordDidChange : function() {
    var record = this.get("record"), prevRecord = this.get("prevRecord"),
        columnData = this.get("columnData");
    if(prevRecord) {
      Ember.removeObserver(prevRecord, columnData.get("key"), this, "notifyValChange");
    }
    if(record) {
      this.recordChangeHook();
      Ember.addObserver(record, columnData.get("key"), this, "notifyValChange");
      this.set("prevRecord", record);
    }
    else if(prevRecord) {
      this.recordRemovedHook();
    }
    this.notifyPropertyChange("value");
  }.observes("record", "view.record"),
  /**
   * Callback called when record changes.
   *
   * @method recordChangeHook
   */
  recordChangeHook : function() {
  },
  /**
   * Callback called when record is removed (set to null).
   *
   * @method recordRemovedHook
   */
  recordRemovedHook : function(){
  },

  notifyValChange : function(obj, key) {
    this.notifyPropertyChange("value");
    this.valueChangeHook(this.get("value"));
  },

  registerForValChangeChild : function() {
    var columnData = this.get("columnData"), parentForBubbling = this.get("parentForBubbling");
    if(columnData && columnData.get("columnListenerEntries")) {
      columnData.get("columnListenerEntries").forEach(function(listenCol) {
        if(parentForBubbling && parentForBubbling.registerForValChange) parentForBubbling.registerForValChange(this, listenCol);
      }, this);
    }
  }.observes("columnData", "view.columnData"),

  unregisterForValChangeChild : function() {
    var columnData = this.get("columnData"), parentForBubbling = this.get("parentForBubbling");
    if(columnData.get("columnListenerEntries")) {
      columnData.get("columnListenerEntries").forEach(function(listenCol) {
        if(parentForBubbling && parentForBubbling.unregisterForValChange) parentForBubbling.unregisterForValChange(this, listenCol);
      }, this);
    }
  },

  /**
   * Parent object with mixin ColumnData.ColumnDataChangeCollectorMixin to bubble to.
   *
   * @property parentForBubbling
   * @type Instance
   */
  parentForBubbling : null,

  destroy : function() {
    this._super();
    this.unregisterForValChangeChild();
  },
});

return {
  ColumnDataValueMixin : ColumnDataValueMixin,
};

});

define('column-data/utils/columnDataGroupPluginMixin',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * A mixin that used by column data group extensions. It adds view lookup paths based on the 'type' and for modules based on <module>Type.
 *
 * @class ColumnDataGroupPluginMixin
 * @module column-data
 * @submodule column-data-utils
 */
var ColumnDataGroupPluginMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  /**
   * Type of the column data group extension. Used to extract 'typeLookup' in 'lookupMap' along with 'type'.
   *
   * @property groupType
   * @type String
   */
  groupType : null,

  /**
   * Type of the column data group in extension. Used to extract 'typeLookup' in 'lookupMap' along with 'groupType'.
   *
   * @property type
   * @type String
   */
  type : "base",

  /**
   * View lookup path extracted from 'lookupMap' using 'groupType' and 'type'.
   *     lookupMap[groupType][type]
   *
   * @property typeLookup
   * @type String
   */
  typeLookup : function() {
    return this.get("lookupMap")[this.get("groupType")][this.get("type")];
  }.property("type"),

  arrayProps : ['modules'],

  /**
   * Array of modules present in the extension.
   *
   * @property modules
   * @type Array
   */
  modules : null,

  modulesWillBeDeleted : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.removeObserver(modules[i]+"Type", this, "moduleTypeDidChange");
    }
  },
  modulesWasAdded : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.addObserver(modules[i]+"Type", this, "moduleTypeDidChange");
      this.moduleTypeDidChange(this, modules[i]+"Type");
    }
    this.columnsChanged();
  },

  moduleTypeDidChange : function(obj, key) {
    var module = key.match(/^(\w*)Type$/)[1];
    this.set(module+"Lookup", this.get("lookupMap")[module][this.get(key) || "base"]);
  },

  columnsChanged : function() {
    var columns = this.get("parentObj.columns"), modules = this.get("modules");
    if(columns) {
      for(var i = 0; i < modules.length; i++) {
        this.set(modules[i]+"ColumnData", columns.findBy(this.get("groupType")+".type", modules[i]));
      }
    }
  }.observes("parentObj.columns.@each.panel"),
});

return {
  ColumnDataGroupPluginMixin : ColumnDataGroupPluginMixin,
};

});

/**
 * Utility classes related to column data.
 *
 * @submodule column-data-utils
 * @module column-data
 */

define('column-data/utils/main',[
  "ember",
  "./columnDataChangeCollectorMixin",
  "./columnDataValueMixin",
  "./columnDataGroupPluginMixin",
], function(Ember) {
  var mod = {};
  for(var i = 1; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        mod[k] = arguments[i][k];
      }
    }
  }

  return mod;
});

/**
 * Module for meta data of a record type and its properties.
 *
 * @module column-data
 */
define('column-data/main',[
  "./columnDataGroup",
  "./columnData",
  "./validations/main",
  "./utils/main",
], function() {
  var ColumnData = Ember.Namespace.create();
  window.ColumnData = ColumnData;

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ColumnData[k] = arguments[i][k];
      }
    }
  }

  ColumnData.initializer = function(app) {
    if(app.ColumnData) {
      for(var i = 0; i < app.ColumnData.length; i++) {
        ColumnData.ColumnDataGroup.create(app.ColumnData[i]);
      }
    }
  };

  return ColumnData;
});

define('timer/timer-consts',[
  "ember",
], function(Ember) {

/**
 * Default timeout for the asyncQue.
 *
 * @property TIMEOUT
 * @for Timer
 * @type Number
 * @default 500
 * @static
 */
var TIMEOUT = 500;

/**
 * Timer ticks.
 *
 * @property TIMERTIMEOUT
 * @for Timer
 * @type Number
 * @default 250
 * @static
 */
var TIMERTIMEOUT = 250;

return {
  TIMEOUT : TIMEOUT,
  TIMERTIMEOUT : TIMERTIMEOUT,
};

});

define('timer/asyncQue',[
  "ember",
  "./timer-consts",
], function(Ember, TimerConsts) {

var queMap = {};

/**
 * @class AsyncQue
 * @for Timer
 * @private
 */
var AsyncQue = Ember.Object.extend({
  init : function() {
    this._super();
    var that = this, timer;
    Ember.run.later(function() {
      that.timerTimedout();
    }, that.get("timeout") || TimerConsts.TIMEOUT);
  },

  timerTimedout : function() {
    if(!this.get("resolved")) {
      var that = this;
      Ember.run(function() {
        delete queMap[that.get("key")];
        that.set("resolved", true);
        that.get("resolve")();
      });
    }
  },

  /**
   * native timer
   *
   * @property timer
   * @for AsyncQue
   * @type Number
   */
  timer : null,

  /**
   * unique identifier for the associated task
   *
   * @property key
   * @type String
   */
  key : "",

  /**
   * resolve function of the associated promise
   *
   * @property resolve
   * @type Function
   */
  resolve : null,

  /**
   * reject function of the associated promise
   *
   * @property reject
   * @type Function
   */
  reject : null,

  /**
   * boolean to indicate whether the associated promise has resolved
   *
   * @property resolved
   * @type boolean
   */
  resolved : false,

  /**
   * timeout after which the associated promise resolves
   *
   * @property reject
   * @type Number
   */
  timeout : TimerConsts.TIMEOUT,
});

/**
 * Public API to create a job into async que.
 * 
 * @method addToQue
 * @for Timer
 * @return {Class} Promise created for the async-que.
 * @param {String} key Unique identifier for the job.
 * @param {Number} [timeout=Timer.TIMEOUT] timeout after which the job should be run.
 */
var addToQue = function(key, timeout) {
  if(queMap[key]) {
    queMap[key].set("resolved", true);
    queMap[key].get("reject")();
  }
  var promise;
  Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      var asyncQue = AsyncQue.create({key : key, resolve : resolve, reject : reject, timeout : timeout});
      queMap[key] = asyncQue;
    });
  });
  return promise;
};

return {
  addToQue : addToQue,
};

});

define('timer/timerObj',[
  "ember",
  "./timer-consts",
], function(Ember, TimerConsts) {


var curTimer = null;
var timers = [];

/**
 * A timer module which executes a job periodically.
 *
 * @class TimerObj
 * @for Timer
 */
var TimerObj = Ember.Object.extend({
  init : function() {
    this._super();
    timers.push(this);
    this.set("ticks", Math.ceil(this.get("timeout") / TimerConsts.TIMERTIMEOUT));
    if(!Timer.curTimer) {
      curTimer = setInterval(timerFunction, TimerConsts.TIMERTIMEOUT);
    }
    var that = this;
    this.set("promise", new Ember.RSVP.Promise(function(resolve, reject) {
      that.setProperties({
        resolve : resolve,
        reject : reject,
      });
    }));
  },

  /**
   * Periodic timeout after which the job should be executed.
   *
   * @property timeout
   * @type boolean
   * @default Timer.TIMERTIMEOUT
   */
  timeout : TimerConsts.TIMERTIMEOUT,

  /**
   * Number of times of Timer.TIMERTIMEOUT per period.
   *
   * @property ticks
   * @type Number
   * @default 1
   * @private
   */
  ticks : 1,

  /**
   * Number of times to execute the job.
   *
   * @property count
   * @type Number
   * @default 0
   */
  count : 0,

  /**
   * Callback executed every period. The job goes here.
   *
   * @method timerCallback
   */
  timerCallback : function() {
  },


  /**
   * Callback executed after the end of timer.
   *
   * @method endCallback
   */
  endCallback : function() {
  },

  promise : null,
  resolve : null,
  reject : null,
});

var timerFunction = function() {
  Ember.run(function() {
    if(timers.length === 0) {
      clearTimeout(curTimer);
      curTimer = null;
    }
    else {
      for(var i = 0; i < timers.length;) {
        var timer = timers[i];
        timer.decrementProperty("ticks");
        if(timer.get("ticks") === 0) {
          timer.set("ticks", Math.ceil(timer.get("timeout") / TimerConsts.TIMERTIMEOUT));
          timer.timerCallback();
          timer.decrementProperty("count");
        }
        if(timer.get("count") <= 0) {
          timers.removeAt(i);
          timer.endCallback();
          timer.get("resolve")();
        }
        else {
          i++;
        }
      }
    }
  });
};

return {
  TimerObj : TimerObj,
};

});

/**
 * Timer module with stuff related to timers.
 *
 * @module timer
 */
define('timer/main',[
  "./timer-consts",
  "./asyncQue",
  "./timerObj",
], function() {
  /**
   * Timer global class.
   *
   * @class Timer
   */
  var Timer = Ember.Namespace.create();
  window.Timer = Timer;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Timer[k] = arguments[i][k];
      }
    }
  }

  return Timer;
});

define('array-modifier/array-modifier-types/arrayModifier',[
  "ember",
], function(Ember) {

/**
 * Base class for array modifier
 *
 * @class ArrayMod.ArrayModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArrayModifier = Ember.Object.extend({
  /**
   * Type of the array modifier.
   *
   * @property type
   * @type String
   * @default "basic"
   * @readonly
   */
  type : "basic",

  /**
   * Array modifier group type the modifier belongs to.
   *
   * @property groupType
   * @type String
   * @default "basic"
   * @readonly
   */
  groupType : "basic",

  /**
   * Property the modifier applies on.
   *
   * @property property
   * @type String
   */
  property : "",

  /**
   * Set to true if a listener on all objects in the array should be added.
   *
   * @property addObserverToAll
   * @type Boolean
   * @default true
   */
  addObserverToAll : true,

  /**
   * Function called when observers are supposed to be added.
   *
   * @method addModObservers
   * @param {Class} context Context to add the observer to.
   * @param {String|Function} method Method to be called when observer is called.
   */
  addModObservers : function(context, method) {
    Ember.addObserver(this, "property", context, method);
  },

  /**
   * Function called when observers are supposed to be removed.
   *
   * @method removeModObservers
   * @param {Class} context Context to add the observer to.
   * @param {String|Function} method Method to be called when observer is called.
   */
  removeModObservers : function(context, method) {
    Ember.removeObserver(this, "property", context, method);
  },
});

return {
  ArrayModifier : ArrayModifier,
};

});

define('array-modifier/array-modifier-types/arrayFilterModifier',[
  "ember",
  "./arrayModifier",
], function(Ember, ArrayModifier) {

/**
 * Base class for array filter, which removes/adds elements.
 *
 * @class ArrayMod.ArrayFilterModifier
 * @extends ArrayMod.ArrayModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArrayFilterModifier = ArrayModifier.ArrayModifier.extend({
  type : "filter",
  groupType : "filter",

  /**
   * Method called to modify an entire array.
   *
   * @method modify
   * @param {Array} array The array to modify.
   */
  modify : function(array) {
    return array.filter(function(item) {
      var value = item.get(this.get("property"));
      this.modFun(item, value);
    }, this);
  },

  /**
   * Method called to modify a single element.
   *
   * @method modify
   * @param {Class} item The item to modify.
   * @param {any} value The value to modfiy on.
   */
  modFun : function(item, value) {
    return true;
  },
});

return {
  ArrayFilterModifier : ArrayFilterModifier,
};

});

define('array-modifier/array-modifier-types/arraySearchModifier',[
  "ember",
  "./arrayFilterModifier",
], function(Ember, ArrayFilterModifier) {

/**
 * Class to search for a string in the array elements.
 *
 * @class ArrayMod.ArraySearchModifier
 * @extends ArrayMod.ArrayFilterModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArraySearchModifier = ArrayFilterModifier.ArrayFilterModifier.extend({
  type : "search",

  /**
   * Search string.
   *
   * @property searchString
   * @type String
   */
  searchString : "",

  /**
   * If set to true, all elements matching searchString will be removed, else all elements not matching searchString will be removed.
   *
   * @property negate
   * @type Boolean
   * @default false
   */
  negate : false,

  /**
   * Search string regex object.
   *
   * @property searchRegex
   * @type RegEx
   * @private
   */
  searchRegex : function() {
    var searchString = this.get("searchString") || "";
    searchString = searchString.replace(/([\.\[\]\?\+\*])/g, "\\$1");
    return new RegExp(searchString, "i");
  }.property('searchString'),

  modFun : function(item, value) {
    var negate = this.get("negate"), filter = this.get("searchRegex").test(value)
    return (negate && !filter) || (!negate && filter);
  },

  addModObservers : function(context, method) {
    this._super();
    //handle this seperately
    Ember.addObserver(this, "searchString", context, method+"_each");
    Ember.addObserver(this, "negate", context, method+"_each");
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "searchString", context, method+"_each");
    Ember.removeObserver(this, "negate", context, method+"_each");
  },
});

return {
  ArraySearchModifier : ArraySearchModifier,
};

});

define('array-modifier/array-modifier-types/arrayTagObjectModifier',[
  "ember",
  "lib/ember-utils-core",
  "./arrayFilterModifier",
], function(Ember, Utils, ArrayFilterModifier) {

/**
 * Class for a tag. Never used directly. Passed as an object to ArrayMod.ArrayTagSearchModifier.
 *
 * @class ArrayMod.TagObject
 * @module array-modifier
 * @submodule array-modifier-types
 */
var TagObject = Ember.Object.extend({
  /**
   * Label for the tag.
   *
   * @property label
   * @type String
   */
  label : "",

  /**
   * Value for the tag.
   *
   * @property val
   * @type String
   */
  val : "",

  /**
   * Checked boolean.
   *
   * @property checked
   * @type Boolean
   * @default true
   */
  checked : true,

  /**
   * If set to true, val will be not taken if checked, else val will be taken if checked.
   *
   * @property negate
   * @type Boolean
   * @default false
   */
  negate : false,
});

/**
 * Class to filter elements based on tags.
 *
 * @class ArrayMod.ArrayTagSearchModifier
 * @extends ArrayMod.ArrayFilterModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArrayTagSearchModifier = ArrayFilterModifier.ArrayFilterModifier.extend({
  type : "tagSearch",

  /**
   * Tags to filter with. Elements are ArrayMod.TagObject instances. But passed as objects while creating.
   *
   * @property tags
   */
  tags : Utils.hasMany(TagObject),

  /**
   * Tags that are taken.
   *
   * @property selectedTags
   */
  selectedTags : Ember.computed.filterBy("tags", "checked", true),

  /**
   * Joiner for the tags. Can be "or" or "and".
   *
   * @property joiner
   * @type String
   * @default "or"
   */
  joiner : "or",

  modFun : function(item, value) {
    var tags = this.get("selectedTags"), joiner = this.get("joiner") == "and", bool = joiner;
    for(var i = 0; i < tags.length; i++) {
      var res = value == tags[i].get("val"), tagNegate = tags[i].get("negate");
      res = (tagNegate && !res) || (!tagNegate && res);
      bool = (joiner && (bool && res)) || (!joiner && (bool || res));
    }
    return bool;
  },

  addModObservers : function(context, method) {
    this._super();
    //handle this seperately
    Ember.addObserver(this, "selectedTags.@each.val",    context, method+"_each");
    Ember.addObserver(this, "selectedTags.@each.negate", context, method+"_each");
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "selectedTags.@each.val",    context, method+"_each");
    Ember.removeObserver(this, "selectedTags.@each.negate", context, method+"_each");
  },
});

return {
  ArrayTagSearchModifier : ArrayTagSearchModifier,
};

});

define('array-modifier/array-modifier-types/arraySortModifier',[
  "ember",
  "./arrayModifier",
], function(Ember, ArrayModifier) {

/**
 * Class to sort elements in the array.
 *
 * @class ArrayMod.ArraySortModifier
 * @extends ArrayMod.ArrayModifier
 * @module array-modifier
 * @submodule array-modifier-types
 */
var ArraySortModifier = ArrayModifier.ArrayModifier.extend({
  type : "sort",
  groupType : "sort",

  /**
   * Order to sort by. true for ascending, false for descending
   *
   * @property order
   * @type String
   * @default true
   */
  order : true,

  addObserverToAll : false,

  modify : function(array) {
    array.sortBy(this.get("property"));
    if(!this.get("order")) array.reverseObjects();
    return array;
  },

  addModObservers : function(context, method) {
    this._super();
    Ember.addObserver(this, "order", context, method);
  },

  removeModObservers : function(context, method) {
    this._super();
    Ember.removeObserver(this, "order", context, method);
  },
});


return {
  ArraySortModifier : ArraySortModifier,
};

});

/**
 * Array modifier types
 *
 * @submodule array-modifier-types
 * @module array-modifier
 */
define('array-modifier/array-modifier-types/main',[
  "./arrayModifier",
  "./arrayFilterModifier",
  "./arraySearchModifier",
  "./arrayTagObjectModifier",
  "./arraySortModifier",
], function(ArrayModifier, ArrayFilterModifier, ArraySearchModifier, ArrayTagSearchModifier, ArraySortModifier) {
  var ArrayModTypes = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ArrayModTypes[k] = arguments[i][k];
      }
    }
  }
  ArrayModTypes.ArrayModMap = {
    basic : ArrayModifier.ArrayModifier,
    filter : ArrayFilterModifier.ArrayFilterModifier,
    search : ArraySearchModifier.ArraySearchModifier,
    tagSearch : ArrayTagSearchModifier.ArrayTagSearchModifier,
    sort : ArraySortModifier.ArraySortModifier,
  };

  return ArrayModTypes;
});

define('array-modifier/array-modifier-groups/arrayModGroup',[
  "ember",
  "../array-modifier-types/main",
  "lib/ember-utils-core",
], function(Ember, ArrayModType, Utils) {

/** 
 * Basic array modifier group.
 *
 * @class ArrayMod.ArrayModGroup
 * @module array-modifier
 * @submodule array-modifier-groups
 */
var ArrayModGroup = Ember.Object.extend(Utils.ObjectWithArrayMixin, {
  type : "basic",

  /**
   * Array modifiers present in the group. Use object while creating.
   *
   * @property arrayMods
   * @type Array
   */
  arrayMods : Utils.hasMany(ArrayModType.ArrayModMap, "type"),

  arrayProps : ['arrayMods'],
  idx : 0,

  /**
   * Method that returns whether an item can be added or not.
   *
   * @method canAdd
   * @param {Class} item Item that is to be checked whether it can be added or not.
   * @returns {Boolean}
   */
  canAdd : function(item) {
    return true;
  },

  modify : function(array) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      array = arrayMods[i].modify(array);
    }
    return array;
  },
});

return {
  ArrayModGroup : ArrayModGroup,
};

});

define('array-modifier/array-modifier-groups/arrayFilterGroup',[
  "ember",
  "./arrayModGroup",
], function(Ember, ArrayModGroup) {

/** 
 * Array filter modifier group which has ArrayMod.ArrayFilterModifier and ArrayMod.ArraySearchModifier
 *
 * @class ArrayMod.ArrayFilterGroup
 * @extends ArrayMod.ArrayModGroup
 * @module array-modifier
 * @submodule array-modifier-groups
 */
var ArrayFilterGroup = ArrayModGroup.ArrayModGroup.extend({
  type : "filter",

  canAdd : function(item) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      var value = item.get(arrayMods[i].get("property"));
      if(!arrayMods[i].modFun(item, value)) {
        return false;
      }
    }
    return true;
  },

  modify : function(array) {
    var that = this;
    return array.filter(function(item) {
      return that.canAdd(item);
    }, this);
  },

  modifySingle : function(array, item, idx) {
    if(this.canAdd(item)) {
      if(!array.contains(item)) {
        if(idx === -1) {
          array.pushObject(item);
        }
        else {
          array.insertAt(idx, item);
        }
      }
      return true;
    }
    else if(array.contains(item)) {
      array.removeObject(item);
    }
    return false;
  },
});

return {
  ArrayFilterGroup : ArrayFilterGroup,
};

});

define('array-modifier/array-modifier-groups/arraySortGroup',[
  "ember",
  "./arrayModGroup",
], function(Ember, ArrayModGroup) {

/** 
 * Array sort modifier group.
 *
 * @class ArrayMod.ArraySortGroup
 * @extends ArrayMod.ArrayModGroup
 * @module array-modifier
 * @submodule array-modifier-groups
 */
var Compare = function(a, b) {
  return a === b ? 0 : (a > b ? 1 : -1);
};
var ArraySortGroup = ArrayModGroup.ArrayModGroup.extend({
  type : "sort",

  compare : function(a, b) {
    var arrayMods = this.get("arrayMods");
    for(var i = 0; i < arrayMods.length; i++) {
      var av = a.get(arrayMods[i].get("property")),
          bv = b.get(arrayMods[i].get("property")),
          cmp = Compare(av, bv),
          order = arrayMods[i].get("order");
      if(!order) {
        cmp = -cmp;
      }
      if(cmp) {
        return cmp;
      }
      else {
        continue;
      }
    }
    return 0;
  },

  modify : function(array) {
    var that = this;
    return array.sort(function(a, b) {
      return that.compare(a, b);
    }, this);
  },

  modifySingle : function(array, item, idx) {
    var that = this;
    if(array.contains(item)) {
      array.removeObject(item);
    }
    Utils.binaryInsert(array, item, function(a, b) {
      return that.compare(a, b);
    });
    return true;
  },
});

return {
  ArraySortGroup : ArraySortGroup,
  Compare : Compare,
};

});

/**
 * Module to handle array modification like sorting, searching and filtering.
 *
 * @module array-modifier-groups
 */
define('array-modifier/array-modifier-groups/main',[
  "./arrayModGroup",
  "./arrayFilterGroup",
  "./arraySortGroup",
], function(ArrayModGroup, ArrayFilterGroup, ArraySortGroup) {
  var ArrayModGroup = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ArrayModGroup[k] = arguments[i][k];
      }
    }
  }

  ArrayModGroup.ArrayModGroupMap = {
    basic : ArrayModGroup.ArrayModGroup,
    filter : ArrayFilterGroup.ArrayFilterGroup,
    sort : ArraySortGroup.ArraySortGroup,
  };

  return ArrayModGroup;
});

define('array-modifier/arrayModController',[
  "ember",
  "lib/ember-utils-core",
  "../timer/main",
  "./array-modifier-types/main",
  "./array-modifier-groups/main",
], function(Ember, Utils, Timer, ArrayModType, ArrayModGroup) {

/**
 * Array controller which will modify the array on 'content' and put it under 'arrangedContent'.
 *
 * @class ArrayMod.ArrayModController
 */
//TODO : revisit the observers addition and deletion
var ArrayModController = Ember.ArrayController.extend(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
  },

  unique_id : function() {
    return Utils.getEmberId(this);
  }.property(),

  /**
   * Array mods added to the controller.
   *
   * @property arrayMods
   * @type Array
   */
  //arrayMods : Utils.hasMany(ArrayModType.ArrayModMap, "type"),
  arrayMods : null,

  /**
   * Array mods groups formed by arrayMods.
   *
   * @property arrayMods
   * @type Array
   * @readOnly
   */
  //arrayModGrps : Utils.hasMany(ArrayModGroup.ArrayModGroupMap, "type"),
  arrayModGrps : null,

  arrayProps : ['arrayMods', 'arrayModGrps'],
  //not firing on adding new objects!
  isModified : function() {
    var arrayModGrps = this.get('arrayModGrps');
    return !!arrayModGrps && arrayModGrps.length > 0;
  }.property('arrayModGrps.@each'),

  addArrayModToGroup : function(arrayMod) {
    var arrayModGrps = this.get("arrayModGrps"), arrayModGrp = arrayModGrps.findBy("type", arrayMod.get("groupType")),
        arrayMods = this.get("arrayMods");
    if(arrayModGrp) {
      Utils.binaryInsert(arrayModGrp.get("arrayMods"), arrayMod, function(a, b) {
        return ArrayModGroup.Compare(arrayMods.indexOf(a), arrayMods.indexOf(b));
      });
    }
    else {
      arrayModGrp = ArrayMod.ArrayModGroupMap[arrayMod.get("groupType")].create({
        arrayMods : [arrayMod],
        idx : arrayMods.indexOf(arrayMod),
      });
      Utils.binaryInsert(arrayModGrps, arrayModGrp, function(a, b) {
        return ArrayModGroup.Compare(arrayMods.indexOf(a), arrayMods.indexOf(b));
      });
    }
  },

  removeArrayModFromGroup : function(arrayMod) {
    var arrayModGrps = this.get("arrayModGrps"), arrayModGrp = arrayModGrps.findBy("type", arrayMod.get("groupType")),
        arrayMods = arrayModGrp.get("arrayMods");
    if(arrayModGrp) {
      arrayMods.removeObject(arrayMod);
      if(arrayMods.length === 0) {
        arrayModGrps.removeObject(arrayModGrp);
      }
    }
  },

  arrayModsWillBeDeleted : function(deletedArrayMods, idx) {
    var content = this.get("content") || [], arrangedContent = this.get("arrangedContent"),
        that = this;
    for(var i = 0; i < deletedArrayMods.length; i++) {
      var arrayMod = deletedArrayMods[i];
      arrayMod.removeModObservers(this, "arrayModsDidChange");
      content.forEach(function(item) {
        if(this.arrayMod.get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.addObserver(item, this.arrayMod.get("property"), this.that, "contentItemPropertyDidChange");
        }
      }, {that : this, arrayMod : arrayMod, arrangedContent : arrangedContent});
      this.removeArrayModFromGroup(arrayMod);
    }
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },
  arrayModsWasAdded : function(addedArrayMods, idx) {
    var content = this.get("content") || [], arrangedContent = this.get("arrangedContent"),
        that = this;
    for(var i = 0; i < addedArrayMods.length; i++) {
      var arrayMod = addedArrayMods[i];
      arrayMod.addModObservers(this, "arrayModsDidChange");
      content.forEach(function(item) {
        if(this.arrayMod.get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.removeObserver(item, this.arrayMod.get("property"), this.that, "contentItemPropertyDidChange");
        }
      }, {that : this, arrayMod : arrayMod, arrangedContent : arrangedContent});
      this.addArrayModToGroup(arrayMod);
    }
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },

  addObserversToItems : function(override, arranged) {
    var content = override || this.get("content") || [], arrangedContent = arranged || this.get("arrangedContent"),
        arrayMods = this.get("arrayMods");
    content.forEach(function(item) {
      for(var i = 0; i < this.arrayMods.length; i++) {
        if(this.arrayMods[i].get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.addObserver(item, this.arrayMods[i].get("property"), this.that, "contentItemPropertyDidChange");
        }
      }
    }, {that : this, arrayMods : arrayMods, arrangedContent : arrangedContent});
  },

  removeObserversFromItems : function(override, arranged) {
    var content = override || this.get("content") || [], arrangedContent = arranged || this.get("arrangedContent"),
        arrayMods = this.get("arrayMods");
    content.forEach(function(item) {
      for(var i = 0; i < this.arrayMods.length; i++) {
        if(this.arrayMods[i].get("addObserverToAll") || this.arrangedContent.contains(item)) {
          Ember.removeObserver(item, this.arrayMods[i].get("property"), this.that, "contentItemPropertyDidChange");
        }
      }
    }, {that : this, arrayMods : arrayMods, arrangedContent : arrangedContent});
  },

  arrayModsDidChange : function() {
    var that = this;
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged", 250).then(function() {
      that.notifyPropertyChange("arrangedContent");
    });
  },

  arrayModsDidChange_each : function() {
    var that = this;
    Timer.addToQue(this.get("unique_id")+"__ArrayModChanged_Each", 500).then(function() {
      var content = that.get("content"), arrangedContent = that.get("arrangedContent"),
          arrayModGrps = that.get('arrayModGrps');
      //enclose the operation in a run loop to decrease the view render overhead
      Ember.run(function() {
        for(var i = 0; i < content.get("length"); i++) {
          var item = content.objectAt(i), inArrangedContent = arrangedContent.contains(item),
              canAdd = true;
          for(var j = 0; j < arrayModGrps.length; j++) {
            if(!arrayModGrps[j].canAdd(item)) {
              canAdd = false;
              break;
            }
          }
          if(inArrangedContent && !canAdd) {
            arrangedContent.removeObject(item);
          }
          else if(!inArrangedContent && canAdd) {
            for(var j = 0; j < arrayModGrps.length; j++) {
              if(!arrayModGrps[j].modifySingle(arrangedContent, item, arrangedContent.indexOf(item))) {
                break;
              }
            }
          }
        }
      });
    });
  },

  destroy : function() {
    this.removeObserversFromItems();
    return this._super();
  },

  arrangedContent : Ember.computed('content', function(key, value) {
    var content = this.get('content'), retcontent,
        arrayModGrps = this.get('arrayModGrps'),
        isModified = !!arrayModGrps && arrayModGrps.length > 0,
        that = this, hasContent = content && (content.length > 0 || (content.get && content.get("length") > 0));

    if(content) {
      retcontent = content.slice();
      if(isModified) {
        for(var i = 0; i < arrayModGrps.length; i++) {
          if(retcontent.length > 0) {
            retcontent = arrayModGrps[i].modify(retcontent);
          }
        }
        this.addObserversToItems(content, retcontent);
      }
      return Ember.A(retcontent);
    }

    return Ember.A([]);
  }),

  _contentWillChange : Ember.beforeObserver('content', function() {
    this.removeObserversFromItems();
    this._super();
  }),

  contentArrayWillChange : function(array, idx, removedCount, addedCount) {
    var isModified = this.get('isModified');
    if(isModified) {
      var arrangedContent = this.get('arrangedContent'),
          removedObjects = array.slice(idx, idx+removedCount),
          arrayModGrps = this.get('arrayModGrps');
      this.removeObserversFromItems(removedObjects);
      removedObjects.forEach(function(item) {
        this.removeObject(item);
      }, arrangedContent);
    }
  },

  contentArrayDidChange : function(array, idx, removedCount, addedCount) {
    var isModified = this.get('isModified');
    if(isModified) {
      var arrangedContent = this.get('arrangedContent'),
          addedObjects = array.slice(idx, idx+addedCount),
          arrayModGrps = this.get('arrayModGrps');
      this.addObserversToItems(addedObjects);
      for(var i = 0; i < addedObjects.length; i++) {
        for(var j = 0; j < arrayModGrps.length; j++) {
          if(!arrayModGrps[j].modifySingle(arrangedContent, addedObjects[i], arrangedContent.indexOf(addedObjects[i]))) {
            break;
          }
        }
      }
    }
  },

  contentItemPropertyDidChange : function(item) {
    var arrayModGrps = this.get('arrayModGrps'),
        arrangedContent = this.get("arrangedContent");
    for(var i = 0; i < arrayModGrps.length; i++) {
      if(!arrayModGrps[i].modifySingle(arrangedContent, item, arrangedContent.indexOf(item))) {
        break;
      }
    }
  },
});

return {
  ArrayModController : ArrayModController,
};

});

/**
 * Module to handle array modification like sorting, searching and filtering.
 *
 * @module array-modifier
 */
define('array-modifier/main',[
  "./array-modifier-groups/main",
  "./array-modifier-types/main",
  "./arrayModController",
], function() {
  var ArrayMod = Ember.Namespace.create();
  window.ArrayMod = ArrayMod;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ArrayMod[k] = arguments[i][k];
      }
    }
  }

  return ArrayMod;
});

(function(global){
var define, requireModule, require, requirejs;

(function() {

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    };
  } else {
    _isArray = Array.isArray;
  }
  
  var registry = {}, seen = {}, state = {};
  var FAILED = false;

  define = function(name, deps, callback) {
  
    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }
  
    registry[name] = {
      deps: deps,
      callback: callback
    };
  };

  function reify(deps, name, seen) {
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    var exports;

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        exports = reified[i] = seen;
      } else {
        reified[i] = require(resolve(dep, name));
      }
    }

    return {
      deps: reified,
      exports: exports
    };
  }

  requirejs = require = requireModule = function(name) {
    if (state[name] !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    if (!registry[name]) {
      throw new Error('Could not find module ' + name);
    }

    var mod = registry[name];
    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    try {
      reified = reify(mod.deps, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    } finally {
      if (!loaded) {
        state[name] = FAILED;
      }
    }

    return reified.exports ? seen[name] : (seen[name] = module);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase;

    if (nameParts.length === 1) {
      parentBase = nameParts;
    } else {
      parentBase = nameParts.slice(0, -1);
    }

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') { parentBase.pop(); }
      else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

define("activemodel-adapter",
  ["activemodel-adapter/system","exports"],
  function(__dependency1__, __exports__) {
    
    var ActiveModelAdapter = __dependency1__.ActiveModelAdapter;
    var ActiveModelSerializer = __dependency1__.ActiveModelSerializer;

    __exports__.ActiveModelAdapter = ActiveModelAdapter;
    __exports__.ActiveModelSerializer = ActiveModelSerializer;
  });
define("activemodel-adapter/setup-container",
  ["ember-data/system/container_proxy","activemodel-adapter/system/active_model_serializer","activemodel-adapter/system/active_model_adapter","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var ContainerProxy = __dependency1__["default"];
    var ActiveModelSerializer = __dependency2__["default"];
    var ActiveModelAdapter = __dependency3__["default"];

    __exports__["default"] = function setupActiveModelAdapter(container, application){
      var proxy = new ContainerProxy(container);
      proxy.registerDeprecations([
        { deprecated: 'serializer:_ams',  valid: 'serializer:-active-model' },
        { deprecated: 'adapter:_ams',     valid: 'adapter:-active-model' }
      ]);

      container.register('serializer:-active-model', ActiveModelSerializer);
      container.register('adapter:-active-model', ActiveModelAdapter);
    };
  });
define("activemodel-adapter/system",
  ["activemodel-adapter/system/active_model_adapter","activemodel-adapter/system/active_model_serializer","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var ActiveModelAdapter = __dependency1__["default"];
    var ActiveModelSerializer = __dependency2__["default"];

    __exports__.ActiveModelAdapter = ActiveModelAdapter;
    __exports__.ActiveModelSerializer = ActiveModelSerializer;
  });
define("activemodel-adapter/system/active_model_adapter",
  ["ember-data/adapters","ember-data/system/adapter","ember-inflector","activemodel-adapter/system/active_model_serializer","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    var RESTAdapter = __dependency1__.RESTAdapter;
    var InvalidError = __dependency2__.InvalidError;
    var pluralize = __dependency3__.pluralize;
    var ActiveModelSerializer = __dependency4__["default"];

    /**
      @module ember-data
    */

    var forEach = Ember.EnumerableUtils.forEach;
    var decamelize = Ember.String.decamelize,
        underscore = Ember.String.underscore;

    /**
      The ActiveModelAdapter is a subclass of the RESTAdapter designed to integrate
      with a JSON API that uses an underscored naming convention instead of camelCasing.
      It has been designed to work out of the box with the
      [active_model_serializers](http://github.com/rails-api/active_model_serializers)
      Ruby gem. This Adapter expects specific settings using ActiveModel::Serializers,
      `embed :ids, include: true` which sideloads the records.

      This adapter extends the DS.RESTAdapter by making consistent use of the camelization,
      decamelization and pluralization methods to normalize the serialized JSON into a
      format that is compatible with a conventional Rails backend and Ember Data.

      ## JSON Structure

      The ActiveModelAdapter expects the JSON returned from your server to follow
      the REST adapter conventions substituting underscored keys for camelcased ones.

      Unlike the DS.RESTAdapter, async relationship keys must be the singular form
      of the relationship name, followed by "_id" for DS.belongsTo relationships,
      or "_ids" for DS.hasMany relationships.

      ### Conventional Names

      Attribute names in your JSON payload should be the underscored versions of
      the attributes in your Ember.js models.

      For example, if you have a `Person` model:

      ```js
      App.FamousPerson = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.attr('string')
      });
      ```

      The JSON returned should look like this:

      ```js
      {
        "famous_person": {
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation": "President"
        }
      }
      ```

      Let's imagine that `Occupation` is just another model:

      ```js
      App.Person = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.belongsTo('occupation')
      });

      App.Occupation = DS.Model.extend({
        name: DS.attr('string'),
        salary: DS.attr('number'),
        people: DS.hasMany('person')
      });
      ```

      The JSON needed to avoid extra server calls, should look like this:

      ```js
      {
        "people": [{
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation_id": 1
        }],

        "occupations": [{
          "id": 1,
          "name": "President",
          "salary": 100000,
          "person_ids": [1]
        }]
      }
      ```

      @class ActiveModelAdapter
      @constructor
      @namespace DS
      @extends DS.RESTAdapter
    **/

    var ActiveModelAdapter = RESTAdapter.extend({
      defaultSerializer: '-active-model',
      /**
        The ActiveModelAdapter overrides the `pathForType` method to build
        underscored URLs by decamelizing and pluralizing the object type name.

        ```js
          this.pathForType("famousPerson");
          //=> "famous_people"
        ```

        @method pathForType
        @param {String} type
        @return String
      */
      pathForType: function(type) {
        var decamelized = decamelize(type);
        var underscored = underscore(decamelized);
        return pluralize(underscored);
      },

      /**
        The ActiveModelAdapter overrides the `ajaxError` method
        to return a DS.InvalidError for all 422 Unprocessable Entity
        responses.

        A 422 HTTP response from the server generally implies that the request
        was well formed but the API was unable to process it because the
        content was not semantically correct or meaningful per the API.

        For more information on 422 HTTP Error code see 11.2 WebDAV RFC 4918
        https://tools.ietf.org/html/rfc4918#section-11.2

        @method ajaxError
        @param jqXHR
        @return error
      */
      ajaxError: function(jqXHR) {
        var error = this._super(jqXHR);

        if (jqXHR && jqXHR.status === 422) {
          var response = Ember.$.parseJSON(jqXHR.responseText),
              errors = {};

          if (response.errors !== undefined) {
            var jsonErrors = response.errors;

            forEach(Ember.keys(jsonErrors), function(key) {
              errors[Ember.String.camelize(key)] = jsonErrors[key];
            });
          }

          return new InvalidError(errors);
        } else {
          return error;
        }
      }
    });

    __exports__["default"] = ActiveModelAdapter;
  });
define("activemodel-adapter/system/active_model_serializer",
  ["ember-inflector","ember-data/serializers/rest_serializer","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var singularize = __dependency1__.singularize;
    var RESTSerializer = __dependency2__["default"];
    /**
      @module ember-data
    */

    var get = Ember.get,
        forEach = Ember.EnumerableUtils.forEach,
        camelize =   Ember.String.camelize,
        capitalize = Ember.String.capitalize,
        decamelize = Ember.String.decamelize,
        underscore = Ember.String.underscore;
    /**
      The ActiveModelSerializer is a subclass of the RESTSerializer designed to integrate
      with a JSON API that uses an underscored naming convention instead of camelCasing.
      It has been designed to work out of the box with the
      [active_model_serializers](http://github.com/rails-api/active_model_serializers)
      Ruby gem. This Serializer expects specific settings using ActiveModel::Serializers,
      `embed :ids, include: true` which sideloads the records.

      This serializer extends the DS.RESTSerializer by making consistent
      use of the camelization, decamelization and pluralization methods to
      normalize the serialized JSON into a format that is compatible with
      a conventional Rails backend and Ember Data.

      ## JSON Structure

      The ActiveModelSerializer expects the JSON returned from your server
      to follow the REST adapter conventions substituting underscored keys
      for camelcased ones.

      ### Conventional Names

      Attribute names in your JSON payload should be the underscored versions of
      the attributes in your Ember.js models.

      For example, if you have a `Person` model:

      ```js
      App.FamousPerson = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.attr('string')
      });
      ```

      The JSON returned should look like this:

      ```js
      {
        "famous_person": {
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation": "President"
        }
      }
      ```

      Let's imagine that `Occupation` is just another model:

      ```js
      App.Person = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.belongsTo('occupation')
      });

      App.Occupation = DS.Model.extend({
        name: DS.attr('string'),
        salary: DS.attr('number'),
        people: DS.hasMany('person')
      });
      ```

      The JSON needed to avoid extra server calls, should look like this:

      ```js
      {
        "people": [{
          "id": 1,
          "first_name": "Barack",
          "last_name": "Obama",
          "occupation_id": 1
        }],

        "occupations": [{
          "id": 1,
          "name": "President",
          "salary": 100000,
          "person_ids": [1]
        }]
      }
      ```

      @class ActiveModelSerializer
      @namespace DS
      @extends DS.RESTSerializer
    */
    var ActiveModelSerializer = RESTSerializer.extend({
      // SERIALIZE

      /**
        Converts camelCased attributes to underscored when serializing.

        @method keyForAttribute
        @param {String} attribute
        @return String
      */
      keyForAttribute: function(attr) {
        return decamelize(attr);
      },

      /**
        Underscores relationship names and appends "_id" or "_ids" when serializing
        relationship keys.

        @method keyForRelationship
        @param {String} key
        @param {String} kind
        @return String
      */
      keyForRelationship: function(rawKey, kind) {
        var key = decamelize(rawKey);
        if (kind === "belongsTo") {
          return key + "_id";
        } else if (kind === "hasMany") {
          return singularize(key) + "_ids";
        } else {
          return key;
        }
      },

      /*
        Does not serialize hasMany relationships by default.
      */
      serializeHasMany: Ember.K,

      /**
        Underscores the JSON root keys when serializing.

        @method serializeIntoHash
        @param {Object} hash
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @param {Object} options
      */
      serializeIntoHash: function(data, type, record, options) {
        var root = underscore(decamelize(type.typeKey));
        data[root] = this.serialize(record, options);
      },

      /**
        Serializes a polymorphic type as a fully capitalized model name.

        @method serializePolymorphicType
        @param {DS.Model} record
        @param {Object} json
        @param relationship
      */
      serializePolymorphicType: function(record, json, relationship) {
        var key = relationship.key;
        var belongsTo = get(record, key);
        var jsonKey = underscore(key + "_type");

        if (Ember.isNone(belongsTo)) {
          json[jsonKey] = null;
        } else {
          json[jsonKey] = capitalize(camelize(belongsTo.constructor.typeKey));
        }
      },

      // EXTRACT

      /**
        Add extra step to `DS.RESTSerializer.normalize` so links are normalized.

        If your payload looks like:

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "links": { "flagged_comments": "api/comments/flagged" }
          }
        }
        ```

        The normalized version would look like this

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "links": { "flaggedComments": "api/comments/flagged" }
          }
        }
        ```

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @param {String} prop
        @return Object
      */

      normalize: function(type, hash, prop) {
        this.normalizeLinks(hash);

        return this._super(type, hash, prop);
      },

      /**
        Convert `snake_cased` links  to `camelCase`

        @method normalizeLinks
        @param {Object} data
      */

      normalizeLinks: function(data){
        if (data.links) {
          var links = data.links;

          for (var link in links) {
            var camelizedLink = camelize(link);

            if (camelizedLink !== link) {
              links[camelizedLink] = links[link];
              delete links[link];
            }
          }
        }
      },

      /**
        Normalize the polymorphic type from the JSON.

        Normalize:
        ```js
          {
            id: "1"
            minion: { type: "evil_minion", id: "12"}
          }
        ```

        To:
        ```js
          {
            id: "1"
            minion: { type: "evilMinion", id: "12"}
          }
        ```

        @method normalizeRelationships
        @private
      */
      normalizeRelationships: function(type, hash) {

        if (this.keyForRelationship) {
          type.eachRelationship(function(key, relationship) {
            var payloadKey, payload;
            if (relationship.options.polymorphic) {
              payloadKey = this.keyForAttribute(key);
              payload = hash[payloadKey];
              if (payload && payload.type) {
                payload.type = this.typeForRoot(payload.type);
              } else if (payload && relationship.kind === "hasMany") {
                var self = this;
                forEach(payload, function(single) {
                  single.type = self.typeForRoot(single.type);
                });
              }
            } else {
              payloadKey = this.keyForRelationship(key, relationship.kind);
              if (!hash.hasOwnProperty(payloadKey)) { return; }
              payload = hash[payloadKey];
            }

            hash[key] = payload;

            if (key !== payloadKey) {
              delete hash[payloadKey];
            }
          }, this);
        }
      }
    });

    __exports__["default"] = ActiveModelSerializer;
  });
define("ember-data",
  ["ember-data/core","ember-data/ext/date","ember-data/system/store","ember-data/system/model","ember-data/system/changes","ember-data/system/adapter","ember-data/system/debug","ember-data/system/record_arrays","ember-data/system/record_array_manager","ember-data/adapters","ember-data/serializers/json_serializer","ember-data/serializers/rest_serializer","ember-inflector","ember-data/serializers/embedded_records_mixin","activemodel-adapter","ember-data/transforms","ember-data/system/relationships","ember-data/ember-initializer","ember-data/setup-container","ember-data/system/container_proxy","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __exports__) {
    
    /**
      Ember Data

      @module ember-data
      @main ember-data
    */

    // support RSVP 2.x via resolve,  but prefer RSVP 3.x's Promise.cast
    Ember.RSVP.Promise.cast = Ember.RSVP.Promise.cast || Ember.RSVP.resolve;

    var DS = __dependency1__["default"];

    var Store = __dependency3__.Store;
    var PromiseArray = __dependency3__.PromiseArray;
    var PromiseObject = __dependency3__.PromiseObject;
    var Model = __dependency4__.Model;
    var Errors = __dependency4__.Errors;
    var RootState = __dependency4__.RootState;
    var attr = __dependency4__.attr;
    var AttributeChange = __dependency5__.AttributeChange;
    var RelationshipChange = __dependency5__.RelationshipChange;
    var RelationshipChangeAdd = __dependency5__.RelationshipChangeAdd;
    var RelationshipChangeRemove = __dependency5__.RelationshipChangeRemove;
    var OneToManyChange = __dependency5__.OneToManyChange;
    var ManyToNoneChange = __dependency5__.ManyToNoneChange;
    var OneToOneChange = __dependency5__.OneToOneChange;
    var ManyToManyChange = __dependency5__.ManyToManyChange;
    var InvalidError = __dependency6__.InvalidError;
    var Adapter = __dependency6__.Adapter;
    var DebugAdapter = __dependency7__["default"];
    var RecordArray = __dependency8__.RecordArray;
    var FilteredRecordArray = __dependency8__.FilteredRecordArray;
    var AdapterPopulatedRecordArray = __dependency8__.AdapterPopulatedRecordArray;
    var ManyArray = __dependency8__.ManyArray;
    var RecordArrayManager = __dependency9__["default"];
    var RESTAdapter = __dependency10__.RESTAdapter;
    var FixtureAdapter = __dependency10__.FixtureAdapter;
    var JSONSerializer = __dependency11__["default"];
    var RESTSerializer = __dependency12__["default"];
    var EmbeddedRecordsMixin = __dependency14__["default"];
    var ActiveModelAdapter = __dependency15__.ActiveModelAdapter;
    var ActiveModelSerializer = __dependency15__.ActiveModelSerializer;

    var Transform = __dependency16__.Transform;
    var DateTransform = __dependency16__.DateTransform;
    var NumberTransform = __dependency16__.NumberTransform;
    var StringTransform = __dependency16__.StringTransform;
    var BooleanTransform = __dependency16__.BooleanTransform;

    var hasMany = __dependency17__.hasMany;
    var belongsTo = __dependency17__.belongsTo;
    var setupContainer = __dependency19__["default"];

    var ContainerProxy = __dependency20__["default"];

    DS.Store         = Store;
    DS.PromiseArray  = PromiseArray;
    DS.PromiseObject = PromiseObject;

    DS.Model     = Model;
    DS.RootState = RootState;
    DS.attr      = attr;
    DS.Errors    = Errors;

    DS.AttributeChange       = AttributeChange;
    DS.RelationshipChange    = RelationshipChange;
    DS.RelationshipChangeAdd = RelationshipChangeAdd;
    DS.OneToManyChange       = OneToManyChange;
    DS.ManyToNoneChange      = OneToManyChange;
    DS.OneToOneChange        = OneToOneChange;
    DS.ManyToManyChange      = ManyToManyChange;

    DS.Adapter      = Adapter;
    DS.InvalidError = InvalidError;

    DS.DebugAdapter = DebugAdapter;

    DS.RecordArray                 = RecordArray;
    DS.FilteredRecordArray         = FilteredRecordArray;
    DS.AdapterPopulatedRecordArray = AdapterPopulatedRecordArray;
    DS.ManyArray                   = ManyArray;

    DS.RecordArrayManager = RecordArrayManager;

    DS.RESTAdapter    = RESTAdapter;
    DS.FixtureAdapter = FixtureAdapter;

    DS.RESTSerializer = RESTSerializer;
    DS.JSONSerializer = JSONSerializer;

    DS.Transform       = Transform;
    DS.DateTransform   = DateTransform;
    DS.StringTransform = StringTransform;
    DS.NumberTransform = NumberTransform;
    DS.BooleanTransform = BooleanTransform;

    DS.ActiveModelAdapter    = ActiveModelAdapter;
    DS.ActiveModelSerializer = ActiveModelSerializer;
    DS.EmbeddedRecordsMixin  = EmbeddedRecordsMixin;

    DS.belongsTo = belongsTo;
    DS.hasMany   = hasMany;

    DS.ContainerProxy = ContainerProxy;

    DS._setupContainer = setupContainer;

    Ember.lookup.DS = DS;

    __exports__["default"] = DS;
  });
define("ember-data/adapters",
  ["ember-data/adapters/fixture_adapter","ember-data/adapters/rest_adapter","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    /**
      @module ember-data
    */

    var FixtureAdapter = __dependency1__["default"];
    var RESTAdapter = __dependency2__["default"];

    __exports__.RESTAdapter = RESTAdapter;
    __exports__.FixtureAdapter = FixtureAdapter;
  });
define("ember-data/adapters/fixture_adapter",
  ["ember-data/system/adapter","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      @module ember-data
    */

    var get = Ember.get;
    var fmt = Ember.String.fmt;
    var indexOf = Ember.EnumerableUtils.indexOf;

    var counter = 0;

    var Adapter = __dependency1__["default"];

    /**
      `DS.FixtureAdapter` is an adapter that loads records from memory.
      It's primarily used for development and testing. You can also use
      `DS.FixtureAdapter` while working on the API but is not ready to
      integrate yet. It is a fully functioning adapter. All CRUD methods
      are implemented. You can also implement query logic that a remote
      system would do. It's possible to develop your entire application
      with `DS.FixtureAdapter`.

      For information on how to use the `FixtureAdapter` in your
      application please see the [FixtureAdapter
      guide](/guides/models/the-fixture-adapter/).

      @class FixtureAdapter
      @namespace DS
      @extends DS.Adapter
    */
    __exports__["default"] = Adapter.extend({
      // by default, fixtures are already in normalized form
      serializer: null,

      /**
        If `simulateRemoteResponse` is `true` the `FixtureAdapter` will
        wait a number of milliseconds before resolving promises with the
        fixture values. The wait time can be configured via the `latency`
        property.

        @property simulateRemoteResponse
        @type {Boolean}
        @default true
      */
      simulateRemoteResponse: true,

      /**
        By default the `FixtureAdapter` will simulate a wait of the
        `latency` milliseconds before resolving promises with the fixture
        values. This behavior can be turned off via the
        `simulateRemoteResponse` property.

        @property latency
        @type {Number}
        @default 50
      */
      latency: 50,

      /**
        Implement this method in order to provide data associated with a type

        @method fixturesForType
        @param {Subclass of DS.Model} type
        @return {Array}
      */
      fixturesForType: function(type) {
        if (type.FIXTURES) {
          var fixtures = Ember.A(type.FIXTURES);
          return fixtures.map(function(fixture){
            var fixtureIdType = typeof fixture.id;
            if(fixtureIdType !== "number" && fixtureIdType !== "string"){
              throw new Error(fmt('the id property must be defined as a number or string for fixture %@', [fixture]));
            }
            fixture.id = fixture.id + '';
            return fixture;
          });
        }
        return null;
      },

      /**
        Implement this method in order to query fixtures data

        @method queryFixtures
        @param {Array} fixture
        @param {Object} query
        @param {Subclass of DS.Model} type
        @return {Promise|Array}
      */
      queryFixtures: function(fixtures, query, type) {
        Ember.assert('Not implemented: You must override the DS.FixtureAdapter::queryFixtures method to support querying the fixture store.');
      },

      /**
        @method updateFixtures
        @param {Subclass of DS.Model} type
        @param {Array} fixture
      */
      updateFixtures: function(type, fixture) {
        if(!type.FIXTURES) {
          type.FIXTURES = [];
        }

        var fixtures = type.FIXTURES;

        this.deleteLoadedFixture(type, fixture);

        fixtures.push(fixture);
      },

      /**
        Implement this method in order to provide json for CRUD methods

        @method mockJSON
        @param {Subclass of DS.Model} type
        @param {DS.Model} record
      */
      mockJSON: function(store, type, record) {
        return store.serializerFor(type).serialize(record, { includeId: true });
      },

      /**
        @method generateIdForRecord
        @param {DS.Store} store
        @param {DS.Model} record
        @return {String} id
      */
      generateIdForRecord: function(store) {
        return "fixture-" + counter++;
      },

      /**
        @method find
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} id
        @return {Promise} promise
      */
      find: function(store, type, id) {
        var fixtures = this.fixturesForType(type);
        var fixture;

        Ember.assert("Unable to find fixtures for model type "+type.toString() +". If you're defining your fixtures using `Model.FIXTURES = ...`, please change it to `Model.reopenClass({ FIXTURES: ... })`.", fixtures);

        if (fixtures) {
          fixture = Ember.A(fixtures).findBy('id', id);
        }

        if (fixture) {
          return this.simulateRemoteCall(function() {
            return fixture;
          }, this);
        }
      },

      /**
        @method findMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Array} ids
        @return {Promise} promise
      */
      findMany: function(store, type, ids) {
        var fixtures = this.fixturesForType(type);

        Ember.assert("Unable to find fixtures for model type "+type.toString(), fixtures);

        if (fixtures) {
          fixtures = fixtures.filter(function(item) {
            return indexOf(ids, item.id) !== -1;
          });
        }

        if (fixtures) {
          return this.simulateRemoteCall(function() {
            return fixtures;
          }, this);
        }
      },

      /**
        @private
        @method findAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} sinceToken
        @return {Promise} promise
      */
      findAll: function(store, type) {
        var fixtures = this.fixturesForType(type);

        Ember.assert("Unable to find fixtures for model type "+type.toString(), fixtures);

        return this.simulateRemoteCall(function() {
          return fixtures;
        }, this);
      },

      /**
        @private
        @method findQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} query
        @param {DS.AdapterPopulatedRecordArray} recordArray
        @return {Promise} promise
      */
      findQuery: function(store, type, query, array) {
        var fixtures = this.fixturesForType(type);

        Ember.assert("Unable to find fixtures for model type " + type.toString(), fixtures);

        fixtures = this.queryFixtures(fixtures, query, type);

        if (fixtures) {
          return this.simulateRemoteCall(function() {
            return fixtures;
          }, this);
        }
      },

      /**
        @method createRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      createRecord: function(store, type, record) {
        var fixture = this.mockJSON(store, type, record);

        this.updateFixtures(type, fixture);

        return this.simulateRemoteCall(function() {
          return fixture;
        }, this);
      },

      /**
        @method updateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      updateRecord: function(store, type, record) {
        var fixture = this.mockJSON(store, type, record);

        this.updateFixtures(type, fixture);

        return this.simulateRemoteCall(function() {
          return fixture;
        }, this);
      },

      /**
        @method deleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      deleteRecord: function(store, type, record) {
        this.deleteLoadedFixture(type, record);

        return this.simulateRemoteCall(function() {
          // no payload in a deletion
          return null;
        });
      },

      /*
        @method deleteLoadedFixture
        @private
        @param type
        @param record
      */
      deleteLoadedFixture: function(type, record) {
        var existingFixture = this.findExistingFixture(type, record);

        if (existingFixture) {
          var index = indexOf(type.FIXTURES, existingFixture);
          type.FIXTURES.splice(index, 1);
          return true;
        }
      },

      /*
        @method findExistingFixture
        @private
        @param type
        @param record
      */
      findExistingFixture: function(type, record) {
        var fixtures = this.fixturesForType(type);
        var id = get(record, 'id');

        return this.findFixtureById(fixtures, id);
      },

      /*
        @method findFixtureById
        @private
        @param fixtures
        @param id
      */
      findFixtureById: function(fixtures, id) {
        return Ember.A(fixtures).find(function(r) {
          if (''+get(r, 'id') === ''+id) {
            return true;
          } else {
            return false;
          }
        });
      },

      /*
        @method simulateRemoteCall
        @private
        @param callback
        @param context
      */
      simulateRemoteCall: function(callback, context) {
        var adapter = this;

        return new Ember.RSVP.Promise(function(resolve) {
          if (get(adapter, 'simulateRemoteResponse')) {
            // Schedule with setTimeout
            Ember.run.later(function() {
              resolve(callback.call(context));
            }, get(adapter, 'latency'));
          } else {
            // Asynchronous, but at the of the runloop with zero latency
            Ember.run.schedule('actions', null, function() {
              resolve(callback.call(context));
            });
          }
        }, "DS: FixtureAdapter#simulateRemoteCall");
      }
    });
  });
define("ember-data/adapters/rest_adapter",
  ["ember-data/system/adapter","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      @module ember-data
    */

    var Adapter = __dependency1__["default"];
    var get = Ember.get;
    var forEach = Ember.ArrayPolyfills.forEach;

    /**
      The REST adapter allows your store to communicate with an HTTP server by
      transmitting JSON via XHR. Most Ember.js apps that consume a JSON API
      should use the REST adapter.

      This adapter is designed around the idea that the JSON exchanged with
      the server should be conventional.

      ## JSON Structure

      The REST adapter expects the JSON returned from your server to follow
      these conventions.

      ### Object Root

      The JSON payload should be an object that contains the record inside a
      root property. For example, in response to a `GET` request for
      `/posts/1`, the JSON should look like this:

      ```js
      {
        "post": {
          "id": 1,
          "title": "I'm Running to Reform the W3C's Tag",
          "author": "Yehuda Katz"
        }
      }
      ```

      Similarly, in response to a `GET` request for `/posts`, the JSON should
      look like this:

      ```js
      {
        "posts": [
          {
            "id": 1,
            "title": "I'm Running to Reform the W3C's Tag",
            "author": "Yehuda Katz"
          },
          {
            "id": 2,
            "title": "Rails is omakase",
            "author": "D2H"
          }
        ]
      }
      ```

      ### Conventional Names

      Attribute names in your JSON payload should be the camelCased versions of
      the attributes in your Ember.js models.

      For example, if you have a `Person` model:

      ```js
      App.Person = DS.Model.extend({
        firstName: DS.attr('string'),
        lastName: DS.attr('string'),
        occupation: DS.attr('string')
      });
      ```

      The JSON returned should look like this:

      ```js
      {
        "person": {
          "id": 5,
          "firstName": "Barack",
          "lastName": "Obama",
          "occupation": "President"
        }
      }
      ```

      ## Customization

      ### Endpoint path customization

      Endpoint paths can be prefixed with a `namespace` by setting the namespace
      property on the adapter:

      ```js
      DS.RESTAdapter.reopen({
        namespace: 'api/1'
      });
      ```
      Requests for `App.Person` would now target `/api/1/people/1`.

      ### Host customization

      An adapter can target other hosts by setting the `host` property.

      ```js
      DS.RESTAdapter.reopen({
        host: 'https://api.example.com'
      });
      ```

      ### Headers customization

      Some APIs require HTTP headers, e.g. to provide an API key. Arbitrary
      headers can be set as key/value pairs on the `RESTAdapter`'s `headers`
      object and Ember Data will send them along with each ajax request.


      ```js
      App.ApplicationAdapter = DS.RESTAdapter.extend({
        headers: {
          "API_KEY": "secret key",
          "ANOTHER_HEADER": "Some header value"
        }
      });
      ```

      `headers` can also be used as a computed property to support dynamic
      headers. In the example below, the `session` object has been
      injected into an adapter by Ember's container.

      ```js
      App.ApplicationAdapter = DS.RESTAdapter.extend({
        headers: function() {
          return {
            "API_KEY": this.get("session.authToken"),
            "ANOTHER_HEADER": "Some header value"
          };
        }.property("session.authToken")
      });
      ```

      In some cases, your dynamic headers may require data from some
      object outside of Ember's observer system (for example
      `document.cookie`). You can use the
      [volatile](/api/classes/Ember.ComputedProperty.html#method_volatile)
      function to set the property into a non-cached mode causing the headers to
      be recomputed with every request.

      ```js
      App.ApplicationAdapter = DS.RESTAdapter.extend({
        headers: function() {
          return {
            "API_KEY": Ember.get(document.cookie.match(/apiKey\=([^;]*)/), "1"),
            "ANOTHER_HEADER": "Some header value"
          };
        }.property().volatile()
      });
      ```

      @class RESTAdapter
      @constructor
      @namespace DS
      @extends DS.Adapter
    */
    __exports__["default"] = Adapter.extend({
      defaultSerializer: '-rest',

      /**
        By default the RESTAdapter will send each find request coming from a `store.find`
        or from accessing a relationship separately to the server. If your server supports passing
        ids as a query string, you can set coalesceFindRequests to true to coalesce all find requests
        within a single runloop.

        For example, if you have an initial payload of
        ```javascript
        post: {
          id:1,
          comments: [1,2]
        }
        ```

        By default calling `post.get('comments')` will trigger the following requests(assuming the
        comments haven't been loaded before):

        ```
        GET /comments/1
        GET /comments/2
        ```

        If you set coalesceFindRequests to `true` it will instead trigger the following request:

        ```
        GET /comments?ids[]=1&ids[]=2
        ```

        Setting coalesceFindRequests to `true` also works for `store.find` requests and `belongsTo`
        relationships accessed within the same runloop. If you set `coalesceFindRequests: true`

        ```javascript
        store.find('comment', 1);
        store.find('comment', 2);
        ```

        will also send a request to: `GET /comments?ids[]=1&ids[]=2`

        @property coalesceFindRequests
        @type {boolean}
      */
      coalesceFindRequests: false,

      /**
        Endpoint paths can be prefixed with a `namespace` by setting the namespace
        property on the adapter:

        ```javascript
        DS.RESTAdapter.reopen({
          namespace: 'api/1'
        });
        ```

        Requests for `App.Post` would now target `/api/1/post/`.

        @property namespace
        @type {String}
      */

      /**
        An adapter can target other hosts by setting the `host` property.

        ```javascript
        DS.RESTAdapter.reopen({
          host: 'https://api.example.com'
        });
        ```

        Requests for `App.Post` would now target `https://api.example.com/post/`.

        @property host
        @type {String}
      */

      /**
        Some APIs require HTTP headers, e.g. to provide an API
        key. Arbitrary headers can be set as key/value pairs on the
        `RESTAdapter`'s `headers` object and Ember Data will send them
        along with each ajax request. For dynamic headers see [headers
        customization](/api/data/classes/DS.RESTAdapter.html#toc_headers-customization).

        ```javascript
        App.ApplicationAdapter = DS.RESTAdapter.extend({
          headers: {
            "API_KEY": "secret key",
            "ANOTHER_HEADER": "Some header value"
          }
        });
        ```

        @property headers
        @type {Object}
      */

      /**
        Called by the store in order to fetch the JSON for a given
        type and ID.

        The `find` method makes an Ajax request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        This method performs an HTTP `GET` request with the id provided as part of the query string.

        @method find
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} id
        @param {DS.Model} record
        @return {Promise} promise
      */
      find: function(store, type, id, record) {
        return this.ajax(this.buildURL(type.typeKey, id, record), 'GET');
      },

      /**
        Called by the store in order to fetch a JSON array for all
        of the records for a given type.

        The `findAll` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        @private
        @method findAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} sinceToken
        @return {Promise} promise
      */
      findAll: function(store, type, sinceToken) {
        var query;

        if (sinceToken) {
          query = { since: sinceToken };
        }

        return this.ajax(this.buildURL(type.typeKey), 'GET', { data: query });
      },

      /**
        Called by the store in order to fetch a JSON array for
        the records that match a particular query.

        The `findQuery` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        The `query` argument is a simple JavaScript object that will be passed directly
        to the server as parameters.

        @private
        @method findQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} query
        @return {Promise} promise
      */
      findQuery: function(store, type, query) {
        return this.ajax(this.buildURL(type.typeKey), 'GET', { data: query });
      },

      /**
        Called by the store in order to fetch several records together if `coalesceFindRequests` is true

        For example, if the original payload looks like:

        ```js
        {
          "id": 1,
          "title": "Rails is omakase",
          "comments": [ 1, 2, 3 ]
        }
        ```

        The IDs will be passed as a URL-encoded Array of IDs, in this form:

        ```
        ids[]=1&ids[]=2&ids[]=3
        ```

        Many servers, such as Rails and PHP, will automatically convert this URL-encoded array
        into an Array for you on the server-side. If you want to encode the
        IDs, differently, just override this (one-line) method.

        The `findMany` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
        promise for the resulting payload.

        @method findMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Array} ids
        @param {Array} records
        @return {Promise} promise
      */
      findMany: function(store, type, ids, records) {
        return this.ajax(this.buildURL(type.typeKey, ids, records), 'GET', { data: { ids: ids } });
      },

      /**
        Called by the store in order to fetch a JSON array for
        the unloaded records in a has-many relationship that were originally
        specified as a URL (inside of `links`).

        For example, if your original payload looks like this:

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "links": { "comments": "/posts/1/comments" }
          }
        }
        ```

        This method will be called with the parent record and `/posts/1/comments`.

        The `findHasMany` method will make an Ajax (HTTP GET) request to the originally specified URL.
        If the URL is host-relative (starting with a single slash), the
        request will use the host specified on the adapter (if any).

        @method findHasMany
        @param {DS.Store} store
        @param {DS.Model} record
        @param {String} url
        @return {Promise} promise
      */
      findHasMany: function(store, record, url) {
        var host = get(this, 'host');
        var id   = get(record, 'id');
        var type = record.constructor.typeKey;

        if (host && url.charAt(0) === '/' && url.charAt(1) !== '/') {
          url = host + url;
        }

        return this.ajax(this.urlPrefix(url, this.buildURL(type, id)), 'GET');
      },

      /**
        Called by the store in order to fetch a JSON array for
        the unloaded records in a belongs-to relationship that were originally
        specified as a URL (inside of `links`).

        For example, if your original payload looks like this:

        ```js
        {
          "person": {
            "id": 1,
            "name": "Tom Dale",
            "links": { "group": "/people/1/group" }
          }
        }
        ```

        This method will be called with the parent record and `/people/1/group`.

        The `findBelongsTo` method will make an Ajax (HTTP GET) request to the originally specified URL.

        @method findBelongsTo
        @param {DS.Store} store
        @param {DS.Model} record
        @param {String} url
        @return {Promise} promise
      */
      findBelongsTo: function(store, record, url) {
        var id   = get(record, 'id');
        var type = record.constructor.typeKey;

        return this.ajax(this.urlPrefix(url, this.buildURL(type, id)), 'GET');
      },

      /**
        Called by the store when a newly created record is
        saved via the `save` method on a model record instance.

        The `createRecord` method serializes the record and makes an Ajax (HTTP POST) request
        to a URL computed by `buildURL`.

        See `serialize` for information on how to customize the serialized form
        of a record.

        @method createRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      createRecord: function(store, type, record) {
        var data = {};
        var serializer = store.serializerFor(type.typeKey);

        serializer.serializeIntoHash(data, type, record, { includeId: true });

        return this.ajax(this.buildURL(type.typeKey, null, record), "POST", { data: data });
      },

      /**
        Called by the store when an existing record is saved
        via the `save` method on a model record instance.

        The `updateRecord` method serializes the record and makes an Ajax (HTTP PUT) request
        to a URL computed by `buildURL`.

        See `serialize` for information on how to customize the serialized form
        of a record.

        @method updateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      updateRecord: function(store, type, record) {
        var data = {};
        var serializer = store.serializerFor(type.typeKey);

        serializer.serializeIntoHash(data, type, record);

        var id = get(record, 'id');

        return this.ajax(this.buildURL(type.typeKey, id, record), "PUT", { data: data });
      },

      /**
        Called by the store when a record is deleted.

        The `deleteRecord` method  makes an Ajax (HTTP DELETE) request to a URL computed by `buildURL`.

        @method deleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @return {Promise} promise
      */
      deleteRecord: function(store, type, record) {
        var id = get(record, 'id');

        return this.ajax(this.buildURL(type.typeKey, id, record), "DELETE");
      },

      /**
        Builds a URL for a given type and optional ID.

        By default, it pluralizes the type's name (for example, 'post'
        becomes 'posts' and 'person' becomes 'people'). To override the
        pluralization see [pathForType](#method_pathForType).

        If an ID is specified, it adds the ID to the path generated
        for the type, separated by a `/`.

        @method buildURL
        @param {String} type
        @param {String} id
        @param {DS.Model} record
        @return {String} url
      */
      buildURL: function(type, id, record) {
        var url = [],
            host = get(this, 'host'),
            prefix = this.urlPrefix();

        if (type) { url.push(this.pathForType(type)); }

        //We might get passed in an array of ids from findMany
        //in which case we don't want to modify the url, as the
        //ids will be passed in through a query param
        if (id && !Ember.isArray(id)) { url.push(id); }

        if (prefix) { url.unshift(prefix); }

        url = url.join('/');
        if (!host && url) { url = '/' + url; }

        return url;
      },

      /**
        @method urlPrefix
        @private
        @param {String} path
        @param {String} parentUrl
        @return {String} urlPrefix
      */
      urlPrefix: function(path, parentURL) {
        var host = get(this, 'host');
        var namespace = get(this, 'namespace');
        var url = [];

        if (path) {
          // Absolute path
          if (path.charAt(0) === '/') {
            if (host) {
              path = path.slice(1);
              url.push(host);
            }
          // Relative path
          } else if (!/^http(s)?:\/\//.test(path)) {
            url.push(parentURL);
          }
        } else {
          if (host) { url.push(host); }
          if (namespace) { url.push(namespace); }
        }

        if (path) {
          url.push(path);
        }

        return url.join('/');
      },

      _stripIDFromURL: function(store, record) {
        var type = store.modelFor(record);
        var url = this.buildURL(type.typeKey, record.get('id'), record);

        var expandedURL = url.split('/');
        //Case when the url is of the format ...something/:id
        var lastSegment = expandedURL[ expandedURL.length - 1 ];
        var id = record.get('id');
        if (lastSegment === id) {
          expandedURL[expandedURL.length - 1] = "";
        } else if(endsWith(lastSegment, '?id=' + id)) {
          //Case when the url is of the format ...something?id=:id
          expandedURL[expandedURL.length - 1] = lastSegment.substring(0, lastSegment.length - id.length - 1);
        }

        return expandedURL.join('/');
      },

      /**
        Organize records into groups, each of which is to be passed to separate
        calls to `findMany`.

        This implementation groups together records that have the same base URL but
        differing ids. For example `/comments/1` and `/comments/2` will be grouped together
        because we know findMany can coalesce them together as `/comments?ids[]=1&ids[]=2`

        It also supports urls where ids are passed as a query param, such as `/comments?id=1`
        but not those where there is more than 1 query param such as `/comments?id=2&name=David`
        Currently only the query param of `id` is supported. If you need to support others, please
        override this or the `_stripIDFromURL` method.

        It does not group records that have differing base urls, such as for example: `/posts/1/comments/2`
        and `/posts/2/comments/3`

        @method groupRecordsForFindMany
        @param {Array} records
        @return {Array}  an array of arrays of records, each of which is to be
                          loaded separately by `findMany`.
      */
      groupRecordsForFindMany: function (store, records) {
        var groups = Ember.MapWithDefault.create({defaultValue: function(){return [];}});
        var adapter = this;

        forEach.call(records, function(record){
          var baseUrl = adapter._stripIDFromURL(store, record);
          groups.get(baseUrl).push(record);
        });

        function splitGroupToFitInUrl(group, maxUrlLength) {
          var baseUrl = adapter._stripIDFromURL(store, group[0]);
          var idsSize = 0;
          var splitGroups = [[]];

          forEach.call(group, function(record) {
            var additionalLength = '&ids[]='.length + record.get('id.length');
            if (baseUrl.length + idsSize + additionalLength >= maxUrlLength) {
              idsSize = 0;
              splitGroups.push([]);
            }

            idsSize += additionalLength;

            var lastGroupIndex = splitGroups.length - 1;
            splitGroups[lastGroupIndex].push(record);
          });

          return splitGroups;
        }

        var groupsArray = [];
        groups.forEach(function(key, group){
          // http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
          var maxUrlLength = 2048;
          var splitGroups = splitGroupToFitInUrl(group, maxUrlLength);

          forEach.call(splitGroups, function(splitGroup) {
            groupsArray.push(splitGroup);
          });
        });

        return groupsArray;
      },

      /**
        Determines the pathname for a given type.

        By default, it pluralizes the type's name (for example,
        'post' becomes 'posts' and 'person' becomes 'people').

        ### Pathname customization

        For example if you have an object LineItem with an
        endpoint of "/line_items/".

        ```js
        App.ApplicationAdapter = DS.RESTAdapter.extend({
          pathForType: function(type) {
            var decamelized = Ember.String.decamelize(type);
            return Ember.String.pluralize(decamelized);
          }
        });
        ```

        @method pathForType
        @param {String} type
        @return {String} path
      **/
      pathForType: function(type) {
        var camelized = Ember.String.camelize(type);
        return Ember.String.pluralize(camelized);
      },

      /**
        Takes an ajax response, and returns a relevant error.

        Returning a `DS.InvalidError` from this method will cause the
        record to transition into the `invalid` state and make the
        `errors` object available on the record.

        ```javascript
        App.ApplicationAdapter = DS.RESTAdapter.extend({
          ajaxError: function(jqXHR) {
            var error = this._super(jqXHR);

            if (jqXHR && jqXHR.status === 422) {
              var jsonErrors = Ember.$.parseJSON(jqXHR.responseText)["errors"];

              return new DS.InvalidError(jsonErrors);
            } else {
              return error;
            }
          }
        });
        ```

        Note: As a correctness optimization, the default implementation of
        the `ajaxError` method strips out the `then` method from jquery's
        ajax response (jqXHR). This is important because the jqXHR's
        `then` method fulfills the promise with itself resulting in a
        circular "thenable" chain which may cause problems for some
        promise libraries.

        @method ajaxError
        @param  {Object} jqXHR
        @return {Object} jqXHR
      */
      ajaxError: function(jqXHR) {
        if (jqXHR && typeof jqXHR === 'object') {
          jqXHR.then = null;
        }

        return jqXHR;
      },

      /**
        Takes a URL, an HTTP method and a hash of data, and makes an
        HTTP request.

        When the server responds with a payload, Ember Data will call into `extractSingle`
        or `extractArray` (depending on whether the original query was for one record or
        many records).

        By default, `ajax` method has the following behavior:

        * It sets the response `dataType` to `"json"`
        * If the HTTP method is not `"GET"`, it sets the `Content-Type` to be
          `application/json; charset=utf-8`
        * If the HTTP method is not `"GET"`, it stringifies the data passed in. The
          data is the serialized record in the case of a save.
        * Registers success and failure handlers.

        @method ajax
        @private
        @param {String} url
        @param {String} type The request type GET, POST, PUT, DELETE etc.
        @param {Object} hash
        @return {Promise} promise
      */
      ajax: function(url, type, options) {
        var adapter = this;

        return new Ember.RSVP.Promise(function(resolve, reject) {
          var hash = adapter.ajaxOptions(url, type, options);

          hash.success = function(json) {
            Ember.run(null, resolve, json);
          };

          hash.error = function(jqXHR, textStatus, errorThrown) {
            Ember.run(null, reject, adapter.ajaxError(jqXHR));
          };

          Ember.$.ajax(hash);
        }, "DS: RESTAdapter#ajax " + type + " to " + url);
      },

      /**
        @method ajaxOptions
        @private
        @param {String} url
        @param {String} type The request type GET, POST, PUT, DELETE etc.
        @param {Object} hash
        @return {Object} hash
      */
      ajaxOptions: function(url, type, options) {
        var hash = options || {};
        hash.url = url;
        hash.type = type;
        hash.dataType = 'json';
        hash.context = this;

        if (hash.data && type !== 'GET') {
          hash.contentType = 'application/json; charset=utf-8';
          hash.data = JSON.stringify(hash.data);
        }

        var headers = get(this, 'headers');
        if (headers !== undefined) {
          hash.beforeSend = function (xhr) {
            forEach.call(Ember.keys(headers), function(key) {
              xhr.setRequestHeader(key, headers[key]);
            });
          };
        }

        return hash;
      }
    });

    //From http://stackoverflow.com/questions/280634/endswith-in-javascript
    function endsWith(string, suffix){
      if (typeof String.prototype.endsWith !== 'function') {
        return string.indexOf(suffix, string.length - suffix.length) !== -1;
      } else {
        return string.endsWith(suffix);
      }
    }
  });
define("ember-data/core",
  ["exports"],
  function(__exports__) {
    
    /**
      @module ember-data
    */

    /**
      All Ember Data methods and functions are defined inside of this namespace.

      @class DS
      @static
    */
    var DS;
    if ('undefined' === typeof DS) {
      /**
        @property VERSION
        @type String
        @default '1.0.0-beta.9'
        @static
      */
      DS = Ember.Namespace.create({
        VERSION: '1.0.0-beta.9'
      });

      if (Ember.libraries) {
        Ember.libraries.registerCoreLibrary('Ember Data', DS.VERSION);
      }
    }

    __exports__["default"] = DS;
  });
define("ember-data/ember-initializer",
  ["ember-data/setup-container"],
  function(__dependency1__) {
    
    var setupContainer = __dependency1__["default"];

    var K = Ember.K;

    /**
      @module ember-data
    */

    /*

      This code initializes Ember-Data onto an Ember application.

      If an Ember.js developer defines a subclass of DS.Store on their application,
      as `App.ApplicationStore` (or via a module system that resolves to `store:application`)
      this code will automatically instantiate it and make it available on the
      router.

      Additionally, after an application's controllers have been injected, they will
      each have the store made available to them.

      For example, imagine an Ember.js application with the following classes:

      App.ApplicationStore = DS.Store.extend({
        adapter: 'custom'
      });

      App.PostsController = Ember.ArrayController.extend({
        // ...
      });

      When the application is initialized, `App.ApplicationStore` will automatically be
      instantiated, and the instance of `App.PostsController` will have its `store`
      property set to that instance.

      Note that this code will only be run if the `ember-application` package is
      loaded. If Ember Data is being used in an environment other than a
      typical application (e.g., node.js where only `ember-runtime` is available),
      this code will be ignored.
    */

    Ember.onLoad('Ember.Application', function(Application) {

      Application.initializer({
        name:       "ember-data",
        initialize: setupContainer
      });

      // Deprecated initializers to satisfy old code that depended on them

      Application.initializer({
        name:       "store",
        after:      "ember-data",
        initialize: K
      });

      Application.initializer({
        name:       "activeModelAdapter",
        before:     "store",
        initialize: K
      });

      Application.initializer({
        name:       "transforms",
        before:     "store",
        initialize: K
      });

      Application.initializer({
        name:       "data-adapter",
        before:     "store",
        initialize: K
      });

      Application.initializer({
        name:       "injectStore",
        before:     "store",
        initialize: K
      });
    });
  });
define("ember-data/ext/date",
  [],
  function() {
    
    /**
      @module ember-data
    */

    /**
      Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>

      © 2011 Colin Snover <http://zetafleet.com>

      Released under MIT license.

      @class Date
      @namespace Ember
      @static
    */
    Ember.Date = Ember.Date || {};

    var origParse = Date.parse, numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];

    /**
      @method parse
      @param date
    */
    Ember.Date.parse = function (date) {
        var timestamp, struct, minutesOffset = 0;

        // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
        // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
        // implementations could be faster
        //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
            // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
            for (var i = 0, k; (k = numericKeys[i]); ++i) {
                struct[k] = +struct[k] || 0;
            }

            // allow undefined days and months
            struct[2] = (+struct[2] || 1) - 1;
            struct[3] = +struct[3] || 1;

            if (struct[8] !== 'Z' && struct[9] !== undefined) {
                minutesOffset = struct[10] * 60 + struct[11];

                if (struct[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
        }
        else {
            timestamp = origParse ? origParse(date) : NaN;
        }

        return timestamp;
    };

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Date) {
      Date.parse = Ember.Date.parse;
    }
  });
define("ember-data/initializers/data_adapter",
  ["ember-data/system/debug/debug_adapter","exports"],
  function(__dependency1__, __exports__) {
    
    var DebugAdapter = __dependency1__["default"];

    /**
      Configures a container with injections on Ember applications
      for the Ember-Data store. Accepts an optional namespace argument.

      @method initializeStoreInjections
      @param {Ember.Container} container
    */
    __exports__["default"] = function initializeDebugAdapter(container){
      container.register('data-adapter:main', DebugAdapter);
    };
  });
define("ember-data/initializers/store",
  ["ember-data/serializers","ember-data/adapters","ember-data/system/container_proxy","ember-data/system/store","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    var JSONSerializer = __dependency1__.JSONSerializer;
    var RESTSerializer = __dependency1__.RESTSerializer;
    var RESTAdapter = __dependency2__.RESTAdapter;
    var ContainerProxy = __dependency3__["default"];
    var Store = __dependency4__["default"];

    /**
      Configures a container for use with an Ember-Data
      store. Accepts an optional namespace argument.

      @method initializeStore
      @param {Ember.Container} container
      @param {Object} [application] an application namespace
    */
    __exports__["default"] = function initializeStore(container, application){
      Ember.deprecate('Specifying a custom Store for Ember Data on your global namespace as `App.Store` ' +
                      'has been deprecated. Please use `App.ApplicationStore` instead.', !(application && application.Store));

      container.register('store:main', container.lookupFactory('store:application') || (application && application.Store) || Store);

      // allow older names to be looked up

      var proxy = new ContainerProxy(container);
      proxy.registerDeprecations([
        { deprecated: 'serializer:_default',  valid: 'serializer:-default' },
        { deprecated: 'serializer:_rest',     valid: 'serializer:-rest' },
        { deprecated: 'adapter:_rest',        valid: 'adapter:-rest' }
      ]);

      // new go forward paths
      container.register('serializer:-default', JSONSerializer);
      container.register('serializer:-rest', RESTSerializer);
      container.register('adapter:-rest', RESTAdapter);

      // Eagerly generate the store so defaultStore is populated.
      // TODO: Do this in a finisher hook
      container.lookup('store:main');
    };
  });
define("ember-data/initializers/store_injections",
  ["exports"],
  function(__exports__) {
    
    /**
      Configures a container with injections on Ember applications
      for the Ember-Data store. Accepts an optional namespace argument.

      @method initializeStoreInjections
      @param {Ember.Container} container
    */
    __exports__["default"] = function initializeStoreInjections(container){
      container.injection('controller',   'store', 'store:main');
      container.injection('route',        'store', 'store:main');
      container.injection('serializer',   'store', 'store:main');
      container.injection('data-adapter', 'store', 'store:main');
    };
  });
define("ember-data/initializers/transforms",
  ["ember-data/transforms","exports"],
  function(__dependency1__, __exports__) {
    
    var BooleanTransform = __dependency1__.BooleanTransform;
    var DateTransform = __dependency1__.DateTransform;
    var StringTransform = __dependency1__.StringTransform;
    var NumberTransform = __dependency1__.NumberTransform;

    /**
      Configures a container for use with Ember-Data
      transforms.

      @method initializeTransforms
      @param {Ember.Container} container
    */
    __exports__["default"] = function initializeTransforms(container){
      container.register('transform:boolean', BooleanTransform);
      container.register('transform:date',    DateTransform);
      container.register('transform:number',  NumberTransform);
      container.register('transform:string',  StringTransform);
    };
  });
define("ember-data/serializers",
  ["ember-data/serializers/json_serializer","ember-data/serializers/rest_serializer","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var JSONSerializer = __dependency1__["default"];
    var RESTSerializer = __dependency2__["default"];

    __exports__.JSONSerializer = JSONSerializer;
    __exports__.RESTSerializer = RESTSerializer;
  });
define("ember-data/serializers/embedded_records_mixin",
  ["ember-inflector","exports"],
  function(__dependency1__, __exports__) {
    
    var get = Ember.get;
    var forEach = Ember.EnumerableUtils.forEach;
    var camelize = Ember.String.camelize;

    var pluralize = __dependency1__.pluralize;

    /**
      ## Using Embedded Records

      `DS.EmbeddedRecordsMixin` supports serializing embedded records.

      To set up embedded records, include the mixin when extending a serializer
      then define and configure embedded (model) relationships.

      Below is an example of a per-type serializer ('post' type).

      ```js
      App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
        attrs: {
          author: {embedded: 'always'},
          comments: {serialize: 'ids'}
        }
      })
      ```

      The `attrs` option for a resource `{embedded: 'always'}` is shorthand for:

      ```js
      {serialize: 'records', deserialize: 'records'}
      ```

      ### Configuring Attrs

      A resource's `attrs` option may be set to use `ids`, `records` or false for the
      `serialize`  and `deserialize` settings.

      The `attrs` property can be set on the ApplicationSerializer or a per-type
      serializer.

      In the case where embedded JSON is expected while extracting a payload (reading)
      the setting is `deserialize: 'records'`, there is no need to use `ids` when
      extracting as that is the default behavior without this mixin if you are using
      the vanilla EmbeddedRecordsMixin. Likewise, to embed JSON in the payload while
      serializing `serialize: 'records'` is the setting to use. There is an option of
      not embedding JSON in the serialized payload by using `serialize: 'ids'`. If you
      do not want the relationship sent at all, you can use `serialize: false`.


      ### EmbeddedRecordsMixin defaults
      If you do not overwrite `attrs` for a specific relationship, the `EmbeddedRecordsMixin`
      will behave in the following way:

      BelongsTo: `{serialize:'id', deserialize:'id'}`
      HasMany:   `{serialize:false,  deserialize:'ids'}`

      ### Model Relationships

      Embedded records must have a model defined to be extracted and serialized.

      To successfully extract and serialize embedded records the model relationships
      must be setup correcty See the
      [defining relationships](/guides/models/defining-models/#toc_defining-relationships)
      section of the **Defining Models** guide page.

      Records without an `id` property are not considered embedded records, model
      instances must have an `id` property to be used with Ember Data.

      ### Example JSON payloads, Models and Serializers

      **When customizing a serializer it is imporant to grok what the cusomizations
      are, please read the docs for the methods this mixin provides, in case you need
      to modify to fit your specific needs.**

      For example review the docs for each method of this mixin:
      * [normalize](/api/data/classes/DS.EmbeddedRecordsMixin.html#method_normalize)
      * [serializeBelongsTo](/api/data/classes/DS.EmbeddedRecordsMixin.html#method_serializeBelongsTo)
      * [serializeHasMany](/api/data/classes/DS.EmbeddedRecordsMixin.html#method_serializeHasMany)

      @class EmbeddedRecordsMixin
      @namespace DS
    */
    var EmbeddedRecordsMixin = Ember.Mixin.create({

      /**
        Normalize the record and recursively normalize/extract all the embedded records
        while pushing them into the store as they are encountered

        A payload with an attr configured for embedded records needs to be extracted:

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "comments": [{
              "id": "1",
              "body": "Rails is unagi"
            }, {
              "id": "2",
              "body": "Omakase O_o"
            }]
          }
        }
        ```
       @method normalize
       @param {subclass of DS.Model} type
       @param {Object} hash to be normalized
       @param {String} key the hash has been referenced by
       @return {Object} the normalized hash
      **/
      normalize: function(type, hash, prop) {
        var normalizedHash = this._super(type, hash, prop);
        return extractEmbeddedRecords(this, this.store, type, normalizedHash);
      },

      keyForRelationship: function(key, type){
        if (this.hasDeserializeRecordsOption(key)) {
          return this.keyForAttribute(key);
        } else {
          return this._super(key, type) || key;
        }
      },

      /**
        Serialize `belongsTo` relationship when it is configured as an embedded object.

        This example of an author model belongs to a post model:

        ```js
        Post = DS.Model.extend({
          title:    DS.attr('string'),
          body:     DS.attr('string'),
          author:   DS.belongsTo('author')
        });

        Author = DS.Model.extend({
          name:     DS.attr('string'),
          post:     DS.belongsTo('post')
        });
        ```

        Use a custom (type) serializer for the post model to configure embedded author

        ```js
        App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
          attrs: {
            author: {embedded: 'always'}
          }
        })
        ```

        A payload with an attribute configured for embedded records can serialize
        the records together under the root attribute's payload:

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "author": {
              "id": "2"
              "name": "dhh"
            }
          }
        }
        ```

        @method serializeBelongsTo
        @param {DS.Model} record
        @param {Object} json
        @param {Object} relationship
      */
      serializeBelongsTo: function(record, json, relationship) {
        var attr = relationship.key;
        var attrs = this.get('attrs');
        if (this.noSerializeOptionSpecified(attr)) {
          this._super(record, json, relationship);
          return;
        }
        var includeIds = this.hasSerializeIdsOption(attr);
        var includeRecords = this.hasSerializeRecordsOption(attr);
        var embeddedRecord = record.get(attr);
        var key;
        if (includeIds) {
          key = this.keyForRelationship(attr, relationship.kind);
          if (!embeddedRecord) {
            json[key] = null;
          } else {
            json[key] = get(embeddedRecord, 'id');
          }
        } else if (includeRecords) {
          key = this.keyForAttribute(attr);
          if (!embeddedRecord) {
            json[key] = null;
          } else {
            json[key] = embeddedRecord.serialize({includeId: true});
            this.removeEmbeddedForeignKey(record, embeddedRecord, relationship, json[key]);
          }
        }
      },

      /**
        Serialize `hasMany` relationship when it is configured as embedded objects.

        This example of a post model has many comments:

        ```js
        Post = DS.Model.extend({
          title:    DS.attr('string'),
          body:     DS.attr('string'),
          comments: DS.hasMany('comment')
        });

        Comment = DS.Model.extend({
          body:     DS.attr('string'),
          post:     DS.belongsTo('post')
        });
        ```

        Use a custom (type) serializer for the post model to configure embedded comments

        ```js
        App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
          attrs: {
            comments: {embedded: 'always'}
          }
        })
        ```

        A payload with an attribute configured for embedded records can serialize
        the records together under the root attribute's payload:

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "body": "I want this for my ORM, I want that for my template language..."
            "comments": [{
              "id": "1",
              "body": "Rails is unagi"
            }, {
              "id": "2",
              "body": "Omakase O_o"
            }]
          }
        }
        ```

        The attrs options object can use more specific instruction for extracting and
        serializing. When serializing, an option to embed `ids` or `records` can be set.
        When extracting the only option is `records`.

        So `{embedded: 'always'}` is shorthand for:
        `{serialize: 'records', deserialize: 'records'}`

        To embed the `ids` for a related object (using a hasMany relationship):

        ```js
        App.PostSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
          attrs: {
            comments: {serialize: 'ids', deserialize: 'records'}
          }
        })
        ```

        ```js
        {
          "post": {
            "id": "1"
            "title": "Rails is omakase",
            "body": "I want this for my ORM, I want that for my template language..."
            "comments": ["1", "2"]
          }
        }
        ```

        @method serializeHasMany
        @param {DS.Model} record
        @param {Object} json
        @param {Object} relationship
      */
      serializeHasMany: function(record, json, relationship) {
        var attr = relationship.key;
        var attrs = this.get('attrs');
        if (this.noSerializeOptionSpecified(attr)) {
          this._super(record, json, relationship);
          return;
        }
        var includeIds = this.hasSerializeIdsOption(attr);
        var includeRecords = this.hasSerializeRecordsOption(attr);
        var key;
        if (includeIds) {
          key = this.keyForRelationship(attr, relationship.kind);
          json[key] = get(record, attr).mapBy('id');
        } else if (includeRecords) {
          key = this.keyForAttribute(attr);
          json[key] = get(record, attr).map(function(embeddedRecord) {
            var serializedEmbeddedRecord = embeddedRecord.serialize({includeId: true});
            this.removeEmbeddedForeignKey(record, embeddedRecord, relationship, serializedEmbeddedRecord);
            return serializedEmbeddedRecord;
          }, this);
        }
      },

      /**
        When serializing an embedded record, modify the property (in the json payload)
        that refers to the parent record (foreign key for relationship).

        Serializing a `belongsTo` relationship removes the property that refers to the
        parent record

        Serializing a `hasMany` relationship does not remove the property that refers to
        the parent record.

        @method removeEmbeddedForeignKey
        @param {DS.Model} record
        @param {DS.Model} embeddedRecord
        @param {Object} relationship
        @param {Object} json
      */
      removeEmbeddedForeignKey: function (record, embeddedRecord, relationship, json) {
        if (relationship.kind === 'hasMany') {
          return;
        } else if (relationship.kind === 'belongsTo') {
          var parentRecord = record.constructor.inverseFor(relationship.key);
          if (parentRecord) {
            var name = parentRecord.name;
            var embeddedSerializer = this.store.serializerFor(embeddedRecord.constructor);
            var parentKey = embeddedSerializer.keyForRelationship(name, parentRecord.kind);
            if (parentKey) {
              delete json[parentKey];
            }
          }
        }
      },

      // checks config for attrs option to embedded (always) - serialize and deserialize
      hasEmbeddedAlwaysOption: function (attr) {
        var option = this.attrsOption(attr);
        return option && option.embedded === 'always';
      },

      // checks config for attrs option to serialize ids
      hasSerializeRecordsOption: function(attr) {
        var alwaysEmbed = this.hasEmbeddedAlwaysOption(attr);
        var option = this.attrsOption(attr);
        return alwaysEmbed || (option && (option.serialize === 'records'));
      },

      // checks config for attrs option to serialize records
      hasSerializeIdsOption: function(attr) {
        var option = this.attrsOption(attr);
        return option && (option.serialize === 'ids' || option.serialize === 'id');
      },

      // checks config for attrs option to serialize records
      noSerializeOptionSpecified: function(attr) {
        var option = this.attrsOption(attr);
        var serializeRecords = this.hasSerializeRecordsOption(attr);
        var serializeIds = this.hasSerializeIdsOption(attr);
        return !(option && (option.serialize || option.embedded));
      },

      // checks config for attrs option to deserialize records
      // a defined option object for a resource is treated the same as
      // `deserialize: 'records'`
      hasDeserializeRecordsOption: function(attr) {
        var alwaysEmbed = this.hasEmbeddedAlwaysOption(attr);
        var option = this.attrsOption(attr);
        return alwaysEmbed || (option && option.deserialize === 'records');
      },

      attrsOption: function(attr) {
        var attrs = this.get('attrs');
        return attrs && (attrs[camelize(attr)] || attrs[attr]);
      }
    });

    // chooses a relationship kind to branch which function is used to update payload
    // does not change payload if attr is not embedded
    function extractEmbeddedRecords(serializer, store, type, partial) {

      type.eachRelationship(function(key, relationship) {
        if (serializer.hasDeserializeRecordsOption(key)) {
          var embeddedType = store.modelFor(relationship.type.typeKey);
          if (relationship.kind === "hasMany") {
            extractEmbeddedHasMany(store, key, embeddedType, partial);
          }
          if (relationship.kind === "belongsTo") {
            extractEmbeddedBelongsTo(store, key, embeddedType, partial);
          }
        }
      });

      return partial;
    }

    // handles embedding for `hasMany` relationship
    function extractEmbeddedHasMany(store, key, embeddedType, hash) {
      if (!hash[key]) {
        return hash;
      }

      var ids = [];

      var embeddedSerializer = store.serializerFor(embeddedType.typeKey);
      forEach(hash[key], function(data) {
        var embeddedRecord = embeddedSerializer.normalize(embeddedType, data, null);
        store.push(embeddedType, embeddedRecord);
        ids.push(embeddedRecord.id);
      });

      hash[key] = ids;
      return hash;
    }

    function extractEmbeddedBelongsTo(store, key, embeddedType, hash) {
      if (!hash[key]) {
        return hash;
      }

      var embeddedSerializer = store.serializerFor(embeddedType.typeKey);
      var embeddedRecord = embeddedSerializer.normalize(embeddedType, hash[key], null);
      store.push(embeddedType, embeddedRecord);

      hash[key] = embeddedRecord.id;
      //TODO Need to add a reference to the parent later so relationship works between both `belongsTo` records
      return hash;
    }

    __exports__["default"] = EmbeddedRecordsMixin;
  });
define("ember-data/serializers/json_serializer",
  ["ember-data/system/changes","exports"],
  function(__dependency1__, __exports__) {
    
    var RelationshipChange = __dependency1__.RelationshipChange;
    var get = Ember.get;
    var set = Ember.set;
    var isNone = Ember.isNone;
    var map = Ember.ArrayPolyfills.map;
    var merge = Ember.merge;

    /**
      In Ember Data a Serializer is used to serialize and deserialize
      records when they are transferred in and out of an external source.
      This process involves normalizing property names, transforming
      attribute values and serializing relationships.

      For maximum performance Ember Data recommends you use the
      [RESTSerializer](DS.RESTSerializer.html) or one of its subclasses.

      `JSONSerializer` is useful for simpler or legacy backends that may
      not support the http://jsonapi.org/ spec.

      @class JSONSerializer
      @namespace DS
    */
    __exports__["default"] = Ember.Object.extend({
      /**
        The primaryKey is used when serializing and deserializing
        data. Ember Data always uses the `id` property to store the id of
        the record. The external source may not always follow this
        convention. In these cases it is useful to override the
        primaryKey property to match the primaryKey of your external
        store.

        Example

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          primaryKey: '_id'
        });
        ```

        @property primaryKey
        @type {String}
        @default 'id'
      */
      primaryKey: 'id',

      /**
        The `attrs` object can be used to declare a simple mapping between
        property names on `DS.Model` records and payload keys in the
        serialized JSON object representing the record. An object with the
        property `key` can also be used to designate the attribute's key on
        the response payload.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: DS.attr('string'),
          lastName: DS.attr('string'),
          occupation: DS.attr('string'),
          admin: DS.attr('boolean')
        });

        App.PersonSerializer = DS.JSONSerializer.extend({
          attrs: {
            admin: 'is_admin',
            occupation: {key: 'career'}
          }
        });
        ```

        You can also remove attributes by setting the `serialize` key to
        false in your mapping object.

        Example

        ```javascript
        App.PersonSerializer = DS.JSONSerializer.extend({
          attrs: {
            admin: {serialize: false},
            occupation: {key: 'career'}
          }
        });
        ```

        When serialized:

        ```javascript
        {
          "career": "magician"
        }
        ```

        Note that the `admin` is now not included in the payload.

        @property attrs
        @type {Object}
      */

      /**
       Given a subclass of `DS.Model` and a JSON object this method will
       iterate through each attribute of the `DS.Model` and invoke the
       `DS.Transform#deserialize` method on the matching property of the
       JSON object.  This method is typically called after the
       serializer's `normalize` method.

       @method applyTransforms
       @private
       @param {subclass of DS.Model} type
       @param {Object} data The data to transform
       @return {Object} data The transformed data object
      */
      applyTransforms: function(type, data) {
        type.eachTransformedAttribute(function(key, type) {
          if (!data.hasOwnProperty(key)) { return; }

          var transform = this.transformFor(type);
          data[key] = transform.deserialize(data[key]);
        }, this);

        return data;
      },

      /**
        Normalizes a part of the JSON payload returned by
        the server. You should override this method, munge the hash
        and call super if you have generic normalization to do.

        It takes the type of the record that is being normalized
        (as a DS.Model class), the property where the hash was
        originally found, and the hash to normalize.

        You can use this method, for example, to normalize underscored keys to camelized
        or other general-purpose normalizations.

        Example

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          normalize: function(type, hash) {
            var fields = Ember.get(type, 'fields');
            fields.forEach(function(field) {
              var payloadField = Ember.String.underscore(field);
              if (field === payloadField) { return; }

              hash[field] = hash[payloadField];
              delete hash[payloadField];
            });
            return this._super.apply(this, arguments);
          }
        });
        ```

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @return {Object}
      */
      normalize: function(type, hash) {
        if (!hash) { return hash; }

        this.normalizeId(hash);
        this.normalizeAttributes(type, hash);
        this.normalizeRelationships(type, hash);

        this.normalizeUsingDeclaredMapping(type, hash);
        this.applyTransforms(type, hash);
        return hash;
      },

      /**
        You can use this method to normalize all payloads, regardless of whether they
        represent single records or an array.

        For example, you might want to remove some extraneous data from the payload:

        ```js
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          normalizePayload: function(payload) {
            delete payload.version;
            delete payload.status;
            return payload;
          }
        });
        ```

        @method normalizePayload
        @param {Object} payload
        @return {Object} the normalized payload
      */
      normalizePayload: function(payload) {
        return payload;
      },

      /**
        @method normalizeAttributes
        @private
      */
      normalizeAttributes: function(type, hash) {
        var payloadKey, key;

        if (this.keyForAttribute) {
          type.eachAttribute(function(key) {
            payloadKey = this.keyForAttribute(key);
            if (key === payloadKey) { return; }
            if (!hash.hasOwnProperty(payloadKey)) { return; }

            hash[key] = hash[payloadKey];
            delete hash[payloadKey];
          }, this);
        }
      },

      /**
        @method normalizeRelationships
        @private
      */
      normalizeRelationships: function(type, hash) {
        var payloadKey, key;

        if (this.keyForRelationship) {
          type.eachRelationship(function(key, relationship) {
            payloadKey = this.keyForRelationship(key, relationship.kind);
            if (key === payloadKey) { return; }
            if (!hash.hasOwnProperty(payloadKey)) { return; }

            hash[key] = hash[payloadKey];
            delete hash[payloadKey];
          }, this);
        }
      },

      /**
        @method normalizeUsingDeclaredMapping
        @private
      */
      normalizeUsingDeclaredMapping: function(type, hash) {
        var attrs = get(this, 'attrs'), payloadKey, key;

        if (attrs) {
          for (key in attrs) {
            payloadKey = this._getMappedKey(key);
            if (!hash.hasOwnProperty(payloadKey)) { continue; }

            if (payloadKey !== key) {
              hash[key] = hash[payloadKey];
              delete hash[payloadKey];
            }
          }
        }
      },

      /**
        @method normalizeId
        @private
      */
      normalizeId: function(hash) {
        var primaryKey = get(this, 'primaryKey');

        if (primaryKey === 'id') { return; }

        hash.id = hash[primaryKey];
        delete hash[primaryKey];
      },

      /**
        Looks up the property key that was set by the custom `attr` mapping
        passed to the serializer.

        @method _getMappedKey
        @private
        @param {String} key
        @return {String} key
      */
      _getMappedKey: function(key) {
        var attrs = get(this, 'attrs');
        var mappedKey;
        if (attrs && attrs[key]) {
          mappedKey = attrs[key];
          //We need to account for both the {title: 'post_title'} and
          //{title: {key: 'post_title'}} forms
          if (mappedKey.key){
            mappedKey = mappedKey.key;
          }
          if (typeof mappedKey === 'string'){
            key = mappedKey;
          }
        }

        return key;
      },

      /**
        Check attrs.key.serialize property to inform if the `key`
        can be serialized

        @method _canSerialize
        @private
        @param {String} key
        @return {boolean} true if the key can be serialized
      */
      _canSerialize: function(key) {
        var attrs = get(this, 'attrs');

        return !attrs || !attrs[key] || attrs[key].serialize !== false;
      },

      // SERIALIZE
      /**
        Called when a record is saved in order to convert the
        record into JSON.

        By default, it creates a JSON object with a key for
        each attribute and belongsTo relationship.

        For example, consider this model:

        ```javascript
        App.Comment = DS.Model.extend({
          title: DS.attr(),
          body: DS.attr(),

          author: DS.belongsTo('user')
        });
        ```

        The default serialization would create a JSON object like:

        ```javascript
        {
          "title": "Rails is unagi",
          "body": "Rails? Omakase? O_O",
          "author": 12
        }
        ```

        By default, attributes are passed through as-is, unless
        you specified an attribute type (`DS.attr('date')`). If
        you specify a transform, the JavaScript value will be
        serialized when inserted into the JSON hash.

        By default, belongs-to relationships are converted into
        IDs when inserted into the JSON hash.

        ## IDs

        `serialize` takes an options hash with a single option:
        `includeId`. If this option is `true`, `serialize` will,
        by default include the ID in the JSON object it builds.

        The adapter passes in `includeId: true` when serializing
        a record for `createRecord`, but not for `updateRecord`.

        ## Customization

        Your server may expect a different JSON format than the
        built-in serialization format.

        In that case, you can implement `serialize` yourself and
        return a JSON hash of your choosing.

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          serialize: function(post, options) {
            var json = {
              POST_TTL: post.get('title'),
              POST_BDY: post.get('body'),
              POST_CMS: post.get('comments').mapBy('id')
            }

            if (options.includeId) {
              json.POST_ID_ = post.get('id');
            }

            return json;
          }
        });
        ```

        ## Customizing an App-Wide Serializer

        If you want to define a serializer for your entire
        application, you'll probably want to use `eachAttribute`
        and `eachRelationship` on the record.

        ```javascript
        App.ApplicationSerializer = DS.JSONSerializer.extend({
          serialize: function(record, options) {
            var json = {};

            record.eachAttribute(function(name) {
              json[serverAttributeName(name)] = record.get(name);
            })

            record.eachRelationship(function(name, relationship) {
              if (relationship.kind === 'hasMany') {
                json[serverHasManyName(name)] = record.get(name).mapBy('id');
              }
            });

            if (options.includeId) {
              json.ID_ = record.get('id');
            }

            return json;
          }
        });

        function serverAttributeName(attribute) {
          return attribute.underscore().toUpperCase();
        }

        function serverHasManyName(name) {
          return serverAttributeName(name.singularize()) + "_IDS";
        }
        ```

        This serializer will generate JSON that looks like this:

        ```javascript
        {
          "TITLE": "Rails is omakase",
          "BODY": "Yep. Omakase.",
          "COMMENT_IDS": [ 1, 2, 3 ]
        }
        ```

        ## Tweaking the Default JSON

        If you just want to do some small tweaks on the default JSON,
        you can call super first and make the tweaks on the returned
        JSON.

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          serialize: function(record, options) {
            var json = this._super.apply(this, arguments);

            json.subject = json.title;
            delete json.title;

            return json;
          }
        });
        ```

        @method serialize
        @param {subclass of DS.Model} record
        @param {Object} options
        @return {Object} json
      */
      serialize: function(record, options) {
        var json = {};

        if (options && options.includeId) {
          var id = get(record, 'id');

          if (id) {
            json[get(this, 'primaryKey')] = id;
          }
        }

        record.eachAttribute(function(key, attribute) {
          this.serializeAttribute(record, json, key, attribute);
        }, this);

        record.eachRelationship(function(key, relationship) {
          if (relationship.kind === 'belongsTo') {
            this.serializeBelongsTo(record, json, relationship);
          } else if (relationship.kind === 'hasMany') {
            this.serializeHasMany(record, json, relationship);
          }
        }, this);

        return json;
      },

      /**
        You can use this method to customize how a serialized record is added to the complete
        JSON hash to be sent to the server. By default the JSON Serializer does not namespace
        the payload and just sends the raw serialized JSON object.
        If your server expects namespaced keys, you should consider using the RESTSerializer.
        Otherwise you can override this method to customize how the record is added to the hash.

        For example, your server may expect underscored root objects.

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          serializeIntoHash: function(data, type, record, options) {
            var root = Ember.String.decamelize(type.typeKey);
            data[root] = this.serialize(record, options);
          }
        });
        ```

        @method serializeIntoHash
        @param {Object} hash
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @param {Object} options
      */
      serializeIntoHash: function(hash, type, record, options) {
        merge(hash, this.serialize(record, options));
      },

      /**
       `serializeAttribute` can be used to customize how `DS.attr`
       properties are serialized

       For example if you wanted to ensure all your attributes were always
       serialized as properties on an `attributes` object you could
       write:

       ```javascript
       App.ApplicationSerializer = DS.JSONSerializer.extend({
         serializeAttribute: function(record, json, key, attributes) {
           json.attributes = json.attributes || {};
           this._super(record, json.attributes, key, attributes);
         }
       });
       ```

       @method serializeAttribute
       @param {DS.Model} record
       @param {Object} json
       @param {String} key
       @param {Object} attribute
      */
      serializeAttribute: function(record, json, key, attribute) {
        var type = attribute.type;

        if (this._canSerialize(key)) {
          var value = get(record, key);
          if (type) {
            var transform = this.transformFor(type);
            value = transform.serialize(value);
          }

          // if provided, use the mapping provided by `attrs` in
          // the serializer
          var payloadKey =  this._getMappedKey(key);

          if (payloadKey === key && this.keyForAttribute) {
            payloadKey = this.keyForAttribute(key);
          }

          json[payloadKey] = value;
        }
      },

      /**
       `serializeBelongsTo` can be used to customize how `DS.belongsTo`
       properties are serialized.

       Example

       ```javascript
       App.PostSerializer = DS.JSONSerializer.extend({
         serializeBelongsTo: function(record, json, relationship) {
           var key = relationship.key;

           var belongsTo = get(record, key);

           key = this.keyForRelationship ? this.keyForRelationship(key, "belongsTo") : key;

           json[key] = Ember.isNone(belongsTo) ? belongsTo : belongsTo.toJSON();
         }
       });
       ```

       @method serializeBelongsTo
       @param {DS.Model} record
       @param {Object} json
       @param {Object} relationship
      */
      serializeBelongsTo: function(record, json, relationship) {
        var key = relationship.key;

        if (this._canSerialize(key)) {
          var belongsTo = get(record, key);

          // if provided, use the mapping provided by `attrs` in
          // the serializer
          var payloadKey = this._getMappedKey(key);
          if (payloadKey === key && this.keyForRelationship) {
            payloadKey = this.keyForRelationship(key, "belongsTo");
          }

          if (isNone(belongsTo)) {
            json[payloadKey] = belongsTo;
          } else {
            json[payloadKey] = get(belongsTo, 'id');
          }

          if (relationship.options.polymorphic) {
            this.serializePolymorphicType(record, json, relationship);
          }
        }
      },

      /**
       `serializeHasMany` can be used to customize how `DS.hasMany`
       properties are serialized.

       Example

       ```javascript
       App.PostSerializer = DS.JSONSerializer.extend({
         serializeHasMany: function(record, json, relationship) {
           var key = relationship.key;
           if (key === 'comments') {
             return;
           } else {
             this._super.apply(this, arguments);
           }
         }
       });
       ```

       @method serializeHasMany
       @param {DS.Model} record
       @param {Object} json
       @param {Object} relationship
      */
      serializeHasMany: function(record, json, relationship) {
        var key = relationship.key;

        if (this._canSerialize(key)) {
          var payloadKey;

          // if provided, use the mapping provided by `attrs` in
          // the serializer
          payloadKey = this._getMappedKey(key);
          if (payloadKey === key && this.keyForRelationship) {
            payloadKey = this.keyForRelationship(key, "hasMany");
          }

          var relationshipType = RelationshipChange.determineRelationshipType(record.constructor, relationship);

          if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
            json[payloadKey] = get(record, key).mapBy('id');
            // TODO support for polymorphic manyToNone and manyToMany relationships
          }
        }
      },

      /**
        You can use this method to customize how polymorphic objects are
        serialized. Objects are considered to be polymorphic if
        `{polymorphic: true}` is pass as the second argument to the
        `DS.belongsTo` function.

        Example

        ```javascript
        App.CommentSerializer = DS.JSONSerializer.extend({
          serializePolymorphicType: function(record, json, relationship) {
            var key = relationship.key,
                belongsTo = get(record, key);
            key = this.keyForAttribute ? this.keyForAttribute(key) : key;

            if (Ember.isNone(belongsTo)) {
              json[key + "_type"] = null;
            } else {
              json[key + "_type"] = belongsTo.constructor.typeKey;
            }
          }
        });
       ```

        @method serializePolymorphicType
        @param {DS.Model} record
        @param {Object} json
        @param {Object} relationship
      */
      serializePolymorphicType: Ember.K,

      // EXTRACT

      /**
        The `extract` method is used to deserialize payload data from the
        server. By default the `JSONSerializer` does not push the records
        into the store. However records that subclass `JSONSerializer`
        such as the `RESTSerializer` may push records into the store as
        part of the extract call.

        This method delegates to a more specific extract method based on
        the `requestType`.

        Example

        ```javascript
        var get = Ember.get;
        socket.on('message', function(message) {
          var modelName = message.model;
          var data = message.data;
          var type = store.modelFor(modelName);
          var serializer = store.serializerFor(type.typeKey);
          var record = serializer.extract(store, type, data, get(data, 'id'), 'single');
          store.push(modelName, record);
        });
        ```

        @method extract
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extract: function(store, type, payload, id, requestType) {
        this.extractMeta(store, type, payload);

        var specificExtract = "extract" + requestType.charAt(0).toUpperCase() + requestType.substr(1);
        return this[specificExtract](store, type, payload, id, requestType);
      },

      /**
        `extractFindAll` is a hook into the extract method used when a
        call is made to `DS.Store#findAll`. By default this method is an
        alias for [extractArray](#method_extractArray).

        @method extractFindAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindAll: function(store, type, payload, id, requestType){
        return this.extractArray(store, type, payload, id, requestType);
      },
      /**
        `extractFindQuery` is a hook into the extract method used when a
        call is made to `DS.Store#findQuery`. By default this method is an
        alias for [extractArray](#method_extractArray).

        @method extractFindQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindQuery: function(store, type, payload, id, requestType){
        return this.extractArray(store, type, payload, id, requestType);
      },
      /**
        `extractFindMany` is a hook into the extract method used when a
        call is made to `DS.Store#findMany`. By default this method is
        alias for [extractArray](#method_extractArray).

        @method extractFindMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindMany: function(store, type, payload, id, requestType){
        return this.extractArray(store, type, payload, id, requestType);
      },
      /**
        `extractFindHasMany` is a hook into the extract method used when a
        call is made to `DS.Store#findHasMany`. By default this method is
        alias for [extractArray](#method_extractArray).

        @method extractFindHasMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractFindHasMany: function(store, type, payload, id, requestType){
        return this.extractArray(store, type, payload, id, requestType);
      },

      /**
        `extractCreateRecord` is a hook into the extract method used when a
        call is made to `DS.Store#createRecord`. By default this method is
        alias for [extractSave](#method_extractSave).

        @method extractCreateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractCreateRecord: function(store, type, payload, id, requestType) {
        return this.extractSave(store, type, payload, id, requestType);
      },
      /**
        `extractUpdateRecord` is a hook into the extract method used when
        a call is made to `DS.Store#update`. By default this method is alias
        for [extractSave](#method_extractSave).

        @method extractUpdateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractUpdateRecord: function(store, type, payload, id, requestType) {
        return this.extractSave(store, type, payload, id, requestType);
      },
      /**
        `extractDeleteRecord` is a hook into the extract method used when
        a call is made to `DS.Store#deleteRecord`. By default this method is
        alias for [extractSave](#method_extractSave).

        @method extractDeleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractDeleteRecord: function(store, type, payload, id, requestType) {
        return this.extractSave(store, type, payload, id, requestType);
      },

      /**
        `extractFind` is a hook into the extract method used when
        a call is made to `DS.Store#find`. By default this method is
        alias for [extractSingle](#method_extractSingle).

        @method extractFind
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractFind: function(store, type, payload, id, requestType) {
        return this.extractSingle(store, type, payload, id, requestType);
      },
      /**
        `extractFindBelongsTo` is a hook into the extract method used when
        a call is made to `DS.Store#findBelongsTo`. By default this method is
        alias for [extractSingle](#method_extractSingle).

        @method extractFindBelongsTo
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractFindBelongsTo: function(store, type, payload, id, requestType) {
        return this.extractSingle(store, type, payload, id, requestType);
      },
      /**
        `extractSave` is a hook into the extract method used when a call
        is made to `DS.Model#save`. By default this method is alias
        for [extractSingle](#method_extractSingle).

        @method extractSave
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractSave: function(store, type, payload, id, requestType) {
        return this.extractSingle(store, type, payload, id, requestType);
      },

      /**
        `extractSingle` is used to deserialize a single record returned
        from the adapter.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractSingle: function(store, type, payload) {
            payload.comments = payload._embedded.comment;
            delete payload._embedded;

            return this._super(store, type, payload);
          },
        });
        ```

        @method extractSingle
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Object} json The deserialized payload
      */
      extractSingle: function(store, type, payload, id, requestType) {
        payload = this.normalizePayload(payload);
        return this.normalize(type, payload);
      },

      /**
        `extractArray` is used to deserialize an array of records
        returned from the adapter.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractArray: function(store, type, payload) {
            return payload.map(function(json) {
              return this.extractSingle(store, type, json);
            }, this);
          }
        });
        ```

        @method extractArray
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
        @param {String or Number} id
        @param {String} requestType
        @return {Array} array An array of deserialized objects
      */
      extractArray: function(store, type, arrayPayload, id, requestType) {
        var normalizedPayload = this.normalizePayload(arrayPayload);
        var serializer = this;

        return map.call(normalizedPayload, function(singlePayload) {
          return serializer.normalize(type, singlePayload);
        });
      },

      /**
        `extractMeta` is used to deserialize any meta information in the
        adapter payload. By default Ember Data expects meta information to
        be located on the `meta` property of the payload object.

        Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          extractMeta: function(store, type, payload) {
            if (payload && payload._pagination) {
              store.metaForType(type, payload._pagination);
              delete payload._pagination;
            }
          }
        });
        ```

        @method extractMeta
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} payload
      */
      extractMeta: function(store, type, payload) {
        if (payload && payload.meta) {
          store.metaForType(type, payload.meta);
          delete payload.meta;
        }
      },

      /**
       `keyForAttribute` can be used to define rules for how to convert an
       attribute name in your model to a key in your JSON.

       Example

       ```javascript
       App.ApplicationSerializer = DS.RESTSerializer.extend({
         keyForAttribute: function(attr) {
           return Ember.String.underscore(attr).toUpperCase();
         }
       });
       ```

       @method keyForAttribute
       @param {String} key
       @return {String} normalized key
      */
      keyForAttribute: function(key){
        return key;
      },

      /**
       `keyForRelationship` can be used to define a custom key when
       serializing relationship properties. By default `JSONSerializer`
       does not provide an implementation of this method.

       Example

        ```javascript
        App.PostSerializer = DS.JSONSerializer.extend({
          keyForRelationship: function(key, relationship) {
             return 'rel_' + Ember.String.underscore(key);
          }
        });
        ```

       @method keyForRelationship
       @param {String} key
       @param {String} relationship type
       @return {String} normalized key
      */

      keyForRelationship: function(key, type){
        return key;
      },

      // HELPERS

      /**
       @method transformFor
       @private
       @param {String} attributeType
       @param {Boolean} skipAssertion
       @return {DS.Transform} transform
      */
      transformFor: function(attributeType, skipAssertion) {
        var transform = this.container.lookup('transform:' + attributeType);
        Ember.assert("Unable to find transform for '" + attributeType + "'", skipAssertion || !!transform);
        return transform;
      }
    });
  });
define("ember-data/serializers/rest_serializer",
  ["ember-data/serializers/json_serializer","ember-inflector/system/string","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    /**
      @module ember-data
    */

    var JSONSerializer = __dependency1__["default"];
    var get = Ember.get;
    var set = Ember.set;
    var forEach = Ember.ArrayPolyfills.forEach;
    var map = Ember.ArrayPolyfills.map;
    var camelize = Ember.String.camelize;

    var singularize = __dependency2__.singularize;

    function coerceId(id) {
      return id == null ? null : id + '';
    }

    /**
      Normally, applications will use the `RESTSerializer` by implementing
      the `normalize` method and individual normalizations under
      `normalizeHash`.

      This allows you to do whatever kind of munging you need, and is
      especially useful if your server is inconsistent and you need to
      do munging differently for many different kinds of responses.

      See the `normalize` documentation for more information.

      ## Across the Board Normalization

      There are also a number of hooks that you might find useful to define
      across-the-board rules for your payload. These rules will be useful
      if your server is consistent, or if you're building an adapter for
      an infrastructure service, like Parse, and want to encode service
      conventions.

      For example, if all of your keys are underscored and all-caps, but
      otherwise consistent with the names you use in your models, you
      can implement across-the-board rules for how to convert an attribute
      name in your model to a key in your JSON.

      ```js
      App.ApplicationSerializer = DS.RESTSerializer.extend({
        keyForAttribute: function(attr) {
          return Ember.String.underscore(attr).toUpperCase();
        }
      });
      ```

      You can also implement `keyForRelationship`, which takes the name
      of the relationship as the first parameter, and the kind of
      relationship (`hasMany` or `belongsTo`) as the second parameter.

      @class RESTSerializer
      @namespace DS
      @extends DS.JSONSerializer
    */
    __exports__["default"] = JSONSerializer.extend({
      /**
        If you want to do normalizations specific to some part of the payload, you
        can specify those under `normalizeHash`.

        For example, given the following json where the the `IDs` under
        `"comments"` are provided as `_id` instead of `id`.

        ```javascript
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "comments": [ 1, 2 ]
          },
          "comments": [{
            "_id": 1,
            "body": "FIRST"
          }, {
            "_id": 2,
            "body": "Rails is unagi"
          }]
        }
        ```

        You use `normalizeHash` to normalize just the comments:

        ```javascript
        App.PostSerializer = DS.RESTSerializer.extend({
          normalizeHash: {
            comments: function(hash) {
              hash.id = hash._id;
              delete hash._id;
              return hash;
            }
          }
        });
        ```

        The key under `normalizeHash` is usually just the original key
        that was in the original payload. However, key names will be
        impacted by any modifications done in the `normalizePayload`
        method. The `DS.RESTSerializer`'s default implementation makes no
        changes to the payload keys.

        @property normalizeHash
        @type {Object}
        @default undefined
      */

      /**
        Normalizes a part of the JSON payload returned by
        the server. You should override this method, munge the hash
        and call super if you have generic normalization to do.

        It takes the type of the record that is being normalized
        (as a DS.Model class), the property where the hash was
        originally found, and the hash to normalize.

        For example, if you have a payload that looks like this:

        ```js
        {
          "post": {
            "id": 1,
            "title": "Rails is omakase",
            "comments": [ 1, 2 ]
          },
          "comments": [{
            "id": 1,
            "body": "FIRST"
          }, {
            "id": 2,
            "body": "Rails is unagi"
          }]
        }
        ```

        The `normalize` method will be called three times:

        * With `App.Post`, `"posts"` and `{ id: 1, title: "Rails is omakase", ... }`
        * With `App.Comment`, `"comments"` and `{ id: 1, body: "FIRST" }`
        * With `App.Comment`, `"comments"` and `{ id: 2, body: "Rails is unagi" }`

        You can use this method, for example, to normalize underscored keys to camelized
        or other general-purpose normalizations.

        If you want to do normalizations specific to some part of the payload, you
        can specify those under `normalizeHash`.

        For example, if the `IDs` under `"comments"` are provided as `_id` instead of
        `id`, you can specify how to normalize just the comments:

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          normalizeHash: {
            comments: function(hash) {
              hash.id = hash._id;
              delete hash._id;
              return hash;
            }
          }
        });
        ```

        The key under `normalizeHash` is just the original key that was in the original
        payload.

        @method normalize
        @param {subclass of DS.Model} type
        @param {Object} hash
        @param {String} prop
        @return {Object}
      */
      normalize: function(type, hash, prop) {
        this.normalizeId(hash);
        this.normalizeAttributes(type, hash);
        this.normalizeRelationships(type, hash);

        this.normalizeUsingDeclaredMapping(type, hash);

        if (this.normalizeHash && this.normalizeHash[prop]) {
          this.normalizeHash[prop](hash);
        }

        this.applyTransforms(type, hash);
        return hash;
      },


      /**
        Called when the server has returned a payload representing
        a single record, such as in response to a `find` or `save`.

        It is your opportunity to clean up the server's response into the normalized
        form expected by Ember Data.

        If you want, you can just restructure the top-level of your payload, and
        do more fine-grained normalization in the `normalize` method.

        For example, if you have a payload like this in response to a request for
        post 1:

        ```js
        {
          "id": 1,
          "title": "Rails is omakase",

          "_embedded": {
            "comment": [{
              "_id": 1,
              "comment_title": "FIRST"
            }, {
              "_id": 2,
              "comment_title": "Rails is unagi"
            }]
          }
        }
        ```

        You could implement a serializer that looks like this to get your payload
        into shape:

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          // First, restructure the top-level so it's organized by type
          extractSingle: function(store, type, payload, id) {
            var comments = payload._embedded.comment;
            delete payload._embedded;

            payload = { comments: comments, post: payload };
            return this._super(store, type, payload, id);
          },

          normalizeHash: {
            // Next, normalize individual comments, which (after `extract`)
            // are now located under `comments`
            comments: function(hash) {
              hash.id = hash._id;
              hash.title = hash.comment_title;
              delete hash._id;
              delete hash.comment_title;
              return hash;
            }
          }
        })
        ```

        When you call super from your own implementation of `extractSingle`, the
        built-in implementation will find the primary record in your normalized
        payload and push the remaining records into the store.

        The primary record is the single hash found under `post` or the first
        element of the `posts` array.

        The primary record has special meaning when the record is being created
        for the first time or updated (`createRecord` or `updateRecord`). In
        particular, it will update the properties of the record that was saved.

        @method extractSingle
        @param {DS.Store} store
        @param {subclass of DS.Model} primaryType
        @param {Object} payload
        @param {String} recordId
        @return {Object} the primary response to the original request
      */
      extractSingle: function(store, primaryType, rawPayload, recordId) {
        var payload = this.normalizePayload(rawPayload);
        var primaryTypeName = primaryType.typeKey;
        var primaryRecord;

        for (var prop in payload) {
          var typeName  = this.typeForRoot(prop);
          var type = store.modelFor(typeName);
          var isPrimary = type.typeKey === primaryTypeName;
          var value = payload[prop];

          // legacy support for singular resources
          if (isPrimary && Ember.typeOf(value) !== "array" ) {
            primaryRecord = this.normalize(primaryType, value, prop);
            continue;
          }

          /*jshint loopfunc:true*/
          forEach.call(value, function(hash) {
            var typeName = this.typeForRoot(prop);
            var type = store.modelFor(typeName);
            var typeSerializer = store.serializerFor(type);

            hash = typeSerializer.normalize(type, hash, prop);

            var isFirstCreatedRecord = isPrimary && !recordId && !primaryRecord;
            var isUpdatedRecord = isPrimary && coerceId(hash.id) === recordId;

            // find the primary record.
            //
            // It's either:
            // * the record with the same ID as the original request
            // * in the case of a newly created record that didn't have an ID, the first
            //   record in the Array
            if (isFirstCreatedRecord || isUpdatedRecord) {
              primaryRecord = hash;
            } else {
              store.push(typeName, hash);
            }
          }, this);
        }

        return primaryRecord;
      },

      /**
        Called when the server has returned a payload representing
        multiple records, such as in response to a `findAll` or `findQuery`.

        It is your opportunity to clean up the server's response into the normalized
        form expected by Ember Data.

        If you want, you can just restructure the top-level of your payload, and
        do more fine-grained normalization in the `normalize` method.

        For example, if you have a payload like this in response to a request for
        all posts:

        ```js
        {
          "_embedded": {
            "post": [{
              "id": 1,
              "title": "Rails is omakase"
            }, {
              "id": 2,
              "title": "The Parley Letter"
            }],
            "comment": [{
              "_id": 1,
              "comment_title": "Rails is unagi"
              "post_id": 1
            }, {
              "_id": 2,
              "comment_title": "Don't tread on me",
              "post_id": 2
            }]
          }
        }
        ```

        You could implement a serializer that looks like this to get your payload
        into shape:

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          // First, restructure the top-level so it's organized by type
          // and the comments are listed under a post's `comments` key.
          extractArray: function(store, type, payload) {
            var posts = payload._embedded.post;
            var comments = [];
            var postCache = {};

            posts.forEach(function(post) {
              post.comments = [];
              postCache[post.id] = post;
            });

            payload._embedded.comment.forEach(function(comment) {
              comments.push(comment);
              postCache[comment.post_id].comments.push(comment);
              delete comment.post_id;
            });

            payload = { comments: comments, posts: payload };

            return this._super(store, type, payload);
          },

          normalizeHash: {
            // Next, normalize individual comments, which (after `extract`)
            // are now located under `comments`
            comments: function(hash) {
              hash.id = hash._id;
              hash.title = hash.comment_title;
              delete hash._id;
              delete hash.comment_title;
              return hash;
            }
          }
        })
        ```

        When you call super from your own implementation of `extractArray`, the
        built-in implementation will find the primary array in your normalized
        payload and push the remaining records into the store.

        The primary array is the array found under `posts`.

        The primary record has special meaning when responding to `findQuery`
        or `findHasMany`. In particular, the primary array will become the
        list of records in the record array that kicked off the request.

        If your primary array contains secondary (embedded) records of the same type,
        you cannot place these into the primary array `posts`. Instead, place the
        secondary items into an underscore prefixed property `_posts`, which will
        push these items into the store and will not affect the resulting query.

        @method extractArray
        @param {DS.Store} store
        @param {subclass of DS.Model} primaryType
        @param {Object} payload
        @return {Array} The primary array that was returned in response
          to the original query.
      */
      extractArray: function(store, primaryType, rawPayload) {
        var payload = this.normalizePayload(rawPayload);
        var primaryTypeName = primaryType.typeKey;
        var primaryArray;

        for (var prop in payload) {
          var typeKey = prop;
          var forcedSecondary = false;

          if (prop.charAt(0) === '_') {
            forcedSecondary = true;
            typeKey = prop.substr(1);
          }

          var typeName = this.typeForRoot(typeKey);
          var type = store.modelFor(typeName);
          var typeSerializer = store.serializerFor(type);
          var isPrimary = (!forcedSecondary && (type.typeKey === primaryTypeName));

          /*jshint loopfunc:true*/
          var normalizedArray = map.call(payload[prop], function(hash) {
            return typeSerializer.normalize(type, hash, prop);
          }, this);

          if (isPrimary) {
            primaryArray = normalizedArray;
          } else {
            store.pushMany(typeName, normalizedArray);
          }
        }

        return primaryArray;
      },

      /**
        This method allows you to push a payload containing top-level
        collections of records organized per type.

        ```js
        {
          "posts": [{
            "id": "1",
            "title": "Rails is omakase",
            "author", "1",
            "comments": [ "1" ]
          }],
          "comments": [{
            "id": "1",
            "body": "FIRST"
          }],
          "users": [{
            "id": "1",
            "name": "@d2h"
          }]
        }
        ```

        It will first normalize the payload, so you can use this to push
        in data streaming in from your server structured the same way
        that fetches and saves are structured.

        @method pushPayload
        @param {DS.Store} store
        @param {Object} payload
      */
      pushPayload: function(store, rawPayload) {
        var payload = this.normalizePayload(rawPayload);

        for (var prop in payload) {
          var typeName = this.typeForRoot(prop);
          var type = store.modelFor(typeName);
          var typeSerializer = store.serializerFor(type);

          /*jshint loopfunc:true*/
          var normalizedArray = map.call(Ember.makeArray(payload[prop]), function(hash) {
            return typeSerializer.normalize(type, hash, prop);
          }, this);

          store.pushMany(typeName, normalizedArray);
        }
      },

      /**
        This method is used to convert each JSON root key in the payload
        into a typeKey that it can use to look up the appropriate model for
        that part of the payload. By default the typeKey for a model is its
        name in camelCase, so if your JSON root key is 'fast-car' you would
        use typeForRoot to convert it to 'fastCar' so that Ember Data finds
        the `FastCar` model.

        If you diverge from this norm you should also consider changes to
        store._normalizeTypeKey as well.

        For example, your server may return prefixed root keys like so:

        ```js
        {
          "response-fast-car": {
            "id": "1",
            "name": "corvette"
          }
        }
        ```

        In order for Ember Data to know that the model corresponding to
        the 'response-fast-car' hash is `FastCar` (typeKey: 'fastCar'),
        you can override typeForRoot to convert 'response-fast-car' to
        'fastCar' like so:

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          typeForRoot: function(root) {
            // 'response-fast-car' should become 'fast-car'
            var subRoot = root.substring(9);

            // _super normalizes 'fast-car' to 'fastCar'
            return this._super(subRoot);
          }
        });
        ```

        @method typeForRoot
        @param {String} key
        @return {String} the model's typeKey
      */
      typeForRoot: function(key) {
        return camelize(singularize(key));
      },

      // SERIALIZE

      /**
        Called when a record is saved in order to convert the
        record into JSON.

        By default, it creates a JSON object with a key for
        each attribute and belongsTo relationship.

        For example, consider this model:

        ```js
        App.Comment = DS.Model.extend({
          title: DS.attr(),
          body: DS.attr(),

          author: DS.belongsTo('user')
        });
        ```

        The default serialization would create a JSON object like:

        ```js
        {
          "title": "Rails is unagi",
          "body": "Rails? Omakase? O_O",
          "author": 12
        }
        ```

        By default, attributes are passed through as-is, unless
        you specified an attribute type (`DS.attr('date')`). If
        you specify a transform, the JavaScript value will be
        serialized when inserted into the JSON hash.

        By default, belongs-to relationships are converted into
        IDs when inserted into the JSON hash.

        ## IDs

        `serialize` takes an options hash with a single option:
        `includeId`. If this option is `true`, `serialize` will,
        by default include the ID in the JSON object it builds.

        The adapter passes in `includeId: true` when serializing
        a record for `createRecord`, but not for `updateRecord`.

        ## Customization

        Your server may expect a different JSON format than the
        built-in serialization format.

        In that case, you can implement `serialize` yourself and
        return a JSON hash of your choosing.

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          serialize: function(post, options) {
            var json = {
              POST_TTL: post.get('title'),
              POST_BDY: post.get('body'),
              POST_CMS: post.get('comments').mapBy('id')
            }

            if (options.includeId) {
              json.POST_ID_ = post.get('id');
            }

            return json;
          }
        });
        ```

        ## Customizing an App-Wide Serializer

        If you want to define a serializer for your entire
        application, you'll probably want to use `eachAttribute`
        and `eachRelationship` on the record.

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          serialize: function(record, options) {
            var json = {};

            record.eachAttribute(function(name) {
              json[serverAttributeName(name)] = record.get(name);
            })

            record.eachRelationship(function(name, relationship) {
              if (relationship.kind === 'hasMany') {
                json[serverHasManyName(name)] = record.get(name).mapBy('id');
              }
            });

            if (options.includeId) {
              json.ID_ = record.get('id');
            }

            return json;
          }
        });

        function serverAttributeName(attribute) {
          return attribute.underscore().toUpperCase();
        }

        function serverHasManyName(name) {
          return serverAttributeName(name.singularize()) + "_IDS";
        }
        ```

        This serializer will generate JSON that looks like this:

        ```js
        {
          "TITLE": "Rails is omakase",
          "BODY": "Yep. Omakase.",
          "COMMENT_IDS": [ 1, 2, 3 ]
        }
        ```

        ## Tweaking the Default JSON

        If you just want to do some small tweaks on the default JSON,
        you can call super first and make the tweaks on the returned
        JSON.

        ```js
        App.PostSerializer = DS.RESTSerializer.extend({
          serialize: function(record, options) {
            var json = this._super(record, options);

            json.subject = json.title;
            delete json.title;

            return json;
          }
        });
        ```

        @method serialize
        @param record
        @param options
      */
      serialize: function(record, options) {
        return this._super.apply(this, arguments);
      },

      /**
        You can use this method to customize the root keys serialized into the JSON.
        By default the REST Serializer sends the typeKey of a model, whih is a camelized
        version of the name.

        For example, your server may expect underscored root objects.

        ```js
        App.ApplicationSerializer = DS.RESTSerializer.extend({
          serializeIntoHash: function(data, type, record, options) {
            var root = Ember.String.decamelize(type.typeKey);
            data[root] = this.serialize(record, options);
          }
        });
        ```

        @method serializeIntoHash
        @param {Object} hash
        @param {subclass of DS.Model} type
        @param {DS.Model} record
        @param {Object} options
      */
      serializeIntoHash: function(hash, type, record, options) {
        hash[type.typeKey] = this.serialize(record, options);
      },

      /**
        You can use this method to customize how polymorphic objects are serialized.
        By default the JSON Serializer creates the key by appending `Type` to
        the attribute and value from the model's camelcased model name.

        @method serializePolymorphicType
        @param {DS.Model} record
        @param {Object} json
        @param {Object} relationship
      */
      serializePolymorphicType: function(record, json, relationship) {
        var key = relationship.key;
        var belongsTo = get(record, key);
        key = this.keyForAttribute ? this.keyForAttribute(key) : key;
        if (Ember.isNone(belongsTo)) {
          json[key + "Type"] = null;
        } else {
          json[key + "Type"] = Ember.String.camelize(belongsTo.constructor.typeKey);
        }
      }
    });
  });
define("ember-data/setup-container",
  ["ember-data/initializers/store","ember-data/initializers/transforms","ember-data/initializers/store_injections","ember-data/initializers/data_adapter","activemodel-adapter/setup-container","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    
    var initializeStore = __dependency1__["default"];
    var initializeTransforms = __dependency2__["default"];
    var initializeStoreInjections = __dependency3__["default"];
    var initializeDataAdapter = __dependency4__["default"];
    var setupActiveModelContainer = __dependency5__["default"];

    __exports__["default"] = function setupContainer(container, application){
      // application is not a required argument. This ensures
      // testing setups can setup a container without booting an
      // entire ember application.

      initializeDataAdapter(container, application);
      initializeTransforms(container, application);
      initializeStoreInjections(container, application);
      initializeStore(container, application);
      setupActiveModelContainer(container, application);
    };
  });
define("ember-data/system/adapter",
  ["exports"],
  function(__exports__) {
    
    /**
      @module ember-data
    */

    var get = Ember.get;
    var set = Ember.set;
    var map = Ember.ArrayPolyfills.map;

    var errorProps = [
      'description',
      'fileName',
      'lineNumber',
      'message',
      'name',
      'number',
      'stack'
    ];

    /**
      A `DS.InvalidError` is used by an adapter to signal the external API
      was unable to process a request because the content was not
      semantically correct or meaningful per the API. Usually this means a
      record failed some form of server side validation. When a promise
      from an adapter is rejected with a `DS.InvalidError` the record will
      transition to the `invalid` state and the errors will be set to the
      `errors` property on the record.

      Example

      ```javascript
      App.ApplicationAdapter = DS.RESTAdapter.extend({
        ajaxError: function(jqXHR) {
          var error = this._super(jqXHR);

          if (jqXHR && jqXHR.status === 422) {
            var jsonErrors = Ember.$.parseJSON(jqXHR.responseText)["errors"];
            return new DS.InvalidError(jsonErrors);
          } else {
            return error;
          }
        }
      });
      ```

      The `DS.InvalidError` must be constructed with a single object whose
      keys are the invalid model properties, and whose values are the
      corresponding error messages. For example:

      ```javascript
      return new DS.InvalidError({
        length: 'Must be less than 15',
        name: 'Must not be blank
      });
      ```

      @class InvalidError
      @namespace DS
    */
    function InvalidError(errors) {
      var tmp = Error.prototype.constructor.call(this, "The backend rejected the commit because it was invalid: " + Ember.inspect(errors));
      this.errors = errors;

      for (var i=0, l=errorProps.length; i<l; i++) {
        this[errorProps[i]] = tmp[errorProps[i]];
      }
    }

    InvalidError.prototype = Ember.create(Error.prototype);

    /**
      An adapter is an object that receives requests from a store and
      translates them into the appropriate action to take against your
      persistence layer. The persistence layer is usually an HTTP API, but
      may be anything, such as the browser's local storage. Typically the
      adapter is not invoked directly instead its functionality is accessed
      through the `store`.

      ### Creating an Adapter

      Create a new subclass of `DS.Adapter`, then assign
      it to the `ApplicationAdapter` property of the application.

      ```javascript
      var MyAdapter = DS.Adapter.extend({
        // ...your code here
      });

      App.ApplicationAdapter = MyAdapter;
      ```

      Model-specific adapters can be created by assigning your adapter
      class to the `ModelName` + `Adapter` property of the application.

      ```javascript
      var MyPostAdapter = DS.Adapter.extend({
        // ...Post-specific adapter code goes here
      });

      App.PostAdapter = MyPostAdapter;
      ```

      `DS.Adapter` is an abstract base class that you should override in your
      application to customize it for your backend. The minimum set of methods
      that you should implement is:

        * `find()`
        * `createRecord()`
        * `updateRecord()`
        * `deleteRecord()`
        * `findAll()`
        * `findQuery()`

      To improve the network performance of your application, you can optimize
      your adapter by overriding these lower-level methods:

        * `findMany()`


      For an example implementation, see `DS.RESTAdapter`, the
      included REST adapter.

      @class Adapter
      @namespace DS
      @extends Ember.Object
    */

    var Adapter = Ember.Object.extend({

      /**
        If you would like your adapter to use a custom serializer you can
        set the `defaultSerializer` property to be the name of the custom
        serializer.

        Note the `defaultSerializer` serializer has a lower priority than
        a model specific serializer (i.e. `PostSerializer`) or the
        `application` serializer.

        ```javascript
        var DjangoAdapter = DS.Adapter.extend({
          defaultSerializer: 'django'
        });
        ```

        @property defaultSerializer
        @type {String}
      */

      /**
        The `find()` method is invoked when the store is asked for a record that
        has not previously been loaded. In response to `find()` being called, you
        should query your persistence layer for a record with the given ID. Once
        found, you can asynchronously call the store's `push()` method to push
        the record into the store.

        Here is an example `find` implementation:

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          find: function(store, type, id) {
            var url = [type.typeKey, id].join('/');

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.getJSON(url).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method find
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} id
        @return {Promise} promise
      */
      find: Ember.required(Function),

      /**
        The `findAll()` method is called when you call `find` on the store
        without an ID (i.e. `store.find('post')`).

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          findAll: function(store, type, sinceToken) {
            var url = type;
            var query = { since: sinceToken };
            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.getJSON(url, query).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @private
        @method findAll
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {String} sinceToken
        @return {Promise} promise
      */
      findAll: null,

      /**
        This method is called when you call `find` on the store with a
        query object as the second parameter (i.e. `store.find('person', {
        page: 1 })`).

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          findQuery: function(store, type, query) {
            var url = type;
            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.getJSON(url, query).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @private
        @method findQuery
        @param {DS.Store} store
        @param {subclass of DS.Model} type
        @param {Object} query
        @param {DS.AdapterPopulatedRecordArray} recordArray
        @return {Promise} promise
      */
      findQuery: null,

      /**
        If the globally unique IDs for your records should be generated on the client,
        implement the `generateIdForRecord()` method. This method will be invoked
        each time you create a new record, and the value returned from it will be
        assigned to the record's `primaryKey`.

        Most traditional REST-like HTTP APIs will not use this method. Instead, the ID
        of the record will be set by the server, and your adapter will update the store
        with the new ID when it calls `didCreateRecord()`. Only implement this method if
        you intend to generate record IDs on the client-side.

        The `generateIdForRecord()` method will be invoked with the requesting store as
        the first parameter and the newly created record as the second parameter:

        ```javascript
        generateIdForRecord: function(store, record) {
          var uuid = App.generateUUIDWithStatisticallyLowOddsOfCollision();
          return uuid;
        }
        ```

        @method generateIdForRecord
        @param {DS.Store} store
        @param {DS.Model} record
        @return {String|Number} id
      */
      generateIdForRecord: null,

      /**
        Proxies to the serializer's `serialize` method.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          createRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var url = type;

            // ...
          }
        });
        ```

        @method serialize
        @param {DS.Model} record
        @param {Object}   options
        @return {Object} serialized record
      */
      serialize: function(record, options) {
        return get(record, 'store').serializerFor(record.constructor.typeKey).serialize(record, options);
      },

      /**
        Implement this method in a subclass to handle the creation of
        new records.

        Serializes the record and send it to the server.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          createRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var url = type;

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.ajax({
                type: 'POST',
                url: url,
                dataType: 'json',
                data: data
              }).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method createRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the record
        @param {DS.Model} record
        @return {Promise} promise
      */
      createRecord: Ember.required(Function),

      /**
        Implement this method in a subclass to handle the updating of
        a record.

        Serializes the record update and send it to the server.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          updateRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var id = record.get('id');
            var url = [type, id].join('/');

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.ajax({
                type: 'PUT',
                url: url,
                dataType: 'json',
                data: data
              }).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method updateRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the record
        @param {DS.Model} record
        @return {Promise} promise
      */
      updateRecord: Ember.required(Function),

      /**
        Implement this method in a subclass to handle the deletion of
        a record.

        Sends a delete request for the record to the server.

        Example

        ```javascript
        App.ApplicationAdapter = DS.Adapter.extend({
          deleteRecord: function(store, type, record) {
            var data = this.serialize(record, { includeId: true });
            var id = record.get('id');
            var url = [type, id].join('/');

            return new Ember.RSVP.Promise(function(resolve, reject) {
              jQuery.ajax({
                type: 'DELETE',
                url: url,
                dataType: 'json',
                data: data
              }).then(function(data) {
                Ember.run(null, resolve, data);
              }, function(jqXHR) {
                jqXHR.then = null; // tame jQuery's ill mannered promises
                Ember.run(null, reject, jqXHR);
              });
            });
          }
        });
        ```

        @method deleteRecord
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the record
        @param {DS.Model} record
        @return {Promise} promise
      */
      deleteRecord: Ember.required(Function),

      /**
        By default the store will try to coalesce all `fetchRecord` calls within the same runloop
        into as few requests as possible by calling groupRecordsForFindMany and passing it into a findMany call.
        You can opt out of this behaviour by either not implementing the findMany hook or by setting
        coalesceFindRequests to false

        @property coalesceFindRequests
        @type {boolean}
      */
      coalesceFindRequests: true,

      /**
        Find multiple records at once if coalesceFindRequests is true

        @method findMany
        @param {DS.Store} store
        @param {subclass of DS.Model} type   the DS.Model class of the records
        @param {Array}    ids
        @param {Array} records
        @return {Promise} promise
      */

      /**
        Organize records into groups, each of which is to be passed to separate
        calls to `findMany`.

        For example, if your api has nested URLs that depend on the parent, you will
        want to group records by their parent.

        The default implementation returns the records as a single group.

        @method groupRecordsForFindMany
        @param {Array} records
        @return {Array}  an array of arrays of records, each of which is to be
                          loaded separately by `findMany`.
      */
      groupRecordsForFindMany: function (store, records) {
        return [records];
      }
    });

    __exports__.InvalidError = InvalidError;
    __exports__.Adapter = Adapter;
    __exports__["default"] = Adapter;
  });
define("ember-data/system/changes",
  ["ember-data/system/changes/relationship_change","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      @module ember-data
    */

    var RelationshipChange = __dependency1__.RelationshipChange;
    var RelationshipChangeAdd = __dependency1__.RelationshipChangeAdd;
    var RelationshipChangeRemove = __dependency1__.RelationshipChangeRemove;
    var OneToManyChange = __dependency1__.OneToManyChange;
    var ManyToNoneChange = __dependency1__.ManyToNoneChange;
    var OneToOneChange = __dependency1__.OneToOneChange;
    var ManyToManyChange = __dependency1__.ManyToManyChange;

    __exports__.RelationshipChange = RelationshipChange;
    __exports__.RelationshipChangeAdd = RelationshipChangeAdd;
    __exports__.RelationshipChangeRemove = RelationshipChangeRemove;
    __exports__.OneToManyChange = OneToManyChange;
    __exports__.ManyToNoneChange = ManyToNoneChange;
    __exports__.OneToOneChange = OneToOneChange;
    __exports__.ManyToManyChange = ManyToManyChange;
  });
define("ember-data/system/changes/relationship_change",
  ["ember-data/system/model/model","ember-data/system/relationship-meta","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    /**
      @module ember-data
    */

    var Model = __dependency1__["default"];
    var isSyncRelationship = __dependency2__.isSyncRelationship;

    var get = Ember.get;
    var set = Ember.set;
    var forEach = Ember.EnumerableUtils.forEach;

    /**
      @class RelationshipChange
      @namespace DS
      @private
      @constructor
    */
    var RelationshipChange = function(options) {
      this.parentRecord = options.parentRecord;
      this.childRecord = options.childRecord;
      this.firstRecord = options.firstRecord;
      this.firstRecordKind = options.firstRecordKind;
      this.firstRecordName = options.firstRecordName;
      this.secondRecord = options.secondRecord;
      this.secondRecordKind = options.secondRecordKind;
      this.secondRecordName = options.secondRecordName;
      this.changeType = options.changeType;
      this.store = options.store;

      this.committed = {};
    };

    /**
      @class RelationshipChangeAdd
      @namespace DS
      @private
      @constructor
    */
    function RelationshipChangeAdd(options){
      RelationshipChange.call(this, options);
    }

    /**
      @class RelationshipChangeRemove
      @namespace DS
      @private
      @constructor
    */
    function RelationshipChangeRemove(options){
      RelationshipChange.call(this, options);
    }

    RelationshipChange.create = function(options) {
      return new RelationshipChange(options);
    };

    RelationshipChangeAdd.create = function(options) {
      return new RelationshipChangeAdd(options);
    };

    RelationshipChangeRemove.create = function(options) {
      return new RelationshipChangeRemove(options);
    };

    var OneToManyChange = {};
    var OneToNoneChange = {};
    var ManyToNoneChange = {};
    var OneToOneChange = {};
    var ManyToManyChange = {};

    RelationshipChange._createChange = function(options){
      if (options.changeType === 'add') {
        return RelationshipChangeAdd.create(options);
      }
      if (options.changeType === 'remove') {
        return RelationshipChangeRemove.create(options);
      }
    };

    RelationshipChange.determineRelationshipType = function(recordType, knownSide){
      var knownKey = knownSide.key, key, otherKind;
      var knownKind = knownSide.kind;

      var inverse = recordType.inverseFor(knownKey);

      if (inverse) {
        key = inverse.name;
        otherKind = inverse.kind;
      }

      if (!inverse) {
        return knownKind === 'belongsTo' ? 'oneToNone' : 'manyToNone';
      } else {
        if (otherKind === 'belongsTo') {
          return knownKind === 'belongsTo' ? 'oneToOne' : 'manyToOne';
        } else {
          return knownKind === 'belongsTo' ? 'oneToMany' : 'manyToMany';
        }
      }
    };

    RelationshipChange.createChange = function(firstRecord, secondRecord, store, options){
      // Get the type of the child based on the child's client ID
      var firstRecordType = firstRecord.constructor, changeType;
      changeType = RelationshipChange.determineRelationshipType(firstRecordType, options);
      if (changeType === 'oneToMany') {
        return OneToManyChange.createChange(firstRecord, secondRecord, store, options);
      } else if (changeType === 'manyToOne') {
        return OneToManyChange.createChange(secondRecord, firstRecord, store, options);
      } else if (changeType === 'oneToNone') {
        return OneToNoneChange.createChange(firstRecord, secondRecord, store, options);
      } else if (changeType === 'manyToNone') {
        return ManyToNoneChange.createChange(firstRecord, secondRecord, store, options);
      } else if (changeType === 'oneToOne') {
        return OneToOneChange.createChange(firstRecord, secondRecord, store, options);
      } else if (changeType === 'manyToMany') {
        return ManyToManyChange.createChange(firstRecord, secondRecord, store, options);
      }
    };

    OneToNoneChange.createChange = function(childRecord, parentRecord, store, options) {
      var key = options.key;
      var change = RelationshipChange._createChange({
        parentRecord: parentRecord,
        childRecord: childRecord,
        firstRecord: childRecord,
        store: store,
        changeType: options.changeType,
        firstRecordName: key,
        firstRecordKind: 'belongsTo'
      });

      store.addRelationshipChangeFor(childRecord, key, parentRecord, null, change);

      return change;
    };

    ManyToNoneChange.createChange = function(childRecord, parentRecord, store, options) {
      var key = options.key;
      var change = RelationshipChange._createChange({
        parentRecord: childRecord,
        childRecord: parentRecord,
        secondRecord: childRecord,
        store: store,
        changeType: options.changeType,
        secondRecordName: options.key,
        secondRecordKind: 'hasMany'
      });

      store.addRelationshipChangeFor(childRecord, key, parentRecord, null, change);
      return change;
    };


    ManyToManyChange.createChange = function(childRecord, parentRecord, store, options) {
      // If the name of the belongsTo side of the relationship is specified,
      // use that
      // If the type of the parent is specified, look it up on the child's type
      // definition.
      var key = options.key;

      var change = RelationshipChange._createChange({
        parentRecord: parentRecord,
        childRecord: childRecord,
        firstRecord: childRecord,
        secondRecord: parentRecord,
        firstRecordKind: 'hasMany',
        secondRecordKind: 'hasMany',
        store: store,
        changeType: options.changeType,
        firstRecordName:  key
      });

      store.addRelationshipChangeFor(childRecord, key, parentRecord, null, change);

      return change;
    };

    OneToOneChange.createChange = function(childRecord, parentRecord, store, options) {
      var key;

      // If the name of the belongsTo side of the relationship is specified,
      // use that
      // If the type of the parent is specified, look it up on the child's type
      // definition.
      if (options.parentType) {
        key = options.parentType.inverseFor(options.key).name;
      } else if (options.key) {
        key = options.key;
      } else {
        Ember.assert('You must pass either a parentType or belongsToName option to OneToManyChange.forChildAndParent', false);
      }

      var change = RelationshipChange._createChange({
        parentRecord: parentRecord,
        childRecord: childRecord,
        firstRecord: childRecord,
        secondRecord: parentRecord,
        firstRecordKind: 'belongsTo',
        secondRecordKind: 'belongsTo',
        store: store,
        changeType: options.changeType,
        firstRecordName:  key
      });

      store.addRelationshipChangeFor(childRecord, key, parentRecord, null, change);

      return change;
    };

    OneToOneChange.maintainInvariant = function(options, store, childRecord, key){
      if (options.changeType === 'add' && store.recordIsMaterialized(childRecord)) {
        var oldParent = get(childRecord, key);
        if (oldParent) {
          var correspondingChange = OneToOneChange.createChange(childRecord, oldParent, store, {
            parentType: options.parentType,
            hasManyName: options.hasManyName,
            changeType: 'remove',
            key: options.key
          });
          store.addRelationshipChangeFor(childRecord, key, options.parentRecord , null, correspondingChange);
          correspondingChange.sync();
        }
      }
    };

    OneToManyChange.createChange = function(childRecord, parentRecord, store, options) {
      var key;

      // If the name of the belongsTo side of the relationship is specified,
      // use that
      // If the type of the parent is specified, look it up on the child's type
      // definition.
      if (options.parentType) {
        key = options.parentType.inverseFor(options.key).name;
        OneToManyChange.maintainInvariant( options, store, childRecord, key );
      } else if (options.key) {
        key = options.key;
      } else {
        Ember.assert('You must pass either a parentType or belongsToName option to OneToManyChange.forChildAndParent', false);
      }

      var change = RelationshipChange._createChange({
        parentRecord: parentRecord,
        childRecord: childRecord,
        firstRecord: childRecord,
        secondRecord: parentRecord,
        firstRecordKind: 'belongsTo',
        secondRecordKind: 'hasMany',
        store: store,
        changeType: options.changeType,
        firstRecordName: key
      });

      store.addRelationshipChangeFor(childRecord, key, parentRecord, change.getSecondRecordName(), change);

      return change;
    };

    OneToManyChange.maintainInvariant = function(options, store, childRecord, key){
      if (options.changeType === 'add' && childRecord) {
        var oldParent = get(childRecord, key);
        if (oldParent) {
          var correspondingChange = OneToManyChange.createChange(childRecord, oldParent, store, {
            parentType: options.parentType,
            hasManyName: options.hasManyName,
            changeType: 'remove',
            key: options.key
          });
          store.addRelationshipChangeFor(childRecord, key, options.parentRecord, correspondingChange.getSecondRecordName(), correspondingChange);
          correspondingChange.sync();
        }
      }
    };

    /**
      @class RelationshipChange
      @namespace DS
    */
    RelationshipChange.prototype = {
      getSecondRecordName: function() {
        var name = this.secondRecordName, parent;

        if (!name) {
          parent = this.secondRecord;
          if (!parent) { return; }

          var childType = this.firstRecord.constructor;
          var inverse = childType.inverseFor(this.firstRecordName);
          this.secondRecordName = inverse.name;
        }

        return this.secondRecordName;
      },

      /**
        Get the name of the relationship on the belongsTo side.

        @method getFirstRecordName
        @return {String}
      */
      getFirstRecordName: function() {
        return this.firstRecordName;
      },

      /**
        @method destroy
        @private
      */
      destroy: function() {
        var childRecord = this.childRecord;
        var belongsToName = this.getFirstRecordName();
        var hasManyName = this.getSecondRecordName();
        var store = this.store;

        store.removeRelationshipChangeFor(childRecord, belongsToName, this.parentRecord, hasManyName, this.changeType);
      },

      getSecondRecord: function(){
        return this.secondRecord;
      },

      /**
        @method getFirstRecord
        @private
      */
      getFirstRecord: function() {
        return this.firstRecord;
      },

      coalesce: function(){
        var relationshipPairs = this.store.relationshipChangePairsFor(this.firstRecord);
        forEach(relationshipPairs, function(pair) {
          var addedChange = pair['add'];
          var removedChange = pair['remove'];
          if (addedChange && removedChange) {
            addedChange.destroy();
            removedChange.destroy();
          }
        });
      }
    };

    RelationshipChangeAdd.prototype = Ember.create(RelationshipChange.create({}));
    RelationshipChangeRemove.prototype = Ember.create(RelationshipChange.create({}));

    RelationshipChangeAdd.prototype.changeType = 'add';
    RelationshipChangeAdd.prototype.sync = function() {
      var secondRecordName = this.getSecondRecordName();
      var firstRecordName = this.getFirstRecordName();
      var firstRecord = this.getFirstRecord();
      var secondRecord = this.getSecondRecord();

      //Ember.assert("You specified a hasMany (" + hasManyName + ") on " + (!belongsToName && (newParent || oldParent || this.lastParent).constructor) + " but did not specify an inverse belongsTo on " + child.constructor, belongsToName);
      //Ember.assert("You specified a belongsTo (" + belongsToName + ") on " + child.constructor + " but did not specify an inverse hasMany on " + (!hasManyName && (newParent || oldParent || this.lastParentRecord).constructor), hasManyName);

      if (secondRecord instanceof Model && firstRecord instanceof Model) {
        if (this.secondRecordKind === 'belongsTo') {
          secondRecord.suspendRelationshipObservers(function() {
            set(secondRecord, secondRecordName, firstRecord);
          });
        } else if (this.secondRecordKind === 'hasMany' && isSyncRelationship(secondRecord, secondRecordName)) {
          secondRecord.suspendRelationshipObservers(function() {
            var relationship = get(secondRecord, secondRecordName);
            relationship.addObject(firstRecord);
          });
        }
      }

      if (firstRecord instanceof Model && secondRecord instanceof Model && get(firstRecord, firstRecordName) !== secondRecord) {
        if (this.firstRecordKind === 'belongsTo') {
          firstRecord.suspendRelationshipObservers(function() {
            set(firstRecord, firstRecordName, secondRecord);
          });
        } else if (this.firstRecordKind === 'hasMany' && isSyncRelationship(secondRecord, secondRecordName)) {
          firstRecord.suspendRelationshipObservers(function() {
            var relationship = get(firstRecord, firstRecordName);
             relationship.addObject(secondRecord);
          });
        }
      }
      this.coalesce();
    };

    RelationshipChangeRemove.prototype.changeType = 'remove';
    RelationshipChangeRemove.prototype.sync = function() {
      var secondRecordName = this.getSecondRecordName();
      var firstRecordName = this.getFirstRecordName();
      var firstRecord = this.getFirstRecord();
      var secondRecord = this.getSecondRecord();

      //Ember.assert("You specified a hasMany (" + hasManyName + ") on " + (!belongsToName && (newParent || oldParent || this.lastParent).constructor) + " but did not specify an inverse belongsTo on " + child.constructor, belongsToName);
      //Ember.assert("You specified a belongsTo (" + belongsToName + ") on " + child.constructor + " but did not specify an inverse hasMany on " + (!hasManyName && (newParent || oldParent || this.lastParentRecord).constructor), hasManyName);

      if (secondRecord instanceof Model && firstRecord instanceof Model) {
        if (this.secondRecordKind === 'belongsTo') {
          secondRecord.suspendRelationshipObservers(function() {
            set(secondRecord, secondRecordName, null);
          });
        } else if (this.secondRecordKind === 'hasMany' && isSyncRelationship(secondRecord, secondRecordName)) {
          secondRecord.suspendRelationshipObservers(function() {
            var relationship = get(secondRecord, secondRecordName);
            relationship.removeObject(firstRecord);
          });
        }
      }

      if (firstRecord instanceof Model && get(firstRecord, firstRecordName)) {
        if (this.firstRecordKind === 'belongsTo') {
          firstRecord.suspendRelationshipObservers(function() {
            set(firstRecord, firstRecordName, null);
          });
        } else if (this.firstRecordKind === 'hasMany' && isSyncRelationship(firstRecord, firstRecordName)) {
          firstRecord.suspendRelationshipObservers(function() {
            var relationship = get(firstRecord, firstRecordName);
            relationship.removeObject(secondRecord);
          });
        }
      }

      this.coalesce();
    };

    __exports__.RelationshipChange = RelationshipChange;
    __exports__.RelationshipChangeAdd = RelationshipChangeAdd;
    __exports__.RelationshipChangeRemove = RelationshipChangeRemove;
    __exports__.OneToManyChange = OneToManyChange;
    __exports__.ManyToNoneChange = ManyToNoneChange;
    __exports__.OneToOneChange = OneToOneChange;
    __exports__.ManyToManyChange = ManyToManyChange;
  });
define("ember-data/system/container_proxy",
  ["exports"],
  function(__exports__) {
    
    /**
      This is used internally to enable deprecation of container paths and provide
      a decent message to the user indicating how to fix the issue.

      @class ContainerProxy
      @namespace DS
      @private
    */
    function ContainerProxy(container){
      this.container = container;
    }

    ContainerProxy.prototype.aliasedFactory = function(path, preLookup) {
      var _this = this;

      return {create: function(){
        if (preLookup) { preLookup(); }

        return _this.container.lookup(path);
      }};
    };

    ContainerProxy.prototype.registerAlias = function(source, dest, preLookup) {
      var factory = this.aliasedFactory(dest, preLookup);

      return this.container.register(source, factory);
    };

    ContainerProxy.prototype.registerDeprecation = function(deprecated, valid) {
      var preLookupCallback = function(){
        Ember.deprecate("You tried to look up '" + deprecated + "', " +
                        "but this has been deprecated in favor of '" + valid + "'.", false);
      };

      return this.registerAlias(deprecated, valid, preLookupCallback);
    };

    ContainerProxy.prototype.registerDeprecations = function(proxyPairs) {
      var i, proxyPair, deprecated, valid, proxy;

      for (i = proxyPairs.length; i > 0; i--) {
        proxyPair = proxyPairs[i - 1];
        deprecated = proxyPair['deprecated'];
        valid = proxyPair['valid'];

        this.registerDeprecation(deprecated, valid);
      }
    };

    __exports__["default"] = ContainerProxy;
  });
define("ember-data/system/debug",
  ["ember-data/system/debug/debug_info","ember-data/system/debug/debug_adapter","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    /**
      @module ember-data
    */

    var DebugAdapter = __dependency2__["default"];

    __exports__["default"] = DebugAdapter;
  });
define("ember-data/system/debug/debug_adapter",
  ["ember-data/system/model","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      @module ember-data
    */
    var Model = __dependency1__.Model;
    var get = Ember.get;
    var capitalize = Ember.String.capitalize;
    var underscore = Ember.String.underscore;

    /**
      Extend `Ember.DataAdapter` with ED specific code.

      @class DebugAdapter
      @namespace DS
      @extends Ember.DataAdapter
      @private
    */
    __exports__["default"] = Ember.DataAdapter.extend({
      getFilters: function() {
        return [
          { name: 'isNew', desc: 'New' },
          { name: 'isModified', desc: 'Modified' },
          { name: 'isClean', desc: 'Clean' }
        ];
      },

      detect: function(klass) {
        return klass !== Model && Model.detect(klass);
      },

      columnsForType: function(type) {
        var columns = [{
          name: 'id',
          desc: 'Id'
        }];
        var count = 0;
        var self = this;
        get(type, 'attributes').forEach(function(name, meta) {
            if (count++ > self.attributeLimit) { return false; }
            var desc = capitalize(underscore(name).replace('_', ' '));
            columns.push({ name: name, desc: desc });
        });
        return columns;
      },

      getRecords: function(type) {
        return this.get('store').all(type);
      },

      getRecordColumnValues: function(record) {
        var self = this, count = 0;
        var columnValues = { id: get(record, 'id') };

        record.eachAttribute(function(key) {
          if (count++ > self.attributeLimit) {
            return false;
          }
          var value = get(record, key);
          columnValues[key] = value;
        });
        return columnValues;
      },

      getRecordKeywords: function(record) {
        var keywords = [];
        var keys = Ember.A(['id']);
        record.eachAttribute(function(key) {
          keys.push(key);
        });
        keys.forEach(function(key) {
          keywords.push(get(record, key));
        });
        return keywords;
      },

      getRecordFilterValues: function(record) {
        return {
          isNew: record.get('isNew'),
          isModified: record.get('isDirty') && !record.get('isNew'),
          isClean: !record.get('isDirty')
        };
      },

      getRecordColor: function(record) {
        var color = 'black';
        if (record.get('isNew')) {
          color = 'green';
        } else if (record.get('isDirty')) {
          color = 'blue';
        }
        return color;
      },

      observeRecord: function(record, recordUpdated) {
        var releaseMethods = Ember.A(), self = this;
        var keysToObserve = Ember.A(['id', 'isNew', 'isDirty']);

        record.eachAttribute(function(key) {
          keysToObserve.push(key);
        });

        keysToObserve.forEach(function(key) {
          var handler = function() {
            recordUpdated(self.wrapRecord(record));
          };
          Ember.addObserver(record, key, handler);
          releaseMethods.push(function() {
            Ember.removeObserver(record, key, handler);
          });
        });

        var release = function() {
          releaseMethods.forEach(function(fn) { fn(); } );
        };

        return release;
      }

    });
  });
define("ember-data/system/debug/debug_info",
  ["ember-data/system/model","exports"],
  function(__dependency1__, __exports__) {
    
    var Model = __dependency1__.Model;

    Model.reopen({

      /**
        Provides info about the model for debugging purposes
        by grouping the properties into more semantic groups.

        Meant to be used by debugging tools such as the Chrome Ember Extension.

        - Groups all attributes in "Attributes" group.
        - Groups all belongsTo relationships in "Belongs To" group.
        - Groups all hasMany relationships in "Has Many" group.
        - Groups all flags in "Flags" group.
        - Flags relationship CPs as expensive properties.

        @method _debugInfo
        @for DS.Model
        @private
      */
      _debugInfo: function() {
        var attributes = ['id'],
            relationships = { belongsTo: [], hasMany: [] },
            expensiveProperties = [];

        this.eachAttribute(function(name, meta) {
          attributes.push(name);
        }, this);

        this.eachRelationship(function(name, relationship) {
          relationships[relationship.kind].push(name);
          expensiveProperties.push(name);
        });

        var groups = [
          {
            name: 'Attributes',
            properties: attributes,
            expand: true
          },
          {
            name: 'Belongs To',
            properties: relationships.belongsTo,
            expand: true
          },
          {
            name: 'Has Many',
            properties: relationships.hasMany,
            expand: true
          },
          {
            name: 'Flags',
            properties: ['isLoaded', 'isDirty', 'isSaving', 'isDeleted', 'isError', 'isNew', 'isValid']
          }
        ];

        return {
          propertyInfo: {
            // include all other mixins / properties (not just the grouped ones)
            includeOtherProperties: true,
            groups: groups,
            // don't pre-calculate unless cached
            expensiveProperties: expensiveProperties
          }
        };
      }
    });

    __exports__["default"] = Model;
  });
define("ember-data/system/model",
  ["ember-data/system/model/model","ember-data/system/model/attributes","ember-data/system/model/states","ember-data/system/model/errors","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    /**
      @module ember-data
    */

    var Model = __dependency1__["default"];
    var attr = __dependency2__["default"];
    var RootState = __dependency3__["default"];
    var Errors = __dependency4__["default"];

    __exports__.Model = Model;
    __exports__.RootState = RootState;
    __exports__.attr = attr;
    __exports__.Errors = Errors;
  });
define("ember-data/system/model/attributes",
  ["ember-data/system/model/model","exports"],
  function(__dependency1__, __exports__) {
    
    var Model = __dependency1__["default"];

    /**
      @module ember-data
    */

    var get = Ember.get;

    /**
      @class Model
      @namespace DS
    */
    Model.reopenClass({
      /**
        A map whose keys are the attributes of the model (properties
        described by DS.attr) and whose values are the meta object for the
        property.

        Example

        ```javascript

        App.Person = DS.Model.extend({
          firstName: attr('string'),
          lastName: attr('string'),
          birthday: attr('date')
        });

        var attributes = Ember.get(App.Person, 'attributes')

        attributes.forEach(function(name, meta) {
          console.log(name, meta);
        });

        // prints:
        // firstName {type: "string", isAttribute: true, options: Object, parentType: function, name: "firstName"}
        // lastName {type: "string", isAttribute: true, options: Object, parentType: function, name: "lastName"}
        // birthday {type: "date", isAttribute: true, options: Object, parentType: function, name: "birthday"}
        ```

        @property attributes
        @static
        @type {Ember.Map}
        @readOnly
      */
      attributes: Ember.computed(function() {
        var map = Ember.Map.create();

        this.eachComputedProperty(function(name, meta) {
          if (meta.isAttribute) {
            Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: DS.attr('<type>')` from " + this.toString(), name !== 'id');

            meta.name = name;
            map.set(name, meta);
          }
        });

        return map;
      }).readOnly(),

      /**
        A map whose keys are the attributes of the model (properties
        described by DS.attr) and whose values are type of transformation
        applied to each attribute. This map does not include any
        attributes that do not have an transformation type.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: attr(),
          lastName: attr('string'),
          birthday: attr('date')
        });

        var transformedAttributes = Ember.get(App.Person, 'transformedAttributes')

        transformedAttributes.forEach(function(field, type) {
          console.log(field, type);
        });

        // prints:
        // lastName string
        // birthday date
        ```

        @property transformedAttributes
        @static
        @type {Ember.Map}
        @readOnly
      */
      transformedAttributes: Ember.computed(function() {
        var map = Ember.Map.create();

        this.eachAttribute(function(key, meta) {
          if (meta.type) {
            map.set(key, meta.type);
          }
        });

        return map;
      }).readOnly(),

      /**
        Iterates through the attributes of the model, calling the passed function on each
        attribute.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(name, meta);
        ```

        - `name` the name of the current property in the iteration
        - `meta` the meta object for the attribute property in the iteration

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: attr('string'),
          lastName: attr('string'),
          birthday: attr('date')
        });

        App.Person.eachAttribute(function(name, meta) {
          console.log(name, meta);
        });

        // prints:
        // firstName {type: "string", isAttribute: true, options: Object, parentType: function, name: "firstName"}
        // lastName {type: "string", isAttribute: true, options: Object, parentType: function, name: "lastName"}
        // birthday {type: "date", isAttribute: true, options: Object, parentType: function, name: "birthday"}
       ```

        @method eachAttribute
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @static
      */
      eachAttribute: function(callback, binding) {
        get(this, 'attributes').forEach(function(name, meta) {
          callback.call(binding, name, meta);
        }, binding);
      },

      /**
        Iterates through the transformedAttributes of the model, calling
        the passed function on each attribute. Note the callback will not be
        called for any attributes that do not have an transformation type.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(name, type);
        ```

        - `name` the name of the current property in the iteration
        - `type` a string containing the name of the type of transformed
          applied to the attribute

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context.

        Example

        ```javascript
        App.Person = DS.Model.extend({
          firstName: attr(),
          lastName: attr('string'),
          birthday: attr('date')
        });

        App.Person.eachTransformedAttribute(function(name, type) {
          console.log(name, type);
        });

        // prints:
        // lastName string
        // birthday date
       ```

        @method eachTransformedAttribute
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @static
      */
      eachTransformedAttribute: function(callback, binding) {
        get(this, 'transformedAttributes').forEach(function(name, type) {
          callback.call(binding, name, type);
        });
      }
    });


    Model.reopen({
      eachAttribute: function(callback, binding) {
        this.constructor.eachAttribute(callback, binding);
      }
    });

    function getDefaultValue(record, options, key) {
      if (typeof options.defaultValue === "function") {
        return options.defaultValue.apply(null, arguments);
      } else {
        return options.defaultValue;
      }
    }

    function hasValue(record, key) {
      return record._attributes.hasOwnProperty(key) ||
             record._inFlightAttributes.hasOwnProperty(key) ||
             record._data.hasOwnProperty(key);
    }

    function getValue(record, key) {
      if (record._attributes.hasOwnProperty(key)) {
        return record._attributes[key];
      } else if (record._inFlightAttributes.hasOwnProperty(key)) {
        return record._inFlightAttributes[key];
      } else {
        return record._data[key];
      }
    }

    /**
      `DS.attr` defines an attribute on a [DS.Model](/api/data/classes/DS.Model.html).
      By default, attributes are passed through as-is, however you can specify an
      optional type to have the value automatically transformed.
      Ember Data ships with four basic transform types: `string`, `number`,
      `boolean` and `date`. You can define your own transforms by subclassing
      [DS.Transform](/api/data/classes/DS.Transform.html).

      Note that you cannot use `attr` to define an attribute of `id`.

      `DS.attr` takes an optional hash as a second parameter, currently
      supported options are:

      - `defaultValue`: Pass a string or a function to be called to set the attribute
                        to a default value if none is supplied.

      Example

      ```javascript
      var attr = DS.attr;

      App.User = DS.Model.extend({
        username: attr('string'),
        email: attr('string'),
        verified: attr('boolean', {defaultValue: false})
      });
      ```

      @namespace
      @method attr
      @for DS
      @param {String} type the attribute type
      @param {Object} options a hash of options
      @return {Attribute}
    */

    __exports__["default"] = function attr(type, options) {
      options = options || {};

      var meta = {
        type: type,
        isAttribute: true,
        options: options
      };

      return Ember.computed('data', function(key, value) {
        if (arguments.length > 1) {
          Ember.assert("You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: DS.attr('<type>')` from " + this.constructor.toString(), key !== 'id');
          var oldValue = getValue(this, key);

          if (value !== oldValue) {
            // Add the new value to the changed attributes hash; it will get deleted by
            // the 'didSetProperty' handler if it is no different from the original value
            this._attributes[key] = value;

            this.send('didSetProperty', {
              name: key,
              oldValue: oldValue,
              originalValue: this._data[key],
              value: value
            });
          }

          return value;
        } else if (hasValue(this, key)) {
          return getValue(this, key);
        } else {
          return getDefaultValue(this, options, key);
        }

      // `data` is never set directly. However, it may be
      // invalidated from the state manager's setData
      // event.
      }).meta(meta);
    };
  });
define("ember-data/system/model/errors",
  ["exports"],
  function(__exports__) {
    
    var get = Ember.get;
    var isEmpty = Ember.isEmpty;
    var map = Ember.EnumerableUtils.map;

    /**
    @module ember-data
    */

    /**
      Holds validation errors for a given record organized by attribute names.

      Every DS.Model has an `errors` property that is an instance of
      `DS.Errors`. This can be used to display validation error
      messages returned from the server when a `record.save()` rejects.
      This works automatically with `DS.ActiveModelAdapter`, but you
      can implement [ajaxError](api/data/classes/DS.RESTAdapter.html#method_ajaxError)
      in other adapters as well.

      For Example, if you had an `User` model that looked like this:

      ```javascript
      App.User = DS.Model.extend({
        username: attr('string'),
        email: attr('string')
      });
      ```
      And you attempted to save a record that did not validate on the backend.

      ```javascript
      var user = store.createRecord('user', {
        username: 'tomster',
        email: 'invalidEmail'
      });
      user.save();
      ```

      Your backend data store might return a response that looks like
      this. This response will be used to populate the error object.

      ```javascript
      {
        "errors": {
          "username": ["This username is already taken!"],
          "email": ["Doesn't look like a valid email."]
        }
      }
      ```

      Errors can be displayed to the user by accessing their property name
      or using the `messages` property to get an array of all errors.

      ```handlebars
      {{#each errors.messages}}
        <div class="error">
          {{message}}
        </div>
      {{/each}}

      <label>Username: {{input value=username}} </label>
      {{#each errors.username}}
        <div class="error">
          {{message}}
        </div>
      {{/each}}

      <label>Email: {{input value=email}} </label>
      {{#each errors.email}}
        <div class="error">
          {{message}}
        </div>
      {{/each}}
      ```

      @class Errors
      @namespace DS
      @extends Ember.Object
      @uses Ember.Enumerable
      @uses Ember.Evented
     */
    __exports__["default"] = Ember.Object.extend(Ember.Enumerable, Ember.Evented, {
      /**
        Register with target handler

        @method registerHandlers
        @param {Object} target
        @param {Function} becameInvalid
        @param {Function} becameValid
      */
      registerHandlers: function(target, becameInvalid, becameValid) {
        this.on('becameInvalid', target, becameInvalid);
        this.on('becameValid', target, becameValid);
      },

      /**
        @property errorsByAttributeName
        @type {Ember.MapWithDefault}
        @private
      */
      errorsByAttributeName: Ember.reduceComputed("content", {
        initialValue: function() {
          return Ember.MapWithDefault.create({
            defaultValue: function() {
              return Ember.A();
            }
          });
        },

        addedItem: function(errors, error) {
          errors.get(error.attribute).pushObject(error);

          return errors;
        },

        removedItem: function(errors, error) {
          errors.get(error.attribute).removeObject(error);

          return errors;
        }
      }),

      /**
        Returns errors for a given attribute

        ```javascript
        var user = store.createRecord('user', {
          username: 'tomster',
          email: 'invalidEmail'
        });
        user.save().catch(function(){
          user.get('errors').errorsFor('email'); // ["Doesn't look like a valid email."]
        });
        ```

        @method errorsFor
        @param {String} attribute
        @return {Array}
      */
      errorsFor: function(attribute) {
        return get(this, 'errorsByAttributeName').get(attribute);
      },

      /**
        An array containing all of the error messages for this
        record. This is useful for displaying all errors to the user.

        ```handlebars
        {{#each errors.messages}}
          <div class="error">
            {{message}}
          </div>
        {{/each}}
        ```

        @property messages
        @type {Array}
      */
      messages: Ember.computed.mapBy('content', 'message'),

      /**
        @property content
        @type {Array}
        @private
      */
      content: Ember.computed(function() {
        return Ember.A();
      }),

      /**
        @method unknownProperty
        @private
      */
      unknownProperty: function(attribute) {
        var errors = this.errorsFor(attribute);
        if (isEmpty(errors)) { return null; }
        return errors;
      },

      /**
        @method nextObject
        @private
      */
      nextObject: function(index, previousObject, context) {
        return get(this, 'content').objectAt(index);
      },

      /**
        Total number of errors.

        @property length
        @type {Number}
        @readOnly
      */
      length: Ember.computed.oneWay('content.length').readOnly(),

      /**
        @property isEmpty
        @type {Boolean}
        @readOnly
      */
      isEmpty: Ember.computed.not('length').readOnly(),

      /**
        Adds error messages to a given attribute and sends
        `becameInvalid` event to the record.

        Example:

        ```javascript
        if (!user.get('username') {
          user.get('errors').add('username', 'This field is required');
        }
        ```

        @method add
        @param {String} attribute
        @param {Array|String} messages
      */
      add: function(attribute, messages) {
        var wasEmpty = get(this, 'isEmpty');

        messages = this._findOrCreateMessages(attribute, messages);
        get(this, 'content').addObjects(messages);

        this.notifyPropertyChange(attribute);
        this.enumerableContentDidChange();

        if (wasEmpty && !get(this, 'isEmpty')) {
          this.trigger('becameInvalid');
        }
      },

      /**
        @method _findOrCreateMessages
        @private
      */
      _findOrCreateMessages: function(attribute, messages) {
        var errors = this.errorsFor(attribute);

        return map(Ember.makeArray(messages), function(message) {
          return errors.findBy('message', message) || {
            attribute: attribute,
            message: message
          };
        });
      },

      /**
        Removes all error messages from the given attribute and sends
        `becameValid` event to the record if there no more errors left.

        Example:

        ```javascript
        App.User = DS.Model.extend({
          email: DS.attr('string'),
          twoFactorAuth: DS.attr('boolean'),
          phone: DS.attr('string')
        });

        App.UserEditRoute = Ember.Route.extend({
          actions: {
            save: function(user) {
               if (!user.get('twoFactorAuth')) {
                 user.get('errors').remove('phone');
               }
               user.save();
             }
          }
        });
        ```

        @method remove
        @param {String} attribute
      */
      remove: function(attribute) {
        if (get(this, 'isEmpty')) { return; }

        var content = get(this, 'content').rejectBy('attribute', attribute);
        get(this, 'content').setObjects(content);

        this.notifyPropertyChange(attribute);
        this.enumerableContentDidChange();

        if (get(this, 'isEmpty')) {
          this.trigger('becameValid');
        }
      },

      /**
        Removes all error messages and sends `becameValid` event
        to the record.

        Example:

        ```javascript
        App.UserEditRoute = Ember.Route.extend({
          actions: {
            retrySave: function(user) {
               user.get('errors').clear();
               user.save();
             }
          }
        });
        ```

        @method clear
      */
      clear: function() {
        if (get(this, 'isEmpty')) { return; }

        get(this, 'content').clear();
        this.enumerableContentDidChange();

        this.trigger('becameValid');
      },

      /**
        Checks if there is error messages for the given attribute.

        ```javascript
        App.UserEditRoute = Ember.Route.extend({
          actions: {
            save: function(user) {
               if (user.get('errors').has('email')) {
                 return alert('Please update your email before attempting to save.');
               }
               user.save();
             }
          }
        });
        ```

        @method has
        @param {String} attribute
        @return {Boolean} true if there some errors on given attribute
      */
      has: function(attribute) {
        return !isEmpty(this.errorsFor(attribute));
      }
    });
  });
define("ember-data/system/model/model",
  ["ember-data/system/model/states","ember-data/system/model/errors","ember-data/system/store","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var RootState = __dependency1__["default"];
    var Errors = __dependency2__["default"];
    var PromiseObject = __dependency3__.PromiseObject;
    /**
      @module ember-data
    */

    var get = Ember.get;
    var set = Ember.set;
    var merge = Ember.merge;
    var Promise = Ember.RSVP.Promise;
    var forEach = Ember.ArrayPolyfills.forEach;

    var JSONSerializer;
    var retrieveFromCurrentState = Ember.computed('currentState', function(key, value) {
      return get(get(this, 'currentState'), key);
    }).readOnly();

    var _extractPivotNameCache = Object.create(null);
    var _splitOnDotCache = Object.create(null);

    function splitOnDot(name) {
      return _splitOnDotCache[name] || (
        _splitOnDotCache[name] = name.split('.')
      );
    }

    function extractPivotName(name) {
      return _extractPivotNameCache[name] || (
        _extractPivotNameCache[name] = splitOnDot(name)[0]
      );
    }

    /**

      The model class that all Ember Data records descend from.

      @class Model
      @namespace DS
      @extends Ember.Object
      @uses Ember.Evented
    */
    var Model = Ember.Object.extend(Ember.Evented, {
      _recordArrays: undefined,
      _relationships: undefined,
      _loadingRecordArrays: undefined,
      /**
        If this property is `true` the record is in the `empty`
        state. Empty is the first state all records enter after they have
        been created. Most records created by the store will quickly
        transition to the `loading` state if data needs to be fetched from
        the server or the `created` state if the record is created on the
        client. A record can also enter the empty state if the adapter is
        unable to locate the record.

        @property isEmpty
        @type {Boolean}
        @readOnly
      */
      isEmpty: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `loading` state. A
        record enters this state when the store asks the adapter for its
        data. It remains in this state until the adapter provides the
        requested data.

        @property isLoading
        @type {Boolean}
        @readOnly
      */
      isLoading: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `loaded` state. A
        record enters this state when its data is populated. Most of a
        record's lifecycle is spent inside substates of the `loaded`
        state.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isLoaded'); // true

        store.find('model', 1).then(function(model) {
          model.get('isLoaded'); // true
        });
        ```

        @property isLoaded
        @type {Boolean}
        @readOnly
      */
      isLoaded: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `dirty` state. The
        record has local changes that have not yet been saved by the
        adapter. This includes records that have been created (but not yet
        saved) or deleted.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isDirty'); // true

        store.find('model', 1).then(function(model) {
          model.get('isDirty'); // false
          model.set('foo', 'some value');
          model.get('isDirty'); // true
        });
        ```

        @property isDirty
        @type {Boolean}
        @readOnly
      */
      isDirty: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `saving` state. A
        record enters the saving state when `save` is called, but the
        adapter has not yet acknowledged that the changes have been
        persisted to the backend.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isSaving'); // false
        var promise = record.save();
        record.get('isSaving'); // true
        promise.then(function() {
          record.get('isSaving'); // false
        });
        ```

        @property isSaving
        @type {Boolean}
        @readOnly
      */
      isSaving: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `deleted` state
        and has been marked for deletion. When `isDeleted` is true and
        `isDirty` is true, the record is deleted locally but the deletion
        was not yet persisted. When `isSaving` is true, the change is
        in-flight. When both `isDirty` and `isSaving` are false, the
        change has persisted.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isDeleted');    // false
        record.deleteRecord();

        // Locally deleted
        record.get('isDeleted');    // true
        record.get('isDirty');      // true
        record.get('isSaving');     // false

        // Persisting the deletion
        var promise = record.save();
        record.get('isDeleted');    // true
        record.get('isSaving');     // true

        // Deletion Persisted
        promise.then(function() {
          record.get('isDeleted');  // true
          record.get('isSaving');   // false
          record.get('isDirty');    // false
        });
        ```

        @property isDeleted
        @type {Boolean}
        @readOnly
      */
      isDeleted: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `new` state. A
        record will be in the `new` state when it has been created on the
        client and the adapter has not yet report that it was successfully
        saved.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('isNew'); // true

        record.save().then(function(model) {
          model.get('isNew'); // false
        });
        ```

        @property isNew
        @type {Boolean}
        @readOnly
      */
      isNew: retrieveFromCurrentState,
      /**
        If this property is `true` the record is in the `valid` state.

        A record will be in the `valid` state when the adapter did not report any
        server-side validation failures.

        @property isValid
        @type {Boolean}
        @readOnly
      */
      isValid: retrieveFromCurrentState,
      /**
        If the record is in the dirty state this property will report what
        kind of change has caused it to move into the dirty
        state. Possible values are:

        - `created` The record has been created by the client and not yet saved to the adapter.
        - `updated` The record has been updated by the client and not yet saved to the adapter.
        - `deleted` The record has been deleted by the client and not yet saved to the adapter.

        Example

        ```javascript
        var record = store.createRecord('model');
        record.get('dirtyType'); // 'created'
        ```

        @property dirtyType
        @type {String}
        @readOnly
      */
      dirtyType: retrieveFromCurrentState,

      /**
        If `true` the adapter reported that it was unable to save local
        changes to the backend for any reason other than a server-side
        validation error.

        Example

        ```javascript
        record.get('isError'); // false
        record.set('foo', 'valid value');
        record.save().then(null, function() {
          record.get('isError'); // true
        });
        ```

        @property isError
        @type {Boolean}
        @readOnly
      */
      isError: false,
      /**
        If `true` the store is attempting to reload the record form the adapter.

        Example

        ```javascript
        record.get('isReloading'); // false
        record.reload();
        record.get('isReloading'); // true
        ```

        @property isReloading
        @type {Boolean}
        @readOnly
      */
      isReloading: false,

      /**
        The `clientId` property is a transient numerical identifier
        generated at runtime by the data store. It is important
        primarily because newly created objects may not yet have an
        externally generated id.

        @property clientId
        @private
        @type {Number|String}
      */
      clientId: null,
      /**
        All ember models have an id property. This is an identifier
        managed by an external source. These are always coerced to be
        strings before being used internally. Note when declaring the
        attributes for a model it is an error to declare an id
        attribute.

        ```javascript
        var record = store.createRecord('model');
        record.get('id'); // null

        store.find('model', 1).then(function(model) {
          model.get('id'); // '1'
        });
        ```

        @property id
        @type {String}
      */
      id: null,

      /**
        @property currentState
        @private
        @type {Object}
      */
      currentState: RootState.empty,

      /**
        When the record is in the `invalid` state this object will contain
        any errors returned by the adapter. When present the errors hash
        typically contains keys corresponding to the invalid property names
        and values which are an array of error messages.

        ```javascript
        record.get('errors.length'); // 0
        record.set('foo', 'invalid value');
        record.save().then(null, function() {
          record.get('errors').get('foo'); // ['foo should be a number.']
        });
        ```

        @property errors
        @type {DS.Errors}
      */
      errors: Ember.computed(function() {
        var errors = Errors.create();

        errors.registerHandlers(this, function() {
          this.send('becameInvalid');
        }, function() {
          this.send('becameValid');
        });

        return errors;
      }).readOnly(),

      /**
        Create a JSON representation of the record, using the serialization
        strategy of the store's adapter.

       `serialize` takes an optional hash as a parameter, currently
        supported options are:

       - `includeId`: `true` if the record's ID should be included in the
          JSON representation.

        @method serialize
        @param {Object} options
        @return {Object} an object whose values are primitive JSON values only
      */
      serialize: function(options) {
        var store = get(this, 'store');
        return store.serialize(this, options);
      },

      /**
        Use [DS.JSONSerializer](DS.JSONSerializer.html) to
        get the JSON representation of a record.

        `toJSON` takes an optional hash as a parameter, currently
        supported options are:

        - `includeId`: `true` if the record's ID should be included in the
          JSON representation.

        @method toJSON
        @param {Object} options
        @return {Object} A JSON representation of the object.
      */
      toJSON: function(options) {
        if (!JSONSerializer) { JSONSerializer = requireModule("ember-data/serializers/json_serializer")["default"]; }
        // container is for lazy transform lookups
        var serializer = JSONSerializer.create({ container: this.container });
        return serializer.serialize(this, options);
      },

      /**
        Fired when the record is loaded from the server.

        @event didLoad
      */
      didLoad: Ember.K,

      /**
        Fired when the record is updated.

        @event didUpdate
      */
      didUpdate: Ember.K,

      /**
        Fired when the record is created.

        @event didCreate
      */
      didCreate: Ember.K,

      /**
        Fired when the record is deleted.

        @event didDelete
      */
      didDelete: Ember.K,

      /**
        Fired when the record becomes invalid.

        @event becameInvalid
      */
      becameInvalid: Ember.K,

      /**
        Fired when the record enters the error state.

        @event becameError
      */
      becameError: Ember.K,

      /**
        @property data
        @private
        @type {Object}
      */
      data: Ember.computed(function() {
        this._data = this._data || {};
        return this._data;
      }).readOnly(),

      _data: null,

      init: function() {
        this._super();
        this._setup();
      },

      _setup: function() {
        this._changesToSync = {};
        this._deferredTriggers = [];
        this._data = {};
        this._attributes = {};
        this._inFlightAttributes = {};
        this._relationships = {};
      },

      /**
        @method send
        @private
        @param {String} name
        @param {Object} context
      */
      send: function(name, context) {
        var currentState = get(this, 'currentState');

        if (!currentState[name]) {
          this._unhandledEvent(currentState, name, context);
        }

        return currentState[name](this, context);
      },

      /**
        @method transitionTo
        @private
        @param {String} name
      */
      transitionTo: function(name) {
        // POSSIBLE TODO: Remove this code and replace with
        // always having direct references to state objects

        var pivotName = extractPivotName(name);
        var currentState = get(this, 'currentState');
        var state = currentState;

        do {
          if (state.exit) { state.exit(this); }
          state = state.parentState;
        } while (!state.hasOwnProperty(pivotName));

        var path = splitOnDot(name);
        var setups = [], enters = [], i, l;

        for (i=0, l=path.length; i<l; i++) {
          state = state[path[i]];

          if (state.enter) { enters.push(state); }
          if (state.setup) { setups.push(state); }
        }

        for (i=0, l=enters.length; i<l; i++) {
          enters[i].enter(this);
        }

        set(this, 'currentState', state);

        for (i=0, l=setups.length; i<l; i++) {
          setups[i].setup(this);
        }

        this.updateRecordArraysLater();
      },

      _unhandledEvent: function(state, name, context) {
        var errorMessage = "Attempted to handle event `" + name + "` ";
        errorMessage    += "on " + String(this) + " while in state ";
        errorMessage    += state.stateName + ". ";

        if (context !== undefined) {
          errorMessage  += "Called with " + Ember.inspect(context) + ".";
        }

        throw new Ember.Error(errorMessage);
      },

      withTransaction: function(fn) {
        var transaction = get(this, 'transaction');
        if (transaction) { fn(transaction); }
      },

      /**
        @method loadingData
        @private
        @param {Promise} promise
      */
      loadingData: function(promise) {
        this.send('loadingData', promise);
      },

      /**
        @method loadedData
        @private
      */
      loadedData: function() {
        this.send('loadedData');
      },

      /**
        @method notFound
        @private
      */
      notFound: function() {
        this.send('notFound');
      },

      /**
        @method pushedData
        @private
      */
      pushedData: function() {
        this.send('pushedData');
      },

      /**
        Marks the record as deleted but does not save it. You must call
        `save` afterwards if you want to persist it. You might use this
        method if you want to allow the user to still `rollback()` a
        delete after it was made.

        Example

        ```javascript
        App.ModelDeleteRoute = Ember.Route.extend({
          actions: {
            softDelete: function() {
              this.controller.get('model').deleteRecord();
            },
            confirm: function() {
              this.controller.get('model').save();
            },
            undo: function() {
              this.controller.get('model').rollback();
            }
          }
        });
        ```

        @method deleteRecord
      */
      deleteRecord: function() {
        this.send('deleteRecord');
      },

      /**
        Same as `deleteRecord`, but saves the record immediately.

        Example

        ```javascript
        App.ModelDeleteRoute = Ember.Route.extend({
          actions: {
            delete: function() {
              var controller = this.controller;
              controller.get('model').destroyRecord().then(function() {
                controller.transitionToRoute('model.index');
              });
            }
          }
        });
        ```

        @method destroyRecord
        @return {Promise} a promise that will be resolved when the adapter returns
        successfully or rejected if the adapter returns with an error.
      */
      destroyRecord: function() {
        this.deleteRecord();
        return this.save();
      },

      /**
        @method unloadRecord
        @private
      */
      unloadRecord: function() {
        if (this.isDestroyed) { return; }

        this.send('unloadRecord');
      },

      /**
        @method clearRelationships
        @private
      */
      clearRelationships: function() {
        this.eachRelationship(function(name, relationship) {
          if (relationship.kind === 'belongsTo') {
            set(this, name, null);
          } else if (relationship.kind === 'hasMany') {
            var hasMany = this._relationships[name];
            if (hasMany) { // relationships are created lazily
              hasMany.destroy();
            }
          }
        }, this);
      },

      /**
        @method updateRecordArrays
        @private
      */
      updateRecordArrays: function() {
        this._updatingRecordArraysLater = false;
        get(this, 'store').dataWasUpdated(this.constructor, this);
      },

      /**
        When a find request is triggered on the store, the user can optionally passed in
        attributes and relationships to be preloaded. These are meant to behave as if they
        came back from the server, expect the user obtained them out of band and is informing
        the store of their existence. The most common use case is for supporting client side
        nested URLs, such as `/posts/1/comments/2` so the user can do
        `store.find('comment', 2, {post:1})` without having to fetch the post.

        Preloaded data can be attributes and relationships passed in either as IDs or as actual
        models.

        @method _preloadData
        @private
        @param {Object} preload
      */
      _preloadData: function(preload) {
        var record = this;
        //TODO(Igor) consider the polymorphic case
        forEach.call(Ember.keys(preload), function(key) {
          var preloadValue = get(preload, key);
          var relationshipMeta = record.constructor.metaForProperty(key);
          if (relationshipMeta.isRelationship) {
            record._preloadRelationship(key, preloadValue);
          } else {
            get(record, '_data')[key] = preloadValue;
          }
        });
      },

      _preloadRelationship: function(key, preloadValue) {
        var relationshipMeta = this.constructor.metaForProperty(key);
        var type = relationshipMeta.type;
        if (relationshipMeta.kind === 'hasMany'){
          this._preloadHasMany(key, preloadValue, type);
        } else {
          this._preloadBelongsTo(key, preloadValue, type);
        }
      },

      _preloadHasMany: function(key, preloadValue, type) {
        Ember.assert("You need to pass in an array to set a hasMany property on a record", Ember.isArray(preloadValue));
        var record = this;

        forEach.call(preloadValue, function(recordToPush) {
          recordToPush = record._convertStringOrNumberIntoRecord(recordToPush, type);
          get(record, key).pushObject(recordToPush);
        });
      },

      _preloadBelongsTo: function(key, preloadValue, type){
        var recordToPush = this._convertStringOrNumberIntoRecord(preloadValue, type);
        set(this, key, recordToPush);
      },

      _convertStringOrNumberIntoRecord: function(value, type) {
        if (Ember.typeOf(value) === 'string' || Ember.typeOf(value) === 'number'){
          return this.store.recordForId(type, value);
        }
        return value;
      },

      /**
        Returns an object, whose keys are changed properties, and value is
        an [oldProp, newProp] array.

        Example

        ```javascript
        App.Mascot = DS.Model.extend({
          name: attr('string')
        });

        var person = store.createRecord('person');
        person.changedAttributes(); // {}
        person.set('name', 'Tomster');
        person.changedAttributes(); // {name: [undefined, 'Tomster']}
        ```

        @method changedAttributes
        @return {Object} an object, whose keys are changed properties,
          and value is an [oldProp, newProp] array.
      */
      changedAttributes: function() {
        var oldData = get(this, '_data');
        var newData = get(this, '_attributes');
        var diffData = {};
        var prop;

        for (prop in newData) {
          diffData[prop] = [oldData[prop], newData[prop]];
        }

        return diffData;
      },

      /**
        @method adapterWillCommit
        @private
      */
      adapterWillCommit: function() {
        this.send('willCommit');
      },

      /**
        If the adapter did not return a hash in response to a commit,
        merge the changed attributes and relationships into the existing
        saved data.

        @method adapterDidCommit
      */
      adapterDidCommit: function(data) {
        set(this, 'isError', false);

        if (data) {
          this._data = data;
        } else {
          Ember.mixin(this._data, this._inFlightAttributes);
        }

        this._inFlightAttributes = {};

        this.send('didCommit');
        this.updateRecordArraysLater();

        if (!data) { return; }

        this.suspendRelationshipObservers(function() {
          this.notifyPropertyChange('data');
        });
      },

      /**
        @method adapterDidDirty
        @private
      */
      adapterDidDirty: function() {
        this.send('becomeDirty');
        this.updateRecordArraysLater();
      },

      dataDidChange: Ember.observer(function() {
        this.reloadHasManys();
      }, 'data'),

      reloadHasManys: function() {
        var relationships = get(this.constructor, 'relationshipsByName');
        this.updateRecordArraysLater();
        relationships.forEach(function(name, relationship) {
          if (this._data.links && this._data.links[name]) { return; }
          if (relationship.kind === 'hasMany') {
            this.hasManyDidChange(relationship.key);
          }
        }, this);
      },

      hasManyDidChange: function(key) {
        var hasMany = this._relationships[key];

        if (hasMany) {
          var records = this._data[key] || [];

          set(hasMany, 'content', Ember.A(records));
          set(hasMany, 'isLoaded', true);
          hasMany.trigger('didLoad');
        }
      },

      /**
        @method updateRecordArraysLater
        @private
      */
      updateRecordArraysLater: function() {
        // quick hack (something like this could be pushed into run.once
        if (this._updatingRecordArraysLater) { return; }
        this._updatingRecordArraysLater = true;

        Ember.run.schedule('actions', this, this.updateRecordArrays);
      },

      /**
        @method setupData
        @private
        @param {Object} data
        @param {Boolean} partial the data should be merged into
          the existing data, not replace it.
      */
      setupData: function(data, partial) {
        if (partial) {
          Ember.merge(this._data, data);
        } else {
          this._data = data;
        }

        var relationships = this._relationships;

        this.eachRelationship(function(name, rel) {
          if (data.links && data.links[name]) { return; }
          if (rel.options.async) { relationships[name] = null; }
        });

        if (data) { this.pushedData(); }

        this.suspendRelationshipObservers(function() {
          this.notifyPropertyChange('data');
        });
      },

      materializeId: function(id) {
        set(this, 'id', id);
      },

      materializeAttributes: function(attributes) {
        Ember.assert("Must pass a hash of attributes to materializeAttributes", !!attributes);
        merge(this._data, attributes);
      },

      materializeAttribute: function(name, value) {
        this._data[name] = value;
      },

      /**
        @method updateHasMany
        @private
        @param {String} name
        @param {Array} records
      */
      updateHasMany: function(name, records) {
        this._data[name] = records;
        this.hasManyDidChange(name);
      },

      /**
        @method updateBelongsTo
        @private
        @param {String} name
        @param {DS.Model} record
      */
      updateBelongsTo: function(name, record) {
        this._data[name] = record;
      },

      /**
        If the model `isDirty` this function will discard any unsaved
        changes

        Example

        ```javascript
        record.get('name'); // 'Untitled Document'
        record.set('name', 'Doc 1');
        record.get('name'); // 'Doc 1'
        record.rollback();
        record.get('name'); // 'Untitled Document'
        ```

        @method rollback
      */
      rollback: function() {
        this._attributes = {};

        if (get(this, 'isError')) {
          this._inFlightAttributes = {};
          set(this, 'isError', false);
        }

        if (!get(this, 'isValid')) {
          this._inFlightAttributes = {};
        }

        this.send('rolledBack');

        this.suspendRelationshipObservers(function() {
          this.notifyPropertyChange('data');
        });
      },

      toStringExtension: function() {
        return get(this, 'id');
      },

      /**
        The goal of this method is to temporarily disable specific observers
        that take action in response to application changes.

        This allows the system to make changes (such as materialization and
        rollback) that should not trigger secondary behavior (such as setting an
        inverse relationship or marking records as dirty).

        The specific implementation will likely change as Ember proper provides
        better infrastructure for suspending groups of observers, and if Array
        observation becomes more unified with regular observers.

        @method suspendRelationshipObservers
        @private
        @param callback
        @param binding
      */
      suspendRelationshipObservers: function(callback, binding) {
        var observers = get(this.constructor, 'relationshipNames').belongsTo;
        var self = this;

        try {
          this._suspendedRelationships = true;
          Ember._suspendObservers(self, observers, null, 'belongsToDidChange', function() {
            Ember._suspendBeforeObservers(self, observers, null, 'belongsToWillChange', function() {
              callback.call(binding || self);
            });
          });
        } finally {
          this._suspendedRelationships = false;
        }
      },

      /**
        Save the record and persist any changes to the record to an
        extenal source via the adapter.

        Example

        ```javascript
        record.set('name', 'Tomster');
        record.save().then(function(){
          // Success callback
        }, function() {
          // Error callback
        });
        ```
        @method save
        @return {Promise} a promise that will be resolved when the adapter returns
        successfully or rejected if the adapter returns with an error.
      */
      save: function() {
        var promiseLabel = "DS: Model#save " + this;
        var resolver = Ember.RSVP.defer(promiseLabel);

        this.get('store').scheduleSave(this, resolver);
        this._inFlightAttributes = this._attributes;
        this._attributes = {};

        return PromiseObject.create({
          promise: resolver.promise
        });
      },

      /**
        Reload the record from the adapter.

        This will only work if the record has already finished loading
        and has not yet been modified (`isLoaded` but not `isDirty`,
        or `isSaving`).

        Example

        ```javascript
        App.ModelViewRoute = Ember.Route.extend({
          actions: {
            reload: function() {
              this.controller.get('model').reload();
            }
          }
        });
        ```

        @method reload
        @return {Promise} a promise that will be resolved with the record when the
        adapter returns successfully or rejected if the adapter returns
        with an error.
      */
      reload: function() {
        set(this, 'isReloading', true);

        var record = this;
        var promiseLabel = "DS: Model#reload of " + this;
        var promise = new Promise(function(resolve){
           record.send('reloadRecord', resolve);
        }, promiseLabel).then(function() {
          record.set('isReloading', false);
          record.set('isError', false);
          return record;
        }, function(reason) {
          record.set('isError', true);
          throw reason;
        }, "DS: Model#reload complete, update flags");

        return PromiseObject.create({
          promise: promise
        });
      },

      // FOR USE DURING COMMIT PROCESS

      adapterDidUpdateAttribute: function(attributeName, value) {

        // If a value is passed in, update the internal attributes and clear
        // the attribute cache so it picks up the new value. Otherwise,
        // collapse the current value into the internal attributes because
        // the adapter has acknowledged it.
        if (value !== undefined) {
          this._data[attributeName] = value;
          this.notifyPropertyChange(attributeName);
        } else {
          this._data[attributeName] = this._inFlightAttributes[attributeName];
        }

        this.updateRecordArraysLater();
      },

      /**
        @method adapterDidInvalidate
        @private
      */
      adapterDidInvalidate: function(errors) {
        var recordErrors = get(this, 'errors');
        function addError(name) {
          if (errors[name]) {
            recordErrors.add(name, errors[name]);
          }
        }

        this.eachAttribute(addError);
        this.eachRelationship(addError);
      },

      /**
        @method adapterDidError
        @private
      */
      adapterDidError: function() {
        this.send('becameError');
        set(this, 'isError', true);
      },

      /**
        Override the default event firing from Ember.Evented to
        also call methods with the given name.

        @method trigger
        @private
        @param name
      */
      trigger: function(name) {
        Ember.tryInvoke(this, name, [].slice.call(arguments, 1));
        this._super.apply(this, arguments);
      },

      triggerLater: function() {
        if (this._deferredTriggers.push(arguments) !== 1) { return; }
        Ember.run.schedule('actions', this, '_triggerDeferredTriggers');
      },

      _triggerDeferredTriggers: function() {
        for (var i=0, l= this._deferredTriggers.length; i<l; i++) {
          this.trigger.apply(this, this._deferredTriggers[i]);
        }

        this._deferredTriggers.length = 0;
      },

      willDestroy: function() {
        this._super();
        this.clearRelationships();
      },

      // This is a temporary solution until we refactor DS.Model to not
      // rely on the data property.
      willMergeMixin: function(props) {
        Ember.assert('`data` is a reserved property name on DS.Model objects. Please choose a different property name for ' + this.constructor.toString(), !props.data);
      }
    });

    Model.reopenClass({
      /**
        Alias DS.Model's `create` method to `_create`. This allows us to create DS.Model
        instances from within the store, but if end users accidentally call `create()`
        (instead of `createRecord()`), we can raise an error.

        @method _create
        @private
        @static
      */
      _create: Model.create,

      /**
        Override the class' `create()` method to raise an error. This
        prevents end users from inadvertently calling `create()` instead
        of `createRecord()`. The store is still able to create instances
        by calling the `_create()` method. To create an instance of a
        `DS.Model` use [store.createRecord](DS.Store.html#method_createRecord).

        @method create
        @private
        @static
      */
      create: function() {
        throw new Ember.Error("You should not call `create` on a model. Instead, call `store.createRecord` with the attributes you would like to set.");
      }
    });

    __exports__["default"] = Model;
  });
define("ember-data/system/model/states",
  ["exports"],
  function(__exports__) {
    
    /**
      @module ember-data
    */

    var get = Ember.get;
    var set = Ember.set;
    /*
      This file encapsulates the various states that a record can transition
      through during its lifecycle.
    */
    /**
      ### State

      Each record has a `currentState` property that explicitly tracks what
      state a record is in at any given time. For instance, if a record is
      newly created and has not yet been sent to the adapter to be saved,
      it would be in the `root.loaded.created.uncommitted` state.  If a
      record has had local modifications made to it that are in the
      process of being saved, the record would be in the
      `root.loaded.updated.inFlight` state. (This state paths will be
      explained in more detail below.)

      Events are sent by the record or its store to the record's
      `currentState` property. How the state reacts to these events is
      dependent on which state it is in. In some states, certain events
      will be invalid and will cause an exception to be raised.

      States are hierarchical and every state is a substate of the
      `RootState`. For example, a record can be in the
      `root.deleted.uncommitted` state, then transition into the
      `root.deleted.inFlight` state. If a child state does not implement
      an event handler, the state manager will attempt to invoke the event
      on all parent states until the root state is reached. The state
      hierarchy of a record is described in terms of a path string. You
      can determine a record's current state by getting the state's
      `stateName` property:

      ```javascript
      record.get('currentState.stateName');
      //=> "root.created.uncommitted"
       ```

      The hierarchy of valid states that ship with ember data looks like
      this:

      ```text
      * root
        * deleted
          * saved
          * uncommitted
          * inFlight
        * empty
        * loaded
          * created
            * uncommitted
            * inFlight
          * saved
          * updated
            * uncommitted
            * inFlight
        * loading
      ```

      The `DS.Model` states are themselves stateless. What that means is
      that, the hierarchical states that each of *those* points to is a
      shared data structure. For performance reasons, instead of each
      record getting its own copy of the hierarchy of states, each record
      points to this global, immutable shared instance. How does a state
      know which record it should be acting on? We pass the record
      instance into the state's event handlers as the first argument.

      The record passed as the first parameter is where you should stash
      state about the record if needed; you should never store data on the state
      object itself.

      ### Events and Flags

      A state may implement zero or more events and flags.

      #### Events

      Events are named functions that are invoked when sent to a record. The
      record will first look for a method with the given name on the
      current state. If no method is found, it will search the current
      state's parent, and then its grandparent, and so on until reaching
      the top of the hierarchy. If the root is reached without an event
      handler being found, an exception will be raised. This can be very
      helpful when debugging new features.

      Here's an example implementation of a state with a `myEvent` event handler:

      ```javascript
      aState: DS.State.create({
        myEvent: function(manager, param) {
          console.log("Received myEvent with", param);
        }
      })
      ```

      To trigger this event:

      ```javascript
      record.send('myEvent', 'foo');
      //=> "Received myEvent with foo"
      ```

      Note that an optional parameter can be sent to a record's `send()` method,
      which will be passed as the second parameter to the event handler.

      Events should transition to a different state if appropriate. This can be
      done by calling the record's `transitionTo()` method with a path to the
      desired state. The state manager will attempt to resolve the state path
      relative to the current state. If no state is found at that path, it will
      attempt to resolve it relative to the current state's parent, and then its
      parent, and so on until the root is reached. For example, imagine a hierarchy
      like this:

          * created
            * uncommitted <-- currentState
            * inFlight
          * updated
            * inFlight

      If we are currently in the `uncommitted` state, calling
      `transitionTo('inFlight')` would transition to the `created.inFlight` state,
      while calling `transitionTo('updated.inFlight')` would transition to
      the `updated.inFlight` state.

      Remember that *only events* should ever cause a state transition. You should
      never call `transitionTo()` from outside a state's event handler. If you are
      tempted to do so, create a new event and send that to the state manager.

      #### Flags

      Flags are Boolean values that can be used to introspect a record's current
      state in a more user-friendly way than examining its state path. For example,
      instead of doing this:

      ```javascript
      var statePath = record.get('stateManager.currentPath');
      if (statePath === 'created.inFlight') {
        doSomething();
      }
      ```

      You can say:

      ```javascript
      if (record.get('isNew') && record.get('isSaving')) {
        doSomething();
      }
      ```

      If your state does not set a value for a given flag, the value will
      be inherited from its parent (or the first place in the state hierarchy
      where it is defined).

      The current set of flags are defined below. If you want to add a new flag,
      in addition to the area below, you will also need to declare it in the
      `DS.Model` class.


       * [isEmpty](DS.Model.html#property_isEmpty)
       * [isLoading](DS.Model.html#property_isLoading)
       * [isLoaded](DS.Model.html#property_isLoaded)
       * [isDirty](DS.Model.html#property_isDirty)
       * [isSaving](DS.Model.html#property_isSaving)
       * [isDeleted](DS.Model.html#property_isDeleted)
       * [isNew](DS.Model.html#property_isNew)
       * [isValid](DS.Model.html#property_isValid)

      @namespace DS
      @class RootState
    */

    function hasDefinedProperties(object) {
      // Ignore internal property defined by simulated `Ember.create`.
      var names = Ember.keys(object);
      var i, l, name;
      for (i = 0, l = names.length; i < l; i++ ) {
        name = names[i];
        if (object.hasOwnProperty(name) && object[name]) { return true; }
      }

      return false;
    }

    function didSetProperty(record, context) {
      if (context.value === context.originalValue) {
        delete record._attributes[context.name];
        record.send('propertyWasReset', context.name);
      } else if (context.value !== context.oldValue) {
        record.send('becomeDirty');
      }

      record.updateRecordArraysLater();
    }

    // Implementation notes:
    //
    // Each state has a boolean value for all of the following flags:
    //
    // * isLoaded: The record has a populated `data` property. When a
    //   record is loaded via `store.find`, `isLoaded` is false
    //   until the adapter sets it. When a record is created locally,
    //   its `isLoaded` property is always true.
    // * isDirty: The record has local changes that have not yet been
    //   saved by the adapter. This includes records that have been
    //   created (but not yet saved) or deleted.
    // * isSaving: The record has been committed, but
    //   the adapter has not yet acknowledged that the changes have
    //   been persisted to the backend.
    // * isDeleted: The record was marked for deletion. When `isDeleted`
    //   is true and `isDirty` is true, the record is deleted locally
    //   but the deletion was not yet persisted. When `isSaving` is
    //   true, the change is in-flight. When both `isDirty` and
    //   `isSaving` are false, the change has persisted.
    // * isError: The adapter reported that it was unable to save
    //   local changes to the backend. This may also result in the
    //   record having its `isValid` property become false if the
    //   adapter reported that server-side validations failed.
    // * isNew: The record was created on the client and the adapter
    //   did not yet report that it was successfully saved.
    // * isValid: The adapter did not report any server-side validation
    //   failures.

    // The dirty state is a abstract state whose functionality is
    // shared between the `created` and `updated` states.
    //
    // The deleted state shares the `isDirty` flag with the
    // subclasses of `DirtyState`, but with a very different
    // implementation.
    //
    // Dirty states have three child states:
    //
    // `uncommitted`: the store has not yet handed off the record
    //   to be saved.
    // `inFlight`: the store has handed off the record to be saved,
    //   but the adapter has not yet acknowledged success.
    // `invalid`: the record has invalid information and cannot be
    //   send to the adapter yet.
    var DirtyState = {
      initialState: 'uncommitted',

      // FLAGS
      isDirty: true,

      // SUBSTATES

      // When a record first becomes dirty, it is `uncommitted`.
      // This means that there are local pending changes, but they
      // have not yet begun to be saved, and are not invalid.
      uncommitted: {
        // EVENTS
        didSetProperty: didSetProperty,

        //TODO(Igor) reloading now triggers a
        //loadingData event, though it seems fine?
        loadingData: Ember.K,

        propertyWasReset: function(record, name) {
          var stillDirty = false;

          for (var prop in record._attributes) {
            stillDirty = true;
            break;
          }

          if (!stillDirty) { record.send('rolledBack'); }
        },

        pushedData: Ember.K,

        becomeDirty: Ember.K,

        willCommit: function(record) {
          record.transitionTo('inFlight');
        },

        reloadRecord: function(record, resolve) {
          resolve(get(record, 'store').reloadRecord(record));
        },

        rolledBack: function(record) {
          record.transitionTo('loaded.saved');
        },

        becameInvalid: function(record) {
          record.transitionTo('invalid');
        },

        rollback: function(record) {
          record.rollback();
        }
      },

      // Once a record has been handed off to the adapter to be
      // saved, it is in the 'in flight' state. Changes to the
      // record cannot be made during this window.
      inFlight: {
        // FLAGS
        isSaving: true,

        // EVENTS
        didSetProperty: didSetProperty,
        becomeDirty: Ember.K,
        pushedData: Ember.K,

        unloadRecord: function(record) {
          Ember.assert("You can only unload a record which is not inFlight. `" + Ember.inspect(record) + " `", false);
        },

        // TODO: More robust semantics around save-while-in-flight
        willCommit: Ember.K,

        didCommit: function(record) {
          var dirtyType = get(this, 'dirtyType');

          record.transitionTo('saved');
          record.send('invokeLifecycleCallbacks', dirtyType);
        },

        becameInvalid: function(record) {
          record.transitionTo('invalid');
          record.send('invokeLifecycleCallbacks');
        },

        becameError: function(record) {
          record.transitionTo('uncommitted');
          record.triggerLater('becameError', record);
        }
      },

      // A record is in the `invalid` if the adapter has indicated
      // the the record failed server-side invalidations.
      invalid: {
        // FLAGS
        isValid: false,

        // EVENTS
        deleteRecord: function(record) {
          record.transitionTo('deleted.uncommitted');
          record.clearRelationships();
        },

        didSetProperty: function(record, context) {
          get(record, 'errors').remove(context.name);

          didSetProperty(record, context);
        },

        becomeDirty: Ember.K,

        willCommit: function(record) {
          get(record, 'errors').clear();
          record.transitionTo('inFlight');
        },

        rolledBack: function(record) {
          get(record, 'errors').clear();
        },

        becameValid: function(record) {
          record.transitionTo('uncommitted');
        },

        invokeLifecycleCallbacks: function(record) {
          record.triggerLater('becameInvalid', record);
        },

        exit: function(record) {
          record._inFlightAttributes = {};
        }
      }
    };

    // The created and updated states are created outside the state
    // chart so we can reopen their substates and add mixins as
    // necessary.

    function deepClone(object) {
      var clone = {}, value;

      for (var prop in object) {
        value = object[prop];
        if (value && typeof value === 'object') {
          clone[prop] = deepClone(value);
        } else {
          clone[prop] = value;
        }
      }

      return clone;
    }

    function mixin(original, hash) {
      for (var prop in hash) {
        original[prop] = hash[prop];
      }

      return original;
    }

    function dirtyState(options) {
      var newState = deepClone(DirtyState);
      return mixin(newState, options);
    }

    var createdState = dirtyState({
      dirtyType: 'created',
      // FLAGS
      isNew: true
    });

    createdState.uncommitted.rolledBack = function(record) {
      record.transitionTo('deleted.saved');
    };

    var updatedState = dirtyState({
      dirtyType: 'updated'
    });

    createdState.uncommitted.deleteRecord = function(record) {
      record.clearRelationships();
      record.transitionTo('deleted.saved');
    };

    createdState.uncommitted.rollback = function(record) {
      DirtyState.uncommitted.rollback.apply(this, arguments);
      record.transitionTo('deleted.saved');
    };

    createdState.uncommitted.propertyWasReset = Ember.K;

    function assertAgainstUnloadRecord(record) {
      Ember.assert("You can only unload a record which is not inFlight. `" + Ember.inspect(record) + "`", false);
    }

    updatedState.inFlight.unloadRecord = assertAgainstUnloadRecord;

    updatedState.uncommitted.deleteRecord = function(record) {
      record.transitionTo('deleted.uncommitted');
      record.clearRelationships();
    };

    var RootState = {
      // FLAGS
      isEmpty: false,
      isLoading: false,
      isLoaded: false,
      isDirty: false,
      isSaving: false,
      isDeleted: false,
      isNew: false,
      isValid: true,

      // DEFAULT EVENTS

      // Trying to roll back if you're not in the dirty state
      // doesn't change your state. For example, if you're in the
      // in-flight state, rolling back the record doesn't move
      // you out of the in-flight state.
      rolledBack: Ember.K,
      unloadRecord: function(record) {
        // clear relationships before moving to deleted state
        // otherwise it fails
        record.clearRelationships();
        record.transitionTo('deleted.saved');
      },


      propertyWasReset: Ember.K,

      // SUBSTATES

      // A record begins its lifecycle in the `empty` state.
      // If its data will come from the adapter, it will
      // transition into the `loading` state. Otherwise, if
      // the record is being created on the client, it will
      // transition into the `created` state.
      empty: {
        isEmpty: true,

        // EVENTS
        loadingData: function(record, promise) {
          record._loadingPromise = promise;
          record.transitionTo('loading');
        },

        loadedData: function(record) {
          record.transitionTo('loaded.created.uncommitted');

          record.suspendRelationshipObservers(function() {
            record.notifyPropertyChange('data');
          });
        },

        pushedData: function(record) {
          record.transitionTo('loaded.saved');
          record.triggerLater('didLoad');
        }
      },

      // A record enters this state when the store asks
      // the adapter for its data. It remains in this state
      // until the adapter provides the requested data.
      //
      // Usually, this process is asynchronous, using an
      // XHR to retrieve the data.
      loading: {
        // FLAGS
        isLoading: true,

        exit: function(record) {
          record._loadingPromise = null;
        },

        // EVENTS
        pushedData: function(record) {
          record.transitionTo('loaded.saved');
          record.triggerLater('didLoad');
          set(record, 'isError', false);
        },

        becameError: function(record) {
          record.triggerLater('becameError', record);
        },

        notFound: function(record) {
          record.transitionTo('empty');
        }
      },

      // A record enters this state when its data is populated.
      // Most of a record's lifecycle is spent inside substates
      // of the `loaded` state.
      loaded: {
        initialState: 'saved',

        // FLAGS
        isLoaded: true,

        //TODO(Igor) Reloading now triggers a loadingData event,
        //but it should be ok?
        loadingData: Ember.K,

        // SUBSTATES

        // If there are no local changes to a record, it remains
        // in the `saved` state.
        saved: {
          setup: function(record) {
            var attrs = record._attributes;
            var isDirty = false;

            for (var prop in attrs) {
              if (attrs.hasOwnProperty(prop)) {
                isDirty = true;
                break;
              }
            }

            if (isDirty) {
              record.adapterDidDirty();
            }
          },

          // EVENTS
          didSetProperty: didSetProperty,

          pushedData: Ember.K,

          becomeDirty: function(record) {
            record.transitionTo('updated.uncommitted');
          },

          willCommit: function(record) {
            record.transitionTo('updated.inFlight');
          },

          reloadRecord: function(record, resolve) {
            resolve(get(record, 'store').reloadRecord(record));
          },

          deleteRecord: function(record) {
            record.transitionTo('deleted.uncommitted');
            record.clearRelationships();
          },

          unloadRecord: function(record) {
            // clear relationships before moving to deleted state
            // otherwise it fails
            record.clearRelationships();
            record.transitionTo('deleted.saved');
          },

          didCommit: function(record) {
            record.send('invokeLifecycleCallbacks', get(record, 'lastDirtyType'));
          },

          // loaded.saved.notFound would be triggered by a failed
          // `reload()` on an unchanged record
          notFound: Ember.K

        },

        // A record is in this state after it has been locally
        // created but before the adapter has indicated that
        // it has been saved.
        created: createdState,

        // A record is in this state if it has already been
        // saved to the server, but there are new local changes
        // that have not yet been saved.
        updated: updatedState
      },

      // A record is in this state if it was deleted from the store.
      deleted: {
        initialState: 'uncommitted',
        dirtyType: 'deleted',

        // FLAGS
        isDeleted: true,
        isLoaded: true,
        isDirty: true,

        // TRANSITIONS
        setup: function(record) {
          record.updateRecordArrays();
        },

        // SUBSTATES

        // When a record is deleted, it enters the `start`
        // state. It will exit this state when the record
        // starts to commit.
        uncommitted: {

          // EVENTS

          willCommit: function(record) {
            record.transitionTo('inFlight');
          },

          rollback: function(record) {
            record.rollback();
          },

          becomeDirty: Ember.K,
          deleteRecord: Ember.K,

          rolledBack: function(record) {
            record.transitionTo('loaded.saved');
          }
        },

        // After a record starts committing, but
        // before the adapter indicates that the deletion
        // has saved to the server, a record is in the
        // `inFlight` substate of `deleted`.
        inFlight: {
          // FLAGS
          isSaving: true,

          // EVENTS

          unloadRecord: assertAgainstUnloadRecord,

          // TODO: More robust semantics around save-while-in-flight
          willCommit: Ember.K,
          didCommit: function(record) {
            record.transitionTo('saved');

            record.send('invokeLifecycleCallbacks');
          },

          becameError: function(record) {
            record.transitionTo('uncommitted');
            record.triggerLater('becameError', record);
          }
        },

        // Once the adapter indicates that the deletion has
        // been saved, the record enters the `saved` substate
        // of `deleted`.
        saved: {
          // FLAGS
          isDirty: false,

          setup: function(record) {
            var store = get(record, 'store');
            store.dematerializeRecord(record);
          },

          invokeLifecycleCallbacks: function(record) {
            record.triggerLater('didDelete', record);
            record.triggerLater('didCommit', record);
          },

          willCommit: Ember.K,

          didCommit: Ember.K
        }
      },

      invokeLifecycleCallbacks: function(record, dirtyType) {
        if (dirtyType === 'created') {
          record.triggerLater('didCreate', record);
        } else {
          record.triggerLater('didUpdate', record);
        }

        record.triggerLater('didCommit', record);
      }
    };

    function wireState(object, parent, name) {
      /*jshint proto:true*/
      // TODO: Use Object.create and copy instead
      object = mixin(parent ? Ember.create(parent) : {}, object);
      object.parentState = parent;
      object.stateName = name;

      for (var prop in object) {
        if (!object.hasOwnProperty(prop) || prop === 'parentState' || prop === 'stateName') { continue; }
        if (typeof object[prop] === 'object') {
          object[prop] = wireState(object[prop], object, name + "." + prop);
        }
      }

      return object;
    }

    RootState = wireState(RootState, null, "root");

    __exports__["default"] = RootState;
  });
define("ember-data/system/record_array_manager",
  ["ember-data/system/record_arrays","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      @module ember-data
    */

    var RecordArray = __dependency1__.RecordArray;
    var FilteredRecordArray = __dependency1__.FilteredRecordArray;
    var AdapterPopulatedRecordArray = __dependency1__.AdapterPopulatedRecordArray;
    var ManyArray = __dependency1__.ManyArray;
    var get = Ember.get;
    var set = Ember.set;
    var forEach = Ember.EnumerableUtils.forEach;

    /**
      @class RecordArrayManager
      @namespace DS
      @private
      @extends Ember.Object
    */
    __exports__["default"] = Ember.Object.extend({
      init: function() {
        this.filteredRecordArrays = Ember.MapWithDefault.create({
          defaultValue: function() { return []; }
        });

        this.changedRecords = [];
        this._adapterPopulatedRecordArrays = [];
      },

      recordDidChange: function(record) {
        if (this.changedRecords.push(record) !== 1) { return; }

        Ember.run.schedule('actions', this, this.updateRecordArrays);
      },

      recordArraysForRecord: function(record) {
        record._recordArrays = record._recordArrays || Ember.OrderedSet.create();
        return record._recordArrays;
      },

      /**
        This method is invoked whenever data is loaded into the store by the
        adapter or updated by the adapter, or when a record has changed.

        It updates all record arrays that a record belongs to.

        To avoid thrashing, it only runs at most once per run loop.

        @method updateRecordArrays
        @param {Class} type
        @param {Number|String} clientId
      */
      updateRecordArrays: function() {
        forEach(this.changedRecords, function(record) {
          if (get(record, 'isDeleted')) {
            this._recordWasDeleted(record);
          } else {
            this._recordWasChanged(record);
          }
        }, this);

        this.changedRecords.length = 0;
      },

      _recordWasDeleted: function (record) {
        var recordArrays = record._recordArrays;

        if (!recordArrays) { return; }

        forEach(recordArrays, function(array) {
          array.removeRecord(record);
        });
      },

      _recordWasChanged: function (record) {
        var type = record.constructor;
        var recordArrays = this.filteredRecordArrays.get(type);
        var filter;

        forEach(recordArrays, function(array) {
          filter = get(array, 'filterFunction');
          this.updateRecordArray(array, filter, type, record);
        }, this);

        // loop through all manyArrays containing an unloaded copy of this
        // clientId and notify them that the record was loaded.
        var manyArrays = record._loadingRecordArrays;

        if (manyArrays) {
          for (var i=0, l=manyArrays.length; i<l; i++) {
            manyArrays[i].loadedRecord();
          }

          record._loadingRecordArrays = [];
        }
      },

      /**
        Update an individual filter.

        @method updateRecordArray
        @param {DS.FilteredRecordArray} array
        @param {Function} filter
        @param {Class} type
        @param {Number|String} clientId
      */
      updateRecordArray: function(array, filter, type, record) {
        var shouldBeInArray;

        if (!filter) {
          shouldBeInArray = true;
        } else {
          shouldBeInArray = filter(record);
        }

        var recordArrays = this.recordArraysForRecord(record);

        if (shouldBeInArray) {
          if (!recordArrays.has(array)) {
            array.pushRecord(record);
            recordArrays.add(array);
          }
        } else if (!shouldBeInArray) {
          recordArrays.remove(array);
          array.removeRecord(record);
        }
      },

      /**
        This method is invoked if the `filterFunction` property is
        changed on a `DS.FilteredRecordArray`.

        It essentially re-runs the filter from scratch. This same
        method is invoked when the filter is created in th first place.

        @method updateFilter
        @param array
        @param type
        @param filter
      */
      updateFilter: function(array, type, filter) {
        var typeMap = this.store.typeMapFor(type);
        var records = typeMap.records, record;

        for (var i=0, l=records.length; i<l; i++) {
          record = records[i];

          if (!get(record, 'isDeleted') && !get(record, 'isEmpty')) {
            this.updateRecordArray(array, filter, type, record);
          }
        }
      },

      /**
        Create a `DS.ManyArray` for a type and list of record references, and index
        the `ManyArray` under each reference. This allows us to efficiently remove
        records from `ManyArray`s when they are deleted.

        @method createManyArray
        @param {Class} type
        @param {Array} references
        @return {DS.ManyArray}
      */
      createManyArray: function(type, records) {
        var manyArray = ManyArray.create({
          type: type,
          content: records,
          store: this.store
        });

        forEach(records, function(record) {
          var arrays = this.recordArraysForRecord(record);
          arrays.add(manyArray);
        }, this);

        return manyArray;
      },

      /**
        Create a `DS.RecordArray` for a type and register it for updates.

        @method createRecordArray
        @param {Class} type
        @return {DS.RecordArray}
      */
      createRecordArray: function(type) {
        var array = RecordArray.create({
          type: type,
          content: Ember.A(),
          store: this.store,
          isLoaded: true
        });

        this.registerFilteredRecordArray(array, type);

        return array;
      },

      /**
        Create a `DS.FilteredRecordArray` for a type and register it for updates.

        @method createFilteredRecordArray
        @param {Class} type
        @param {Function} filter
        @param {Object} query (optional
        @return {DS.FilteredRecordArray}
      */
      createFilteredRecordArray: function(type, filter, query) {
        var array = FilteredRecordArray.create({
          query: query,
          type: type,
          content: Ember.A(),
          store: this.store,
          manager: this,
          filterFunction: filter
        });

        this.registerFilteredRecordArray(array, type, filter);

        return array;
      },

      /**
        Create a `DS.AdapterPopulatedRecordArray` for a type with given query.

        @method createAdapterPopulatedRecordArray
        @param {Class} type
        @param {Object} query
        @return {DS.AdapterPopulatedRecordArray}
      */
      createAdapterPopulatedRecordArray: function(type, query) {
        var array = AdapterPopulatedRecordArray.create({
          type: type,
          query: query,
          content: Ember.A(),
          store: this.store,
          manager: this
        });

        this._adapterPopulatedRecordArrays.push(array);

        return array;
      },

      /**
        Register a RecordArray for a given type to be backed by
        a filter function. This will cause the array to update
        automatically when records of that type change attribute
        values or states.

        @method registerFilteredRecordArray
        @param {DS.RecordArray} array
        @param {Class} type
        @param {Function} filter
      */
      registerFilteredRecordArray: function(array, type, filter) {
        var recordArrays = this.filteredRecordArrays.get(type);
        recordArrays.push(array);

        this.updateFilter(array, type, filter);
      },

      // Internally, we maintain a map of all unloaded IDs requested by
      // a ManyArray. As the adapter loads data into the store, the
      // store notifies any interested ManyArrays. When the ManyArray's
      // total number of loading records drops to zero, it becomes
      // `isLoaded` and fires a `didLoad` event.
      registerWaitingRecordArray: function(record, array) {
        var loadingRecordArrays = record._loadingRecordArrays || [];
        loadingRecordArrays.push(array);
        record._loadingRecordArrays = loadingRecordArrays;
      },

      willDestroy: function(){
        this._super();

        forEach(flatten(values(this.filteredRecordArrays.values)), destroy);
        forEach(this._adapterPopulatedRecordArrays, destroy);
      }
    });

    function values(obj) {
      var result = [];
      var keys = Ember.keys(obj);

      for (var i = 0; i < keys.length; i++) {
        result.push(obj[keys[i]]);
      }

      return result;
    }

    function destroy(entry) {
      entry.destroy();
    }

    function flatten(list) {
      var length = list.length;
      var result = Ember.A();

      for (var i = 0; i < length; i++) {
        result = result.concat(list[i]);
      }

      return result;
    }
  });
define("ember-data/system/record_arrays",
  ["ember-data/system/record_arrays/record_array","ember-data/system/record_arrays/filtered_record_array","ember-data/system/record_arrays/adapter_populated_record_array","ember-data/system/record_arrays/many_array","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    /**
      @module ember-data
    */

    var RecordArray = __dependency1__["default"];
    var FilteredRecordArray = __dependency2__["default"];
    var AdapterPopulatedRecordArray = __dependency3__["default"];
    var ManyArray = __dependency4__["default"];

    __exports__.RecordArray = RecordArray;
    __exports__.FilteredRecordArray = FilteredRecordArray;
    __exports__.AdapterPopulatedRecordArray = AdapterPopulatedRecordArray;
    __exports__.ManyArray = ManyArray;
  });
define("ember-data/system/record_arrays/adapter_populated_record_array",
  ["ember-data/system/record_arrays/record_array","exports"],
  function(__dependency1__, __exports__) {
    
    var RecordArray = __dependency1__["default"];
    /**
      @module ember-data
    */

    var get = Ember.get;
    var set = Ember.set;

    function cloneNull(source) {
      var clone = Object.create(null);
      for (var key in source) {
        clone[key] = source[key];
      }
      return clone;
    }

    /**
      Represents an ordered list of records whose order and membership is
      determined by the adapter. For example, a query sent to the adapter
      may trigger a search on the server, whose results would be loaded
      into an instance of the `AdapterPopulatedRecordArray`.

      @class AdapterPopulatedRecordArray
      @namespace DS
      @extends DS.RecordArray
    */
    __exports__["default"] = RecordArray.extend({
      query: null,

      replace: function() {
        var type = get(this, 'type').toString();
        throw new Error("The result of a server query (on " + type + ") is immutable.");
      },

      /**
        @method load
        @private
        @param {Array} data
      */
      load: function(data) {
        var store = get(this, 'store');
        var type = get(this, 'type');
        var records = store.pushMany(type, data);
        var meta = store.metadataFor(type);

        this.setProperties({
          content: Ember.A(records),
          isLoaded: true,
          meta: cloneNull(meta)
        });

        records.forEach(function(record) {
          this.manager.recordArraysForRecord(record).add(this);
        }, this);

        // TODO: should triggering didLoad event be the last action of the runLoop?
        Ember.run.once(this, 'trigger', 'didLoad');
      }
    });
  });
define("ember-data/system/record_arrays/filtered_record_array",
  ["ember-data/system/record_arrays/record_array","exports"],
  function(__dependency1__, __exports__) {
    
    var RecordArray = __dependency1__["default"];

    /**
      @module ember-data
    */

    var get = Ember.get;

    /**
      Represents a list of records whose membership is determined by the
      store. As records are created, loaded, or modified, the store
      evaluates them to determine if they should be part of the record
      array.

      @class FilteredRecordArray
      @namespace DS
      @extends DS.RecordArray
    */
    __exports__["default"] = RecordArray.extend({
      /**
        The filterFunction is a function used to test records from the store to
        determine if they should be part of the record array.

        Example

        ```javascript
        var allPeople = store.all('person');
        allPeople.mapBy('name'); // ["Tom Dale", "Yehuda Katz", "Trek Glowacki"]

        var people = store.filter('person', function(person) {
          if (person.get('name').match(/Katz$/)) { return true; }
        });
        people.mapBy('name'); // ["Yehuda Katz"]

        var notKatzFilter = function(person) {
          return !person.get('name').match(/Katz$/);
        };
        people.set('filterFunction', notKatzFilter);
        people.mapBy('name'); // ["Tom Dale", "Trek Glowacki"]
        ```

        @method filterFunction
        @param {DS.Model} record
        @return {Boolean} `true` if the record should be in the array
      */
      filterFunction: null,
      isLoaded: true,

      replace: function() {
        var type = get(this, 'type').toString();
        throw new Error("The result of a client-side filter (on " + type + ") is immutable.");
      },

      /**
        @method updateFilter
        @private
      */
      _updateFilter: function() {
        var manager = get(this, 'manager');
        manager.updateFilter(this, get(this, 'type'), get(this, 'filterFunction'));
      },

      updateFilter: Ember.observer(function() {
        Ember.run.once(this, this._updateFilter);
      }, 'filterFunction')
    });
  });
define("ember-data/system/record_arrays/many_array",
  ["ember-data/system/record_arrays/record_array","ember-data/system/changes","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    var RecordArray = __dependency1__["default"];
    var RelationshipChange = __dependency2__.RelationshipChange;

    /**
      @module ember-data
    */

    var get = Ember.get, set = Ember.set;
    var map = Ember.EnumerableUtils.map;

    function sync(change) {
      change.sync();
    }

    /**
      A `ManyArray` is a `RecordArray` that represents the contents of a has-many
      relationship.

      The `ManyArray` is instantiated lazily the first time the relationship is
      requested.

      ### Inverses

      Often, the relationships in Ember Data applications will have
      an inverse. For example, imagine the following models are
      defined:

      ```javascript
      App.Post = DS.Model.extend({
        comments: DS.hasMany('comment')
      });

      App.Comment = DS.Model.extend({
        post: DS.belongsTo('post')
      });
      ```

      If you created a new instance of `App.Post` and added
      a `App.Comment` record to its `comments` has-many
      relationship, you would expect the comment's `post`
      property to be set to the post that contained
      the has-many.

      We call the record to which a relationship belongs the
      relationship's _owner_.

      @class ManyArray
      @namespace DS
      @extends DS.RecordArray
    */
    __exports__["default"] = RecordArray.extend({
      init: function() {
        this._super.apply(this, arguments);
        this._changesToSync = Ember.OrderedSet.create();
      },

      /**
        The property name of the relationship

        @property {String} name
        @private
      */
      name: null,

      /**
        The record to which this relationship belongs.

        @property {DS.Model} owner
        @private
      */
      owner: null,

      /**
        `true` if the relationship is polymorphic, `false` otherwise.

        @property {Boolean} isPolymorphic
        @private
      */
      isPolymorphic: false,

      // LOADING STATE

      isLoaded: false,

      /**
        Used for async `hasMany` arrays
        to keep track of when they will resolve.

        @property {Ember.RSVP.Promise} promise
        @private
      */
      promise: null,

      /**
        @method loadingRecordsCount
        @param {Number} count
        @private
      */
      loadingRecordsCount: function(count) {
        this.loadingRecordsCount = count;
      },

      /**
        @method loadedRecord
        @private
      */
      loadedRecord: function() {
        this.loadingRecordsCount--;
        if (this.loadingRecordsCount === 0) {
          set(this, 'isLoaded', true);
          this.trigger('didLoad');
        }
      },

      /**
        @method fetch
        @private
      */
      fetch: function() {
        var records = get(this, 'content');
        var store = get(this, 'store');
        var owner = get(this, 'owner');

        var unloadedRecords = records.filterBy('isEmpty', true);
        store.scheduleFetchMany(unloadedRecords, owner);
      },

      // Overrides Ember.Array's replace method to implement
      replaceContent: function(index, removed, added) {
        // Map the array of record objects into an array of  client ids.
        added = map(added, function(record) {
          Ember.assert("You cannot add '" + record.constructor.typeKey + "' records to this relationship (only '" + this.type.typeKey + "' allowed)", !this.type || record instanceof this.type);
          return record;
        }, this);

        this._super(index, removed, added);
      },

      arrangedContentDidChange: function() {
        Ember.run.once(this, 'fetch');
      },

      arrayContentWillChange: function(index, removed, added) {
        var owner = get(this, 'owner');
        var name = get(this, 'name');

        if (!owner._suspendedRelationships) {
          // This code is the first half of code that continues inside
          // of arrayContentDidChange. It gets or creates a change from
          // the child object, adds the current owner as the old
          // parent if this is the first time the object was removed
          // from a ManyArray, and sets `newParent` to null.
          //
          // Later, if the object is added to another ManyArray,
          // the `arrayContentDidChange` will set `newParent` on
          // the change.
          for (var i=index; i<index+removed; i++) {
            var record = get(this, 'content').objectAt(i);

            var change = RelationshipChange.createChange(owner, record, get(this, 'store'), {
              parentType: owner.constructor,
              changeType: "remove",
              kind: "hasMany",
              key: name
            });

            this._changesToSync.add(change);
          }
        }

        return this._super.apply(this, arguments);
      },

      arrayContentDidChange: function(index, removed, added) {
        this._super.apply(this, arguments);

        var owner = get(this, 'owner');
        var name = get(this, 'name');
        var store = get(this, 'store');

        if (!owner._suspendedRelationships) {
          // This code is the second half of code that started in
          // `arrayContentWillChange`. It gets or creates a change
          // from the child object, and adds the current owner as
          // the new parent.
          for (var i=index; i<index+added; i++) {
            var record = get(this, 'content').objectAt(i);

            var change = RelationshipChange.createChange(owner, record, store, {
              parentType: owner.constructor,
              changeType: "add",
              kind:"hasMany",
              key: name
            });
            change.hasManyName = name;

            this._changesToSync.add(change);
          }

          // We wait until the array has finished being
          // mutated before syncing the OneToManyChanges created
          // in arrayContentWillChange, so that the array
          // membership test in the sync() logic operates
          // on the final results.
          this._changesToSync.forEach(sync);

          this._changesToSync.clear();
        }
      },

      /**
        Create a child record within the owner

        @method createRecord
        @private
        @param {Object} hash
        @return {DS.Model} record
      */
      createRecord: function(hash) {
        var owner = get(this, 'owner');
        var store = get(owner, 'store');
        var type = get(this, 'type');
        var record;

        Ember.assert("You cannot add '" + type.typeKey + "' records to this polymorphic relationship.", !get(this, 'isPolymorphic'));

        record = store.createRecord.call(store, type, hash);
        this.pushObject(record);

        return record;
      }
    });
  });
define("ember-data/system/record_arrays/record_array",
  ["ember-data/system/store","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      @module ember-data
    */

    var PromiseArray = __dependency1__.PromiseArray;
    var get = Ember.get;
    var set = Ember.set;

    /**
      A record array is an array that contains records of a certain type. The record
      array materializes records as needed when they are retrieved for the first
      time. You should not create record arrays yourself. Instead, an instance of
      `DS.RecordArray` or its subclasses will be returned by your application's store
      in response to queries.

      @class RecordArray
      @namespace DS
      @extends Ember.ArrayProxy
      @uses Ember.Evented
    */

    __exports__["default"] = Ember.ArrayProxy.extend(Ember.Evented, {
      /**
        The model type contained by this record array.

        @property type
        @type DS.Model
      */
      type: null,

      /**
        The array of client ids backing the record array. When a
        record is requested from the record array, the record
        for the client id at the same index is materialized, if
        necessary, by the store.

        @property content
        @private
        @type Ember.Array
      */
      content: null,

      /**
        The flag to signal a `RecordArray` is currently loading data.

        Example

        ```javascript
        var people = store.all('person');
        people.get('isLoaded'); // true
        ```

        @property isLoaded
        @type Boolean
      */
      isLoaded: false,
      /**
        The flag to signal a `RecordArray` is currently loading data.

        Example

        ```javascript
        var people = store.all('person');
        people.get('isUpdating'); // false
        people.update();
        people.get('isUpdating'); // true
        ```

        @property isUpdating
        @type Boolean
      */
      isUpdating: false,

      /**
        The store that created this record array.

        @property store
        @private
        @type DS.Store
      */
      store: null,

      /**
        Retrieves an object from the content by index.

        @method objectAtContent
        @private
        @param {Number} index
        @return {DS.Model} record
      */
      objectAtContent: function(index) {
        var content = get(this, 'content');

        return content.objectAt(index);
      },

      /**
        Used to get the latest version of all of the records in this array
        from the adapter.

        Example

        ```javascript
        var people = store.all('person');
        people.get('isUpdating'); // false
        people.update();
        people.get('isUpdating'); // true
        ```

        @method update
      */
      update: function() {
        if (get(this, 'isUpdating')) { return; }

        var store = get(this, 'store');
        var type = get(this, 'type');

        return store.fetchAll(type, this);
      },

      /**
        Adds a record to the `RecordArray` without duplicates

        @method addRecord
        @private
        @param {DS.Model} record
      */
      addRecord: function(record) {
        get(this, 'content').addObject(record);
      },

      /**
        Adds a record to the `RecordArray`, but allows duplicates

        @method pushRecord
        @private
        @param {DS.Model} record
      */
      pushRecord: function(record) {
        get(this, 'content').pushObject(record);
      },


      /**
        Removes a record to the `RecordArray`.

        @method removeRecord
        @private
        @param {DS.Model} record
      */
      removeRecord: function(record) {
        get(this, 'content').removeObject(record);
      },

      /**
        Saves all of the records in the `RecordArray`.

        Example

        ```javascript
        var messages = store.all('message');
        messages.forEach(function(message) {
          message.set('hasBeenSeen', true);
        });
        messages.save();
        ```

        @method save
        @return {DS.PromiseArray} promise
      */
      save: function() {
        var promiseLabel = "DS: RecordArray#save " + get(this, 'type');
        var promise = Ember.RSVP.all(this.invoke("save"), promiseLabel).then(function(array) {
          return Ember.A(array);
        }, null, "DS: RecordArray#save apply Ember.NativeArray");

        return PromiseArray.create({ promise: promise });
      },

      _dissociateFromOwnRecords: function() {
        var array = this;

        this.forEach(function(record){
          var recordArrays = record._recordArrays;

          if (recordArrays) {
            recordArrays.remove(array);
          }
        });
      },

      willDestroy: function(){
        this._dissociateFromOwnRecords();
        this._super();
      }
    });
  });
define("ember-data/system/relationship-meta",
  ["ember-inflector/system","exports"],
  function(__dependency1__, __exports__) {
    
    var singularize = __dependency1__.singularize;

    function typeForRelationshipMeta(store, meta) {
      var typeKey, type;

      typeKey = meta.type || meta.key;
      if (typeof typeKey === 'string') {
        if (meta.kind === 'hasMany') {
          typeKey = singularize(typeKey);
        }
        type = store.modelFor(typeKey);
      } else {
        type = meta.type;
      }

      return type;
    }

    __exports__.typeForRelationshipMeta = typeForRelationshipMeta;function relationshipFromMeta(store, meta) {
      return {
        key:  meta.key,
        kind: meta.kind,
        type: typeForRelationshipMeta(store, meta),
        options:    meta.options,
        parentType: meta.parentType,
        isRelationship: true
      };
    }

    __exports__.relationshipFromMeta = relationshipFromMeta;function isSyncRelationship(record, relationshipName) {
      var meta = Ember.meta(record);
      var desc = meta.descs[relationshipName];

      return desc && !desc._meta.options.async;
    }

    __exports__.isSyncRelationship = isSyncRelationship;
  });
define("ember-data/system/relationships",
  ["./relationships/belongs_to","./relationships/has_many","ember-data/system/relationships/ext","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    /**
      @module ember-data
    */

    var belongsTo = __dependency1__["default"];
    var hasMany = __dependency2__["default"];


    __exports__.belongsTo = belongsTo;
    __exports__.hasMany = hasMany;
  });
define("ember-data/system/relationships/belongs_to",
  ["ember-data/system/model","ember-data/system/store","ember-data/system/changes","ember-data/system/relationship-meta","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    
    var get = Ember.get;
    var set = Ember.set;
    var isNone = Ember.isNone;
    var Promise = Ember.RSVP.Promise;

    var Model = __dependency1__.Model;
    var PromiseObject = __dependency2__.PromiseObject;
    var RelationshipChange = __dependency3__.RelationshipChange;
    var relationshipFromMeta = __dependency4__.relationshipFromMeta;
    var typeForRelationshipMeta = __dependency4__.typeForRelationshipMeta;
    var isSyncRelationship = __dependency4__.isSyncRelationship;

    /**
      @module ember-data
    */

    function asyncBelongsTo(type, options, meta) {
      return Ember.computed('data', function(key, value) {
        var data = get(this, 'data');
        var store = get(this, 'store');
        var promiseLabel = "DS: Async belongsTo " + this + " : " + key;
        var promise;

        meta.key = key;

        if (arguments.length === 2) {
          Ember.assert("You can only add a '" + type + "' record to this relationship", !value || value instanceof typeForRelationshipMeta(store, meta));
          return value === undefined ? null : PromiseObject.create({
            promise: Promise.cast(value, promiseLabel)
          });
        }

        var link = data.links && data.links[key];
        var belongsTo = data[key];

        if (!isNone(belongsTo)) {
          var inverse = this.constructor.inverseFor(key);
          //but for now only in the oneToOne case
          if (inverse && inverse.kind === 'belongsTo'){
            set(belongsTo, inverse.name, this);
          }
          //TODO(Igor) after OR doesn't seem that will be called
          promise = store.findById(belongsTo.constructor, belongsTo.get('id')) || Promise.cast(belongsTo, promiseLabel);
          return PromiseObject.create({
            promise: promise
          });
        } else if (link) {
          promise = store.findBelongsTo(this, link, relationshipFromMeta(store, meta));
          return PromiseObject.create({
            promise: promise
          });
        } else {
          return null;
        }
      }).meta(meta);
    }

    /**
      `DS.belongsTo` is used to define One-To-One and One-To-Many
      relationships on a [DS.Model](/api/data/classes/DS.Model.html).


      `DS.belongsTo` takes an optional hash as a second parameter, currently
      supported options are:

      - `async`: A boolean value used to explicitly declare this to be an async relationship.
      - `inverse`: A string used to identify the inverse property on a
        related model in a One-To-Many relationship. See [Explicit Inverses](#toc_explicit-inverses)

      #### One-To-One
      To declare a one-to-one relationship between two models, use
      `DS.belongsTo`:

      ```javascript
      App.User = DS.Model.extend({
        profile: DS.belongsTo('profile')
      });

      App.Profile = DS.Model.extend({
        user: DS.belongsTo('user')
      });
      ```

      #### One-To-Many
      To declare a one-to-many relationship between two models, use
      `DS.belongsTo` in combination with `DS.hasMany`, like this:

      ```javascript
      App.Post = DS.Model.extend({
        comments: DS.hasMany('comment')
      });

      App.Comment = DS.Model.extend({
        post: DS.belongsTo('post')
      });
      ```

      @namespace
      @method belongsTo
      @for DS
      @param {String or DS.Model} type the model type of the relationship
      @param {Object} options a hash of options
      @return {Ember.computed} relationship
    */
    function belongsTo(type, options) {
      if (typeof type === 'object') {
        options = type;
        type = undefined;
      } else {
        Ember.assert("The first argument to DS.belongsTo must be a string representing a model type key, e.g. use DS.belongsTo('person') to define a relation to the App.Person model", !!type && (typeof type === 'string' || Model.detect(type)));
      }

      options = options || {};

      var meta = {
        type: type,
        isRelationship: true,
        options: options,
        kind: 'belongsTo',
        key: null
      };

      if (options.async) {
        return asyncBelongsTo(type, options, meta);
      }

      return Ember.computed('data', function(key, value) {
        var data = get(this, 'data');
        var store = get(this, 'store');
        var belongsTo, typeClass;

        if (typeof type === 'string') {
          typeClass = store.modelFor(type);
        } else {
          typeClass = type;
        }

        if (arguments.length === 2) {
          Ember.assert("You can only add a '" + type + "' record to this relationship", !value || value instanceof typeClass);
          return value === undefined ? null : value;
        }

        belongsTo = data[key];

        if (isNone(belongsTo)) { return null; }

        store.findById(belongsTo.constructor, belongsTo.get('id'));

        return belongsTo;
      }).meta(meta);
    }

    /**
      These observers observe all `belongsTo` relationships on the record. See
      `relationships/ext` to see how these observers get their dependencies.

      @class Model
      @namespace DS
    */
    Model.reopen({

      /**
        @method belongsToWillChange
        @private
        @static
        @param record
        @param key
      */
      belongsToWillChange: Ember.beforeObserver(function(record, key) {
        if (get(record, 'isLoaded') && isSyncRelationship(record, key)) {
          var oldParent = get(record, key);

          if (oldParent) {
            var store = get(record, 'store');
            var change = RelationshipChange.createChange(record, oldParent, store, {
              key: key,
              kind: 'belongsTo',
              changeType: 'remove'
            });

            change.sync();
            this._changesToSync[key] = change;
          }
        }
      }),

      /**
        @method belongsToDidChange
        @private
        @static
        @param record
        @param key
      */
      belongsToDidChange: Ember.immediateObserver(function(record, key) {
        if (get(record, 'isLoaded')) {
          var newParent = get(record, key);

          if (newParent) {
            var store = get(record, 'store');
            var change = RelationshipChange.createChange(record, newParent, store, {
              key: key,
              kind: 'belongsTo',
              changeType: 'add'
            });

            change.sync();
          }
        }

        delete this._changesToSync[key];
      })
    });

    __exports__["default"] = belongsTo;
  });
define("ember-data/system/relationships/ext",
  ["ember-inflector/system","ember-data/system/relationship-meta","ember-data/system/model"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    
    var singularize = __dependency1__.singularize;
    var typeForRelationshipMeta = __dependency2__.typeForRelationshipMeta;
    var relationshipFromMeta = __dependency2__.relationshipFromMeta;
    var Model = __dependency3__.Model;

    var get = Ember.get;
    var set = Ember.set;

    /**
      @module ember-data
    */

    /*
      This file defines several extensions to the base `DS.Model` class that
      add support for one-to-many relationships.
    */

    /**
      @class Model
      @namespace DS
    */
    Model.reopen({

      /**
        This Ember.js hook allows an object to be notified when a property
        is defined.

        In this case, we use it to be notified when an Ember Data user defines a
        belongs-to relationship. In that case, we need to set up observers for
        each one, allowing us to track relationship changes and automatically
        reflect changes in the inverse has-many array.

        This hook passes the class being set up, as well as the key and value
        being defined. So, for example, when the user does this:

        ```javascript
        DS.Model.extend({
          parent: DS.belongsTo('user')
        });
        ```

        This hook would be called with "parent" as the key and the computed
        property returned by `DS.belongsTo` as the value.

        @method didDefineProperty
        @param proto
        @param key
        @param value
      */
      didDefineProperty: function(proto, key, value) {
        // Check if the value being set is a computed property.
        if (value instanceof Ember.ComputedProperty) {

          // If it is, get the metadata for the relationship. This is
          // populated by the `DS.belongsTo` helper when it is creating
          // the computed property.
          var meta = value.meta();

          if (meta.isRelationship && meta.kind === 'belongsTo') {
            Ember.addObserver(proto, key, null, 'belongsToDidChange');
            Ember.addBeforeObserver(proto, key, null, 'belongsToWillChange');
          }

          meta.parentType = proto.constructor;
        }
      }
    });

    /*
      These DS.Model extensions add class methods that provide relationship
      introspection abilities about relationships.

      A note about the computed properties contained here:

      **These properties are effectively sealed once called for the first time.**
      To avoid repeatedly doing expensive iteration over a model's fields, these
      values are computed once and then cached for the remainder of the runtime of
      your application.

      If your application needs to modify a class after its initial definition
      (for example, using `reopen()` to add additional attributes), make sure you
      do it before using your model with the store, which uses these properties
      extensively.
    */

    Model.reopenClass({
      /**
        For a given relationship name, returns the model type of the relationship.

        For example, if you define a model like this:

       ```javascript
        App.Post = DS.Model.extend({
          comments: DS.hasMany('comment')
        });
       ```

        Calling `App.Post.typeForRelationship('comments')` will return `App.Comment`.

        @method typeForRelationship
        @static
        @param {String} name the name of the relationship
        @return {subclass of DS.Model} the type of the relationship, or undefined
      */
      typeForRelationship: function(name) {
        var relationship = get(this, 'relationshipsByName').get(name);
        return relationship && relationship.type;
      },

      inverseFor: function(name) {
        var inverseType = this.typeForRelationship(name);

        if (!inverseType) { return null; }

        var options = this.metaForProperty(name).options;

        if (options.inverse === null) { return null; }

        var inverseName, inverseKind, inverse;

        if (options.inverse) {
          inverseName = options.inverse;
          inverse = Ember.get(inverseType, 'relationshipsByName').get(inverseName);

          Ember.assert("We found no inverse relationships by the name of '" + inverseName + "' on the '" + inverseType.typeKey +
            "' model. This is most likely due to a missing attribute on your model definition.", !Ember.isNone(inverse));

          inverseKind = inverse.kind;
        } else {
          var possibleRelationships = findPossibleInverses(this, inverseType);

          if (possibleRelationships.length === 0) { return null; }

          Ember.assert("You defined the '" + name + "' relationship on " + this + ", but multiple possible inverse relationships of type " +
            this + " were found on " + inverseType + ". Look at http://emberjs.com/guides/models/defining-models/#toc_explicit-inverses for how to explicitly specify inverses",
            possibleRelationships.length === 1);

          inverseName = possibleRelationships[0].name;
          inverseKind = possibleRelationships[0].kind;
        }

        function findPossibleInverses(type, inverseType, possibleRelationships) {
          possibleRelationships = possibleRelationships || [];

          var relationshipMap = get(inverseType, 'relationships');
          if (!relationshipMap) { return; }

          var relationships = relationshipMap.get(type);
          if (relationships) {
            possibleRelationships.push.apply(possibleRelationships, relationshipMap.get(type));
          }

          if (type.superclass) {
            findPossibleInverses(type.superclass, inverseType, possibleRelationships);
          }

          return possibleRelationships;
        }

        return {
          type: inverseType,
          name: inverseName,
          kind: inverseKind
        };
      },

      /**
        The model's relationships as a map, keyed on the type of the
        relationship. The value of each entry is an array containing a descriptor
        for each relationship with that type, describing the name of the relationship
        as well as the type.

        For example, given the following model definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),
          posts: DS.hasMany('post')
        });
        ```

        This computed property would return a map describing these
        relationships, like this:

        ```javascript
        var relationships = Ember.get(App.Blog, 'relationships');
        relationships.get(App.User);
        //=> [ { name: 'users', kind: 'hasMany' },
        //     { name: 'owner', kind: 'belongsTo' } ]
        relationships.get(App.Post);
        //=> [ { name: 'posts', kind: 'hasMany' } ]
        ```

        @property relationships
        @static
        @type Ember.Map
        @readOnly
      */
      relationships: Ember.computed(function() {
        var map = new Ember.MapWithDefault({
          defaultValue: function() { return []; }
        });

        // Loop through each computed property on the class
        this.eachComputedProperty(function(name, meta) {
          // If the computed property is a relationship, add
          // it to the map.
          if (meta.isRelationship) {
            meta.key = name;
            var relationshipsForType = map.get(typeForRelationshipMeta(this.store, meta));

            relationshipsForType.push({
              name: name,
              kind: meta.kind
            });
          }
        });

        return map;
      }).cacheable(false).readOnly(),

      /**
        A hash containing lists of the model's relationships, grouped
        by the relationship kind. For example, given a model with this
        definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post')
        });
        ```

        This property would contain the following:

        ```javascript
        var relationshipNames = Ember.get(App.Blog, 'relationshipNames');
        relationshipNames.hasMany;
        //=> ['users', 'posts']
        relationshipNames.belongsTo;
        //=> ['owner']
        ```

        @property relationshipNames
        @static
        @type Object
        @readOnly
      */
      relationshipNames: Ember.computed(function() {
        var names = {
          hasMany: [],
          belongsTo: []
        };

        this.eachComputedProperty(function(name, meta) {
          if (meta.isRelationship) {
            names[meta.kind].push(name);
          }
        });

        return names;
      }),

      /**
        An array of types directly related to a model. Each type will be
        included once, regardless of the number of relationships it has with
        the model.

        For example, given a model with this definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post')
        });
        ```

        This property would contain the following:

        ```javascript
        var relatedTypes = Ember.get(App.Blog, 'relatedTypes');
        //=> [ App.User, App.Post ]
        ```

        @property relatedTypes
        @static
        @type Ember.Array
        @readOnly
      */
      relatedTypes: Ember.computed(function() {
        var type;
        var types = Ember.A();

        // Loop through each computed property on the class,
        // and create an array of the unique types involved
        // in relationships
        this.eachComputedProperty(function(name, meta) {
          if (meta.isRelationship) {
            meta.key = name;
            type = typeForRelationshipMeta(this.store, meta);

            Ember.assert("You specified a hasMany (" + meta.type + ") on " + meta.parentType + " but " + meta.type + " was not found.",  type);

            if (!types.contains(type)) {
              Ember.assert("Trying to sideload " + name + " on " + this.toString() + " but the type doesn't exist.", !!type);
              types.push(type);
            }
          }
        });

        return types;
      }).cacheable(false).readOnly(),

      /**
        A map whose keys are the relationships of a model and whose values are
        relationship descriptors.

        For example, given a model with this
        definition:

        ```javascript
        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post')
        });
        ```

        This property would contain the following:

        ```javascript
        var relationshipsByName = Ember.get(App.Blog, 'relationshipsByName');
        relationshipsByName.get('users');
        //=> { key: 'users', kind: 'hasMany', type: App.User }
        relationshipsByName.get('owner');
        //=> { key: 'owner', kind: 'belongsTo', type: App.User }
        ```

        @property relationshipsByName
        @static
        @type Ember.Map
        @readOnly
      */
      relationshipsByName: Ember.computed(function() {
        var map = Ember.Map.create();

        this.eachComputedProperty(function(name, meta) {
          if (meta.isRelationship) {
            meta.key = name;
            var relationship = relationshipFromMeta(this.store, meta);
            relationship.type = typeForRelationshipMeta(this.store, meta);
            map.set(name, relationship);
          }
        });

        return map;
      }).cacheable(false).readOnly(),

      /**
        A map whose keys are the fields of the model and whose values are strings
        describing the kind of the field. A model's fields are the union of all of its
        attributes and relationships.

        For example:

        ```javascript

        App.Blog = DS.Model.extend({
          users: DS.hasMany('user'),
          owner: DS.belongsTo('user'),

          posts: DS.hasMany('post'),

          title: DS.attr('string')
        });

        var fields = Ember.get(App.Blog, 'fields');
        fields.forEach(function(field, kind) {
          console.log(field, kind);
        });

        // prints:
        // users, hasMany
        // owner, belongsTo
        // posts, hasMany
        // title, attribute
        ```

        @property fields
        @static
        @type Ember.Map
        @readOnly
      */
      fields: Ember.computed(function() {
        var map = Ember.Map.create();

        this.eachComputedProperty(function(name, meta) {
          if (meta.isRelationship) {
            map.set(name, meta.kind);
          } else if (meta.isAttribute) {
            map.set(name, 'attribute');
          }
        });

        return map;
      }).readOnly(),

      /**
        Given a callback, iterates over each of the relationships in the model,
        invoking the callback with the name of each relationship and its relationship
        descriptor.

        @method eachRelationship
        @static
        @param {Function} callback the callback to invoke
        @param {any} binding the value to which the callback's `this` should be bound
      */
      eachRelationship: function(callback, binding) {
        get(this, 'relationshipsByName').forEach(function(name, relationship) {
          callback.call(binding, name, relationship);
        });
      },

      /**
        Given a callback, iterates over each of the types related to a model,
        invoking the callback with the related type's class. Each type will be
        returned just once, regardless of how many different relationships it has
        with a model.

        @method eachRelatedType
        @static
        @param {Function} callback the callback to invoke
        @param {any} binding the value to which the callback's `this` should be bound
      */
      eachRelatedType: function(callback, binding) {
        get(this, 'relatedTypes').forEach(function(type) {
          callback.call(binding, type);
        });
      }
    });

    Model.reopen({
      /**
        Given a callback, iterates over each of the relationships in the model,
        invoking the callback with the name of each relationship and its relationship
        descriptor.

        @method eachRelationship
        @param {Function} callback the callback to invoke
        @param {any} binding the value to which the callback's `this` should be bound
      */
      eachRelationship: function(callback, binding) {
        this.constructor.eachRelationship(callback, binding);
      }
    });
  });
define("ember-data/system/relationships/has_many",
  ["ember-data/system/store","ember-data/system/relationship-meta","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    /**
      @module ember-data
    */

    var PromiseArray = __dependency1__.PromiseArray;

    var relationshipFromMeta = __dependency2__.relationshipFromMeta;
    var typeForRelationshipMeta = __dependency2__.typeForRelationshipMeta;

    var get = Ember.get;
    var set = Ember.set;
    var setProperties = Ember.setProperties;
    var map = Ember.EnumerableUtils.map;

    /**
      Returns a computed property that synchronously returns a ManyArray for
      this relationship. If not all of the records in this relationship are
      loaded, it will raise an exception.
    */

    function syncHasMany(type, options, meta) {
      return Ember.computed('data', function(key) {
        return buildRelationship(this, key, options, function(store, data) {
          // Configure the metadata for the computed property to contain
          // the key.
          meta.key = key;

          var records = data[key];

          Ember.assert("You looked up the '" + key + "' relationship on '" + this + "' but some of the associated records were not loaded. Either make sure they are all loaded together with the parent record, or specify that the relationship is async (`DS.hasMany({ async: true })`)", Ember.A(records).isEvery('isEmpty', false));

          return store.findMany(this, data[key], typeForRelationshipMeta(store, meta));
        });
      }).meta(meta).readOnly();
    }

    /**
      Returns a computed property that itself returns a promise that resolves to a
      ManyArray.
     */

    function asyncHasMany(type, options, meta) {
      return Ember.computed('data', function(key) {
        // Configure the metadata for the computed property to contain
        // the key.
        meta.key = key;

        var relationship = buildRelationship(this, key, options, function(store, data) {
          var link = data.links && data.links[key];
          var rel;
          var promiseLabel = "DS: Async hasMany " + this + " : " + key;
          var resolver = Ember.RSVP.defer(promiseLabel);

          if (link) {
            rel = store.findHasMany(this, link, relationshipFromMeta(store, meta), resolver);
          } else {

            //This is a temporary workaround for setting owner on the relationship
            //until single source of truth lands. It only works for OneToMany atm
            var records = data[key];
            var inverse = this.constructor.inverseFor(key);
            var owner = this;
            if (inverse && records) {
              if (inverse.kind === 'belongsTo'){
                map(records, function(record){
                  set(record, inverse.name, owner);
                });
              }
            }

            rel = store.findMany(owner, data[key], typeForRelationshipMeta(store, meta), resolver);
          }

          // Cache the promise so we can use it when we come back and don't
          // need to rebuild the relationship.
          set(rel, 'promise', resolver.promise);

          return rel;
        });

        var promise = relationship.get('promise').then(function() {
          return relationship;
        }, null, "DS: Async hasMany records received");

        return PromiseArray.create({
          promise: promise
        });
      }).meta(meta).readOnly();
    }

    /*
      Builds the ManyArray for a relationship using the provided callback,
      but only if it had not been created previously. After building, it
      sets some metadata on the created ManyArray, such as the record which
      owns it and the name of the relationship.
    */
    function buildRelationship(record, key, options, callback) {
      var rels = record._relationships;

      if (rels[key]) { return rels[key]; }

      var data = get(record, 'data');
      var store = get(record, 'store');

      var relationship = rels[key] = callback.call(record, store, data);

      return setProperties(relationship, {
        owner: record,
        name: key,
        isPolymorphic: options.polymorphic
      });
    }

    /**
      `DS.hasMany` is used to define One-To-Many and Many-To-Many
      relationships on a [DS.Model](/api/data/classes/DS.Model.html).

      `DS.hasMany` takes an optional hash as a second parameter, currently
      supported options are:

      - `async`: A boolean value used to explicitly declare this to be an async relationship.
      - `inverse`: A string used to identify the inverse property on a related model.

      #### One-To-Many
      To declare a one-to-many relationship between two models, use
      `DS.belongsTo` in combination with `DS.hasMany`, like this:

      ```javascript
      App.Post = DS.Model.extend({
        comments: DS.hasMany('comment')
      });

      App.Comment = DS.Model.extend({
        post: DS.belongsTo('post')
      });
      ```

      #### Many-To-Many
      To declare a many-to-many relationship between two models, use
      `DS.hasMany`:

      ```javascript
      App.Post = DS.Model.extend({
        tags: DS.hasMany('tag')
      });

      App.Tag = DS.Model.extend({
        posts: DS.hasMany('post')
      });
      ```

      #### Explicit Inverses

      Ember Data will do its best to discover which relationships map to
      one another. In the one-to-many code above, for example, Ember Data
      can figure out that changing the `comments` relationship should update
      the `post` relationship on the inverse because post is the only
      relationship to that model.

      However, sometimes you may have multiple `belongsTo`/`hasManys` for the
      same type. You can specify which property on the related model is
      the inverse using `DS.hasMany`'s `inverse` option:

      ```javascript
      var belongsTo = DS.belongsTo,
          hasMany = DS.hasMany;

      App.Comment = DS.Model.extend({
        onePost: belongsTo('post'),
        twoPost: belongsTo('post'),
        redPost: belongsTo('post'),
        bluePost: belongsTo('post')
      });

      App.Post = DS.Model.extend({
        comments: hasMany('comment', {
          inverse: 'redPost'
        })
      });
      ```

      You can also specify an inverse on a `belongsTo`, which works how
      you'd expect.

      @namespace
      @method hasMany
      @for DS
      @param {String or DS.Model} type the model type of the relationship
      @param {Object} options a hash of options
      @return {Ember.computed} relationship
    */
    function hasMany(type, options) {
      if (typeof type === 'object') {
        options = type;
        type = undefined;
      }

      options = options || {};

      // Metadata about relationships is stored on the meta of
      // the relationship. This is used for introspection and
      // serialization. Note that `key` is populated lazily
      // the first time the CP is called.
      var meta = {
        type: type,
        isRelationship: true,
        options: options,
        kind: 'hasMany',
        key: null
      };

      if (options.async) {
        return asyncHasMany(type, options, meta);
      } else {
        return syncHasMany(type, options, meta);
      }
    }

    __exports__["default"] = hasMany;
  });
define("ember-data/system/store",
  ["ember-data/system/adapter","ember-inflector/system/string","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    
    /*globals Ember*/
    /*jshint eqnull:true*/

    /**
      @module ember-data
    */

    var InvalidError = __dependency1__.InvalidError;
    var Adapter = __dependency1__.Adapter;
    var singularize = __dependency2__.singularize;

    var get = Ember.get;
    var set = Ember.set;
    var once = Ember.run.once;
    var isNone = Ember.isNone;
    var forEach = Ember.EnumerableUtils.forEach;
    var indexOf = Ember.EnumerableUtils.indexOf;
    var map = Ember.EnumerableUtils.map;
    var Promise = Ember.RSVP.Promise;
    var copy = Ember.copy;
    var Store, PromiseObject, PromiseArray, RecordArrayManager, Model;

    var camelize = Ember.String.camelize;

    // Implementors Note:
    //
    //   The variables in this file are consistently named according to the following
    //   scheme:
    //
    //   * +id+ means an identifier managed by an external source, provided inside
    //     the data provided by that source. These are always coerced to be strings
    //     before being used internally.
    //   * +clientId+ means a transient numerical identifier generated at runtime by
    //     the data store. It is important primarily because newly created objects may
    //     not yet have an externally generated id.
    //   * +reference+ means a record reference object, which holds metadata about a
    //     record, even if it has not yet been fully materialized.
    //   * +type+ means a subclass of DS.Model.

    // Used by the store to normalize IDs entering the store.  Despite the fact
    // that developers may provide IDs as numbers (e.g., `store.find(Person, 1)`),
    // it is important that internally we use strings, since IDs may be serialized
    // and lose type information.  For example, Ember's router may put a record's
    // ID into the URL, and if we later try to deserialize that URL and find the
    // corresponding record, we will not know if it is a string or a number.
    function coerceId(id) {
      return id == null ? null : id+'';
    }

    /**
      The store contains all of the data for records loaded from the server.
      It is also responsible for creating instances of `DS.Model` that wrap
      the individual data for a record, so that they can be bound to in your
      Handlebars templates.

      Define your application's store like this:

      ```javascript
      MyApp.Store = DS.Store.extend();
      ```

      Most Ember.js applications will only have a single `DS.Store` that is
      automatically created by their `Ember.Application`.

      You can retrieve models from the store in several ways. To retrieve a record
      for a specific id, use `DS.Store`'s `find()` method:

      ```javascript
      store.find('person', 123).then(function (person) {
      });
      ```

      If your application has multiple `DS.Store` instances (an unusual case), you can
      specify which store should be used:

      ```javascript
      store.find('person', 123).then(function (person) {
      });
      ```

      By default, the store will talk to your backend using a standard
      REST mechanism. You can customize how the store talks to your
      backend by specifying a custom adapter:

      ```javascript
      MyApp.ApplicationAdapter = MyApp.CustomAdapter
      ```

      You can learn more about writing a custom adapter by reading the `DS.Adapter`
      documentation.

      ### Store createRecord() vs. push() vs. pushPayload() vs. update()

      The store provides multiple ways to create new record objects. They have
      some subtle differences in their use which are detailed below:

      [createRecord](#method_createRecord) is used for creating new
      records on the client side. This will return a new record in the
      `created.uncommitted` state. In order to persist this record to the
      backend you will need to call `record.save()`.

      [push](#method_push) is used to notify Ember Data's store of new or
      updated records that exist in the backend. This will return a record
      in the `loaded.saved` state. The primary use-case for `store#push` is
      to notify Ember Data about record updates that happen
      outside of the normal adapter methods (for example
      [SSE](http://dev.w3.org/html5/eventsource/) or [Web
      Sockets](http://www.w3.org/TR/2009/WD-websockets-20091222/)).

      [pushPayload](#method_pushPayload) is a convenience wrapper for
      `store#push` that will deserialize payloads if the
      Serializer implements a `pushPayload` method.

      [update](#method_update) works like `push`, except it can handle
      partial attributes without overwriting the existing record
      properties.

      Note: When creating a new record using any of the above methods
      Ember Data will update `DS.RecordArray`s such as those returned by
      `store#all()`, `store#findAll()` or `store#filter()`. This means any
      data bindings or computed properties that depend on the RecordArray
      will automatically be synced to include the new or updated record
      values.

      @class Store
      @namespace DS
      @extends Ember.Object
    */
    Store = Ember.Object.extend({

      /**
        @method init
        @private
      */
      init: function() {
        // internal bookkeeping; not observable
        if (!RecordArrayManager) { RecordArrayManager = requireModule("ember-data/system/record_array_manager")["default"]; }
        this.typeMaps = {};
        this.recordArrayManager = RecordArrayManager.create({
          store: this
        });
        this._relationshipChanges = {};
        this._pendingSave = [];
        //Used to keep track of all the find requests that need to be coalesced
        this._pendingFetch = Ember.Map.create();
      },

      /**
        The adapter to use to communicate to a backend server or other persistence layer.

        This can be specified as an instance, class, or string.

        If you want to specify `App.CustomAdapter` as a string, do:

        ```js
        adapter: 'custom'
        ```

        @property adapter
        @default DS.RESTAdapter
        @type {DS.Adapter|String}
      */
      adapter: '-rest',

      /**
        Returns a JSON representation of the record using a custom
        type-specific serializer, if one exists.

        The available options are:

        * `includeId`: `true` if the record's ID should be included in
          the JSON representation

        @method serialize
        @private
        @param {DS.Model} record the record to serialize
        @param {Object} options an options hash
      */
      serialize: function(record, options) {
        return this.serializerFor(record.constructor.typeKey).serialize(record, options);
      },

      /**
        This property returns the adapter, after resolving a possible
        string key.

        If the supplied `adapter` was a class, or a String property
        path resolved to a class, this property will instantiate the
        class.

        This property is cacheable, so the same instance of a specified
        adapter class should be used for the lifetime of the store.

        @property defaultAdapter
        @private
        @return DS.Adapter
      */
      defaultAdapter: Ember.computed('adapter', function() {
        var adapter = get(this, 'adapter');

        Ember.assert('You tried to set `adapter` property to an instance of `DS.Adapter`, where it should be a name or a factory', !(adapter instanceof Adapter));

        if (typeof adapter === 'string') {
          adapter = this.container.lookup('adapter:' + adapter) || this.container.lookup('adapter:application') || this.container.lookup('adapter:-rest');
        }

        if (DS.Adapter.detect(adapter)) {
          adapter = adapter.create({
            container: this.container
          });
        }

        return adapter;
      }),

      // .....................
      // . CREATE NEW RECORD .
      // .....................

      /**
        Create a new record in the current store. The properties passed
        to this method are set on the newly created record.

        To create a new instance of `App.Post`:

        ```js
        store.createRecord('post', {
          title: "Rails is omakase"
        });
        ```

        @method createRecord
        @param {String} type
        @param {Object} properties a hash of properties to set on the
          newly created record.
        @return {DS.Model} record
      */
      createRecord: function(typeName, inputProperties) {
        var type = this.modelFor(typeName);
        var properties = copy(inputProperties) || {};

        // If the passed properties do not include a primary key,
        // give the adapter an opportunity to generate one. Typically,
        // client-side ID generators will use something like uuid.js
        // to avoid conflicts.

        if (isNone(properties.id)) {
          properties.id = this._generateId(type);
        }

        // Coerce ID to a string
        properties.id = coerceId(properties.id);

        var record = this.buildRecord(type, properties.id);

        // Move the record out of its initial `empty` state into
        // the `loaded` state.
        record.loadedData();

        // Set the properties specified on the record.
        record.setProperties(properties);

        return record;
      },

      /**
        If possible, this method asks the adapter to generate an ID for
        a newly created record.

        @method _generateId
        @private
        @param {String} type
        @return {String} if the adapter can generate one, an ID
      */
      _generateId: function(type) {
        var adapter = this.adapterFor(type);

        if (adapter && adapter.generateIdForRecord) {
          return adapter.generateIdForRecord(this);
        }

        return null;
      },

      // .................
      // . DELETE RECORD .
      // .................

      /**
        For symmetry, a record can be deleted via the store.

        Example

        ```javascript
        var post = store.createRecord('post', {
          title: "Rails is omakase"
        });

        store.deleteRecord(post);
        ```

        @method deleteRecord
        @param {DS.Model} record
      */
      deleteRecord: function(record) {
        record.deleteRecord();
      },

      /**
        For symmetry, a record can be unloaded via the store. Only
        non-dirty records can be unloaded.

        Example

        ```javascript
        store.find('post', 1).then(function(post) {
          store.unloadRecord(post);
        });
        ```

        @method unloadRecord
        @param {DS.Model} record
      */
      unloadRecord: function(record) {
        record.unloadRecord();
      },

      // ................
      // . FIND RECORDS .
      // ................

      /**
        This is the main entry point into finding records. The first parameter to
        this method is the model's name as a string.

        ---

        To find a record by ID, pass the `id` as the second parameter:

        ```javascript
        store.find('person', 1);
        ```

        The `find` method will always return a **promise** that will be resolved
        with the record. If the record was already in the store, the promise will
        be resolved immediately. Otherwise, the store will ask the adapter's `find`
        method to find the necessary data.

        The `find` method will always resolve its promise with the same object for
        a given type and `id`.

        ---

        You can optionally preload specific attributes and relationships that you know of
        by passing them as the third argument to find.

        For example, if your Ember route looks like `/posts/1/comments/2` and you API route
        for the comment also looks like `/posts/1/comments/2` if you want to fetch the comment
        without fetching the post you can pass in the post to the `find` call:

        ```javascript
        store.find('comment', 2, {post: 1});
        ```

        If you have access to the post model you can also pass the model itself:

        ```javascript
        store.find('post', 1).then(function (myPostModel) {
          store.find('comment', 2, {post: myPostModel});
        });
        ```

        This way, your adapter's `find` or `buildURL` method will be able to look up the
        relationship on the record and construct the nested URL without having to first
        fetch the post.

        ---

        To find all records for a type, call `find` with no additional parameters:

        ```javascript
        store.find('person');
        ```

        This will ask the adapter's `findAll` method to find the records for the
        given type, and return a promise that will be resolved once the server
        returns the values.

        ---

        To find a record by a query, call `find` with a hash as the second
        parameter:

        ```javascript
        store.find('person', { page: 1 });
        ```

        This will ask the adapter's `findQuery` method to find the records for
        the query, and return a promise that will be resolved once the server
        responds.

        @method find
        @param {String or subclass of DS.Model} type
        @param {Object|String|Integer|null} id
        @return {Promise} promise
      */
      find: function(type, id, preload) {
        Ember.assert("You need to pass a type to the store's find method", arguments.length >= 1);
        Ember.assert("You may not pass `" + id + "` as id to the store's find method", arguments.length === 1 || !Ember.isNone(id));

        if (arguments.length === 1) {
          return this.findAll(type);
        }

        // We are passed a query instead of an id.
        if (Ember.typeOf(id) === 'object') {
          return this.findQuery(type, id);
        }

        return this.findById(type, coerceId(id), preload);
      },

      /**
        This method returns a record for a given type and id combination.

        @method findById
        @private
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {Promise} promise
      */
      findById: function(typeName, id, preload) {
        var fetchedRecord;

        var type = this.modelFor(typeName);
        var record = this.recordForId(type, id);

        if (preload) {
          record._preloadData(preload);
        }

        if (get(record, 'isEmpty')) {
          fetchedRecord = this.scheduleFetch(record);
          //TODO double check about reloading
        } else if (get(record, 'isLoading')){
          fetchedRecord = record._loadingPromise;
        }

        return promiseObject(fetchedRecord || record, "DS: Store#findById " + type + " with id: " + id);
      },

      /**
        This method makes a series of requests to the adapter's `find` method
        and returns a promise that resolves once they are all loaded.

        @private
        @method findByIds
        @param {String} type
        @param {Array} ids
        @return {Promise} promise
      */
      findByIds: function(type, ids) {
        var store = this;
        var promiseLabel = "DS: Store#findByIds " + type;

        return promiseArray(Ember.RSVP.all(map(ids, function(id) {
          return store.findById(type, id);
        })).then(Ember.A, null, "DS: Store#findByIds of " + type + " complete"));
      },

      /**
        This method is called by `findById` if it discovers that a particular
        type/id pair hasn't been loaded yet to kick off a request to the
        adapter.

        @method fetchRecord
        @private
        @param {DS.Model} record
        @return {Promise} promise
      */
      fetchRecord: function(record) {
        var type = record.constructor;
        var id = get(record, 'id');
        var adapter = this.adapterFor(type);

        Ember.assert("You tried to find a record but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to find a record but your adapter (for " + type + ") does not implement 'find'", adapter.find);

        var promise = _find(adapter, this, type, id, record);
        return promise;
      },

      scheduleFetchMany: function(records) {
        return Ember.RSVP.all(map(records, this.scheduleFetch, this));
      },

      scheduleFetch: function(record) {
        var type = record.constructor;
        if (isNone(record)) { return null; }
        if (record._loadingPromise) { return record._loadingPromise; }

        var resolver = Ember.RSVP.defer('Fetching ' + type + 'with id: ' + record.get('id'));
        var recordResolverPair = {
          record: record,
          resolver: resolver
        };
        var promise = resolver.promise;

        record.loadingData(promise);

        if (!this._pendingFetch.get(type)){
          this._pendingFetch.set(type, [recordResolverPair]);
        } else {
          this._pendingFetch.get(type).push(recordResolverPair);
        }
        Ember.run.scheduleOnce('afterRender', this, this.flushAllPendingFetches);

        return promise;
      },

      flushAllPendingFetches: function(){
        if (this.isDestroyed || this.isDestroying) {
          return;
        }

        this._pendingFetch.forEach(this._flushPendingFetchForType, this);
        this._pendingFetch = Ember.Map.create();
      },

      _flushPendingFetchForType: function (type, recordResolverPairs) {
        var store = this;
        var adapter = store.adapterFor(type);
        var shouldCoalesce = !!adapter.findMany && adapter.coalesceFindRequests;
        var records = Ember.A(recordResolverPairs).mapBy('record');
        var resolvers = Ember.A(recordResolverPairs).mapBy('resolver');

        function _fetchRecord(recordResolverPair) {
          recordResolverPair.resolver.resolve(store.fetchRecord(recordResolverPair.record));
        }

        function resolveFoundRecords(records) {
          forEach(records, function(record){
            var pair = Ember.A(recordResolverPairs).findBy('record', record);
            if (pair){
              var resolver = pair.resolver;
              resolver.resolve(record);
            }
          });
        }

        function makeMissingRecordsRejector(requestedRecords) {
          return function rejectMissingRecords(resolvedRecords) {
            var missingRecords = requestedRecords.without(resolvedRecords);
            rejectRecords(missingRecords);
          };
        }

        function makeRecordsRejector(records) {
          return function (error) {
            rejectRecords(records, error);
          };
        }

        function rejectRecords(records, error) {
          forEach(records, function(record){
            var pair = Ember.A(recordResolverPairs).findBy('record', record);
            if (pair){
              var resolver = pair.resolver;
              resolver.reject(error);
            }
          });
        }

        if (recordResolverPairs.length === 1) {
          _fetchRecord(recordResolverPairs[0]);
        } else if (shouldCoalesce) {
          var groups = adapter.groupRecordsForFindMany(this, records);
          forEach(groups, function (groupOfRecords) {
            var requestedRecords = Ember.A(groupOfRecords);
            var ids = requestedRecords.mapBy('id');
            if (ids.length > 1) {
              _findMany(adapter, store, type, ids, requestedRecords).
                then(resolveFoundRecords).
                then(makeMissingRecordsRejector(requestedRecords)).
                then(null, makeRecordsRejector(requestedRecords));
            } else if (ids.length === 1) {
              var pair = Ember.A(recordResolverPairs).findBy('record', groupOfRecords[0]);
              _fetchRecord(pair);
            } else {
              Ember.assert("You cannot return an empty array from adapter's method groupRecordsForFindMany", false);
            }
          });
        } else {
          forEach(recordResolverPairs, _fetchRecord);
        }
      },

      /**
        Get a record by a given type and ID without triggering a fetch.

        This method will synchronously return the record if it is available in the store,
        otherwise it will return `null`. A record is available if it has been fetched earlier, or
        pushed manually into the store.

        _Note: This is an synchronous method and does not return a promise._

        ```js
        var post = store.getById('post', 1);

        post.get('id'); // 1
        ```

        @method getById
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {DS.Model|null} record
      */
      getById: function(type, id) {
        if (this.hasRecordForId(type, id)) {
          return this.recordForId(type, id);
        } else {
          return null;
        }
      },

      /**
        This method is called by the record's `reload` method.

        This method calls the adapter's `find` method, which returns a promise. When
        **that** promise resolves, `reloadRecord` will resolve the promise returned
        by the record's `reload`.

        @method reloadRecord
        @private
        @param {DS.Model} record
        @return {Promise} promise
      */
      reloadRecord: function(record) {
        var type = record.constructor;
        var adapter = this.adapterFor(type);
        var id = get(record, 'id');

        Ember.assert("You cannot reload a record without an ID", id);
        Ember.assert("You tried to reload a record but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to reload a record but your adapter does not implement `find`", adapter.find);

        return this.scheduleFetch(record);
      },

      /**
        Returns true if a record for a given type and ID is already loaded.

        @method hasRecordForId
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {Boolean}
      */
      hasRecordForId: function(typeName, inputId) {
        var type = this.modelFor(typeName);
        var id = coerceId(inputId);
        return !!this.typeMapFor(type).idToRecord[id];
      },

      /**
        Returns id record for a given type and ID. If one isn't already loaded,
        it builds a new record and leaves it in the `empty` state.

        @method recordForId
        @private
        @param {String or subclass of DS.Model} type
        @param {String|Integer} id
        @return {DS.Model} record
      */
      recordForId: function(typeName, inputId) {
        var type = this.modelFor(typeName);
        var id = coerceId(inputId);
        var idToRecord = this.typeMapFor(type).idToRecord;
        var record = idToRecord[id];

        if (!record || !idToRecord[id]) {
          record = this.buildRecord(type, id);
        }

        return record;
      },

      /**
        @method findMany
        @private
        @param {DS.Model} owner
        @param {Array} records
        @param {String or subclass of DS.Model} type
        @param {Resolver} resolver
        @return {DS.ManyArray} records
      */
      findMany: function(owner, inputRecords, typeName, resolver) {
        var type = this.modelFor(typeName);
        var records = Ember.A(inputRecords);
        var unloadedRecords = records.filterProperty('isEmpty', true);
        var manyArray = this.recordArrayManager.createManyArray(type, records);

        manyArray.loadingRecordsCount = unloadedRecords.length;

        if (unloadedRecords.length) {
          forEach(unloadedRecords, function(record) {
            this.recordArrayManager.registerWaitingRecordArray(record, manyArray);
          }, this);

          resolver.resolve(this.scheduleFetchMany(unloadedRecords, owner));
        } else {
          if (resolver) { resolver.resolve(); }
          manyArray.set('isLoaded', true);
          once(manyArray, 'trigger', 'didLoad');
        }

        return manyArray;
      },

      /**
        If a relationship was originally populated by the adapter as a link
        (as opposed to a list of IDs), this method is called when the
        relationship is fetched.

        The link (which is usually a URL) is passed through unchanged, so the
        adapter can make whatever request it wants.

        The usual use-case is for the server to register a URL as a link, and
        then use that URL in the future to make a request for the relationship.

        @method findHasMany
        @private
        @param {DS.Model} owner
        @param {any} link
        @param {String or subclass of DS.Model} type
        @return {Promise} promise
      */
      findHasMany: function(owner, link, relationship, resolver) {
        var adapter = this.adapterFor(owner.constructor);

        Ember.assert("You tried to load a hasMany relationship but you have no adapter (for " + owner.constructor + ")", adapter);
        Ember.assert("You tried to load a hasMany relationship from a specified `link` in the original payload but your adapter does not implement `findHasMany`", adapter.findHasMany);

        var records = this.recordArrayManager.createManyArray(relationship.type, Ember.A([]));
        resolver.resolve(_findHasMany(adapter, this, owner, link, relationship));
        return records;
      },

      /**
        @method findBelongsTo
        @private
        @param {DS.Model} owner
        @param {any} link
        @param {Relationship} relationship
        @return {Promise} promise
      */
      findBelongsTo: function(owner, link, relationship) {
        var adapter = this.adapterFor(owner.constructor);

        Ember.assert("You tried to load a belongsTo relationship but you have no adapter (for " + owner.constructor + ")", adapter);
        Ember.assert("You tried to load a belongsTo relationship from a specified `link` in the original payload but your adapter does not implement `findBelongsTo`", adapter.findBelongsTo);

        return _findBelongsTo(adapter, this, owner, link, relationship);
      },

      /**
        This method delegates a query to the adapter. This is the one place where
        adapter-level semantics are exposed to the application.

        Exposing queries this way seems preferable to creating an abstract query
        language for all server-side queries, and then require all adapters to
        implement them.

        This method returns a promise, which is resolved with a `RecordArray`
        once the server returns.

        @method findQuery
        @private
        @param {String or subclass of DS.Model} type
        @param {any} query an opaque query to be used by the adapter
        @return {Promise} promise
      */
      findQuery: function(typeName, query) {
        var type = this.modelFor(typeName);
        var array = this.recordArrayManager
          .createAdapterPopulatedRecordArray(type, query);

        var adapter = this.adapterFor(type);

        Ember.assert("You tried to load a query but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to load a query but your adapter does not implement `findQuery`", adapter.findQuery);

        return promiseArray(_findQuery(adapter, this, type, query, array));
      },

      /**
        This method returns an array of all records adapter can find.
        It triggers the adapter's `findAll` method to give it an opportunity to populate
        the array with records of that type.

        @method findAll
        @private
        @param {String or subclass of DS.Model} type
        @return {DS.AdapterPopulatedRecordArray}
      */
      findAll: function(typeName) {
        var type = this.modelFor(typeName);

        return this.fetchAll(type, this.all(type));
      },

      /**
        @method fetchAll
        @private
        @param {DS.Model} type
        @param {DS.RecordArray} array
        @return {Promise} promise
      */
      fetchAll: function(type, array) {
        var adapter = this.adapterFor(type);
        var sinceToken = this.typeMapFor(type).metadata.since;

        set(array, 'isUpdating', true);

        Ember.assert("You tried to load all records but you have no adapter (for " + type + ")", adapter);
        Ember.assert("You tried to load all records but your adapter does not implement `findAll`", adapter.findAll);

        return promiseArray(_findAll(adapter, this, type, sinceToken));
      },

      /**
        @method didUpdateAll
        @param {DS.Model} type
      */
      didUpdateAll: function(type) {
        var findAllCache = this.typeMapFor(type).findAllCache;
        set(findAllCache, 'isUpdating', false);
      },

      /**
        This method returns a filtered array that contains all of the known records
        for a given type.

        Note that because it's just a filter, it will have any locally
        created records of the type.

        Also note that multiple calls to `all` for a given type will always
        return the same RecordArray.

        Example

        ```javascript
        var localPosts = store.all('post');
        ```

        @method all
        @param {String or subclass of DS.Model} type
        @return {DS.RecordArray}
      */
      all: function(typeName) {
        var type = this.modelFor(typeName);
        var typeMap = this.typeMapFor(type);
        var findAllCache = typeMap.findAllCache;

        if (findAllCache) { return findAllCache; }

        var array = this.recordArrayManager.createRecordArray(type);

        typeMap.findAllCache = array;
        return array;
      },


      /**
        This method unloads all of the known records for a given type.

        ```javascript
        store.unloadAll('post');
        ```

        @method unloadAll
        @param {String or subclass of DS.Model} type
      */
      unloadAll: function(type) {
        var modelType = this.modelFor(type);
        var typeMap = this.typeMapFor(modelType);
        var records = typeMap.records.slice();
        var record;

        for (var i = 0; i < records.length; i++) {
          record = records[i];
          record.unloadRecord();
          record.destroy(); // maybe within unloadRecord
        }

        typeMap.findAllCache = null;
      },

      /**
        Takes a type and filter function, and returns a live RecordArray that
        remains up to date as new records are loaded into the store or created
        locally.

        The callback function takes a materialized record, and returns true
        if the record should be included in the filter and false if it should
        not.

        The filter function is called once on all records for the type when
        it is created, and then once on each newly loaded or created record.

        If any of a record's properties change, or if it changes state, the
        filter function will be invoked again to determine whether it should
        still be in the array.

        Optionally you can pass a query which will be triggered at first. The
        results returned by the server could then appear in the filter if they
        match the filter function.

        Example

        ```javascript
        store.filter('post', {unread: true}, function(post) {
          return post.get('unread');
        }).then(function(unreadPosts) {
          unreadPosts.get('length'); // 5
          var unreadPost = unreadPosts.objectAt(0);
          unreadPost.set('unread', false);
          unreadPosts.get('length'); // 4
        });
        ```

        @method filter
        @param {String or subclass of DS.Model} type
        @param {Object} query optional query
        @param {Function} filter
        @return {DS.PromiseArray}
      */
      filter: function(type, query, filter) {
        var promise;
        var length = arguments.length;
        var array;
        var hasQuery = length === 3;

        // allow an optional server query
        if (hasQuery) {
          promise = this.findQuery(type, query);
        } else if (arguments.length === 2) {
          filter = query;
        }

        type = this.modelFor(type);

        if (hasQuery) {
          array = this.recordArrayManager.createFilteredRecordArray(type, filter, query);
        } else {
          array = this.recordArrayManager.createFilteredRecordArray(type, filter);
        }

        promise = promise || Promise.cast(array);


        return promiseArray(promise.then(function() {
          return array;
        }, null, "DS: Store#filter of " + type));
      },

      /**
        This method returns if a certain record is already loaded
        in the store. Use this function to know beforehand if a find()
        will result in a request or that it will be a cache hit.

         Example

        ```javascript
        store.recordIsLoaded('post', 1); // false
        store.find('post', 1).then(function() {
          store.recordIsLoaded('post', 1); // true
        });
        ```

        @method recordIsLoaded
        @param {String or subclass of DS.Model} type
        @param {string} id
        @return {boolean}
      */
      recordIsLoaded: function(type, id) {
        if (!this.hasRecordForId(type, id)) { return false; }
        return !get(this.recordForId(type, id), 'isEmpty');
      },

      /**
        This method returns the metadata for a specific type.

        @method metadataFor
        @param {String or subclass of DS.Model} type
        @return {object}
      */
      metadataFor: function(type) {
        type = this.modelFor(type);
        return this.typeMapFor(type).metadata;
      },

      // ............
      // . UPDATING .
      // ............

      /**
        If the adapter updates attributes or acknowledges creation
        or deletion, the record will notify the store to update its
        membership in any filters.
        To avoid thrashing, this method is invoked only once per

        run loop per record.

        @method dataWasUpdated
        @private
        @param {Class} type
        @param {DS.Model} record
      */
      dataWasUpdated: function(type, record) {
        this.recordArrayManager.recordDidChange(record);
      },

      // ..............
      // . PERSISTING .
      // ..............

      /**
        This method is called by `record.save`, and gets passed a
        resolver for the promise that `record.save` returns.

        It schedules saving to happen at the end of the run loop.

        @method scheduleSave
        @private
        @param {DS.Model} record
        @param {Resolver} resolver
      */
      scheduleSave: function(record, resolver) {
        record.adapterWillCommit();
        this._pendingSave.push([record, resolver]);
        once(this, 'flushPendingSave');
      },

      /**
        This method is called at the end of the run loop, and
        flushes any records passed into `scheduleSave`

        @method flushPendingSave
        @private
      */
      flushPendingSave: function() {
        var pending = this._pendingSave.slice();
        this._pendingSave = [];

        forEach(pending, function(tuple) {
          var record = tuple[0], resolver = tuple[1];
          var adapter = this.adapterFor(record.constructor);
          var operation;

          if (get(record, 'currentState.stateName') === 'root.deleted.saved') {
            return resolver.resolve(record);
          } else if (get(record, 'isNew')) {
            operation = 'createRecord';
          } else if (get(record, 'isDeleted')) {
            operation = 'deleteRecord';
          } else {
            operation = 'updateRecord';
          }

          resolver.resolve(_commit(adapter, this, operation, record));
        }, this);
      },

      /**
        This method is called once the promise returned by an
        adapter's `createRecord`, `updateRecord` or `deleteRecord`
        is resolved.

        If the data provides a server-generated ID, it will
        update the record and the store's indexes.

        @method didSaveRecord
        @private
        @param {DS.Model} record the in-flight record
        @param {Object} data optional data (see above)
      */
      didSaveRecord: function(record, data) {
        if (data) {
          // normalize relationship IDs into records
          data = normalizeRelationships(this, record.constructor, data, record);

          this.updateId(record, data);
        }

        record.adapterDidCommit(data);
      },

      /**
        This method is called once the promise returned by an
        adapter's `createRecord`, `updateRecord` or `deleteRecord`
        is rejected with a `DS.InvalidError`.

        @method recordWasInvalid
        @private
        @param {DS.Model} record
        @param {Object} errors
      */
      recordWasInvalid: function(record, errors) {
        record.adapterDidInvalidate(errors);
      },

      /**
        This method is called once the promise returned by an
        adapter's `createRecord`, `updateRecord` or `deleteRecord`
        is rejected (with anything other than a `DS.InvalidError`).

        @method recordWasError
        @private
        @param {DS.Model} record
      */
      recordWasError: function(record) {
        record.adapterDidError();
      },

      /**
        When an adapter's `createRecord`, `updateRecord` or `deleteRecord`
        resolves with data, this method extracts the ID from the supplied
        data.

        @method updateId
        @private
        @param {DS.Model} record
        @param {Object} data
      */
      updateId: function(record, data) {
        var oldId = get(record, 'id');
        var id = coerceId(data.id);

        Ember.assert("An adapter cannot assign a new id to a record that already has an id. " + record + " had id: " + oldId + " and you tried to update it with " + id + ". This likely happened because your server returned data in response to a find or update that had a different id than the one you sent.", oldId === null || id === oldId);

        this.typeMapFor(record.constructor).idToRecord[id] = record;

        set(record, 'id', id);
      },

      /**
        Returns a map of IDs to client IDs for a given type.

        @method typeMapFor
        @private
        @param type
        @return {Object} typeMap
      */
      typeMapFor: function(type) {
        var typeMaps = get(this, 'typeMaps');
        var guid = Ember.guidFor(type);
        var typeMap;

        typeMap = typeMaps[guid];

        if (typeMap) { return typeMap; }

        typeMap = {
          idToRecord: Object.create(null),
          records: [],
          metadata: Object.create(null),
          type: type
        };

        typeMaps[guid] = typeMap;

        return typeMap;
      },

      // ................
      // . LOADING DATA .
      // ................

      /**
        This internal method is used by `push`.

        @method _load
        @private
        @param {String or subclass of DS.Model} type
        @param {Object} data
        @param {Boolean} partial the data should be merged into
          the existing data, not replace it.
      */
      _load: function(type, data, partial) {
        var id = coerceId(data.id);
        var record = this.recordForId(type, id);

        record.setupData(data, partial);
        this.recordArrayManager.recordDidChange(record);

        return record;
      },

      /**
        Returns a model class for a particular key. Used by
        methods that take a type key (like `find`, `createRecord`,
        etc.)

        @method modelFor
        @param {String or subclass of DS.Model} key
        @return {subclass of DS.Model}
      */
      modelFor: function(key) {
        var factory;

        if (typeof key === 'string') {
          var normalizedKey = this.container.normalize('model:' + key);

          factory = this.container.lookupFactory(normalizedKey);
          if (!factory) { throw new Ember.Error("No model was found for '" + key + "'"); }
          factory.typeKey = this._normalizeTypeKey(normalizedKey.split(':', 2)[1]);
        } else {
          // A factory already supplied. Ensure it has a normalized key.
          factory = key;
          if (factory.typeKey) {
            factory.typeKey = this._normalizeTypeKey(factory.typeKey);
          }
        }

        factory.store = this;
        return factory;
      },

      /**
        Push some data for a given type into the store.

        This method expects normalized data:

        * The ID is a key named `id` (an ID is mandatory)
        * The names of attributes are the ones you used in
          your model's `DS.attr`s.
        * Your relationships must be:
          * represented as IDs or Arrays of IDs
          * represented as model instances
          * represented as URLs, under the `links` key

        For this model:

        ```js
        App.Person = DS.Model.extend({
          firstName: DS.attr(),
          lastName: DS.attr(),

          children: DS.hasMany('person')
        });
        ```

        To represent the children as IDs:

        ```js
        {
          id: 1,
          firstName: "Tom",
          lastName: "Dale",
          children: [1, 2, 3]
        }
        ```

        To represent the children relationship as a URL:

        ```js
        {
          id: 1,
          firstName: "Tom",
          lastName: "Dale",
          links: {
            children: "/people/1/children"
          }
        }
        ```

        If you're streaming data or implementing an adapter,
        make sure that you have converted the incoming data
        into this form.

        This method can be used both to push in brand new
        records, as well as to update existing records.

        @method push
        @param {String or subclass of DS.Model} type
        @param {Object} data
        @return {DS.Model} the record that was created or
          updated.
      */
      push: function(typeName, data, _partial) {
        // _partial is an internal param used by `update`.
        // If passed, it means that the data should be
        // merged into the existing data, not replace it.

        Ember.assert("You must include an `id` for " + typeName+ " in a hash passed to `push`", data.id != null);

        var type = this.modelFor(typeName);

        // normalize relationship IDs into records
        data = normalizeRelationships(this, type, data);

        this._load(type, data, _partial);

        return this.recordForId(type, data.id);
      },

      /**
        Push some raw data into the store.

        This method can be used both to push in brand new
        records, as well as to update existing records. You
        can push in more than one type of object at once.
        All objects should be in the format expected by the
        serializer.

        ```js
        App.ApplicationSerializer = DS.ActiveModelSerializer;

        var pushData = {
          posts: [
            {id: 1, post_title: "Great post", comment_ids: [2]}
          ],
          comments: [
            {id: 2, comment_body: "Insightful comment"}
          ]
        }

        store.pushPayload(pushData);
        ```

        By default, the data will be deserialized using a default
        serializer (the application serializer if it exists).

        Alternatively, `pushPayload` will accept a model type which
        will determine which serializer will process the payload.
        However, the serializer itself (processing this data via
        `normalizePayload`) will not know which model it is
        deserializing.

        ```js
        App.ApplicationSerializer = DS.ActiveModelSerializer;
        App.PostSerializer = DS.JSONSerializer;
        store.pushPayload('comment', pushData); // Will use the ApplicationSerializer
        store.pushPayload('post', pushData); // Will use the PostSerializer
        ```

        @method pushPayload
        @param {String} type Optionally, a model used to determine which serializer will be used
        @param {Object} payload
      */
      pushPayload: function (type, inputPayload) {
        var serializer;
        var payload;
        if (!inputPayload) {
          payload = type;
          serializer = defaultSerializer(this.container);
          Ember.assert("You cannot use `store#pushPayload` without a type unless your default serializer defines `pushPayload`", serializer.pushPayload);
        } else {
          payload = inputPayload;
          serializer = this.serializerFor(type);
        }
        serializer.pushPayload(this, payload);
      },

      /**
        `normalize` converts a json payload into the normalized form that
        [push](#method_push) expects.

        Example

        ```js
        socket.on('message', function(message) {
          var modelName = message.model;
          var data = message.data;
          store.push(modelName, store.normalize(modelName, data));
        });
        ```

        @method normalize
        @param {String} The name of the model type for this payload
        @param {Object} payload
        @return {Object} The normalized payload
      */
      normalize: function (type, payload) {
        var serializer = this.serializerFor(type);
        var model = this.modelFor(type);
        return serializer.normalize(model, payload);
      },

      /**
        Update existing records in the store. Unlike [push](#method_push),
        update will merge the new data properties with the existing
        properties. This makes it safe to use with a subset of record
        attributes. This method expects normalized data.

        `update` is useful if your app broadcasts partial updates to
        records.

        ```js
        App.Person = DS.Model.extend({
          firstName: DS.attr('string'),
          lastName: DS.attr('string')
        });

        store.get('person', 1).then(function(tom) {
          tom.get('firstName'); // Tom
          tom.get('lastName'); // Dale

          var updateEvent = {id: 1, firstName: "TomHuda"};
          store.update('person', updateEvent);

          tom.get('firstName'); // TomHuda
          tom.get('lastName'); // Dale
        });
        ```

        @method update
        @param {String} type
        @param {Object} data
        @return {DS.Model} the record that was updated.
      */
      update: function(type, data) {
        Ember.assert("You must include an `id` for " + type + " in a hash passed to `update`", data.id != null);

        return this.push(type, data, true);
      },

      /**
        If you have an Array of normalized data to push,
        you can call `pushMany` with the Array, and it will
        call `push` repeatedly for you.

        @method pushMany
        @param {String or subclass of DS.Model} type
        @param {Array} datas
        @return {Array}
      */
      pushMany: function(type, datas) {
        return map(datas, function(data) {
          return this.push(type, data);
        }, this);
      },

      /**
        If you have some metadata to set for a type
        you can call `metaForType`.

        @method metaForType
        @param {String or subclass of DS.Model} type
        @param {Object} metadata
      */
      metaForType: function(typeName, metadata) {
        var type = this.modelFor(typeName);

        Ember.merge(this.typeMapFor(type).metadata, metadata);
      },

      /**
        Build a brand new record for a given type, ID, and
        initial data.

        @method buildRecord
        @private
        @param {subclass of DS.Model} type
        @param {String} id
        @param {Object} data
        @return {DS.Model} record
      */
      buildRecord: function(type, id, data) {
        var typeMap = this.typeMapFor(type);
        var idToRecord = typeMap.idToRecord;

        Ember.assert('The id ' + id + ' has already been used with another record of type ' + type.toString() + '.', !id || !idToRecord[id]);
        Ember.assert("`" + Ember.inspect(type)+ "` does not appear to be an ember-data model", (typeof type._create === 'function') );

        // lookupFactory should really return an object that creates
        // instances with the injections applied
        var record = type._create({
          id: id,
          store: this,
          container: this.container
        });

        if (data) {
          record.setupData(data);
        }

        // if we're creating an item, this process will be done
        // later, once the object has been persisted.
        if (id) {
          idToRecord[id] = record;
        }

        typeMap.records.push(record);

        return record;
      },

      // ...............
      // . DESTRUCTION .
      // ...............

      /**
        When a record is destroyed, this un-indexes it and
        removes it from any record arrays so it can be GCed.

        @method dematerializeRecord
        @private
        @param {DS.Model} record
      */
      dematerializeRecord: function(record) {
        var type = record.constructor;
        var typeMap = this.typeMapFor(type);
        var id = get(record, 'id');

        record.updateRecordArrays();

        if (id) {
          delete typeMap.idToRecord[id];
        }

        var loc = indexOf(typeMap.records, record);
        typeMap.records.splice(loc, 1);
      },

      // ........................
      // . RELATIONSHIP CHANGES .
      // ........................

      addRelationshipChangeFor: function(childRecord, childKey, parentRecord, parentKey, change) {
        var clientId = childRecord.clientId;
        var parentClientId = parentRecord ? parentRecord : parentRecord;
        var key = childKey + parentKey;
        var changes = this._relationshipChanges;

        if (!(clientId in changes)) {
          changes[clientId] = {};
        }
        if (!(parentClientId in changes[clientId])) {
          changes[clientId][parentClientId] = {};
        }
        if (!(key in changes[clientId][parentClientId])) {
          changes[clientId][parentClientId][key] = {};
        }
        changes[clientId][parentClientId][key][change.changeType] = change;
      },

      removeRelationshipChangeFor: function(clientRecord, childKey, parentRecord, parentKey, type) {
        var clientId = clientRecord.clientId;
        var parentClientId = parentRecord ? parentRecord.clientId : parentRecord;
        var changes = this._relationshipChanges;
        var key = childKey + parentKey;

        if (!(clientId in changes) || !(parentClientId in changes[clientId]) || !(key in changes[clientId][parentClientId])){
          return;
        }
        delete changes[clientId][parentClientId][key][type];
      },

      relationshipChangePairsFor: function(record){
        var toReturn = [];

        if( !record ) { return toReturn; }

        //TODO(Igor) What about the other side
        var changesObject = this._relationshipChanges[record.clientId];
        for (var objKey in changesObject){
          if (changesObject.hasOwnProperty(objKey)){
            for (var changeKey in changesObject[objKey]){
              if (changesObject[objKey].hasOwnProperty(changeKey)){
                toReturn.push(changesObject[objKey][changeKey]);
              }
            }
          }
        }
        return toReturn;
      },

      // ......................
      // . PER-TYPE ADAPTERS
      // ......................

      /**
        Returns the adapter for a given type.

        @method adapterFor
        @private
        @param {subclass of DS.Model} type
        @return DS.Adapter
      */
      adapterFor: function(type) {
        var container = this.container, adapter;

        if (container) {
          adapter = container.lookup('adapter:' + type.typeKey) || container.lookup('adapter:application');
        }

        return adapter || get(this, 'defaultAdapter');
      },

      // ..............................
      // . RECORD CHANGE NOTIFICATION .
      // ..............................

      /**
        Returns an instance of the serializer for a given type. For
        example, `serializerFor('person')` will return an instance of
        `App.PersonSerializer`.

        If no `App.PersonSerializer` is found, this method will look
        for an `App.ApplicationSerializer` (the default serializer for
        your entire application).

        If no `App.ApplicationSerializer` is found, it will fall back
        to an instance of `DS.JSONSerializer`.

        @method serializerFor
        @private
        @param {String} type the record to serialize
        @return {DS.Serializer}
      */
      serializerFor: function(type) {
        type = this.modelFor(type);
        var adapter = this.adapterFor(type);

        return serializerFor(this.container, type.typeKey, adapter && adapter.defaultSerializer);
      },

      willDestroy: function() {
        var typeMaps = this.typeMaps;
        var keys = Ember.keys(typeMaps);
        var store = this;

        var types = map(keys, byType);

        this.recordArrayManager.destroy();

        forEach(types, this.unloadAll, this);

        function byType(entry) {
          return typeMaps[entry]['type'];
        }

      },

      /**
        All typeKeys are camelCase internally. Changing this function may
        require changes to other normalization hooks (such as typeForRoot).

        @method _normalizeTypeKey
        @private
        @param {String} type
        @return {String} if the adapter can generate one, an ID
      */
      _normalizeTypeKey: function(key) {
        return camelize(singularize(key));
      }
    });

    function normalizeRelationships(store, type, data, record) {
      type.eachRelationship(function(key, relationship) {
        // A link (usually a URL) was already provided in
        // normalized form
        if (data.links && data.links[key]) {
          if (record && relationship.options.async) { record._relationships[key] = null; }
          return;
        }

        var kind = relationship.kind;
        var value = data[key];

        if (value == null) {
          if (kind === 'hasMany' && record) {
            value = data[key] = record.get(key).toArray();
          }
          return;
        }

        if (kind === 'belongsTo') {
          deserializeRecordId(store, data, key, relationship, value);
        } else if (kind === 'hasMany') {
          deserializeRecordIds(store, data, key, relationship, value);
          addUnsavedRecords(record, key, value);
        }
      });

      return data;
    }

    function deserializeRecordId(store, data, key, relationship, id) {
      if (!Model) { Model = requireModule("ember-data/system/model")["Model"]; }
      if (isNone(id) || id instanceof Model) {
        return;
      }

      var type;

      if (typeof id === 'number' || typeof id === 'string') {
        type = typeFor(relationship, key, data);
        data[key] = store.recordForId(type, id);
      } else if (typeof id === 'object') {
        // polymorphic
        data[key] = store.recordForId(id.type, id.id);
      }
    }

    function typeFor(relationship, key, data) {
      if (relationship.options.polymorphic) {
        return data[key + "Type"];
      } else {
        return relationship.type;
      }
    }

    function deserializeRecordIds(store, data, key, relationship, ids) {
      for (var i=0, l=ids.length; i<l; i++) {
        deserializeRecordId(store, ids, i, relationship, ids[i]);
      }
    }

    // If there are any unsaved records that are in a hasMany they won't be
    // in the payload, so add them back in manually.
    function addUnsavedRecords(record, key, data) {
      if(record) {
        var unsavedRecords = uniqById(Ember.A(data), record.get(key).filterBy('isNew'));
        Ember.A(data).pushObjects(unsavedRecords);
      }
    }

    function uniqById(data, records) {
      var currentIds = data.mapBy("id");
      return records.reject(function(record) {
        return Ember.A(currentIds).contains(record.id);
      });
    }

    // Delegation to the adapter and promise management
    /**
      A `PromiseArray` is an object that acts like both an `Ember.Array`
      and a promise. When the promise is resolved the resulting value
      will be set to the `PromiseArray`'s `content` property. This makes
      it easy to create data bindings with the `PromiseArray` that will be
      updated when the promise resolves.

      For more information see the [Ember.PromiseProxyMixin
      documentation](/api/classes/Ember.PromiseProxyMixin.html).

      Example

      ```javascript
      var promiseArray = DS.PromiseArray.create({
        promise: $.getJSON('/some/remote/data.json')
      });

      promiseArray.get('length'); // 0

      promiseArray.then(function() {
        promiseArray.get('length'); // 100
      });
      ```

      @class PromiseArray
      @namespace DS
      @extends Ember.ArrayProxy
      @uses Ember.PromiseProxyMixin
    */
    PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
    /**
      A `PromiseObject` is an object that acts like both an `Ember.Object`
      and a promise. When the promise is resolved, then the resulting value
      will be set to the `PromiseObject`'s `content` property. This makes
      it easy to create data bindings with the `PromiseObject` that will
      be updated when the promise resolves.

      For more information see the [Ember.PromiseProxyMixin
      documentation](/api/classes/Ember.PromiseProxyMixin.html).

      Example

      ```javascript
      var promiseObject = DS.PromiseObject.create({
        promise: $.getJSON('/some/remote/data.json')
      });

      promiseObject.get('name'); // null

      promiseObject.then(function() {
        promiseObject.get('name'); // 'Tomster'
      });
      ```

      @class PromiseObject
      @namespace DS
      @extends Ember.ObjectProxy
      @uses Ember.PromiseProxyMixin
    */
    PromiseObject = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);

    function promiseObject(promise, label) {
      return PromiseObject.create({
        promise: Promise.cast(promise, label)
      });
    }

    function promiseArray(promise, label) {
      return PromiseArray.create({
        promise: Promise.cast(promise, label)
      });
    }

    function isThenable(object) {
      return object && typeof object.then === 'function';
    }

    function serializerFor(container, type, defaultSerializer) {
      return container.lookup('serializer:'+type) ||
                     container.lookup('serializer:application') ||
                     container.lookup('serializer:' + defaultSerializer) ||
                     container.lookup('serializer:-default');
    }

    function defaultSerializer(container) {
      return container.lookup('serializer:application') ||
             container.lookup('serializer:-default');
    }

    function serializerForAdapter(adapter, type) {
      var serializer = adapter.serializer;
      var defaultSerializer = adapter.defaultSerializer;
      var container = adapter.container;

      if (container && serializer === undefined) {
        serializer = serializerFor(container, type.typeKey, defaultSerializer);
      }

      if (serializer === null || serializer === undefined) {
        serializer = {
          extract: function(store, type, payload) { return payload; }
        };
      }

      return serializer;
    }

    function _objectIsAlive(object) {
      return !(get(object, "isDestroyed") || get(object, "isDestroying"));
    }

    function _guard(promise, test) {
      var guarded = promise['finally'](function() {
        if (!test()) {
          guarded._subscribers.length = 0;
        }
      });

      return guarded;
    }

    function _bind(fn) {
      var args = Array.prototype.slice.call(arguments, 1);

      return function() {
        return fn.apply(undefined, args);
      };
    }

    function _find(adapter, store, type, id, record) {
      var promise = adapter.find(store, type, id, record);
      var serializer = serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#find of " + type + " with id: " + id;

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        Ember.assert("You made a request for a " + type.typeKey + " with id " + id + ", but the adapter's response did not have any data", adapterPayload);
        var payload = serializer.extract(store, type, adapterPayload, id, 'find');

        return store.push(type, payload);
      }, function(error) {
        var record = store.getById(type, id);
        if (record) {
          record.notFound();
        }
        throw error;
      }, "DS: Extract payload of '" + type + "'");
    }


    function _findMany(adapter, store, type, ids, records) {
      var promise = adapter.findMany(store, type, ids, records);
      var serializer = serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#findMany of " + type;

      if (promise === undefined) {
        throw new Error('adapter.findMany returned undefined, this was very likely a mistake');
      }

      var guardedPromise;

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        var payload = serializer.extract(store, type, adapterPayload, null, 'findMany');

        Ember.assert("The response from a findMany must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

        return store.pushMany(type, payload);
      }, null, "DS: Extract payload of " + type);
    }

    function _findHasMany(adapter, store, record, link, relationship) {
      var promise = adapter.findHasMany(store, record, link, relationship);
      var serializer = serializerForAdapter(adapter, relationship.type);
      var label = "DS: Handle Adapter#findHasMany of " + record + " : " + relationship.type;

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));
      promise = _guard(promise, _bind(_objectIsAlive, record));

      return promise.then(function(adapterPayload) {
        var payload = serializer.extract(store, relationship.type, adapterPayload, null, 'findHasMany');

        Ember.assert("The response from a findHasMany must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

        var records = store.pushMany(relationship.type, payload);
        record.updateHasMany(relationship.key, records);
      }, null, "DS: Extract payload of " + record + " : hasMany " + relationship.type);
    }

    function _findBelongsTo(adapter, store, record, link, relationship) {
      var promise = adapter.findBelongsTo(store, record, link, relationship);
      var serializer = serializerForAdapter(adapter, relationship.type);
      var label = "DS: Handle Adapter#findBelongsTo of " + record + " : " + relationship.type;

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));
      promise = _guard(promise, _bind(_objectIsAlive, record));

      return promise.then(function(adapterPayload) {
        var payload = serializer.extract(store, relationship.type, adapterPayload, null, 'findBelongsTo');
        var record = store.push(relationship.type, payload);

        record.updateBelongsTo(relationship.key, record);
        return record;
      }, null, "DS: Extract payload of " + record + " : " + relationship.type);
    }

    function _findAll(adapter, store, type, sinceToken) {
      var promise = adapter.findAll(store, type, sinceToken);
      var serializer = serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#findAll of " + type;

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        var payload = serializer.extract(store, type, adapterPayload, null, 'findAll');

        Ember.assert("The response from a findAll must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

        store.pushMany(type, payload);
        store.didUpdateAll(type);
        return store.all(type);
      }, null, "DS: Extract payload of findAll " + type);
    }

    function _findQuery(adapter, store, type, query, recordArray) {
      var promise = adapter.findQuery(store, type, query, recordArray);
      var serializer = serializerForAdapter(adapter, type);
      var label = "DS: Handle Adapter#findQuery of " + type;

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));

      return promise.then(function(adapterPayload) {
        var payload = serializer.extract(store, type, adapterPayload, null, 'findQuery');

        Ember.assert("The response from a findQuery must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

        recordArray.load(payload);
        return recordArray;
      }, null, "DS: Extract payload of findQuery " + type);
    }

    function _commit(adapter, store, operation, record) {
      var type = record.constructor;
      var promise = adapter[operation](store, type, record);
      var serializer = serializerForAdapter(adapter, type);
      var label = "DS: Extract and notify about " + operation + " completion of " + record;

      Ember.assert("Your adapter's '" + operation + "' method must return a value, but it returned `undefined", promise !==undefined);

      promise = Promise.cast(promise, label);
      promise = _guard(promise, _bind(_objectIsAlive, store));
      promise = _guard(promise, _bind(_objectIsAlive, record));

      return promise.then(function(adapterPayload) {
        var payload;

        if (adapterPayload) {
          payload = serializer.extract(store, type, adapterPayload, get(record, 'id'), operation);
        } else {
          payload = adapterPayload;
        }

        store.didSaveRecord(record, payload);
        return record;
      }, function(reason) {
        if (reason instanceof InvalidError) {
          store.recordWasInvalid(record, reason.errors);
        } else {
          store.recordWasError(record, reason);
        }

        throw reason;
      }, label);
    }

    __exports__.Store = Store;
    __exports__.PromiseArray = PromiseArray;
    __exports__.PromiseObject = PromiseObject;

    __exports__["default"] = Store;
  });
define("ember-data/transforms",
  ["ember-data/transforms/base","ember-data/transforms/number","ember-data/transforms/date","ember-data/transforms/string","ember-data/transforms/boolean","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    
    var Transform = __dependency1__["default"];
    var NumberTransform = __dependency2__["default"];
    var DateTransform = __dependency3__["default"];
    var StringTransform = __dependency4__["default"];
    var BooleanTransform = __dependency5__["default"];

    __exports__.Transform = Transform;
    __exports__.NumberTransform = NumberTransform;
    __exports__.DateTransform = DateTransform;
    __exports__.StringTransform = StringTransform;
    __exports__.BooleanTransform = BooleanTransform;
  });
define("ember-data/transforms/base",
  ["exports"],
  function(__exports__) {
    
    /**
      The `DS.Transform` class is used to serialize and deserialize model
      attributes when they are saved or loaded from an
      adapter. Subclassing `DS.Transform` is useful for creating custom
      attributes. All subclasses of `DS.Transform` must implement a
      `serialize` and a `deserialize` method.

      Example

      ```javascript
      // Converts centigrade in the JSON to fahrenheit in the app
      App.TemperatureTransform = DS.Transform.extend({
        deserialize: function(serialized) {
          return (serialized *  1.8) + 32;
        },
        serialize: function(deserialized) {
          return (deserialized - 32) / 1.8;
        }
      });
      ```

      Usage

      ```javascript
      var attr = DS.attr;
      App.Requirement = DS.Model.extend({
        name: attr('string'),
        temperature: attr('temperature')
      });
      ```

      @class Transform
      @namespace DS
     */
    __exports__["default"] = Ember.Object.extend({
      /**
        When given a deserialized value from a record attribute this
        method must return the serialized value.

        Example

        ```javascript
        serialize: function(deserialized) {
          return Ember.isEmpty(deserialized) ? null : Number(deserialized);
        }
        ```

        @method serialize
        @param deserialized The deserialized value
        @return The serialized value
      */
      serialize: Ember.required(),

      /**
        When given a serialize value from a JSON object this method must
        return the deserialized value for the record attribute.

        Example

        ```javascript
        deserialize: function(serialized) {
          return empty(serialized) ? null : Number(serialized);
        }
        ```

        @method deserialize
        @param serialized The serialized value
        @return The deserialized value
      */
      deserialize: Ember.required()
    });
  });
define("ember-data/transforms/boolean",
  ["ember-data/transforms/base","exports"],
  function(__dependency1__, __exports__) {
    
    var Transform = __dependency1__["default"];

    /**
      The `DS.BooleanTransform` class is used to serialize and deserialize
      boolean attributes on Ember Data record objects. This transform is
      used when `boolean` is passed as the type parameter to the
      [DS.attr](../../data#method_attr) function.

      Usage

      ```javascript
      var attr = DS.attr;
      App.User = DS.Model.extend({
        isAdmin: attr('boolean'),
        name: attr('string'),
        email: attr('string')
      });
      ```

      @class BooleanTransform
      @extends DS.Transform
      @namespace DS
     */
    __exports__["default"] = Transform.extend({
      deserialize: function(serialized) {
        var type = typeof serialized;

        if (type === "boolean") {
          return serialized;
        } else if (type === "string") {
          return serialized.match(/^true$|^t$|^1$/i) !== null;
        } else if (type === "number") {
          return serialized === 1;
        } else {
          return false;
        }
      },

      serialize: function(deserialized) {
        return Boolean(deserialized);
      }
    });
  });
define("ember-data/transforms/date",
  ["ember-data/transforms/base","exports"],
  function(__dependency1__, __exports__) {
    
    /**
      The `DS.DateTransform` class is used to serialize and deserialize
      date attributes on Ember Data record objects. This transform is used
      when `date` is passed as the type parameter to the
      [DS.attr](../../data#method_attr) function.

      ```javascript
      var attr = DS.attr;
      App.Score = DS.Model.extend({
        value: attr('number'),
        player: DS.belongsTo('player'),
        date: attr('date')
      });
      ```

      @class DateTransform
      @extends DS.Transform
      @namespace DS
     */
    var Transform = __dependency1__["default"];

    // Date.prototype.toISOString shim
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    var toISOString = Date.prototype.toISOString || function() {
      function pad(number) {
        if ( number < 10 ) {
          return '0' + number;
        }
        return number;
      }

      return this.getUTCFullYear() +
        '-' + pad( this.getUTCMonth() + 1 ) +
        '-' + pad( this.getUTCDate() ) +
        'T' + pad( this.getUTCHours() ) +
        ':' + pad( this.getUTCMinutes() ) +
        ':' + pad( this.getUTCSeconds() ) +
        '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
        'Z';
    };

    if (Ember.SHIM_ES5) {
      if (!Date.prototype.toISOString) {
        Date.prototype.toISOString = toISOString;
      }
    }

    __exports__["default"] = Transform.extend({

      deserialize: function(serialized) {
        var type = typeof serialized;

        if (type === "string") {
          return new Date(Ember.Date.parse(serialized));
        } else if (type === "number") {
          return new Date(serialized);
        } else if (serialized === null || serialized === undefined) {
          // if the value is not present in the data,
          // return undefined, not null.
          return serialized;
        } else {
          return null;
        }
      },

      serialize: function(date) {
        if (date instanceof Date) {
          return toISOString.call(date);
        } else {
          return null;
        }
      }
    });
  });
define("ember-data/transforms/number",
  ["ember-data/transforms/base","exports"],
  function(__dependency1__, __exports__) {
    
    var Transform = __dependency1__["default"];

    var empty = Ember.isEmpty;

    /**
      The `DS.NumberTransform` class is used to serialize and deserialize
      numeric attributes on Ember Data record objects. This transform is
      used when `number` is passed as the type parameter to the
      [DS.attr](../../data#method_attr) function.

      Usage

      ```javascript
      var attr = DS.attr;
      App.Score = DS.Model.extend({
        value: attr('number'),
        player: DS.belongsTo('player'),
        date: attr('date')
      });
      ```

      @class NumberTransform
      @extends DS.Transform
      @namespace DS
     */
    __exports__["default"] = Transform.extend({
      deserialize: function(serialized) {
        return empty(serialized) ? null : Number(serialized);
      },

      serialize: function(deserialized) {
        return empty(deserialized) ? null : Number(deserialized);
      }
    });
  });
define("ember-data/transforms/string",
  ["ember-data/transforms/base","exports"],
  function(__dependency1__, __exports__) {
    
    var Transform = __dependency1__["default"];
    var none = Ember.isNone;

    /**
      The `DS.StringTransform` class is used to serialize and deserialize
      string attributes on Ember Data record objects. This transform is
      used when `string` is passed as the type parameter to the
      [DS.attr](../../data#method_attr) function.

      Usage

      ```javascript
      var attr = DS.attr;
      App.User = DS.Model.extend({
        isAdmin: attr('boolean'),
        name: attr('string'),
        email: attr('string')
      });
      ```

      @class StringTransform
      @extends DS.Transform
      @namespace DS
     */
    __exports__["default"] = Transform.extend({
      deserialize: function(serialized) {
        return none(serialized) ? null : String(serialized);
      },
      serialize: function(deserialized) {
        return none(deserialized) ? null : String(deserialized);
      }
    });
  });
define("ember-inflector",
  ["./system","./helpers","./ext/string","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var Inflector = __dependency1__.Inflector;
    var defaultRules = __dependency1__.defaultRules;
    var pluralize = __dependency1__.pluralize;
    var singularize = __dependency1__.singularize;

    Inflector.defaultRules = defaultRules;
    Ember.Inflector        = Inflector;

    Ember.String.pluralize   = pluralize;
    Ember.String.singularize = singularize;


    __exports__["default"] = Inflector;

    __exports__.pluralize = pluralize;
    __exports__.singularize = singularize;
  });
define("ember-inflector/ext/string",
  ["../system/string"],
  function(__dependency1__) {
    
    var pluralize = __dependency1__.pluralize;
    var singularize = __dependency1__.singularize;

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.String) {
      /**
        See {{#crossLink "Ember.String/pluralize"}}{{/crossLink}}

        @method pluralize
        @for String
      */
      String.prototype.pluralize = function() {
        return pluralize(this);
      };

      /**
        See {{#crossLink "Ember.String/singularize"}}{{/crossLink}}

        @method singularize
        @for String
      */
      String.prototype.singularize = function() {
        return singularize(this);
      };
    }
  });
define("ember-inflector/helpers",
  ["./system/string"],
  function(__dependency1__) {
    
    var singularize = __dependency1__.singularize;
    var pluralize = __dependency1__.pluralize;

    /**
     *
     * If you have Ember Inflector (such as if Ember Data is present),
     * singularize a word. For example, turn "oxen" into "ox".
     *
     * Example:
     *
     * {{singularize myProperty}}
     * {{singularize "oxen"}}
     *
     * @for Ember.Handlebars.helpers
     * @method singularize
     * @param {String|Property} word word to singularize
    */
    Ember.Handlebars.helper('singularize', singularize);

    /**
     *
     * If you have Ember Inflector (such as if Ember Data is present),
     * pluralize a word. For example, turn "ox" into "oxen".
     *
     * Example:
     *
     * {{pluralize myProperty}}
     * {{pluralize "oxen"}}
     *
     * @for Ember.Handlebars.helpers
     * @method pluralize
     * @param {String|Property} word word to pluralize
    */
    Ember.Handlebars.helper('pluralize', pluralize);
  });
define("ember-inflector/system",
  ["./system/inflector","./system/string","./system/inflections","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    
    var Inflector = __dependency1__["default"];

    var pluralize = __dependency2__.pluralize;
    var singularize = __dependency2__.singularize;

    var defaultRules = __dependency3__["default"];

    
    Inflector.inflector = new Inflector(defaultRules);
    
    __exports__.Inflector = Inflector;
    __exports__.singularize = singularize;
    __exports__.pluralize = pluralize;
    __exports__.defaultRules = defaultRules;
  });
define("ember-inflector/system/inflections",
  ["exports"],
  function(__exports__) {
    
    __exports__["default"] = {
      plurals: [
        [/$/, 's'],
        [/s$/i, 's'],
        [/^(ax|test)is$/i, '$1es'],
        [/(octop|vir)us$/i, '$1i'],
        [/(octop|vir)i$/i, '$1i'],
        [/(alias|status)$/i, '$1es'],
        [/(bu)s$/i, '$1ses'],
        [/(buffal|tomat)o$/i, '$1oes'],
        [/([ti])um$/i, '$1a'],
        [/([ti])a$/i, '$1a'],
        [/sis$/i, 'ses'],
        [/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
        [/(hive)$/i, '$1s'],
        [/([^aeiouy]|qu)y$/i, '$1ies'],
        [/(x|ch|ss|sh)$/i, '$1es'],
        [/(matr|vert|ind)(?:ix|ex)$/i, '$1ices'],
        [/^(m|l)ouse$/i, '$1ice'],
        [/^(m|l)ice$/i, '$1ice'],
        [/^(ox)$/i, '$1en'],
        [/^(oxen)$/i, '$1'],
        [/(quiz)$/i, '$1zes']
      ],

      singular: [
        [/s$/i, ''],
        [/(ss)$/i, '$1'],
        [/(n)ews$/i, '$1ews'],
        [/([ti])a$/i, '$1um'],
        [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i, '$1sis'],
        [/(^analy)(sis|ses)$/i, '$1sis'],
        [/([^f])ves$/i, '$1fe'],
        [/(hive)s$/i, '$1'],
        [/(tive)s$/i, '$1'],
        [/([lr])ves$/i, '$1f'],
        [/([^aeiouy]|qu)ies$/i, '$1y'],
        [/(s)eries$/i, '$1eries'],
        [/(m)ovies$/i, '$1ovie'],
        [/(x|ch|ss|sh)es$/i, '$1'],
        [/^(m|l)ice$/i, '$1ouse'],
        [/(bus)(es)?$/i, '$1'],
        [/(o)es$/i, '$1'],
        [/(shoe)s$/i, '$1'],
        [/(cris|test)(is|es)$/i, '$1is'],
        [/^(a)x[ie]s$/i, '$1xis'],
        [/(octop|vir)(us|i)$/i, '$1us'],
        [/(alias|status)(es)?$/i, '$1'],
        [/^(ox)en/i, '$1'],
        [/(vert|ind)ices$/i, '$1ex'],
        [/(matr)ices$/i, '$1ix'],
        [/(quiz)zes$/i, '$1'],
        [/(database)s$/i, '$1']
      ],

      irregularPairs: [
        ['person', 'people'],
        ['man', 'men'],
        ['child', 'children'],
        ['sex', 'sexes'],
        ['move', 'moves'],
        ['cow', 'kine'],
        ['zombie', 'zombies']
      ],

      uncountable: [
        'equipment',
        'information',
        'rice',
        'money',
        'species',
        'series',
        'fish',
        'sheep',
        'jeans',
        'police'
      ]
    };
  });
define("ember-inflector/system/inflector",
  ["exports"],
  function(__exports__) {
    
    var BLANK_REGEX = /^\s*$/;
    var LAST_WORD_DASHED_REGEX = /(\w+[_-])([a-z\d]+$)/;
    var LAST_WORD_CAMELIZED_REGEX = /(\w+)([A-Z][a-z\d]*$)/;
    var CAMELIZED_REGEX = /[A-Z][a-z\d]*$/;

    function loadUncountable(rules, uncountable) {
      for (var i = 0, length = uncountable.length; i < length; i++) {
        rules.uncountable[uncountable[i].toLowerCase()] = true;
      }
    }

    function loadIrregular(rules, irregularPairs) {
      var pair;

      for (var i = 0, length = irregularPairs.length; i < length; i++) {
        pair = irregularPairs[i];

        //pluralizing
        rules.irregular[pair[0].toLowerCase()] = pair[1];
        rules.irregular[pair[1].toLowerCase()] = pair[1];

        //singularizing
        rules.irregularInverse[pair[1].toLowerCase()] = pair[0];
        rules.irregularInverse[pair[0].toLowerCase()] = pair[0];
      }
    }

    /**
      Inflector.Ember provides a mechanism for supplying inflection rules for your
      application. Ember includes a default set of inflection rules, and provides an
      API for providing additional rules.

      Examples:

      Creating an inflector with no rules.

      ```js
      var inflector = new Ember.Inflector();
      ```

      Creating an inflector with the default ember ruleset.

      ```js
      var inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

      inflector.pluralize('cow'); //=> 'kine'
      inflector.singularize('kine'); //=> 'cow'
      ```

      Creating an inflector and adding rules later.

      ```javascript
      var inflector = Ember.Inflector.inflector;

      inflector.pluralize('advice'); // => 'advices'
      inflector.uncountable('advice');
      inflector.pluralize('advice'); // => 'advice'

      inflector.pluralize('formula'); // => 'formulas'
      inflector.irregular('formula', 'formulae');
      inflector.pluralize('formula'); // => 'formulae'

      // you would not need to add these as they are the default rules
      inflector.plural(/$/, 's');
      inflector.singular(/s$/i, '');
      ```

      Creating an inflector with a nondefault ruleset.

      ```javascript
      var rules = {
        plurals:  [ /$/, 's' ],
        singular: [ /\s$/, '' ],
        irregularPairs: [
          [ 'cow', 'kine' ]
        ],
        uncountable: [ 'fish' ]
      };

      var inflector = new Ember.Inflector(rules);
      ```

      @class Inflector
      @namespace Ember
    */
    function Inflector(ruleSet) {
      ruleSet = ruleSet || {};
      ruleSet.uncountable = ruleSet.uncountable || makeDictionary();
      ruleSet.irregularPairs = ruleSet.irregularPairs || makeDictionary();

      var rules = this.rules = {
        plurals:  ruleSet.plurals || [],
        singular: ruleSet.singular || [],
        irregular: makeDictionary(),
        irregularInverse: makeDictionary(),
        uncountable: makeDictionary()
      };

      loadUncountable(rules, ruleSet.uncountable);
      loadIrregular(rules, ruleSet.irregularPairs);

      this.enableCache();
    }

    if (!Object.create && !Object.create(null).hasOwnProperty) {
      throw new Error("This browser does not support Object.create(null), please polyfil with es5-sham: http://git.io/yBU2rg");
    }

    function makeDictionary() {
      var cache = Object.create(null);
      cache['_dict'] = null;
      delete cache['_dict'];
      return cache;
    }

    Inflector.prototype = {
      /**
        @public

        As inflections can be costly, and commonly the same subset of words are repeatedly
        inflected an optional cache is provided.

        @method enableCache
      */
      enableCache: function() {
        this.purgeCache();

        this.singularize = function(word) {
          this._cacheUsed = true;
          return this._sCache[word] || (this._sCache[word] = this._singularize(word));
        };

        this.pluralize = function(word) {
          this._cacheUsed = true;
          return this._pCache[word] || (this._pCache[word] = this._pluralize(word));
        };
      },

      /**
        @public

        @method purgedCache
      */
      purgeCache: function() {
        this._cacheUsed = false;
        this._sCache = makeDictionary();
        this._pCache = makeDictionary();
      },

      /**
        @public
        disable caching

        @method disableCache;
      */
      disableCache: function() {
        this._sCache = null;
        this._pCache = null;
        this.singularize = function(word) {
          return this._singularize(word);
        };

        this.pluralize = function(word) {
          return this._pluralize(word);
        };
      },

      /**
        @method plural
        @param {RegExp} regex
        @param {String} string
      */
      plural: function(regex, string) {
        if (this._cacheUsed) { this.purgeCache(); }
        this.rules.plurals.push([regex, string.toLowerCase()]);
      },

      /**
        @method singular
        @param {RegExp} regex
        @param {String} string
      */
      singular: function(regex, string) {
        if (this._cacheUsed) { this.purgeCache(); }
        this.rules.singular.push([regex, string.toLowerCase()]);
      },

      /**
        @method uncountable
        @param {String} regex
      */
      uncountable: function(string) {
        if (this._cacheUsed) { this.purgeCache(); }
        loadUncountable(this.rules, [string.toLowerCase()]);
      },

      /**
        @method irregular
        @param {String} singular
        @param {String} plural
      */
      irregular: function (singular, plural) {
        if (this._cacheUsed) { this.purgeCache(); }
        loadIrregular(this.rules, [[singular, plural]]);
      },

      /**
        @method pluralize
        @param {String} word
      */
      pluralize: function(word) {
        return this._pluralize(word);
      },

      _pluralize: function(word) {
        return this.inflect(word, this.rules.plurals, this.rules.irregular);
      },
      /**
        @method singularize
        @param {String} word
      */
      singularize: function(word) {
        return this._singularize(word);
      },

      _singularize: function(word) {
        return this.inflect(word, this.rules.singular,  this.rules.irregularInverse);
      },

      /**
        @protected

        @method inflect
        @param {String} word
        @param {Object} typeRules
        @param {Object} irregular
      */
      inflect: function(word, typeRules, irregular) {
        var inflection, substitution, result, lowercase, wordSplit,
          firstPhrase, lastWord, isBlank, isCamelized, isUncountable, 
          isIrregular, isIrregularInverse, rule;
      
        isBlank = BLANK_REGEX.test(word);
        isCamelized = CAMELIZED_REGEX.test(word);
        firstPhrase = "";

        if (isBlank) {
          return word;
        }

        lowercase = word.toLowerCase();
        wordSplit = LAST_WORD_DASHED_REGEX.exec(word) || LAST_WORD_CAMELIZED_REGEX.exec(word);
        if (wordSplit){
          firstPhrase = wordSplit[1];
          lastWord = wordSplit[2].toLowerCase();
        }

        isUncountable = this.rules.uncountable[lowercase] || this.rules.uncountable[lastWord];

        if (isUncountable) {
          return word;
        }

        isIrregular = irregular && (irregular[lowercase] || irregular[lastWord]);

        if (isIrregular) {
          if (irregular[lowercase]){
            return isIrregular;
          }
          else {
            isIrregular = (isCamelized) ? isIrregular.capitalize() : isIrregular;
            return firstPhrase + isIrregular;
          }
        }

        for (var i = typeRules.length, min = 0; i > min; i--) {
           inflection = typeRules[i-1];
           rule = inflection[0];

          if (rule.test(word)) {
            break;
          }
        }

        inflection = inflection || [];

        rule = inflection[0];
        substitution = inflection[1];

        result = word.replace(rule, substitution);

        return result;
      }
    };

    __exports__["default"] = Inflector;
  });
define("ember-inflector/system/string",
  ["./inflector","exports"],
  function(__dependency1__, __exports__) {
    
    var Inflector = __dependency1__["default"];

    function pluralize(word) {
      return Inflector.inflector.pluralize(word);
    }

    function singularize(word) {
      return Inflector.inflector.singularize(word);
    }

    __exports__.pluralize = pluralize;
    __exports__.singularize = singularize;
  });
 global.DS = requireModule('ember-data')['default'];
 })(this);
define("ember_data", ["ember"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.DS;
    };
}(this)));

define('crud-adapter/model-wrapper',[
  "ember",
  "ember_data",
  "lib/ember-utils-core",
], function(Ember, DS, Utils) {

/**
 * Model wrapper model class. No used directly. Instead use createModelWrapper.
 *
 * @class ModelWrapper
 * @for CrudAdapter
 */
var ModelWrapper = DS.Model.extend(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps"), that = this;
    this.set("isDirty_alias", this.get("isDirty"));
    Ember.addObserver(this, "isDirty", this, "attributeDidChange");
    for(var i = 0; i < arrayProps.length; i++) {
      var arrayProp = arrayProps[i];
      this[arrayProp+"WillBeDeleted"] = that.childrenWillBeDeleted;
      this[arrayProp+"WasAdded"] = that.childrenWasAdded;
    }
  },

  childrenWillBeDeleted : function(props, idxs) {
    this._validation = this._validation || {};
    for(var i = 0; i < props.length; i++) {
      var propId = Utils.getEmberId(props[i]);
      delete this._validation[propId];
      Ember.removeObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.removeObserver(props[i], "isDirty", this, "attributeDidChange");
      Ember.removeObserver(props[i], "isLoading", this, "attributeDidChange");
      Ember.removeObserver(props[i], "isReloading", this, "attributeDidChange");
      Ember.removeObserver(props[i], "isSaving", this, "attributeDidChange");
    }
  },

  childrenWasAdded : function(props, idxs) {
    for(var i = 0; i < props.length; i++) {
      this.validationFailedDidChanged(props[i], "validationFailed");
      this.attributeDidChange(props[i], "isDirty");
      Ember.addObserver(props[i], "validationFailed", this, "validationFailedDidChanged");
      Ember.addObserver(props[i], "isDirty", this, "attributeDidChange");
      Ember.addObserver(props[i], "isLoading", this, "attributeDidChange");
      Ember.addObserver(props[i], "isReloading", this, "attributeDidChange");
      Ember.addObserver(props[i], "isSaving", this, "attributeDidChange");
    }
  },

  validationFailedDidChanged : function(obj, attr) {
    var val = obj.get(attr), objId = Utils.getEmberId(obj);
    this._validation = this._validation || {};
    if(val) {
      this._validation[objId] = 1;
    }
    else {
      delete this._validation[objId];
    }
    this.set("validationFailed", Utils.hashHasKeys(this._validation));
  },

  attributeDidChange : function(obj, attr) {
    this.set(attr+"_alias", this.get(attr) || obj.get(attr));
  },

  /**
   * Boolean to denote validation failure. Poppulated by form module.
   *
   * @property validationFailed
   * @for ModelWrapper
   * @type Boolean
   */
  validationFailed : false,

  /**
   * Bubbled isLoading boolean from child records.
   *
   * @property isLoading_alias
   * @type Boolean
   */
  isLoading_alias : false,

  /**
   * Bubbled isReloading boolean from child records.
   *
   * @property isReloading_alias
   * @type Boolean
   */
  isReloading_alias : Ember.computed.oneWay("isReloading"),

  /**
   * Bubbled isSaving boolean from child records.
   *
   * @property isSaving_alias
   * @type Boolean
   */
  isSaving_alias : Ember.computed.oneWay("isSaving"),

  /**
   * Bubbled isDirty boolean from child records.
   *
   * @property isDirty_alias
   * @type Boolean
   */
  isDirty_alias : Ember.computed.oneWay("isDirty"),
  isNotDirty : Ember.computed.not("isDirty_alias"),

  /**
   * Boolean to denote disabling of save based on isDirty_alias, validationFailed, isLoading_alias, isReloading_alias, isSaving_alias.
   *
   * @property disableSave
   * @type Boolean
   */
  disableSave : Ember.computed.or("isNotDirty", "validationFailed", "isLoading_alias", "isReloading_alias", "isSaving_alias"),
});

var allowedModelAttrs = [{
  /**
   * Array of primary keys for the model. The values of these keys will be joined with '__' and will be assigned to 'id'.
   *
   * @property keys
   * @type Array
   * @static
   */
  attr : "keys",
  defaultValue : "emptyArray",
}, {
  /**
   * API end point on server for transactions for this model.
   *
   * @property apiName
   * @type String
   * @default "data/generic"
   * @static
   */
  attr : "apiName",
  defaultValue : "value",
  value : "data/generic",
}, {
  /**
   * Keys needed to make delete calls. These values will be taken from either the record or 'CrudAdapter.GlobalData'
   *
   * @property queryParams
   * @type Array
   * @static
   */
  attr : "queryParams", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys needed to make find calls. These values will be taken from either the record or 'CrudAdapter.GlobalData'
   *
   * @property findParams
   * @type Array
   * @static
   */
  attr : "findParams", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys for extra attributes to be passed along with record attrs during create/update call. These values will be taken from either the record or 'CrudAdapter.GlobalData'
   *
   * @property extraAttrs
   * @type Array
   * @static
   */
  attr : "extraAttrs", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys from record to be deleted when making create/update call.
   *
   * @property ignoreFieldsOnCreateUpdate
   * @type Array
   * @static
   */
  attr : "ignoreFieldsOnCreateUpdate", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys from backup data to be deleted when data is recieved from server after a create/update call.
   *
   * @property ignoreFieldsOnRetrieveBackup
   * @type Array
   * @static
   */
  attr : "ignoreFieldsOnRetrieveBackup", 
  defaultValue : "emptyArray",
}, {
  /**
   * Keys from record data to be deleted when data is being backed up during a find call.
   *
   * @property removeAttrsFromBackupOnFind
   * @type Array
   * @static
   */
  attr : "removeAttrsFromBackupOnFind", 
  defaultValue : "emptyArray",
}, {
  /**
   * Retain id when backing up data.
   *
   * @property retainId
   * @type Boolean
   * @default false
   * @static
   */
  attr : "retainId", 
  defaultValue : "value",
  value : false,
}, {
  /**
   * Use id from record while backing up (default is to use "new" when creating record and id when updating). Used when records are child records and are not saved directly, in which case the child records must have an id and should be used when backing up.
   *
   * @property useIdForBackup
   * @type Boolean
   * @default false
   * @static
   */
  attr : "useIdForBackup", 
  defaultValue : "value",
  value : false,
}, {
  /**
   * Attribute that will be paginated. Applies during findNext calls.
   *
   * @property paginatedAttribute
   * @type String
   * @default "id"
   * @static
   */
  attr : "paginatedAttribute", 
  defaultValue : "value",
  value : "id",
}, {
  /**
   * Callback called when normalizing record.
   *
   * @property normalizeFunction
   * @type Function
   * @param {Object} [hash] JSON object of the data returned from server.
   * @static
   */
  attr : "normalizeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called before serializing child records.
   *
   * @property preSerializeRelations
   * @type Function
   * @param {Object} [data] JSON object of the data returned from server.
   * @static
   */
  attr : "preSerializeRelations", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called for serializing data being sent to server.
   *
   * @property serializeFunction
   * @type Function
   * @param {Class} [record] Record being sent to server.
   * @param {Object} [json] JSON object of the data to be sent to server.
   * @static
   */
  attr : "serializeFunction", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called after backing up data.
   *
   * @property backupData
   * @type Function
   * @param {Class} [record] Record being backed up.
   * @param {String|Class} [type] Record type.
   * @param {Object} [data] JSON object being backed up.
   * @static
   */
  attr : "backupData", 
  defaultValue : "value",
  value : function() {},
}, {
  /**
   * Callback called after retrieving backup data.
   *
   * @property retrieveBackup
   * @type Function
   * @param {Object} [hash] JSON object returned by server.
   * @param {String|Class} [type] Record type.
   * @param {Object} [data] JSON object stored in backup.
   * @static
   */
  attr : "retrieveBackup", 
  defaultValue : "value",
  value : function() {},
}];

/**
 * Function that returns an ember data model.
 *
 * @method createModelWrapper
 * @fro CrudAdapter
 * @param {Object} [object] JSON that are member attributes.
 * @param {Object} [config] JSON that are static attributes.
 * @param {Array} [mixins] Array of mixins to include.
 */
var createModelWrapper = function(object, config, mixins) {
  var args = mixins || [];
  args.push(object);
  var model = ModelWrapper.extend.apply(ModelWrapper, args);
  for(var i = 0; i < allowedModelAttrs.length; i++) {
    if(config[allowedModelAttrs[i].attr]) {
      model[allowedModelAttrs[i].attr] = config[allowedModelAttrs[i].attr];
    }
    else {
      if(allowedModelAttrs[i].defaultValue === "emptyArray") {
        model[allowedModelAttrs[i].attr] = Ember.A();
      }
      else if(allowedModelAttrs[i].defaultValue === "value") {
        model[allowedModelAttrs[i].attr] = allowedModelAttrs[i].value;
      }
    }
  }
  return model;
};

window.attr = DS.attr;
window.hasMany = DS.hasMany;
window.belongsTo = DS.belongsTo;

return {
  createModelWrapper : createModelWrapper,
};

});

define('crud-adapter/getId',[
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Method to get id from a record/object for a type.
 *
 * @method getId
 * @for CrudAdapter
 * @param {Instance|Object} record Record/Object to get id from.
 * @param {Class} type Model for the Record/Object.
 * @returns {String} Id of the record/object.
 */
var getId = function(record, type) {
  var id = record.id;
  if(!id) {
    var keys = type.keys || [], ids = [];
    for(var i = 0; i < keys.length; i++) {
      var attr = (record.get && record.get(keys[i])) || record[keys[i]];
      if(null !== attr || undefined !== attr) {
        ids.push(attr);
      }
      else {
        return null;
      }
    }
    return ids.join("__");
  }
  else {
    return id;
  }
};

return {
  getId : getId,
};

});

define('crud-adapter/backupData',[
  "ember",
  "ember_data",
  "./getId",
], function(Ember, DS, getId) {
getId = getId.getId;

/**
 * Method to backup data for a record if server doesnt return the full data.
 *
 * @method backupData
 * @for CrudAdaptor
 * @param {Instance} record
 * @param {Class} type Model class for the record.
 * @param {String} [operation] Operation when the backup was called.
 * @returns {Object} Backedup data.
 */
var backupDataMap = {};
var backupData = function(record, type, operation) {
  //TODO : make 'new' into a custom new tag extracted from 'type'
  var data = record.toJSON(), 
      backupId = operation === "create" ? "New" : getId(record, type);
      id = getId(record, type) || "New";
  if(type.useIdForBackup) backupId = id;
  backupDataMap[type.typeKey] = backupDataMap[type.typeKey] || {};
  backupDataMap[type.typeKey][backupId] = data;
  if(type.retainId) data.id = id;
  for(var i = 0; i < type.keys.length; i++) {
    if(Ember.isEmpty(data[type.keys[i]])) delete data[type.keys[i]];
  }
  type.eachRelationship(function(name, relationship) {
    var a = record.get(relationship.key);
    if(a) {
      if(relationship.kind == 'hasMany') {
        this.data[relationship.key] = [];
        a.forEach(function(item) {
          this.data[relationship.key].push(backupData(item, relationship.type, operation));
        }, this);
      }
      else if(relationship.kind === "belongsTo") {
        a = a.content;
        this.data[relationship.key] = a ? a.get("id") || a : a;
      }
    }
  }, {data : data, record : record, operation : operation});
  if(type.backupData) {
    type.backupData(record, type, data);
  }
  if(operation === "find") {
    for(var i = 0; i < type.removeAttrsFromBackupOnFind.length; i++) {
      delete data[type.removeAttrsFromBackupOnFind[i]];
    }
  }
  return data;
};

return {
  backupData : backupData,
  backupDataMap : backupDataMap,
};

});

define('crud-adapter/applicationAdapter',[
  "ember",
  "ember_data",
  "./getId",
  "./backupData",
], function(Ember, DS, getId, backupData) {
getId = getId.getId;
var backupDataMap = backupData.backupDataMap;
backupData = backupData.backupData;

var GlobalData = Ember.Object.create();
var endPoint = {
  find : "get",
};
/**
 * ApplicationAdapter for CRUD adapter. Not used direcrlty.
 *
 * @class ApplicationAdapter
 * @for CrudAdapter
 */
var ApplicationAdapter = DS.RESTAdapter.extend({
  getQueryParams : function(type, query, record, inBody) {
    var extraParams = {};
    //delete generated field
    if(!type.retainId) delete query.id;
    if(inBody) {
      //only sent for create / update
      for(var i = 0; i < type.ignoreFieldsOnCreateUpdate.length; i++) {
        delete query[type.ignoreFieldsOnCreateUpdate[i]];
      }
      for(var i = 0; i < type.extraAttrs.length; i++) {
        extraParams[type.extraAttrs[i]] = record.get(type.extraAttrs[i]) || GlobalData.get(type.extraAttrs[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.extraAttrs[i]] == 'all') delete query[type.extraAttrs[i]];
      }
      Ember.merge(query, extraParams);
      //return "data="+JSON.stringify(query);
      return query;
    }
    else {
      for(var i = 0; i < type.queryParams.length; i++) {
        extraParams[type.queryParams[i]] = record.get(type.queryParams[i]) || GlobalData.get(type.queryParams[i]);
        //find a better way to handle this (primary key shudnt be sent during create request)
        if(query[type.queryParams[i]] == 'all') delete query[type.queryParams[i]];
      }
      Ember.merge(query, extraParams);
    }
    return query;
  },

  buildFindQuery : function(type, id, query) {
    var keys = type.keys || [], ids = id.split("__");
    for(var i = 0; i < keys.length; i++) {
      query[keys[i]] = (ids.length > i ? ids[i] : "");
    }
    for(var i = 0; i < type.findParams.length; i++) {
      query[type.findParams[i]] = GlobalData.get(type.findParams[i]);
    }
    return query;
  },

  buildURL : function(type, id) {
    var ty = (Ember.typeOf(type) == 'string' ? type : type.apiName || type.typeKey), url = '/' + ty;
    return url;
  },

  createRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    backupData(record, type, "create");
    return this.ajax(this.buildURL(type)+"/create", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  find : function(store, type, id) {
    return this.ajax(this.buildURL(type, id)+"/"+endPoint.find, 'GET', { data : this.buildFindQuery(type, id, {}) });
  },

  findAll : function(store, type) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET');
  },

  findQuery : function(store, type, query) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET', { data : query });
  },

  _findNext : function(store, type, query, id, queryType) {
    var adapter = store.adapterFor(type),
        serializer = store.serializerFor(type),
        label = "DS: Handle Adapter#find of " + type.typeKey;

    return $.ajax({
      url : adapter.buildURL(type)+"/"+queryType,
      method : 'GET', 
      data : { id : id, cur : Ember.get("CrudAdapter.GlobalData.cursor."+id) },
      dataType : "json",
    }).then(function(adapterPayload) {
      Ember.assert("You made a request for a " + type.typeKey + " with id " + id + ", but the adapter's response did not have any data", adapterPayload);
      var payload = serializer.extract(store, type, adapterPayload, id, "findNext");

      return store.push(type, payload);
    }, function(error) {
      var record = store.getById(type, id);
      record.notFound();
      throw error;
    }, "DS: Extract payload of '" + type + "'");
  },

  findNextFull : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    backupData(record, type);
    return this._findNext(record.store, type, query, getId(record, type), "getFullNext");
  },

  findNext : function(record, type, query) {
    type = (Ember.typeOf(type) === "string" ? record.store.modelFor(type) : type);
    backupData(record, type);
    return this._findNext(record.store, type, query, getId(record, type), "getNext");
  },

  updateRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    backupData(record, type);
    return this.ajax(this.buildURL(type)+"/update", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  deleteRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true }), query = {};
    return this.ajax(this.buildURL(type)+"/delete", 'GET', { data : this.getQueryParams(type, query, record) });
  },
});

return {
  ApplicationAdapter : ApplicationAdapter,
  GlobalData : GlobalData,
  endPoint : endPoint,
};

});

define('crud-adapter/retrieveBackup',[
  "ember",
  "ember_data",
  "./backupData",
  "./getId",
], function(Ember, DS, BackupData, getId) {
getId = getId.getId;

/**
 * Method to retrieve backed up data for a record when server doesnt return the full data.
 *
 * @method retrieveBackup
 * @for CrudAdaptor
 * @param {Object} hash Data returned by server.
 * @param {Class} type Model class for the record.
 * @param {Boolean} [hasId] Boolean to denote that the record has id.
 * @returns {Object} Retrieved data.
 */
var retrieveBackup = function(hash, type, hasId) {
  var backupId = hasId ? getId(hash, type) : "New",
      id = getId(hash, type) || "New";
  if(type.useIdForBackup) backupId = id;
  if(BackupData.backupDataMap[type.typeKey] && BackupData.backupDataMap[type.typeKey][backupId]) {
    var data = BackupData.backupDataMap[type.typeKey][backupId];
    delete BackupData.backupDataMap[type.typeKey][backupId];
    for(var i = 0; i < type.ignoreFieldsOnRetrieveBackup.length; i++) {
      delete data[type.ignoreFieldsOnRetrieveBackup[i]];
    }
    hash = Utils.merge(hash, data);
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var da = this.data[relationship.key], ha = this.hash[relationship.key];
        if(da) {
          for(var i = 0; i < da.length; i++) {
            var ele = ha.findBy(relationship.type.keys[0], da[i][relationship.type.keys[0]]);
            da[i].id = getId(da[i], relationship.type);
            if(ele) Ember.merge(ele, da[i]);
            else ha.push(da[i]);
          }
        }
      }
    }, {data : data, hash : hash});
  }
  if(type.retrieveBackup) {
    type.retrieveBackup(hash, type, data);
  }
  return hash;
};

return {
  retrieveBackup : retrieveBackup,
};

});

define('crud-adapter/applicationSerializer',[
  "ember",
  "ember_data",
  "./getId",
  "./backupData",
  "./retrieveBackup",
], function(Ember, DS, getId, backupData, retrieveBackup) {
getId = getId.getId;
var backupDataMap = backupData.backupDataMap;
backupData = backupData.backupData;
retrieveBackup = retrieveBackup.retrieveBackup;

var ModelMap = {};

/**
 * ApplicationSerializer for CRUD serializer. Not used directly.
 *
 * @class ApplicationSerializer
 * @for CrudAdapter
 */
var ApplicationSerializer = DS.RESTSerializer.extend({
  serializeRelations : function(type, payload, data, parent) {
    type.preSerializeRelations(data);
    type.eachRelationship(function(name, relationship) {
      var plural = Ember.String.pluralize(relationship.type.typeKey);
      this.payload[plural] = this.payload[plural] || [];
      if(this.data[relationship.key]) {
        if(relationship.kind === "hasMany") {
          for(var i = 0; i < this.data[relationship.key].length; i++) {
            var childData = this.data[relationship.key][i], childModel, childType;
            if(relationship.options.polymorphic) {
              childType = ModelMap[relationship.type.typeKey][this.data[relationship.key][i].type];
            }
            else {
              childType = (ModelMap[relationship.type.typeKey] && ModelMap[relationship.type.typeKey][data.type]) || relationship.type.typeKey;
            }
            childModel = this.serializer.store.modelFor(childType);
            this.serializer.serializeRelations(childModel, payload, childData, this.data);
            childData = this.serializer.normalize(childModel, childData, childType);
            this.payload[plural].push(childData);
            if(relationship.options.polymorphic) {
              this.serializer.store.push(childType, childData);
              this.data[relationship.key][i] = {
                id : childData.id,
                type : childType,
              };
            }
            else {
              this.serializer.store.push(childType, childData);
              this.data[relationship.key][i] = childData.id;
            }
          }
        }
      }
      else if(relationship.kind === "belongsTo" && parent) {
        if(relationship.options.polymorphic) {
        }
        else {
          this.data[relationship.key] = getId(parent, relationship.type);
        }
      }
    }, {payload : payload, data : data, serializer : this});
  },

  extractSingle : function(store, type, payload, id, requestType) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");
    if(Ember.typeOf(payload.result.data) == 'array') payload.result.data = payload.result.data[0];

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[type.typeKey] = payload.result.data || {};
    retrieveBackup(payload[type.typeKey], type, requestType !== 'createRecord');
    this.normalize(type, payload[type.typeKey], type.typeKey);
    this.serializeRelations(type, payload, payload[type.typeKey]);
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractArray : function(store, type, payload, id, requestType) {
    var plural = Ember.String.pluralize(type.typeKey);
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[plural] = payload.result.data || [];
    for(var i = 0; i < payload[plural].length; i++) {
      this.normalize(type, payload[plural][i], type.typeKey);
      retrieveBackup(payload[plural][i], type, requestType !== 'createRecord');
      this.serializeRelations(type, payload, payload[plural][i]);
    }
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractFindNext : function(store, type, payload) {
    var id = getId(payload.result.data, type);
    payload.result.data[type.paginatedAttribute].replace(0, 0, backupDataMap[type.typeKey][id][type.paginatedAttribute]);
    delete backupDataMap[type.typeKey][id];
    return this.extractSingle(store, type, payload);
  },

  extractDeleteRecord : function(store, type, payload) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    return null;
  },

  extractCreateRecord : function(store, type, payload) {
    return this.extractSingle(store, type, payload, null, "createRecord");
  },

  extractFindHasMany : function(store, type, payload) {
    return this._super(store, type, payload);
  },

  extract : function(store, type, payload, id, requestType) {
    return this._super(store, type, payload, id, requestType);
  },

  normalize : function(type, hash, prop) {
    //generate id property for ember data
    hash.id = getId(hash, type);
    this.normalizeAttributes(type, hash);
    this.normalizeRelationships(type, hash);

    this.normalizeUsingDeclaredMapping(type, hash);

    if(type.normalizeFunction) {
      type.normalizeFunction(hash);
    }

    return hash;
  },

  serialize : function(record, options) {
    var json = this._super(record, options), type = record.__proto__.constructor;

    if(type.serializeFunction) {
      type.serializeFunction(record, json);
    }

    return json;
  },

  serializeHasMany : function(record, json, relationship) {
    var key = relationship.key;

    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    json[key] = record.get(key);
    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      json[key] = json[key].mapBy('id');
    }
    else if (relationshipType === 'manyToOne') {
      json[key] = json[key].map(function(r) {
        return this.serialize(r, {});
      }, this);
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    //do nothing!
  },

  typeForRoot : function(root) {
    if(/data$/.test(root)) {
      return root;
    }
    return Ember.String.singularize(root);
  }
});

return {
  ApplicationSerializer : ApplicationSerializer,
  ModelMap : ModelMap,
};

});

define('crud-adapter/createRecordWrapper',[
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Wrapper to create record.
 *
 * @method createRecordWrapper
 * @for CrudAdapter
 * @param {Instance} store
 * @param {Class|String} type
 * @param {Object} data
 */
var createRecordWrapper = function(store, type, data) {
  if(data.id && store.recordIsLoaded(type, data.id)) {
    var record = store.recordForId(type, data.id);
    record.unloadRecord();
  }
  return store.createRecord(type, data);
};

return {
  createRecordWrapper : createRecordWrapper,
};

});

define('crud-adapter/saveRecord',[
  "ember",
  "ember_data",
], function(Ember, DS) {

var isDirty = function(record) {
  //isDirty_alias is populated by ROSUI.AggregateFromChildren mixin with child records' isDirty
  return record.get("isDirty") || record.get("isDirty_alias");
};

var validationFailed = function(record) {
  //created a wrapper to do other stuff if needed
  return record.get("validationFailed");
};

/**
 * Wrapper to save record.
 *
 * @method saveRecord
 * @for CrudAdapter
 * @param {Instance} record
 * @param {Class|String} type Model class of the record
 */
var saveRecord = function(record, type) {
  var promise;
  //Ember.run(function() {
    promise = new Ember.RSVP.Promise(function(resolve, reject) {
      if(!record.get("isDeleted")) {
        record.eachAttribute(function(attr) {
          var val = this.get(attr);
          if(Ember.typeOf(val) === "string") {
            val = val.replace(/^\s*/, "");
            val = val.replace(/\s*$/, "");
            this.set(attr, val);
          }
        }, record);
      }
      var isNew = record.get("isNew");
      new Ember.RSVP.Promise(function(resolvei, rejecti) {
        record.save().then(function(data) {
          resolvei(data);
        }, function(message) {
          //Accessing the ember-data internal state machine directly. Might change with change in the ember-data version
          rejecti(message.message || message.statusText || message);
        });
      }).then(function(data) {
        resolve(data);
        if(!record.get("isDeleted")) {
          record.eachRelationship(function(name, relationship) {
            if(relationship.kind === "hasMany") {
              var hasManyArray = record.get(relationship.key);
              hasManyArray.then(function() {
                var map = {};
                for(var i = 0; i < hasManyArray.get("length");) {
                  var item = hasManyArray.objectAt(i), emberId = Utils.getEmberId(item);
                  if(map[emberId]) {
                    hasManyArray.removeAt(i);
                  }
                  else if(item.get("isNew")) {
                    hasManyArray.removeAt(i);
                    item.unloadRecord();
                  }
                  else {
                    map[emberId] = 1;
                    i++;
                  }
                }
              });
            }
          }, record);
          var model = record.__proto__.constructor;
          if(model.attrsByServer) {
            /* attrs returned by server are not updated on the model for some reason */
            for(var i = 0; i < model.attrsByServer.length; i++) {
              record.set(model.attrsByServer[i], record._data[model.attrsByServer[i]]);
            }
            record.adapterDidCommit();
          }
        }
      }, function(message) {
        reject(message.message || message.statusText || message);
      });
    });
  //});
  return promise;
};

return {
  saveRecord : saveRecord,
};

});

define('crud-adapter/retrieveFailure',[
  "ember",
  "ember_data",
  "lib/ember-utils-core",
  "./backupData",
  "./createRecordWrapper",
  "./getId",
], function(Ember, DS, Utils, BackupData, createRecordWrapper, getId) {
createRecordWrapper = createRecordWrapper.createRecordWrapper;
getId = getId.getId;

/**
 * Method to retrieve record from failure.
 *
 * @method retrieveFailure
 * @for CrudAdapter
 * @param {Instance} record
 */
var retrieveFailure = function(record) {
  var type = record.__proto__.constructor,
      backupId = record.get("isNew") ? "New" : record.get("id"),
      id = record.get("id") || "New";
  if(record.get("isDeleted")) {
    record.transitionTo('loaded.updated.uncommitted');
  }
  else {
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
  if(BackupData.backupDataMap[type.typeKey] && BackupData.backupDataMap[type.typeKey][backupId]) {
    var data = BackupData.backupDataMap[type.typeKey][backupId],
        attrs = record._inFlightAttributes;
    if(Utils.hashHasKeys(record._attributes)) {
      Utils.merge(attrs, record._attributes); 
    }
    delete BackupData.backupDataMap[type.typeKey][backupId];
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, attrs[f]);
    }
    type.eachRelationship(function(name, relationship) {
      if(relationship.kind === "hasMany") {
        var arr = this.record.get(relationship.key), darr = this.data[relationship.key];
        if(darr) {
          for(var i = 0; i < darr.length; i++) {
            var rid = getId(darr[i], relationship.type), rrec = this.record.store.getById(relationship.type, rid) || arr.objectAt(i);
            if(rrec) {
              retrieveFailure(rrec);
              if(this.record.addToProp) {
                this.record.addToProp(relationship.key, rrec);
              }
              else {
                arr.pushObject(rrec);
              }
            }
            else if(BackupData.backupDataMap[relationship.type.typeKey] && BackupData.backupDataMap[relationship.type.typeKey][rid]) {
              var crdata = BackupData.backupDataMap[relationship.type.typeKey][rid], parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete crdata[parentKey];
              }
              if(!rrec) {
                this.record.addToProp(relationship.key, createRecordWrapper(this.record.store, relationship.type, crdata));
              }
              delete BackupData.backupDataMap[relationship.type.typeKey][rid];
            }
            else {
              var parentKey;
              relationship.type.eachRelationship(function(name, relationship) {
                if(relationship.kind === "belongsTo") {
                  parentKey = name;
                }
              });
              if(parentKey) {
                delete darr[i][parentKey];
              }
              this.record.addToProp(relationship.key, createRecordWrapper(this.record.store, relationship.type, darr[i]));
            }
          }
        }
      }
    }, {record : record, data : data});
  }
};

return {
  retrieveFailure : retrieveFailure,
};

});

define('crud-adapter/forceReload',[
  "ember",
  "ember_data",
  "./backupData",
], function(Ember, DS, backupData) {
backupData = backupData.backupData;

/**
 * Method to reload a record.
 *
 * @method forceReload
 * @for CrudAdapter
 * @param {Instance} store Store to reload from.
 * @param {Class} type Type of the record to reload.
 * @param {String} id Id of the record to reload.
 * @returns {Instance} Reloaded record.
 */
var forceReload = function(store, type, id) {
  if(store.recordIsLoaded(type, id)) {
    var record = store.recordForId(type, id);
    backupData(record, record.__proto__.constructor, "find");
    return record.reload();
  }
  else {
    return store.find(type, id);
  }
};

return {
  forceReload : forceReload,
};

});

define('crud-adapter/rollbackRecord',[
  "ember",
  "ember_data",
], function(Ember, DS) {

/**
 * Wrapper method to rollback a record.
 *
 * @method rollbackRecord
 * @for CrudAdapter
 * @param {Instance} record
 */
var rollbackRecord = function(record) {
  if(record.get("isError") || record.get("isInvalid") || record.get("isSaving")) {
    var attrs = record._inFlightAttributes, data = record._data;
    record._inFlightAttributes = {};
    for(var f in attrs) {
      record.set(f, data[f]);
    }
    if(record.get("isNew")) {
      record.transitionTo('loaded.created.uncommitted');
    }
    else {
      record.transitionTo('loaded.updated.uncommitted');
    }
  }
  else {
    record.rollback();
  }
  record.__proto__.constructor.eachRelationship(function(name, relationship) {
    if(relationship.kind === "hasMany") {
      var rarr = record.get(relationship.key);
      rarr.then(function() {
        rarr.forEach(function(rec) {
          rollbackRecord(rec);
        });
      });
    }
  });
};

return {
  rollbackRecord : rollbackRecord,
};

});

/**
 * Wrapper module around ember data.
 *
 * @module crud-adapter
 */
define('crud-adapter/main',[
  "./model-wrapper",
  "./getId",
  "./applicationAdapter",
  "./applicationSerializer",
  "./createRecordWrapper",
  "./saveRecord",
  "./backupData",
  "./retrieveBackup",
  "./retrieveFailure",
  "./forceReload",
  "./rollbackRecord",
], function() {
  /**
   * Global class for crud-adapter.
   *
   * @class CrudAdapter
   */
  var CrudAdapter = Ember.Namespace.create();
  window.CrudAdapter = CrudAdapter;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        CrudAdapter[k] = arguments[i][k];
      }
    }
  }

  CrudAdapter.loadAdaptor = function(app) {
    app.ApplicationAdapter = CrudAdapter.ApplicationAdapter;
    app.ApplicationSerializer = CrudAdapter.ApplicationSerializer;
  };

  return CrudAdapter;
});

define('drag-drop/drag-drop-globals',[
], function() {

//temp solution for chrome's buggy event.dataTransfer, v31.x.x
return {
  VIEW_ID : "",
  MOVE_THRESHOLD : 2,
};

});

define('drag-drop/draggableMixin',[
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
], function(Ember, Utils, DragDropGlobals) {

/**
 * A draggable mixin when included enables the view to be dragged.
 *
 * @class DragDrop.DraggableMixin
 */
var DraggableMixin = Ember.Mixin.create({
  classNames : ['dragdrop-draggable'],

  attributeBindings : 'draggable',
  draggable : 'true',
  move : true,
  dragStart : function(event) {
    var dataTransfer = event.originalEvent.dataTransfer, viewid = this.get("elementId");
    dataTransfer.setData('ViewId', viewid);
    dataTransfer.dropEffect = 'move';
    DragDropGlobals.VIEW_ID = viewid;
    if(this.get("move")) {
      var ele = this.get("element");
      this.set("mouseOffset", { left : Utils.getOffset(ele, "Left") - event.originalEvent.x, top : Utils.getOffset(ele, "Top") - event.originalEvent.y });
    }
    this.dragStartCallback(event);
    event.stopPropagation();
  },

  /**
   * A callback method that is called when a drag starts.
   *
   * @method dragStartCallback
   * @param {Object} event The event object of the dragStart event.
   */
  dragStartCallback : function(event) {
  },

  /**
   * Targets that are allowed to be dropped on. Can be a selector or an array of selectors.
   *
   * @property allowedDropTargets
   * @type String|Array
   * @default '.dragdrop-droppable'
   */
  allowedDropTargets : '.dragdrop-droppable',
});

return {
  DraggableMixin : DraggableMixin,
};

});

define('drag-drop/droppableMixin',[
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
], function(Ember, Utils, DragDropGlobals) {

/**
 * A droppable mixin when included enables the view to be dropped on.
 *
 * @class DragDrop.DroppableMixin
 */
var DroppableMixin = Ember.Mixin.create({
  classNames : ['dragdrop-droppable'],

  selectorsPass : function(ele, selectors) {
    if(Ember.typeOf(selectors)  !== 'array') {
      selectors = [selectors];
    }
    for(var i = 0; i < selectors.length; i++) {
      if(!Ember.isEmpty(ele.filter(selectors[i]))) {
        return true;
      }
    }
    return false;
  },
  canInteract : function(dragView, dragEle, dropView, dropEle) {
    return this.selectorsPass(dropEle, dragView.get("allowedDropTargets")) && this.selectorsPass(dragEle, dropView.get("acceptDropFrom"));
  },

  dragEnter: function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragEnterCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  dragOver : function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragOverCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  dragLeave : function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      this.dragLeaveCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },
  drop: function(event) {
    var dragView = Ember.View.views[DragDropGlobals.VIEW_ID], dragEle = dragView && $(dragView.get("element")),
        dropView = this, dropEle = $(event.target);
    if(dragView && this.canInteract(dragView, dragEle, dropView, dropEle)) {
      if(dragView.get("move")) {
        var mouseOffset = dragView.get("mouseOffset");
        dragEle.offset({ left : mouseOffset.left + event.originalEvent.x, top : mouseOffset.top + event.originalEvent.y });
      }
      this.dropCallback(event, dragView, dragEle, dropView, dropEle);
    }
    event.preventDefault();
  },

  /**
   * A callback method that is called when the view being dragged enters this view.
   *
   * @method dragEnterCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragEnterCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged is over this view.
   *
   * @method dragOverCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged leaves this view.
   *
   * @method dragLeaveCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dragLeaveCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * A callback method that is called when the view being dragged is dropped on this view.
   *
   * @method dropCallback
   * @param {Object} event The event object of the dragStart event.
   * @param {Class} dragView The view being dragged.
   * @param {Class} dragEle The element being dragged.
   * @param {Class} dropView The view being dropped on.
   * @param {Class} dropEle The element being dropped on.
   */
  dropCallback : function(event, dragView, dragEle, dropView, dropEle) {
  },

  /**
   * Accept drops from elements passing the selectors. Can be a single selectors or an array of it.
   *
   * @property acceptDropFrom
   * @type String|Array
   * @default '.dragdrop-draggable'
   */
  acceptDropFrom : '.dragdrop-draggable',
});

return {
  DroppableMixin : DroppableMixin,
};

});

define('drag-drop/sortableDraggableMixin',[
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
  "./draggableMixin",
  "./droppableMixin",
], function(Ember, Utils, DragDropGlobals, DraggableMixin, DroppableMixin) {

/**
 * Draggable mixin for the sortable component.
 *
 * @class DragDrop.SortableDraggableMixin
 */
var SortableDraggableMixin = Ember.Mixin.create(DraggableMixin.DraggableMixin, DroppableMixin.DroppableMixin, {
  init : function() {
    this._super();
    this.set("lastXY", [0, 0]);
  },
  classNames : ['dragdrop-sortable-element'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortableDragableClassNames'),
  sortEleId : function() {
    return this.get("record."+this.get("columnDataGroup.sort.sortEleIdColumnData.key"));
  }.property("view.columnData.key"),
  sortableView : null,
  groupId : 0,
  hasElements : false,
  curGrpId : function() {
    return this.get("groupId");
  }.property('view.groupId', 'view.columnDataGroup.sort.sameLevel'),
  stateData : null,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  isPlaceholder : false,
  move : false,
  calcAppendPosition : function(xy) {
    var lxy = this.get("lastXY"),
        dx = xy[0] - lxy[0], adx = Math.abs(dx),
        dy = xy[1] - lxy[1], ady = Math.abs(dy),
        rd = dx, ard = adx;
    if(ady > adx) {
      rd = dy;
      ard = ady;
    }
    if(ard > DragDropGlobals.MOVE_THRESHOLD) {
      if(rd < 0) {
        this.set("appendNext", false);
      }
      else {
        this.set("appendNext", true);
      }
      this.set("lastXY", xy);
      this.set("change", true);
    }
    else {
      this.set("change", false);
    }
  },
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
    if(dropView.get("sortableView") && dragView.get("sortableView")) {
      var
      columnDataGroup = this.get("columnDataGroup"),
      sortEleIdKey = columnDataGroup.get("sort.sortEleIdColumnData.key"),

      //sortable container and it's element id of the element dropped on
      dropViewSort = dropView.get("sortableView"),
      dropViewSortId = dropViewSort.get("elementId"),
      //siblings of the element dropped on
      dropViewEles = dropViewSort.get("sortEleChildren"),
      //sort id of the element dropped on
      dropViewSortEleId = dropView.get("sortEleId"),
      //index of the element dropped on in the array of siblings
      dropViewIdx = dropViewEles.indexOf(dropViewEles.findBy( sortEleIdKey, dropViewSortEleId )),

      //sort id of the element dragged
      dragViewSortEleId = dragView.get("sortEleId"),
      //sortable container and it's element id of the element dragged
      dragViewSort = dragView.get("sortableView"),
      dragViewSortId = dragViewSort.get("elementId"),
      //siblings of the element dragged
      dragViewEles = dragViewSort.get("sortEleChildren"),
      //index of the element dragged in the array of siblings
      dragViewIdx = dragViewEles.indexOf(dragViewEles.findBy( sortEleIdKey, dragViewSortEleId )),
      dragViewData = dragViewEles[dragViewIdx];

      dragView.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
      if(dropViewSort.get("effH") === dragViewSort.get("effH")) {
        //allow sortable on views with same hierarchy

        if(dragView.get("change")) {
          //process only if there is a change in the mouse position

          if(dropViewSortId === dragViewSortId) {
            //if both eles are from the same sortable container (siblings)

            if(dropViewSortEleId !== dragViewSortEleId && dropViewIdx !== dragViewIdx) {
              //process only if the eles are not the same
              //return;

              if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
                //if there only 1 element and its a placeholder, remove it
                dropViewSort.removeAt(0);
              }

              //remove the dragged ele from its siblings array
              dropViewEles.removeAt(dragViewIdx);
              //remove the dragged ele's view from sortable container
              dropViewSort.removeAt(dragViewIdx);
              //if need to append after (calculated based on mouse position difference), increment dropViewIdx
              if(dragView.get("appendNext")) dropViewIdx++;
              //correct dropViewIdx to dropViewEles.length if needed
              if(dropViewIdx > dropViewEles.length) dropViewIdx = dropViewEles.length;
              else if(dropViewIdx === -1) dropViewIdx = 0;
              //insert the dragViewData to siblings array at the new index
              dropViewEles.insertAt(dropViewIdx, dragViewData);
              //insert the dragView to sortable container at the new index
              dropViewSort.insertAt(dropViewIdx, dragView);

              //reset the change boolean
              dragView.set("change", false);
              //stop propagation if it was processed
              event.stopPropagation();
            }
          }
          else {
            if(dropViewEles.indexOf(dragViewData) === -1 && !Utils.deepSearchArray(dragViewData, dropViewSortEleId, sortEleIdKey, columnDataGroup.get("sort.sortEleChildrenColumnData.key"))) {
              //process only if dropViewEles doesnt have dragViewData and dragViewData doesnt have dropViewSortEleId somewhere at a deeper level
              //this is to prevent a parent being dropped on its child
              //return;

              if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
                //if there only 1 element and its a placeholder, remove it
                dropViewSort.removeAt(0);
              }

              //remove the dragged ele from its siblings array
              dragViewEles.removeAt(dragViewIdx);
              //remove the dragged ele's view from sortable container
              dragViewSort.removeAt(dragViewIdx);
              //if need to append after (calculated based on mouse position difference), increment dropViewIdx
              if(dragView.get("appendNext")) dropViewIdx++;
              //correct dropViewIdx to dropViewEles.length if needed
              if(dropViewIdx > dropViewEles.length) dropViewIdx = dropViewEles.length;
              else if(dropViewIdx === -1) dropViewIdx = 0;
              //insert the dragViewData to siblings array at the new index
              dropViewEles.insertAt(dropViewIdx, dragViewData);
              //update the sortable container view of the drag ele to the drop's container
              dragView.set("sortableView", dropViewSort);
              //insert the dragView to sortable container at the new index
              dropViewSort.insertAt(dropViewIdx, dragView);
              if(dragViewSort.get("length") === 0) {
                //if the drag ele's sortable container is empty, leave a placeholder in it's place
                dragViewSort.pushObject(columnDataGroup.get("sort.placeholderClass").create({
                  sortableView : dragViewSort,
                  hierarchy : dragView.get("hierarchy"),
                  groupId : dragView.get("stateData.grpId"),
                  columnDataGroup : columnDataGroup,
                }));
              }

              //reset the change boolean
              dragView.set("change", false);
              //stop propagation if it was processed
              event.stopPropagation();
            }
          }
        }
      }
    }
  },
  change : false,
  appendNext : false,
  lastXY : null,
});

return {
  SortableDraggableMixin : SortableDraggableMixin,
};

});

define('drag-drop/sortableDroppableMixin',[
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
  "./droppableMixin",
  "../column-data/main",
], function(Ember, Utils, DragDropGlobals, DroppableMixin, ColumnData) {

/**
 * Droppable mixin for the sortable component.
 *
 * @class DragDrop.SortableDroppableMixin
 */
var SortableDroppableMixin = Ember.Mixin.create(DroppableMixin.DroppableMixin, {
  init : function() {
    this._super();
    this.set("stateData", this.get("stateData") || {grpId : 0});
    //console.log("new droppable create!");
    this.sortEleChildrenDidChange();
  },

  classNames : ['dragdrop-sortable-container'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortableDroppableClassNames'),

  sortEleChildren : function() {
    return this.get("record."+this.get("columnDataGroup.sort.sortEleChildrenColumnData.key"));
  }.property("view.columnDataGroup.sort.sortEleChildrenColumnData", "view.record"),
  sortEleChildrenDidChange : function() {
    var sortEleChildren = this.get("sortEleChildren"), columnDataGroup = this.get("columnDataGroup"),
        thisLen = this.get("length"), newLen = sortEleChildren.length,
        replaceLen = (newLen < thisLen ? newLen : thisLen),
        addNewLen = newLen - replaceLen,
        i = 0;
        stateData = this.get("stateData"),
        sortEleChildrenClassMap = columnDataGroup.get("sort.sortEleChildrenClassMap"),
        sortEleChildrenClassColumnData = columnDataGroup.get("sort.sortEleChildrenClassColumnData"),
        sortEleChildrenColumnGroupLookup = columnDataGroup.get("sort.sortEleChildrenColumnGroupLookup");
    for(; i < replaceLen; i++) {
      this.objectAt(i).setProperties({
        record : sortEleChildren[i],
        columnDataGroup : ColumnData.Registry.retrieve(sortEleChildren[i].get(sortEleChildrenColumnGroupLookup.get("key")), "columnDataGroup"),
        stateData : stateData,
        sortableView : this,
      });
    }
    for(; i < addNewLen; i++) {
      this.pushObject(sortEleChildrenClassMap[sortEleChildren[i].get(sortEleChildrenClassColumnData.get("key"))].create({
        record : sortEleChildren[i],
        columnDataGroup : ColumnData.Registry.retrieve(sortEleChildren[i].get(sortEleChildrenColumnGroupLookup.get("key")), "columnDataGroup"),
        stateData : stateData,
        sortableView : this,
      }));
    }
    if(sortEleChildren.length === 0) {
      this.pushObject(columnDataGroup.get("sort.placeholderClass").create({
        record : this.get("record"),
        columnDataGroup : columnDataGroup,
        stateData : stateData,
        sortableView : this,
      }));
    }
  }.observes("view.sortEleChildren"),

  elesIsEmpty : Ember.computed.empty('sortEleChildren.@each'),
  groupId : 0,
  hierarchy : "",
  stateData : null,
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  isPlaceholder : false,
});

return {
  SortableDroppableMixin : SortableDroppableMixin,
};

});

define('drag-drop/sortablePlaceholderMixin',[
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
  "./draggableMixin",
  "./droppableMixin",
], function(Ember, Utils, DragDropGlobals, DraggableMixin, DroppableMixin) {

/**
 * Placeholder mixin for empty sortable list.
 *
 * @class DragDrop.SortablePlaceholderMixin
 */
var SortablePlaceholderMixin = Ember.Mixin.create(DraggableMixin.DraggableMixin, DroppableMixin.DroppableMixin, {
  init : function() {
    this._super();
  },

  isPlaceholder : true,
  move : false,

  classNames : ['dragdrop-sortable-placeholder'],
  //classNameBindings : Ember.computed.alias('columnDataGroup.sort.sortablePlaceholderClassNames'),
  columnDataGroup : null,
  sortableView : null,
  groupId : 0,
  hierarchy : "",
  /* effective hierarchy */
  effH : function() {
    return this.get("hierarchy")+"_"+this.get("groupId");
  }.property('view.groupId', 'view.hierarchy'),
  dragOverCallback : function(event, dragView, dragEle, dropView, dropEle) {
    if(dropView.get("sortableView") && dragView.get("sortableView")) {
      var
      columnDataGroup = this.get("columnDataGroup"),

      //sortable container and it's element id of the element dropped on
      dropViewSort = dropView.get("sortableView"),
      dropViewSortId = dropViewSort.get("elementId"),
      //siblings of the element dropped on
      dropViewEles = dropViewSort.get("sortEleChildren"),
      //sort id of the element dropped on
      dropViewSortEleId = dropView.get("sortEleId"),
      //index of the element dropped on in the array of siblings
      dropViewIdx = dropViewEles.indexOf(dropViewEles.findBy( columnDataGroup.get("sort.sortEleIdColumnData.key"), dropViewSortEleId)),

      //sort id of the element dragged
      dragViewSortEleId = dragView.get("sortEleId"),
      //sortable container and it's element id of the element dragged
      dragViewSort = dragView.get("sortableView"),
      dragViewSortId = dragViewSort.get("elementId"),
      //siblings of the element dragged
      dragViewEles = dragViewSort.get("sortEleChildren"),
      //index of the element dragged in the array of siblings
      dragViewIdx = dragViewEles.indexOf(dragViewEles.findBy( columnDataGroup.get("sort.sortEleIdColumnData.key"), dragViewSortEleId)),
      dragViewData = dragViewEles[dragViewIdx];

      dragView.calcAppendPosition([event.originalEvent.x, event.originalEvent.y]);
      if(dropViewSort.get("effH") === dragViewSort.get("effH")) {
        //allow sortable on views with same hierarchy

        if(dragView.get("change")) {
          //process only if there is a change in the mouse position

          if(dropViewSort.get("length") == 1 && dropViewSort.objectAt(0).isPlaceholder) {
            //if there only 1 element and its a placeholder, remove it
            dropViewSort.removeAt(0);
          }

          //remove the dragged ele from its siblings array
          dragViewEles.removeAt(dragViewIdx);
          //remove the dragged ele's view from sortable container
          dragViewSort.removeAt(dragViewIdx);
          //insert the dragViewData to siblings array at the end
          dropViewEles.pushObject(dragViewData);
          //insert the dragView to sortable container at the end
          dropViewSort.pushObject(dragView);
          //update the sortable container view of the drag ele to the drop's container
          dragView.set("sortableView", dropViewSort);

          //reset the change boolean
          dragView.set("change", false);
          //stop propagation if it was processed
          event.stopPropagation();
        }
      }
    }
  },
});

return {
  SortablePlaceholderMixin : SortablePlaceholderMixin,
};

});

define('drag-drop/drag-drop-column-data-interface',[
  "ember",
  "lib/ember-utils-core",
  "./drag-drop-globals",
], function(Ember, Utils, DragDropGlobals) {

/***    Sortable ColumnData Interface    ***/

var SortableColumnDataGroup = Ember.Object.extend({
  sortableDragableClassNames : [],
  sortableDroppableClassNames : [],
  sortablePlaceholderClassNames : [],

  sortEleIdColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleId");
  }.property("parentObj.columns.@each.sort"),
  sortEleChildrenColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleChildren");
  }.property("parentObj.columns.@each.sort"),

  sortEleChildrenClassMap : function() {
    return Ember.get(this.get("sortEleChildrenClassMapName"));
  }.property("sortEleChildrenClassMapName"),
  sortEleChildrenClassMapName : null,
  sortEleChildrenClassColumnData : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleChildrenClass");
  }.property("parentObj.columns.@each.sort"),

  sortEleChildrenColumnGroupLookup : function() {
    return this.get("parentObj.columns").findBy("sort.moduleType", "sortEleChildrenColumnGroup");
  }.property("parentObj.columns.@each.sort"),

  placeholderClass : function() {
    return Ember.get(this.get("placeholderClassName"));
  }.property("placeholderClassName"),
  placeholderClassName : "",

  sameLevel : false,
});

var SortableEleIdColumnData = Ember.Object.extend({
});

var SortableEleChildrenColumnData = Ember.Object.extend({
});

var SortableEleChildrenClassColumnData = Ember.Object.extend({
});

var SortableEleChildrenColumnGroup = Ember.Object.extend({
});

var SortableColumnDataMap = {
  sortEleId                  : SortableEleIdColumnData,
  sortEleChildren            : SortableEleChildrenColumnData,
  sortEleChildrenClass       : SortableEleChildrenClassColumnData,
  sortEleChildrenColumnGroup : SortableEleChildrenColumnGroup,
};

return {
  SortableColumnDataGroup : SortableColumnDataGroup,
  SortableColumnDataMap : SortableColumnDataMap,
};

});

/**
 * A drag drop module for all operations related to drag and drop. Uses html5 drag drop feature.
 *
 * @module drag-drop
 */
define('drag-drop/main',[
  "./drag-drop-globals",
  "./draggableMixin",
  "./droppableMixin",
  "./sortableDraggableMixin",
  "./sortableDroppableMixin",
  "./sortablePlaceholderMixin",
  "./drag-drop-column-data-interface",
], function() {
  var DragDrop = Ember.Namespace.create();
  window.DragDrop = DragDrop;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        DragDrop[k] = arguments[i][k];
      }
    }
  }

  return DragDrop;
});

define('global-module/global-module-view/displayTextView',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
], function(Ember, Utils, ColumnData) {

/**
 * Module for a simple display of text.
 *
 * @class GlobalModules.DisplayTextView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  /**
   * Key for the configurations on columnData.
   *
   * @property columnDataKey
   * @type String
   */
  columnDataKey : '',

  //tagName : '',

  classNameBindings : ['moduleClassName'],
  moduleClassName : function() {
    var classNames = this.get("columnData."+this.get("columnDataKey")+".classNames") || [];
    if(classNames.join) {
      classNames = classNames.join(" ");
    }
    return classNames;
  }.property("view.columnData", "view.columnDataKey"),

  template : Ember.Handlebars.compile('' +
    '{{view.value}}' +
  ''),
});

return {
  DisplayTextView : DisplayTextView,
};

});

define('global-module/global-module-view/displayTextWithTooltipView',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "./displayTextView",
], function(Ember, Utils, ColumnData, DisplayTextView) {

/**
 * Module for a simple display of text with tooltip.
 *
 * @class GlobalModules.DisplayTextWithTooltipView
 * @extends GlobalModules.DisplayTextView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextWithTooltipView = DisplayTextView.DisplayTextView.extend({
  tooltip : function() {
    return this.get("columnData."+this.get("columnDataKey")+".tooltip") || this.get("record"+this.get("columnData."+this.get("columnDataKey")+".tooltipKey")) || "";
  }.property("view.columnData"),

  template : Ember.Handlebars.compile('' +
    '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
  ''),
});

return {
  DisplayTextWithTooltipView : DisplayTextWithTooltipView,
};

});

define('global-module/global-module-view/displayTextCollapsibleView',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "./displayTextWithTooltipView",
], function(Ember, Utils, ColumnData, DisplayTextWithTooltipView) {

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleView
 * @extends GlobalModules.DisplayTextWithTooltipView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextCollapsibleView = DisplayTextWithTooltipView.DisplayTextWithTooltipView.extend({
  groupId : null,
  groupIdHref : function() {
    return "#"+this.get("groupId");
  }.property('view.groupId'),
  collapseId : null,
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}{{view.value}}{{/tool-tip}}' +
    '</a>' +
  ''),
});

return {
  DisplayTextCollapsibleView : DisplayTextCollapsibleView,
};

});

define('global-module/global-module-view/displayTextCollapsibleGlypiconView',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "./displayTextCollapsibleView",
], function(Ember, Utils, ColumnData, DisplayTextCollapsibleView) {

/**
 * Module for a simple display of text with tooltip with connection to a collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconView
 * @extends GlobalModules.DisplayTextCollapsibleView
 * @module global-module
 * @submodule global-module-view
 */
var DisplayTextCollapsibleGlypiconView = DisplayTextCollapsibleView.DisplayTextCollapsibleView.extend({
  glyphiconCollapsed : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),
  glyphiconOpened : function() {
    return this.get("columnData."+this.get("columnDataKey")+".glyphiconCollapsed");
  }.property("view.columnData", "view.columnDataKey"),

  glyphicon : function() {
    return this.get( this.get("collapsed") ? "glyphiconCollapsed" : "glyphiconOpened" );
  }.property("view.collpased"),

  template : Ember.Handlebars.compile('' +
    '<a data-toggle="collapse" {{bind-attr data-parent="view.groupIdHref" href="view.collapseIdHref"}}>' +
      '{{#tool-tip title=view.tooltip}}<span {{bind-attr class=":glyphicon view.glyphicon"}}></span>{{/tool-tip}}' +
    '</a>' +
  ''),
});

return {
  DisplayTextCollapsibleGlypiconView : DisplayTextCollapsibleGlypiconView,
};

});

/**
 * Views for the global modules.
 *
 * @module global-module
 * @submodule global-module-view
 */
define('global-module/global-module-view/main',[
  "./displayTextView",
  "./displayTextWithTooltipView",
  "./displayTextCollapsibleView",
  "./displayTextCollapsibleGlypiconView",
], function() {
  var GlobalModulesView = Ember.Namespace.create();

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        GlobalModulesView[k] = arguments[i][k];
      }
    }
  }

  GlobalModulesView.GlobalModulesMap = {
    "displayText"                    : "globalModules/displayText",
    "displayTextWithTooltip"         : "globalModules/displayTextWithTooltip",
    "displayTextCollapsible"         : "globalModules/displayTextCollapsible",
    "displayTextCollapsibleGlypicon" : "globalModules/displayTextCollapsibleGlypicon",
  };

  return GlobalModulesView;
});

define('global-module/global-module-column-data/globalModuleColumnDataGroupMixin',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
], function(Ember, Utils, ColumnData, GlobalModulesView) {

/**
 * Column Data Group for global modules.
 *
 * @class GlobalModules.GlobalModuleColumnDataGroupMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var GlobalModuleColumnDataGroupMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var arrayProps = this.get("arrayProps");
    if(!arrayProps.contains("modules")) {
      arrayProps.pushObject("modules");
    }
  },

  /**
   * The type of base module.
   *
   * @property type
   * @type String
   */
  type : "base",

  /**
   * The view type of base module.
   *
   * @property viewType
   * @type String
   * @default "base"
   */
  viewType : "base",

  /**
   * Lookup map for the base module type to view's path.
   *
   * @property modules
   * @type Array
   */
  lookupMap : null,

  viewLookup : function() {
    return this.get("lookupMap")[this.get("viewType")];
  }.property("viewType", "lookupMap"),

  arrayProps : ['modules'],

  /**
   * Modules base module supports.
   *
   * @property modules
   * @type Array
   */
  modules : null,

  modulesWillBeDeleted : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.removeObserver(modules[i]+"Type", this, "moduleTypeDidChange");
    }
  },
  modulesWasAdded : function(modules, idxs) {
    for(var i = 0; i < modules.length; i++) {
      this.addObserver(modules[i]+"Type", this, "moduleTypeDidChange");
      this.moduleTypeDidChange(this, modules[i]+"Type");
    }
    this.columnsChanged();
  },

  moduleTypeDidChange : function(obj, moduleType) {
    var module = moduleType.match(/^(\w*)Type$/)[1];
    this.set(module+"Lookup", GlobalModulesView.GlobalModulesMap[this.get(moduleType) || "displayText"]);
  },

  columnsChanged : function() {
    var columns = this.get("parentObj.columns"), modules = this.get("modules");
    if(columns) {
      for(var i = 0; i < modules.length; i++) {
        this.set(modules[i]+"ColumnData", columns.findBy(this.get("type")+".moduleType", modules[i]));
      }
    }
  }.observes("parentObj.columns.@each"),
});

return {
  GlobalModuleColumnDataGroupMixin : GlobalModuleColumnDataGroupMixin,
};

});

define('global-module/global-module-column-data/displayTextColumnDataMixin',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
], function(Ember, Utils, ColumnData, GlobalModulesView) {

/**
 * Column Data for display text module.
 *
 * @class GlobalModules.DisplayTextColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextColumnDataMixin = Ember.Mixin.create({
  //viewType : "displayText",

  /**
   * Class names to use for the module.
   *
   * @property classNames
   * @type String
   */
  //classNames : [],

  /**
   * Tag name used by the module.
   *
   * @property tagName
   * @type String
   * @default "div"
   */
  //tagName : 'div',
});

return {
  DisplayTextColumnDataMixin : DisplayTextColumnDataMixin,
};

});

define('global-module/global-module-column-data/displayTextWithTooltipColumnDataMixin',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
  "./displayTextColumnDataMixin",
], function(Ember, Utils, ColumnData, GlobalModulesView, DisplayTextColumnDataMixin) {

/**
 * Column Data for display text with tooltip module.
 *
 * @class GlobalModules.DisplayTextWithTooltipColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextWithTooltipColumnDataMixin = Ember.Mixin.create(DisplayTextColumnDataMixin.DisplayTextColumnDataMixin, {
  //viewType : "displayTextWithTooltip",

  /**
   * Static tooltip for the module.
   *
   * @property tooltip
   * @type String
   */
  //tooltip : null,

  /**
   * Key to the value on the record for dynamic tooltip.
   *
   * @property tooltipKey
   * @type String
   */
  //tooltipKey : null,
});

return {
  DisplayTextWithTooltipColumnDataMixin : DisplayTextWithTooltipColumnDataMixin,
};

});

define('global-module/global-module-column-data/displayTextCollapsibleColumnDataMixin',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
  "./displayTextWithTooltipColumnDataMixin",
], function(Ember, Utils, ColumnData, GlobalModulesView, DisplayTextWithTooltipColumnDataMixin) {

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextCollapsibleColumnDataMixin = Ember.Mixin.create(DisplayTextWithTooltipColumnDataMixin.DisplayTextWithTooltipColumnDataMixin, {
  //viewType : "displayTextCollapsible",
});

return {
  DisplayTextCollapsibleColumnDataMixin : DisplayTextCollapsibleColumnDataMixin,
};

});

define('global-module/global-module-column-data/displayTextCollapsibleGlypiconColumnDataMixin',[
  "ember",
  "lib/ember-utils-core",
  "../../column-data/main",
  "../global-module-view/main",
  "./displayTextCollapsibleColumnDataMixin",
], function(Ember, Utils, ColumnData, GlobalModulesView, DisplayTextCollapsibleColumnDataMixin) {

/**
 * Column Data for display text collapsible module.
 *
 * @class GlobalModules.DisplayTextCollapsibleGlypiconColumnDataMixin
 * @module global-module
 * @submodule global-module-column-data
 */
var DisplayTextCollapsibleGlypiconColumnDataMixin = Ember.Mixin.create(DisplayTextCollapsibleColumnDataMixin.DisplayTextCollapsibleColumnDataMixin, {
  //viewType : "displayTextCollapsibleGlypicon",

  /**
   * Glypicon class when open.
   *
   * @property glyphiconOpened
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconOpened : "glyphicon-chevron-down",

  /**
   * Glypicon class when collapsed.
   *
   * @property glyphiconCollapsed
   * @type String
   * @default "glyphicon-chevron-down"
   */
  glyphiconCollapsed : "glyphicon-chevron-right",
});

return {
  DisplayTextCollapsibleGlypiconColumnDataMixin : DisplayTextCollapsibleGlypiconColumnDataMixin,
};

});

/**
 * Views for the global modules.
 *
 * @module global-module
 * @submodule global-module-column-data
 */
define('global-module/global-module-column-data/main',[
  "./globalModuleColumnDataGroupMixin",
  "./displayTextColumnDataMixin",
  "./displayTextWithTooltipColumnDataMixin",
  "./displayTextCollapsibleColumnDataMixin",
  "./displayTextCollapsibleGlypiconColumnDataMixin",
], function() {
  var GlobalModulesColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        GlobalModulesColumnData[k] = arguments[i][k];
      }
    }
  }

  GlobalModulesColumnData.GlobalModulesColumnDataMixinMap = {
    "displayText"                    : GlobalModulesColumnData.DisplayTextColumnDataMixin,
    "displayTextWithTooltip"         : GlobalModulesColumnData.DisplayTextWithTooltipColumnDataMixin,
    "displayTextCollapsible"         : GlobalModulesColumnData.DisplayTextCollapsibleColumnDataMixin,
    "displayTextCollapsibleGlypicon" : GlobalModulesColumnData.DisplayTextCollapsibleGlypiconColumnDataMixin,
  };

  return GlobalModulesColumnData;
});

/**
 * Global modules for certain tasks like displaying an attribute from the record.
 *
 * @module global-module
 */
define('global-module/main',[
  "./global-module-column-data/main",
  "./global-module-view/main",
], function() {
  var GlobalModules = Ember.Namespace.create();
  window.GlobalModules = GlobalModules;

  //start after DS
  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        GlobalModules[k] = arguments[i][k];
      }
    }
  }

  return GlobalModules;
});

define('list-group/listGroupView',[
  "ember",
], function(Ember) {

/**
 * A view for a list of records.
 *
 * @class ListGroup.ListGroupView
 */
var ListGroupView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property list
   * @type Array
   */
  list : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['list-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.list}}' +
        '{{view thatView.columnDataGroup.list.viewLookup record=this columnDataGroup=thatView.columnDataGroup}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

return {
  ListGroupView : ListGroupView,
};

});

define('list-group/list-item/listItemView',[
  "ember",
], function(Ember) {

/**
 * Basic list item view.
 *
 * @class ListGroup.ListItemView
 * @module list-group
 * @submodule list-item
 */
var ListItemView = Ember.View.extend({
  /**
   * The record that holds all the data.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['list-group-item'],

  template : Ember.Handlebars.compile('' +
    '<h4 class="list-group-item-heading group-item-heading">' +
      '{{view view.columnDataGroup.list.titleLookup record=view.record columnData=view.columnDataGroup.list.titleColumnData ' +
                                                   'tagName=view.columnDataGroup.list.titleColumnData.list.tagName columnDataKey="list"}}' +
      '{{view view.columnDataGroup.list.rightBlockLookup record=view.record columnData=view.columnDataGroup.list.rightBlockColumnData ' +
                                                        'tagName=view.columnDataGroup.list.rightBlockColumnData.list.tagName columnDataKey="list"}}' +
    '</h4>' +
    '{{view view.columnDataGroup.list.descLookup record=view.record columnData=view.columnDataGroup.list.descColumnData ' +
                                                'tagName=view.columnDataGroup.list.descColumnData.list.tagName columnDataKey="list"}}' +
  ''),
});

return {
  ListItemView : ListItemView,
};

});

/**
 * Different list item views.
 *
 * @module list-group
 * @submodule list-item
 */
define('list-group/list-item/main',[
  "./listItemView",
], function() {
  var ListItem = {};

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ListItem[k] = arguments[i][k];
      }
    }
  }

  ListItem.NameToLookupMap = {
    "base" : "listGroup/listItem",
  };

  return ListItem;
});

define('list-group/list-column-data/listColumnDataGroup',[
  "ember",
  "../../global-module/main",
  "../list-item/main",
], function(Ember, GlobalModules, ListItem) {

/**
 * A column data group for the list group module.
 *
 * @class ListGroup.ListColumnDataGroup
 * @module list-group
 * @submodule list-column-data
 */
var ListColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "list",
  modules : ["title", "rightBlock", "desc"],
  lookupMap : ListItem.NameToLookupMap,

  /**
   * Type of title view.
   *
   * @property titleType
   * @type String
   * @default "displayText"
   */
  //titleType : "displayText",

  /**
   * Type of right block view.
   *
   * @property rightBlockType
   * @type String
   * @default "displayText"
   */
  //rightBlockType : "displayText",

  /**
   * Type of desc view.
   *
   * @property descType
   * @type String
   * @default "displayText"
   */
  //descType : "displayText",
});

return {
  ListColumnDataGroup : ListColumnDataGroup,
};

});

define('list-group/list-column-data/listColumnData',[
  "ember",
], function(Ember) {

/**
 * Column data for the list group modules (title, rightBlock or desc based on 'type')
 *
 * @class ListGroup.ListColumnData
 * @module list-group
 * @submodule list-column-data
 */
var ListColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

var ListTitleColumnData = ListColumnData.extend({
  tagName : "span",
  classNames : ['group-item-name'],
});

var ListRightBlockColumnData = ListColumnData.extend({
  tagName : "div",
  classNames : ['pull-right', 'text-right'],
});

var ListDescColumnData = ListColumnData.extend({
  tagName : "p",
  classNames : ['list-group-item-text'],
});

var ListColumnDataMap = {
  title      : ListTitleColumnData,
  rightBlock : ListRightBlockColumnData,
  desc       : ListDescColumnData,
};

return {
  ListColumnData           : ListColumnData,
  ListTitleColumnData      : ListTitleColumnData,
  ListRightBlockColumnData : ListRightBlockColumnData,
  ListDescColumnData       : ListDescColumnData,
  ListColumnDataMap        : ListColumnDataMap,
};

});

/**
 * Different list item views.
 *
 * @module list-group
 * @submodule list-column-data
 */
define('list-group/list-column-data/main',[
  "./listColumnDataGroup",
  "./listColumnData",
], function() {
  var ListGroupItem = {};

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ListGroupItem[k] = arguments[i][k];
      }
    }
  }

  ListGroupItem.NameToLookupMap = {
    "base" : "listGroup/listItem",
  };

  return ListGroupItem;
});

/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module list-group
 */
define('list-group/main',[
  "./listGroupView",
  "./list-item/main",
  "./list-column-data/main",
], function() {
  var ListGroup = Ember.Namespace.create();
  window.ListGroup = ListGroup;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        ListGroup[k] = arguments[i][k];
      }
    }
  }

  return ListGroup;
});

define('tree/nodeRecordMixin',[
  "ember",
], function(Ember) {

/**
 * Mixin to define behaviour of a record in the tree module.
 *
 * @class Tree.NodeRecordMixin
 */
var NodeRecordMixin = Ember.Mixin.create(Ember.ActionHandler, {
  /**
   * Array of children records.
   *
   * @property children
   */
  children : null,

  columnDataGroup : function() {
    var nodeColumnData = this.get("parentObj.columnDataGroup.tree.nodeColumnData");
    if(nodeColumnData) {
      return ColumnData.Registry.retrieve(this.get(nodeColumnData.get("key")), "columnDataGroup");
    }
    return null;
  }.property("parentObj.columnDataGroup"),
});

return {
  NodeRecordMixin : NodeRecordMixin,
};

});

define('tree/tree-nodes/nodeView',[
  "ember",
], function(Ember) {

/**
 * Node view for a non leaf node.
 *
 * @class Tree.NodeView
 * @module tree
 * @submodule tree-nodes
 */
var NodeView = Ember.View.extend({
  /**
   * Record for the node.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['tree-node'],

  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property("elementId"),

  collapsed : false,

  template : Ember.Handlebars.compile('' +
    '{{view view.columnDataGroup.tree.leftBarLookup record=view.record columnData=view.columnDataGroup.tree.leftBarColumnData collapseId=view.collapseId groupId=view.elementId ' +
                                                   'tagName=view.columnDataGroup.tree.leftBarColumnData.tree.tagName columnDataKey="tree" collapsed=view.collapsed}}' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
      '<div {{bind-attr id=view.collapseId class="view.columnDataGroup.tree.nodeChildrenClass :tree-node-children :collapse :in"}}>' +
        '{{#each view.record.children}}' +
          '{{view columnDataGroup.tree.nodeLookup record=this columnDataGroup=columnDataGroup}}' +
        '{{/each}}' +
      '</div>' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),

  didInsertElement : function() {
    var ele = $(this.get("element")).find(this.get("collapseIdSelector")), that = this;
    ele.on("shown.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", false);
      });
      e.stopPropagation();
    });
    ele.on("hidden.bs.collapse", function(e) {
      Ember.run(function() {
        that.set("collapsed", true);
      });
      e.stopPropagation();
    });
  },
});

return {
  NodeView : NodeView,
};

});

define('tree/tree-nodes/leafView',[
  "ember",
  "./nodeView",
], function(Ember, NodeView) {

/**
 * Node view for a leaf node.
 *
 * @class Tree.LeafView
 * @module tree
 * @submodule tree-nodes
 */
var LeafView = NodeView.NodeView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="tree-node-leftbar leaf-node"></div>' +
    '<div {{bind-attr class="view.columnDataGroup.tree.nodeMainClass :tree-node-main :leaf-node"}}>' +
      '{{view view.columnDataGroup.tree.labelLookup record=view.record columnData=view.columnDataGroup.tree.labelColumnData ' +
                                                   'tagName=view.columnDataGroup.tree.labelColumnData.tree.tagName columnDataKey="tree"}}' +
    '</div>' +
    '<div class="clearfix"></div>' +
  ''),
});

return {
  LeafView : LeafView,
};

});

/**
 * Different node views.
 *
 * @module tree
 * @submodule tree-nodes
 */
define('tree/tree-nodes/main',[
  "../../global-module/main",
  "./nodeView",
  "./leafView",
], function(GlobalModules) {
  var TreeNodes = Ember.Namespace.create();

  for(var i = 1; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        TreeNodes[k] = arguments[i][k];
      }
    }
  }

  TreeNodes.NameToLookupMap = {
    "node" : "tree/node",
    "leaf" : "tree/leaf",
  };
  GlobalModules.GlobalModulesMap.node = "tree/node";
  GlobalModules.GlobalModulesMap.leaf = "tree/leaf";

  return TreeNodes;
});

define('tree/tree-column-data/treeColumnDataGroup',[
  "ember",
  "../../global-module/main",
  "../tree-nodes/main",
], function(Ember, GlobalModules, TreeNode) {

/**
 * A column data group for the tree module.
 *
 * @class Tree.TreeColumnDataGroup
 * @module tree
 * @submodule tree-column-data
 */
var TreeColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "tree",
  modules : ["leftBar", "label", "node"],
  lookupMap : TreeNode.NameToLookupMap,

  /**
   * Type of left bar view.
   *
   * @property leftBarType
   * @type String
   * @default "displayText"
   */
  //leftBarType : "displayTextCollapsibleGlypicon",

  /**
   * Type of label view.
   *
   * @property labelType
   * @type String
   * @default "displayText"
   */
  //labelType : "displayText",

  /**
   * Type of node view.
   *
   * @property nodeType
   * @type String
   * @default "displayText"
   */
  //nodeType : "node",
});

return {
  TreeColumnDataGroup : TreeColumnDataGroup,
};

});

define('tree/tree-column-data/treeColumnData',[
  "ember",
], function(Ember) {

/**
 * Column data for the tree modules (leftBar, label or node based on 'type')
 *
 * @class Tree.TreeColumnData
 * @module tree
 * @submodule tree-column-data
 */
var TreeColumnData = Ember.Object.extend({
});

var TreeLeftBarColumnData = TreeColumnData.extend({
  classNames : ["tree-node-leftbar"],
});

var TreeLabelColumnData = TreeColumnData.extend({
  tagName : "h4",
  classNames : ['tree-node-name'],
});

var TreeNodeColumnData = TreeColumnData.extend({
});

var TreeColumnDataMap = {
  "leftBar" : TreeLeftBarColumnData,
  "label"   : TreeLabelColumnData,
  "node"    : TreeNodeColumnData,
};

return {
  TreeColumnData        : TreeColumnData,
  TreeLeftBarColumnData : TreeLeftBarColumnData,
  TreeLabelColumnData   : TreeLabelColumnData,
  TreeNodeColumnData    : TreeNodeColumnData,
  TreeColumnDataMap     : TreeColumnDataMap,
};

});

/**
 * Column data interface for tree.
 *
 * @module tree
 * @submodule tree-column-data
 */
define('tree/tree-column-data/main',[
  "./treeColumnDataGroup",
  "./treeColumnData",
], function() {
  var TreeColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        TreeColumnData[k] = arguments[i][k];
      }
    }
  }

  return TreeColumnData;
});

/**
 * Module to show record in a tree format.
 *
 * @module tree
 */
define('tree/main',[
  "./nodeRecordMixin",
  "./tree-nodes/main",
  "./tree-column-data/main",
], function() {
  var Tree = Ember.Namespace.create();
  window.Tree = Tree;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Tree[k] = arguments[i][k];
      }
    }
  }

  return Tree;
});

define('panels/panel-views/panelView',[
  "ember",
], function(Ember) {

/**
 * Basic panel view.
 *
 * @class Panels.PanelView
 * @module panels
 * @submodule panel-views
 */
var PanelView = Ember.View.extend({
  /**
   * The record that holds all the data.
   *
   * @property record
   * @type Class
   */
  record : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel', 'panel-default'],

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData ' +
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div class="panel-body">' +
      '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData ' +
                                                   'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '{{#if view.columnDataGroup.panel.footerColumnData}}' +
      '<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData ' +
                                                       'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>' +
    '{{/if}}' +
  ''),
});

return {
  PanelView : PanelView,
};

});

define('panels/panel-views/panelCollapsibleView',[
  "ember",
  "./panelView",
], function(Ember, PanelView) {

/**
 * Panel view for a collapsible.
 *
 * @class Panels.PanelCollapsibleView
 * @extends Panels.PanelView
 * @module panels
 * @submodule panel-views
 */
var PanelCollapsibleView = PanelView.PanelView.extend({
  groupId : null,
  collapseId : function() {
    return this.get("elementId")+"-inner";
  }.property('view.elementId'),
  collapseIdHref : function() {
    return "#"+this.get("collapseId");
  }.property('view.collapseId'),

  isFirst : function() {
    var panels = this.get("parentView.panels");
    return !panels || panels.objectAt(0) === this.get("record");
  }.property("view.parentView.panels.@each", "view.record"),

  template : Ember.Handlebars.compile('' +
    '<div class="panel-heading">' +
      '{{view view.columnDataGroup.panel.headingLookup record=view.record columnData=view.columnDataGroup.panel.headingColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                      'tagName=view.columnDataGroup.panel.headingColumnData.list.tagName columnDataKey="panel"}}' +
    '</div>' +
    '<div {{bind-attr id="view.collapseId" class=":panel-collapse :collapse view.isFirst:in"}}>' +
      '<div class="panel-body">' +
        '{{view view.columnDataGroup.panel.bodyLookup record=view.record columnData=view.columnDataGroup.panel.bodyColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                     'tagName=view.columnDataGroup.panel.bodyColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>' +
      '{{#if view.columnDataGroup.panel.footerColumnData}}<div class="panel-footer">' +
        '{{view view.columnDataGroup.panel.footerLookup record=view.record columnData=view.columnDataGroup.panel.footerColumnData collapseId=view.collapseId groupId=view.groupId '+
                                                       'tagName=view.columnDataGroup.panel.footerColumnData.list.tagName columnDataKey="panel"}}' +
      '</div>{{/if}}' +
    '</div>' +
  ''),
});

return {
  PanelCollapsibleView : PanelCollapsibleView,
};

});

/**
 * Different panel views.
 *
 * @module panels
 * @submodule panel-views
 */
define('panels/panel-views/main',[
  "./panelView",
  "./panelCollapsibleView",
], function() {
  var PanelView = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        PanelView[k] = arguments[i][k];
      }
    }
  }

  PanelView.NameToLookupMap = {
    "base" : "panels/panel",
    "collapsible" : "panels/panelCollapsible",
  };

  return PanelView;
});

define('panels/panel-column-data/panelColumnDataGroup',[
  "ember",
  "../../global-module/main",
  "../panel-views/main",
], function(Ember, GlobalModules, PanelViews) {

/**
 * A column data group for the panels module.
 *
 * @class Panels.PanelColumnDataGroup
 * @module panels
 * @submodule panel-column-data
 */
var PanelColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "panel",
  modules : ["heading", "body", "footer"],
  lookupMap : PanelViews.NameToLookupMap,

  /**
   * Type of heading view.
   *
   * @property headingType
   * @type String
   * @default "displayText"
   */
  //headingType : "displayText",

  /**
   * Type of body view.
   *
   * @property bodyType
   * @type String
   * @default "displayText"
   */
  //bodyType : "displayText",

  /**
   * Type of footer view.
   *
   * @property footerType
   * @type String
   */
  //footerType : "",
});

return {
  PanelColumnDataGroup : PanelColumnDataGroup,
};

});

define('panels/panel-column-data/panelColumnData',[
  "ember",
  "../../global-module/main",
  "../panel-views/main",
], function(Ember, GlobalModules) {

/**
 * Column data for the panels modules (heading, body and footer based on 'type')
 *
 * @class PanelGroup.PanelColumnData
 * @module panels
 * @submodule panel-column-data
 */
var PanelColumnData = Ember.Object.extend({
  /**
   * Used to determine the type of the module.
   *
   * @property moduleType
   * @type String
   */
  moduleType : "",
});

var PanelHeadingColumnData = PanelColumnData.extend({
  tagName : "h3",
  classNames : ["panel-title"],
});

var PanelBodyColumnData = PanelColumnData.extend({
});

var PanelFooterColumnData = PanelColumnData.extend({
});

var PanelColumnDataMap = {
  heading : PanelHeadingColumnData,
  body    : PanelBodyColumnData,
  footer  : PanelFooterColumnData,
};

return {
  PanelColumnData        : PanelColumnData,
  PanelHeadingColumnData : PanelHeadingColumnData,
  PanelBodyColumnData    : PanelBodyColumnData,
  PanelFooterColumnData  : PanelFooterColumnData,
  PanelColumnDataMap     : PanelColumnDataMap,
};

});

/**
 * Column data interface for panels.
 *
 * @module panels
 * @submodule panel-column-data
 */
define('panels/panel-column-data/main',[
  "./panelColumnDataGroup",
  "./panelColumnData",
], function() {
  var PanelColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        PanelColumnData[k] = arguments[i][k];
      }
    }
  }

  return PanelColumnData;
});

define('panels/panelsView',[
  "ember",
], function(Ember) {

/**
 * A view for a set of panels.
 *
 * @class Panels.PanelsView
 */
var PanelsView = Ember.View.extend({
  /**
   * The list of records.
   *
   * @property panels
   * @type Array
   */
  panels : null,

  /**
   * Associated column data group to customize the view.
   *
   * @property columnDataGroup
   * @type Class
   */
  columnDataGroup : null,

  classNames : ['panel-group'],

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.panels}}' +
        '{{view thatView.columnDataGroup.panel.viewLookup record=this columnDataGroup=thatView.columnDataGroup groupId=thatView.elementId}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

return {
  PanelsView : PanelsView,
};

});

/**
 * An ember wrapper module for bootstrap's list group component.
 *
 * @module panels
 */
define('panels/main',[
  "./panel-column-data/main",
  "./panel-views/main",
  "./panelsView",
], function() {
  var Panels = Ember.Namespace.create();
  window.Panels = Panels;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Panels[k] = arguments[i][k];
      }
    }
  }

  return Panels;
});

define('lazy-display/lazyDisplayColumnDataGroup',[
  "ember",
], function(Ember) {

/**
 * A column data group for the lazy display module.
 *
 * @class LazyDisplay.LazyDisplayColumnDataGroup
 */
var LazyDisplayColumnDataGroup = Ember.Object.extend({
  /**
   * Height of each row.
   *
   * @property rowHeight
   * @type Number
   * @default 50
   */
  rowHeight : 50,

  /**
   * Number of extra rows to load past the area of view.
   *
   * @property rowBuffer
   * @type Number
   * @default 50
   */
  rowBuffer : 50,

  /**
   * Timeout after which the async-que job to load views past the area of view.
   *
   * @property rowLoadDelay
   * @type Number
   * @default 150
   */
  rowLoadDelay : 150,

  passKeys : [],
  passValuePaths : [],

  /**
   * View for the lazy display main which has the rows.
   *
   * @property lazyDisplayMainClass
   * @type String|Class
   */
  lazyDisplayMainClass : null,

  /**
   * Addtional class name for the lazyDisplayHeightWrapper view.
   *
   * @property lazyDisplayHeightWrapperClasses
   * @type Array
   */
  lazyDisplayHeightWrapperClasses : [],

  /**
   * View for the lazy display main which has the rows.
   *
   * @property lazyDisplayScrollViewClasses
   * @type Array
   */
  lazyDisplayScrollViewClasses : [],
});

return {
  LazyDisplayColumnDataGroup : LazyDisplayColumnDataGroup,
};

});

define('lazy-display/lazyDisplayScrollView',[
  "ember",
], function(Ember) {

var LazyDisplayScrollView = Ember.ContainerView.extend({
  //table with the actual rows
  init : function() {
    this._super();
    var columnDataGroup = this.get("columnDataGroup"),
        passValuePaths = columnDataGroup.get("lazyDisplay.passValuePaths"),
        passKeys = columnDataGroup.get("lazyDisplay.passKeys"),
        lazyDisplayMainData = {
          rows : this.get("rows"),
          columnDataGroup : columnDataGroup,
          lazyDisplayHeightWrapper : this.get("lazyDisplayHeightWrapper"),
        }, lazyDisplayMainObj,
        mainClass = columnDataGroup.get("lazyDisplay.lazyDisplayMainClass");
    for(var i = 0; i < passValuePaths.length; i++) {
      TestApp.addObserver(passValuePaths[i], this, "passValueDidChange");
      lazyDisplayMainData[passKeys[i]] = Ember.get(passValuePaths[i]);
    }
    if(Ember.typeOf(mainClass) === "string") {
      mainClass = (this.container && this.container.lookup(mainClass)) || Ember.get(mainClass);
    }
    lazyDisplayMainObj = mainClass.create(lazyDisplayMainData);
    this.pushObject(lazyDisplayMainObj);
  },

  classNames : ['lazy-display-scroll-view'],

  columnDataGroup : null,
  lazyDisplayHeightWrapper : null,
  rows : null,
  rowsValueDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),

  passValueDidChange : function(obj, key) {
    var columnDataGroup = this.get("columnDataGroup"),
        passValuePaths = columnDataGroup.get("lazyDisplay.passValuePaths"),
        passKeys = columnDataGroup.get("lazyDisplay.passKeys"),
        idx = passValuePaths.findBy(key);
    this.objectAt(0).set(passKeys[idx], Ember.get(key));
  },

  scroll : function(scrollTop) {
    var childView = this.objectAt(0),
        ele = $(this.get("element"));
    if(childView) {
      childView.scroll(scrollTop);
    }
  },

  resize : function(height) {
    var childView = this.objectAt(0),
        ele = $(this.get("element"));
    if(childView) {
      childView.resize(height);
    }
  },
});

return {
  LazyDisplayScrollView : LazyDisplayScrollView,
};

});

define('lazy-display/lazyDisplayHeightWrapperView',[
  "ember",
  "./lazyDisplayScrollView",
], function(Ember, LazyDisplayScrollView) {

var LazyDisplayHeightWrapperView = Ember.ContainerView.extend({
  //this is to set the height to the actual height before the views corresponding to the rows are loaded
  init : function() {
    this._super();
    this.pushObject(LazyDisplayScrollView.LazyDisplayScrollView.create({
    //TODO : bind the vars. not needed for now though.
      rows : this.get("rows"),
      columnDataGroup : this.get("columnDataGroup"),
      lazyDisplayHeightWrapper : this,
      classNames : this.get("columnDataGroup.lazyDisplay.lazyDisplayScrollViewClasses"),
    }));
  },
  rows : null,
  rowsValueDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),
  columnDataGroup : null,
  columnDataGroupDidChange : function() {
    this.objectAt(0).set("columnDataGroup", columnDataGroup);
  }.observes('view.columnDataGroup', 'columnDataGroup'),

  classNames : ['lazy-display-height-wrapper'],

  attributeBindings : ['style'],
  style : function() {
    return "height:" + this.get("columnDataGroup.lazyDisplay.rowHeight") * this.get("rows.length") + "px;";
  }.property("view.rows.@each"),

  rowsDidChange : function() {
    this.notifyPropertyChange("style");
  },

  scroll : function(scrollTop) {
    var childView = this.objectAt(0),
        ele = $(this.get("element"));
    if(childView) {
      childView.scroll(scrollTop);
    }
  },

  resize : function(height) {
    var childView = this.objectAt(0),
        ele = $(this.get("element"));
    if(childView) {
      childView.resize(height);
    }
  },
});

return {
  LazyDisplayHeightWrapperView : LazyDisplayHeightWrapperView,
};

});

define('lazy-display/lazyDisplayView',[
  "ember",
  "./lazyDisplayColumnDataGroup",
  "./lazyDisplayHeightWrapperView",
], function(Ember, LazyDisplayColumnDataGroup, LazyDisplayHeightWrapperView) {

/**
 * Main view to be used in the templates.
 *
 * @class LazyDisplay.LazyDisplayView
 */
var LazyDisplayView = Ember.ContainerView.extend({
  //scrolling is on this
  init : function() {
    this._super();
    var columnDataGroup = this.get("columnDataGroup") || LazyDisplayColumnDataGroup.LazyDisplayColumnDataGroup.create();
    this.pushObject(LazyDisplayHeightWrapperView.LazyDisplayHeightWrapperView.create({
      rows : this.get("rows"),
      columnDataGroup : columnDataGroup,
      classNames : columnDataGroup.get("lazyDisplay.lazyDisplayHeightWrapperClasses"),
    }));
  },
  
  /**
   * The rows to be displayed lazily.
   *
   * @property rows
   * @type Array
   */
  rows : null,
  rowsDidChange : function() {
    this.objectAt(0).set("rows", this.get("rows"));
  }.observes('view.rows', 'rows'),
  
  /**
   * The column data group which will serve as a config for lazy display.
   *
   * @property rows
   * @type Array
   */
  columnDataGroup : null,
  columnDataGroupDidChange : function() {
    this.objectAt(0).set("columnDataGroup", columnDataGroup);
  }.observes('view.columnDataGroup', 'columnDataGroup'),

  classNames : ['lazy-display'],

  didInsertElement : function() {
    var ele = $(this.get("element")), childView = this.objectAt(0);
    ele.scroll(this, this.scroll);
    ele.resize(this, this.resize);
    if(childView) {
      Ember.run(function() {
        childView.scroll(ele.scrollTop());
        childView.resize(ele.height());
      });
    }
  },

  scroll : function(e) {
    var that = e.data, childView = that.objectAt(0),
        ele = $(that.get("element"));
    if(childView) {
      Ember.run(function() {
        childView.scroll(ele.scrollTop());
      });
    }
  },

  resize : function(e) {
    var that = e.data, childView = that.objectAt(0),
        ele = $(that.get("element"));
    if(childView) {
      Ember.run(function() {
        childView.resize(ele.height());
      });
    }
  },

});

return {
  LazyDisplayView : LazyDisplayView,
};

});

define('lazy-display/lazyDisplayMainMixin',[
  "ember",
  "lib/ember-utils-core",
  "../timer/main",
], function(Ember, Utils, Timer) {

var LazyDisplayMainMixin = Ember.Mixin.create(Utils.ObjectWithArrayMixin, {
  rows : null,
  lazyDisplayHeightWrapper : null,

  classNames : ['lazy-display-main'],

  arrayProps : ['rows'],

  rowsWillBeDeleted : function(deletedRows, idxs) {
    if(this._state === "destroying") return;
    var rowViews = this.filter(function(e, i, a) {
      return deletedRows.findBy("id", e.get("row.id"));
    }), that = this;
    if(rowViews.length) {
      //this.removeObjects(rowViews);
      this.rerenderRows(deletedRows);
    }
    Timer.addToQue("lazyload", 100).then(function() {
      that.get("lazyDisplayHeightWrapper").rowsDidChange();
    });
  },

  rowsWasAdded : function(addedRows, idxs) {
    if(this._state === "destroying") return;
    var that = this;
    //this.beginPropertyChanges();
    for(var i = 0; i < addedRows.length; i++) {
      var row = addedRows[i], rowView = this.findBy("row.id", row.get("id")),
          that = this, canShow = this.canShowRow(idxs[i]);
      if(rowView && !Ember.isEmpty(row.get("id"))) {
        this.removeObject(rowView);
      }
      if(canShow === 0) {
        rowView = this.getRowView(row);
      }
      else if(canShow === -1) {
        rowView = this.getDummyView(row);
      }
      else {
        break;
      }
      this.insertAt(idxs[i], rowView);
    }
    //this.endPropertyChanges();
    Timer.addToQue("lazyload", 100).then(function() {
      that.get("lazyDisplayHeightWrapper").rowsDidChange();
    });
  },

  rerenderRows : function(ignoreRows) {
    if(this._state === "destroying") return;
    ignoreRows = ignoreRows || [];
    var rows = this.get("rows"), length = rows.get("length"), j = 0,
        userType = this.get("userType"), columnData = this.get("columnData");
    for(var i = 0; i < length; i++) {
      var cview = this.objectAt(j), canShow = this.canShowRow(j),
          rowObj = rows.objectAt(i);
      if(ignoreRows.contains(rowObj)) {
        if(cview) this.removeObject(cview);
        continue;
      }
      if(canShow === 0 && (!cview || cview.rowType === 0)) {
        var row = this.getRowView(rowObj);
        if(cview) {
          this.removeAt(j);
          this.insertAt(j, row);
        }
        else {
          this.pushObject(row);
        }
      }
      else if(canShow === -1 && !cview) {
        this.insertAt(j, this.getDummyView(rowObj));
      }
      j++;
    }
  },

  scrollTop : 0,
  scrollTopDidChange : function() {
    var that = this;
    Timer.addToQue("lazyload", this.get("columnDataGroup.lazyDisplay.rowLoadDelay")).then(function() {
      that.rerenderRows();
    });
  }.observes("scrollTop", "view.scrollTop"),
  scroll : function(scrollTop) {
    this.set("scrollTop", scrollTop);
  },

  height : 0,
  heightDidChange : function() {
    var that = this;
    Timer.addToQue("lazyload", this.get("columnDataGroup.lazyDisplay.rowLoadDelay")).then(function() {
      that.rerenderRows();
    });
  }.observes("height", "view.height"),
  resize : function(height) {
    this.set("height", height);
  },

  canShowRow : function(idx) {
    var rows = this.get("rows"), length = rows.get("length"),
        scrollTop = this.get("scrollTop"), height = this.get("height"),
        columnDataGroup = this.get("columnDataGroup"),
        rowHeight = columnDataGroup.get("lazyDisplay.rowHeight"),
        rowBuffer = columnDataGroup.get("lazyDisplay.rowBuffer"),
        scrollLength = Math.round(scrollTop / rowHeight - rowBuffer),
        heightLength = height / rowHeight + 2*rowBuffer;
    //console.log(scrollTop + ".." + height + ".." + idx + ".." + scrollLength + ".." + heightLength + "..retval.." + 
    //            (idx < scrollLength ? -1 : (idx >= scrollLength && idx < scrollLength + heightLength ? 0: 1)));
    if(idx < scrollLength) return -1;
    if(idx >= scrollLength && idx < scrollLength + heightLength) return 0;
    if(idx >= scrollLength + heightLength) return 1;
    return 0;
  },
});

var LazyDisplayDummyRow = Ember.Mixin.create({
  rowType : 0,

  classNames : ['lazy-display-dummy-row'],
});

var LazyDisplayRow = Ember.Mixin.create({
  rowType : 1,

  classNames : ['lazy-display-row'],
});

return {
  LazyDisplayMainMixin : LazyDisplayMainMixin,
  LazyDisplayDummyRow  : LazyDisplayDummyRow,
  LazyDisplayRow       : LazyDisplayRow,
};

});

/**
 * A module to selective load views for a very large set of records. Will load the views around the point of view.
 *
 * @module lazy-display
 */
define('lazy-display/main',[
  "./lazyDisplayColumnDataGroup",
  "./lazyDisplayView",
  "./lazyDisplayHeightWrapperView",
  "./lazyDisplayScrollView",
  "./lazyDisplayMainMixin",
], function() {
  var LazyDisplay = Ember.Namespace.create();
  window.LazyDisplay = LazyDisplay;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        LazyDisplay[k] = arguments[i][k];
      }
    }
  }

  return LazyDisplay;
});

define('form/multiColumnMixin',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Mixin for views with multiple child view with column data.
 *
 * @class MultiColumnMixin
 */
var MultiColumnMixin = Ember.Mixin.create({
  parentForRows : function() {
    return this;
  }.property(),

  filteredCols : function() {
    var cols = this.get("columnDataGroup.columns"), record = this.get("record"), that = this;
    if(cols) {
      return cols.filter(function(columnData) {
        return that.canAddColumnData(columnData, record);
      });
    }
    return [];
  }.property('columnDataGroup.columns.@each.form', 'view.columnDataGroup.columns.@each.form', 'record.isNew', 'view.record.isNew'),

  canAddColumnData : function(columnData, record) {
    return !columnData.get('form.isOnlyTable') && (!columnData.get("form.removeOnEdit") || !record || record.get("isNew")) && (!columnData.get("form.removeOnNew") || !record || !record.get("isNew"));
  },

  template : Ember.Handlebars.compile('' +
    '{{#with view as thatView}}' +
      '{{#each thatView.filteredCols}}' +
        '{{view form.formView record=thatView.record columnData=this labelWidthClass=thatView.columnDataGroup.form.labelWidthClass ' +
                             'inputWidthClass=thatView.columnDataGroup.form.inputWidthClass tagName=thatView.columnDataGroup.form.tagName ' +
                             'showLabel=thatView.columnDataGroup.form.showLabel parentForm=thatView.parentForRows immediateParent=thatView}}' +
      '{{/each}}' +
    '{{/with}}' +
  ''),
});

return {
  MultiColumnMixin : MultiColumnMixin,
};

});

define('form/formView',[
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
  "./multiColumnMixin",
], function(Ember, Utils, ColumnData, MultiColumnMixin) {

/**
 * Base form view.
 * Usage:
 *
 *     {{view "form/form" record=record columnDataGroup=columnDataGroup}}
 *
 * @class FormView
 */
var FormView = Ember.View.extend(MultiColumnMixin.MultiColumnMixin, ColumnData.ColumnDataChangeCollectorMixin, {
  childTagNames : 'div',
  classNames : ['form-horizontal'],
});

return {
  FormView : FormView,
};

});

define('form/form-column-data/formColumnDataGroup',[
  "ember",
  "lib/ember-utils-core",
  "global-module/main",
], function(Ember, Utils, GlobalModules) {

/**
 * Column data group for form.
 *
 * @class Form.FormColumnDataGroup
 * @submodule form-column-data
 * @module form
 */
var FormColumnDataGroup = Ember.Object.extend(GlobalModules.GlobalModuleColumnDataGroupMixin, {
  type : "form",
  modules : [],
  lookupMap : {},

  labelWidthClass : "col-sm-4",
  inputWidthClass : "col-sm-8",
  showLabel : true,
});

return {
  FormColumnDataGroup : FormColumnDataGroup,
};

});

define('form/form-column-data/formColumnData',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Entry to disable/enable column based on value of another.
 *
 * @class Form.DisableForCol
 * @submodule form-column-data
 * @module form
 */
var HideForCol = Ember.Object.extend({
  name : "",
  value : "",
  keyName : "",
  //used when you need different entries for the same attr in the record
  key : function() {
    return this.get("keyName") || this.get("name");
  }.property("keyName", "name"),
  hide : false,
  show : false,
});

/**
 * Column data for form module.
 *
 * @class Form.FormColumnData
 * @submodule form-column-data
 * @module form
 */
var FormColumnData = Ember.Object.extend({
  placeholder : null,
  placeholderActual : function() {
    var placeholder = this.get("placeholder"), label = this.get("parentObj.label");
    if(placeholder) return placeholder;
    return label;
  }.property('parentObj.label', 'placeholder'),
  moduleType : "",
  formView : function() {
    return Form.TypeToCellNameMap[this.get("moduleType")];
  }.property('type'),
  fixedValue : null,
  options : [],
  data : [],
  dataValCol : "",
  dataLabelCol : "",
  bubbleValues : false,
  cantBeNull : false,
  canManipulateEntries : true,

  multiEntryContainerClass : "multi-entry-container",
  eachMultiEntryClass : "each-multi-entry",
  multiEntryClass : "multi-entry",
  showChildrenLabel : false,
  childrenLabelWidthClass : "",
  childrenInputWidthClass : "col-md-12",

  exts : Utils.hasMany(),
  hideForCols : Utils.hasMany(HideForCol),
});

return {
  FormColumnData : FormColumnData,
};

});

/**
 * Column data interface for form module.
 *
 * @submodule form-column-data
 * @module form
 */

define('form/form-column-data/main',[
  "./formColumnDataGroup",
  "./formColumnData",
], function() {
  var FormColumnData = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        FormColumnData[k] = arguments[i][k];
      }
    }
  }

  FormColumnData.FormColumnDataMap = {
    textInput              : FormColumnData.FormColumnData,
    textareaInput          : FormColumnData.FormColumnData,
    staticSelect           : FormColumnData.FormColumnData,
    dynamicSelect          : FormColumnData.FormColumnData,
    selectiveSelect        : FormColumnData.FormColumnData,
    label                  : FormColumnData.FormColumnData,
    fileUpload             : FormColumnData.FormColumnData,
    imageUpload            : FormColumnData.FormColumnData,
    csvData                : FormColumnData.FormColumnData,
    multiEntry             : FormColumnData.FormColumnData,
    multiInput             : FormColumnData.FormColumnData,
    checkBox               : FormColumnData.FormColumnData,
    textareaSelectedInput  : FormColumnData.FormColumnData,
    groupRadioButton       : FormColumnData.FormColumnData,
    groupCheckBox          : FormColumnData.FormColumnData,
    sectionHeading         : FormColumnData.FormColumnData,
  };

  return FormColumnData;
});

define('form/form-items/textInputView',[
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
], function(Ember, Utils, ColumnData) {

/**
 * Base input view - a text input view.
 *
 * @class Form.TextInputView
 * @module form
 * @submodule form-items
 */
var TextInputView = Ember.View.extend(ColumnData.ColumnDataValueMixin, {
  parentForm : null,
  immediateParent : null,
  parentForBubbling : Ember.computed.alias("parentForm"),

  layout : Ember.Handlebars.compile('' +
    '{{#if view.showLabelComp}}<div {{bind-attr class="view.labelClass"}} >' +
      '<label {{bind-attr for="view.columnData.name" }}>{{#if view.columnData.label}}{{view.columnData.label}}{{#if view.columnData.form.mandatory}}*{{/if}}{{/if}}</label>' +
      '{{#if view.columnData.form.helpText}}<div class="label-tooltip">' +
        '{{#tool-tip placement="right" title=view.columnData.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
      '</div>{{/if}}' +
    '</div>{{/if}}'+
    '<div {{bind-attr class="view.inputClass"}}> {{#if view.columnData.form.fieldDescription}}<span>{{view.columnData.form.fieldDescription}}</span>{{/if}}' +
      '<div class="validateField">'+
        '{{yield}}' +
        '{{#unless view.showLabelComp}}'+
          '{{#if view.columnData.form.helpText}}<div class="label-tooltip">' +
            '{{#tool-tip placement="right" title=view.columnData.form.helpText}}<span class="glyphicon glyphicon-question-sign"></span>{{/tool-tip}}' +
          '</div>{{/if}}' +
        '{{/unless}}'+
        '{{#if view.invalid}}' +
          '{{#if view.invalidReason}}<span class="help-block text-danger">{{view.invalidReason}}</span>{{/if}}' +
        '{{/if}}' +
      '</div>'+
    '</div>' +
  ''),
  template : Ember.Handlebars.compile('{{input class="form-control" autofocus=view.columnData.form.autofocus type="text" value=view.value disabled=view.isDisabled ' +
                                                                   'placeholder=view.columnData.form.placeholderActual maxlength=view.columnData.form.maxlength}}'),
  classNames : ["form-group"],
  classNameBindings : ["columnData.form.additionalClass", "columnData.validation.validations:has-validations", "invalid:has-error", ":has-feedback", "hidden:hidden", "additionalClass"],
  attributeBindings : ["colName:data-column-name"],
  colName : Ember.computed.alias("columnData.name"),
  labelWidthClass : "col-full",
  inputWidthClass : "col-sm-8",
  showLabel : true,
  labelClass : function() {
    var columnData = this.get("columnData"), labelWidthClass = this.get("labelWidthClass");
    return "control-label "+(columnData.labelWidthClass || labelWidthClass);
  }.property("view.columnData", "view.labelWidthClass"),
  inputClass : function() {
    var columnData = this.get("columnData"), inputWidthClass = this.get("inputWidthClass");
    return "control-input "+(columnData.inputWidthClass || inputWidthClass);
  }.property("view.columnData", "view.inputWidthClass"),

  isDisabled : function() {
    var columnData = this.get("columnData"),record = this.get("record");
    this.notifyPropertyChange("value");
    return columnData.get("form.fixedValue") || ((columnData.get("form.disableOnEdit") && record && !record.get("isNew")) || (columnData.get("form.disableOnNew") && record && record.get("isNew")));
  }.property("view.columnData", "view.columnData.form.fixedValue", "view.columnData.form.disableOnEdit", "view.columnData.form.disableOnNew"),

  showLabelComp : function() {
    var columnData = this.get("columnData");
    if(columnData.showLabel === undefined ) return this.get("showLabel");
    return this.get("showLabel") && columnData.showLabel;
  }.property("showLabel", "view.columnData"),

  invalid : false,
  invalidReason : false,

  hidden : false,
  hideCheck : function(changedCol, changedValue) {
    var columnData = this.get("columnData"), record = this.get("record"),
        hideEntry = columnData.get("form.hideForCols") && columnData.get("form.hideForCols").findBy("name", changedCol.get("name"));
    changedValue = changedValue || record.get(changedCol.get("key"));
    if(hideEntry) {
      var eq = hideEntry.value === changedValue, dis = hideEntry.hide, en = hideEntry.show;
      this.set("hidden", (dis && eq) || (en && !eq));
    }
  },
  disableValidation : Ember.computed.alias("hidden"),

  listenedColumnChangedHook : function(changedCol, changedValue, oldValue) {
    this.hideCheck(changedCol, changedValue);
  },

  valueDidChange : function(value) {
  },

  prevRecord : null,
  recordChangeHook : function() {
    this.notifyPropertyChange("isDisabled");
    var hideForCols = this.get("columnData.form.hideForCols");
    if(hideForCols) {
      for(var i = 0; i < hideForCols.length; i++) {
        this.hideCheck(hideForCols[i], this.get("record."+hideForCols[i].get("key")));
      }
    }
  },
  recordRemovedHook : function(){
  },
  title : "test",
});

return {
  TextInputView : TextInputView,
};

});

define('form/form-items/textAreaView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for textarea.
 *
 * @class Form.TextAreaView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var TextAreaView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('{{textarea class="form-control" autofocus="view.columnData.form.autofocus" value=view.value disabled=view.isDisabled rows=view.columnData.rows ' +
                                                                      'cols=view.columnData.cols placeholder=view.columnData.form.placeholderActual maxlength=view.columnData.form.maxlength ' +
                                                                      'readonly=view.columnData.form.readonly}}'),
});

return {
  TextAreaView : TextAreaView,
};

});

define('form/form-items/multipleValue',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Base for multiple value object.
 *
 * @class Form.MultipleValue
 * @module form
 * @submodule form-items
 */
var MultipleValue = Ember.Object.extend({
  value : function(key, value) {
    var columnData = this.get("columnData");
    if(arguments.length > 1) {
      if(!Ember.isNone(columnData)) {
        var validation = columnData.validateValue(value, null, columnData.get("validation.eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
        }
        else {
          this.set("isInvalid", false);
        }
      }
      return value;
    }
  }.property('columnData'),
  label : "",
  isInvalid : false,
});

return {
  MultipleValue : MultipleValue,
};

});

define('form/form-items/copyValuesToObject',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/*
 * Copy values from record to object.
 *
 * @method Form.CopyValuesToObject
 * @module form
 * @submodule form-items
 */
var CopyValuesToObject = function(obj, col, record, value) {
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        obj[copyAttrs[k]] = record.get(k);
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        obj[k] = staticAttrs[k];
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        obj[valAttrs[k]] = value.get(k);
      }
    }
  }
};

return CopyValuesToObject;

});

define('form/form-items/copyValuesToRecord',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/*
 *
 * @module form
 * @submodule form-items
 */
var CopyValuesToRecord = function(toRecord, col, fromRecord, value) {
  var copyAttrs = col.get("form.copyAttrs"),
      staticAttrs = col.get("form.staticAttrs"),
      valAttrs = col.get("form.valAttrs");
  if(copyAttrs) {
    for(var k in copyAttrs) {
      if(copyAttrs.hasOwnProperty(k)) {
        toRecord.set(copyAttrs[k], fromRecord.get(k));
      }
    }
  }
  if(staticAttrs) {
    for(var k in staticAttrs) {
      if(staticAttrs.hasOwnProperty(k)) {
        toRecord.set(k, staticAttrs[k]);
      }
    }
  }
  if(value && valAttrs) {
    for(var k in valAttrs) {
      if(valAttrs.hasOwnProperty(k)) {
        toRecord.set(valAttrs[k], value.get(k));
      }
    }
  }
};

return CopyValuesToRecord;

});

define('form/form-items/multipleValueMixin',[
  "ember",
  "lib/ember-utils-core",
  "./multipleValue",
  "./copyValuesToObject",
  "./copyValuesToRecord",
], function(Ember, Utils, MultipleValue, CopyValuesToObject, CopyValuesToRecord) {

/**
 * Mixin which enables views to have multiple values.
 *
 * @class Form.MultipleValueMixin
 * @module form
 * @submodule form-items
 */
var MultipleValueMixin = Ember.Mixin.create({
  init : function() {
    this._super();
    var values = this.get("values");
    this.set("values", Ember.isEmpty(values) ? [] : values);
    if(this.get("value")) this.valArrayDidChange();
    else this.valuesArrayDidChange();
  },

  values : Utils.hasMany(MultipleValue.MultipleValue),

  valuesCount : function() {
    return this.get("values.length") || 0;
  }.property('values.@each'),

  valuesArrayDidChange : function() {
    if(!this.get("values") || this.get("lock")) return;
    var value = this.get("value"), values = this.get("values"),
        valLength = val && val.get("length"), valuesLength = values.get("length"),
        columnData = this.get("columnData"), record = this.get("record");
    if(val) {
      this.set("lock", true);
      values.forEach(function(val, idx) {
        var valObj = value.objectAt(idx);
        if(valObj) {
          valObj.set(columnData.get("form.arrayCol"), val.get("value"));
          CopyValuesToRecord(valObj, columnData, record, val);
        }
        else {
          var data = { /*id : columnData.get("name")+"__"+csvid++*/ };
          data[columnData.get("form.arrayCol")] = val.get("value");
          CopyValuesToObject(data, columnData, record, val);
          record.addToProp(columnData.get("key"), CrudAdapter.createRecordWrapper(record.store, columnData.get("form.arrayType"), data));
        }
      });
      if(valLength > valuesLength) {
        for(var i = valuesLength; i < valLength; i++) {
          value.popObject();
        }
      }
      this.set("lock", false);
    }
  }.observes('values.@each.value', 'view.values.@each.value'),

  valArrayDidChange : function() {
    if(this.get("lock")) return;
    var value = this.get("value"), columnData = this.get("columnData");
    if(value) {
      var values, val = this.get("value");
      values = this.valuesMultiCreateHook(value);
      this.set("lock", true);
      this.set("values", values);
      this.set("lock", false);
    }
  }.observes('value.@each', 'view.value.@each'),

  valuesMultiCreateHook : function(value) {
    if(value.map) {
      return value.map(function(e, i, a) {
        return this.valuesElementCreateHook(e);
      }, this);
    }
    return [];
  },

  valuesElementCreateHook : function(element) {
    var columnData = this.get("columnData");
    return {val : element.get(columnData.get("form.arrayCol")), columnData : columnData};
  },

  lock : false,

  valuesWereInvalid : function() {
    //for now arrayCol is present for all multi value cols
    //change this check if there are exceptions
    if(!this.get("columnData.form.arrayCol")) return;
    var values = this.get("values"),
        isInvalid = !values || values.get("length") === 0 || values.anyBy("isInvalid", true),
        record = this.get("record"), columnData = this.get("columnData");
    if(!record) return;
    if(this.get("disabled")) {
      delete record._validation[columnData.get("name")];
    }
    else {
      this.set("invalid", isInvalid);
      record._validation = record._validation || {};
      if(isInvalid) {
        record._validation[columnData.get("name")] = 1;
      }
      else {
        delete record._validation[columnData.get("name")];
      }
    }
    this.validateValue();
  }.observes('values.@each.isInvalid', 'view.values.@each.isInvalid', 'disabled', 'view.disabled'),
});

return {
  MultipleValueMixin : MultipleValueMixin,
};

});

define('form/form-items/multiEntryView',[
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
  "crud-adapter/main",
  "./textInputView",
  "./copyValuesToObject",
], function(Ember, Utils, ColumnData, CrudAdapter, TextInputView, CopyValuesToObject) {

/**
 * View for multiple rows of items.
 *
 * @class Form.MultiEntryView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var mulid = 0;
var MultiEntryView = TextInputView.TextInputView.extend(ColumnData.ColumnDataChangeCollectorMixin, {
  childView : function() {
    var columnData = this.get("columnData");
    return Form.TypeToCellNameMap[columnData.get("childCol").type];
  }.property("view.columnData.childCol.type"),
  template : Ember.Handlebars.compile('' +
    '<div {{bind-attr class="view.columnData.form.multiEntryContainerClass"}}>' +
    '{{#with view as outerView}}' +
      '{{#each outerView.value}}' +
        '<div {{bind-attr class="outerView.columnData.form.eachMultiEntryClass"}}>' +
          '<div {{bind-attr class="outerView.columnData.form.multiEntryClass"}}>' +
            '{{view outerView.childView record=this columnData=outerView.columnData.childCol parentForm=outerView showLabel=outerView.columnData.form.showChildrenLabel immediateParent=outerView}}' +
          '</div>' +
          '{{#if outerView.columnData.form.canManipulateEntries}}' +
            '<div class="remove-entry" rel="tooltip" title="Delete Condition"><a {{action "deleteEntry" this target="outerView"}}>' +
              '<span class="glyphicon glyphicon-trash"></span>' +
            '</a></div>' +
            '<div class="add-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
              '<span class="glyphicon glyphicon-plus"></span>'+
            '</a></div>'+
          '{{/if}}' +
        '</div>' +
      '{{else}}'+
        '{{#if outerView.columnData.form.canManipulateEntries}}' +
          '<div class="add-first-entry" rel="tooltip" title="Add Condition"> <a {{action "addEntry" target="outerView"}}>'+
            '<span class="glyphicon glyphicon-plus"></span>'+
          '</a></div>'+
        '{{/if}}' +
      '{{/each}}'+
    '{{/with}}' +
    '</div>'+
    '<p class="tp-rules-end-msg">{{view.columnData.form.postInputText}}</p>'
    ),

  valuesArrayDidChange : function() {
    if(this.get("record")) this.validateValue(this.get("value"));
  }.observes("value.@each", "view.value.@each"),

  actions : {
    addEntry : function() {
      var record = this.get("record"), columnData = this.get("columnData"),
          entry, value = this.get("value"), data = { /*id : columnData.get("name")+"__"+mulid++*/ };
      $('.tooltip').hide();
      CopyValuesToObject(data, columnData, record);
      entry = CrudAdapter.createRecordWrapper(record.store, columnData.get("form.arrayType"), data);
      if(!value) {
        value = [];
        this.set("value", value);
      }
      value.pushObject(entry);
    },

    deleteEntry : function(entry) {
      $('.tooltip').hide();
      var value = this.get("value");
      value.removeObject(entry);
    },
  },
});

return {
  MultiEntryView : MultiEntryView,
};

});

define('form/form-items/multiInputView',[
  "ember",
  "lib/ember-utils-core",
  "column-data/main",
  "../multiColumnMixin",
], function(Ember, Utils, ColumnData, MultiColumnMixin) {

/**
 * View for multiple form items.
 *
 * @class Form.MultiInputView
 * @extends Form.MultiColumnMixin
 * @module form
 * @submodule form-items
 */
var MultiInputView = Ember.View.extend(MultiColumnMixin.MultiColumnMixin, ColumnData.ColumnDataChangeCollectorMixin, {
  classNames : ['clearfix'],
  classNameBindings : ['columnData.form.additionalClass'],
  parentForRows : function() {
    if(this.get("columnData.form.propogateValChange")) {
      return this.get("parentForm");
    }
    else {
      return this;
    }
  }.property(),

  columnDataGroup : Ember.computed.alias("columnData.childColumnDataGroup"),
});

return {
  MultiInputView : MultiInputView,
};

});

define('form/form-items/emberSelectViewFix',[
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

define('form/form-items/staticSelectView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for select tag with static options.
 *
 * @class Form.StaticSelectView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
//TODO : support multiple on static select (no requirement for now)
var StaticSelectView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.columnData.form.options optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'prompt=view.columnData.form.prompt value=view.value disabled=view.isDisabled maxlength=view.columnData.form.maxlength}}' +
                                      '{{#if view.helpblock}}<p class="help-block">{{view.helpblock}}</p>{{/if}}'),

  helpblock : "",
});

return {
  StaticSelectView : StaticSelectView,
};

});

define('form/form-items/dynamicSelectView',[
  "ember",
  "lib/ember-utils-core",
  "./staticSelectView",
  "./multipleValueMixin",
], function(Ember, Utils, StaticSelectView, MultipleValueMixin) {

/**
 * View for a select tag with dynamic options.
 *
 * @class Form.DynamicSelectView
 * @extends Form.StaticSelectView
 * @module form
 * @submodule form-items
 */
var DynamicSelectView = StaticSelectView.StaticSelectView.extend(MultipleValueMixin.MultipleValueMixin, Utils.ObjectWithArrayMixin, {
  init : function() {
    this._super();
    var columnData = this.get("columnData");
    Ember.addObserver(this,columnData.get("form.dataPath")+".@each",this,"dataDidChange");
  },

  classNameBindings : ['hideOnEmpty:hidden'],
  hideOnEmpty : false,

  selectOptions : function() {
    var columnData = this.get("columnData"), data = [], opts = [];
    if(columnData.dataPath) {
      data = Ember.get(columnData.dataPath) || this.get(columnData.dataPath);
    }
    else {
      data = columnData.data || [];
    }
    if(data) {
      data.forEach(function(item) {
        opts.push(Ember.Object.create({ val : item.get(columnData.dataValCol), label : item.get(columnData.dataLabelCol)}));
      }, this);
    }
    if(columnData.get("form.hideOnEmpty") && opts.length - columnData.get("form.hideEmptyBuffer") === 0) {
      this.set("hideOnEmpty", true);
    }
    else {
      this.set("hideOnEmpty", false);
    }
    return opts;
  }.property('view.columnData'),

  dataDidChange : function(){
    this.notifyPropertyChange("selectOptions");
    this.rerender();
  },

  selection : function(key, value) {
    if(arguments.length > 1) {
      if(this._state !== "preRender") {
        if(this.get("columnData.form.multiple")) {
          if(Ember.isEmpty(value[0])) {
            //initially the selection is an array with undef as its 1st element
            //this.set("values", []);
          }
          else {
            this.set("values", value); 
          }
        }
        else {
          this.set("value", value && value.val);
        }
      }
      return value;
    }
    else {
      var options = this.get("selectOptions"), sel;
      if(this.get("columnData.form.multiple")) {
        var values = this.get("values"), columnData = this.get("columnData");
        if(values && values.get("length")) {
          sel = options.filter(function(e, i, a) {
            return !!values.findBy("value", e.get("value"));
          });
        }
      }
      else {
        sel = options.findBy("value", this.get("value"));
      }
      return sel;
    }
  }.property("view.values.@each", "values.@each"),

  recordChangeHook : function() {
    this._super();
    this.notifyPropertyChange("selection");
  },

  valueDidChange : function() {
    this.notifyPropertyChange("selection");
  },

  selectionWasAdded : function(addedSels, idxs, fromSetFunc) {
    if(this.get("columnData.form.multiple") && !fromSetFunc) {
      this.set("values", this.get("selection"));
    }
  },

  arrayProps : ["selection"],

  template : Ember.Handlebars.compile('{{view "select" class="form-control" content=view.selectOptions optionValuePath="content.val" optionLabelPath="content.label" ' +
                                                      'multiple=view.columnData.form.multiple prompt=view.columnData.form.prompt selection=view.selection disabled=view.isDisabled}}'),
});

return {
  DynamicSelectView : DynamicSelectView,
};

});

define('form/form-items/fileUploadView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * Form item for a file upload input.
 *
 * @class Form.FileUploadView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var FileUploadView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.columnData.form.accept"}}>'),

  disableBtn : false,
  fileName : "",

  btnLabel : function(){
    return this.get('uploadBtnLabel') || this.get('columnData').get('form.btnLabel');
  }.property('columnData.form.btnLabel', 'view.columnData.form.btnLabel'),

  postRead : function(data) {
    this.set("value", data);
  },

  postFail : function(message) {
    this.set("value", null);
  },

  change : function(event) {
    var files = event.originalEvent && event.originalEvent.target.files, that = this, columnData = this.get("columnData");
    if(files && files.length > 0 && !Ember.isEmpty(files[0])) {
      this.set("disableBtn", "disabled");
      this.set("fileName", files[0].name);
      EmberFile[columnData.get("method")](files[0]).then(function(data) {
        that.postRead(data);
        that.set("disableBtn", false);
      }, function(message) {
        that.postFail(message);
        that.set("disableBtn", false);
      });
      $(this.get("element")).find("input[type='file']")[0].value = "";
    }
  },

  actions : {
    loadFile : function() {
      fileInput = $(this.get("element")).find("input[type='file']");
      fileInput.click();
    },
  },
});

return {
  FileUploadView : FileUploadView,
};

});

define('form/form-items/imageUploadView',[
  "ember",
  "lib/ember-utils-core",
  "./fileUploadView",
], function(Ember, Utils, FileUploadView) {

/**
 * Form item to upload image.
 *
 * @class Form.ImageUploadView
 * @extends Form.FileUploadView
 * @module form
 * @submodule form-items
 */
var ImageUploadView = FileUploadView.FileUploadView.extend({
  template : Ember.Handlebars.compile('<p><button class="btn btn-default btn-sm" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.columnData.form.btnLabel}}</button>' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.columnData.form.accept"}}></p>' +
                                      '<canvas class="hidden"></canvas>' +
                                      '<div {{bind-attr class="view.hasImage::hidden"}}>' +
                                        '<div class="image-container">' +
                                          '<div class="image-container-inner">' +
                                            '<img class="the-image" {{bind-attr src="view.imageSrc"}}>' +
                                            '<div class="image-cropper"></div>' +
                                          '</div>' +
                                        '</div>' +
                                        '<button class="btn btn-default btn-sm" {{action "cropImage" target="view"}}>Crop</button>' +
                                      '</div>' +
                                      '<div class="clearfix"></div>'),

  imageSrc : "",
  hasImage : false,

  postRead : function(data) {
    this.set("imageSrc", data);
    this.set("hasImage", true);
  },

  postFail : function(message) {
    this.set("imageSrc", null);
    this.set("hasImage", false);
  },

  didInsertElement : function() {
    this._super();
    var cropper = $(this.get("element")).find(".image-cropper");
    cropper.draggable({
      containment: "parent",
    });
    cropper.resizable({
      containment: "parent",
    });
  },

  actions : {
    cropImage : function() {
      var cropper = $(this.get("element")).find(".image-cropper"),
          x = cropper.css("left"), y = cropper.css("top"),
          h = cropper.height(), w = cropper.width(),
          canvas = $(this.get("element")).find("canvas")[0],
          context = canvas.getContext("2d");
      x = Number(x.match(/^(\d+)px$/)[1]);
      y = Number(y.match(/^(\d+)px$/)[1]);
      context.drawImage($(this.get("element")).find(".the-image")[0], x, y, h, w, 0, 0, h, w);
      this.set("value", canvas.toDataURL());
      this.set("hasImage", false);
      cropper.css("left", 0);
      cropper.css("top", 0);
      cropper.height(100);
      cropper.width(100);
    },
  },

});

return {
};

});

define('form/form-items/csvDataInputView',[
  "ember",
  "lib/ember-utils-core",
  "lazy-display/main",
  "./fileUploadView",
  "./multipleValueMixin",
  "./multipleValue",
], function(Ember, Utils, LazyDisplay, FileUploadView, MultipleValueMixin, MultipleValue) {

/**
 * Input to accept csv data. Can be uploaded from a file or entered manually. INCOMPLETE!
 *
 * @class Form.CSVDataInputView
 * @extends Form.FileUploadView
 * @module form
 * @submodule form-items
 */
//TODO : find a better way to set id
var csvid = 0;
var CSVDataValue = Ember.View.extend(LazyDisplay.LazyDisplayRow, {
  template : Ember.Handlebars.compile('' +
                                      '<div {{bind-attr class=":form-group view.data.isInvalid:has-error view.data.showInput:has-input view.data.showInput:has-feedback :csv-value"}}>' +
                                        '{{#if view.data.showInput}}' +
                                          '{{view Ember.TextField class="form-control input-sm" value=view.data.val}}' +
                                          '<span {{bind-attr class=":form-control-feedback"}}></span>' +
                                        '{{else}}' +
                                          '<p class="form-control-static">{{view.data.val}}</p>' +
                                        '{{/if}}' +
                                      '</div>' +
                                      ''),

  data : null,
});

var CSVEntry = MultipleValue.MultipleValue.extend({
  val : function(key, value) {
    var col = this.get("col");
    if(arguments.length > 1) {
      if(!Ember.isNone(col)) {
        var validation = col.validateValue(value, null, col.get("validation.eachValidations"));
        if(validation[0]) {
          this.set("isInvalid", true);
          if(!this.get("validated")) {
            this.set("showInput", true);
          }
        }
        else {
          this.set("isInvalid", false);
        }
        this.set("validated", true);
      }
      return value;
    }
  }.property('col'),
  showInput : false,
  validated : false,
  col : null,
});

var CSVDataDummyValue = Ember.View.extend(LazyDisplay.LazyDisplayDummyRow, {
  classNames : ["csv-dummy-value"],
  template : Ember.Handlebars.compile(''),
});

var CSVDataValues = Ember.ContainerView.extend(LazyDisplay.LazyDisplayMainMixin, {
  getRowView : function(row) {
    return CSVDataValue.create({
      data : row,
    });
  },

  getDummyView : function() {
    return CSVDataDummyValue.create();
  },
});

var CSVDataInputView = FileUploadView.FileUploadView.extend(MultipleValueMixin.MultipleValueMixin, {
  template : Ember.Handlebars.compile('' +
                                      '{{view.columnData.form.description}}' +
                                      '{{#if view.hasFile}}' +
                                        '{{view.fileName}} ({{view.valuesCount}} {{view.columnData.form.entityPlural}})' +
                                        '<button class="btn btn-link" {{action "remove" target="view"}}>Remove</button> | ' +
                                        '<button class="btn btn-link" {{action "replace" target="view"}}>Replace</button>' +
                                        '{{view "lazyDisplay/lazyDisplay" classNameBindings=":form-sm :csv-values-wrapper" columnDataGroup=view.columnDataGroup rows=view.valuesTransformed}}' +
                                      '{{else}}' +
                                        '{{textarea class="form-control" autofocus="view.columnData.form.autofocus" value=view.csvVal rows=view.columnData.rows cols=view.columnData.cols ' +
                                                                        'placeholder=view.columnData.form.placeholderActual maxlength=view.columnData.form.maxlength ' +
                                                                        'readonly=view.columnData.form.readonly}}' +
                                        '<div class="upload-help-text">'+
                                        '<button class="btn btn-default" {{action "loadFile" target="view"}} {{bind-attr disabled="view.disableBtn"}}>{{view.columnData.form.btnLabel}}</button>' +
                                        '</div>'+
                                      '{{/if}}' +
                                      '<input class="hidden" type="file" name="files[]" {{bind-attr accept="view.columnData.form.accept"}}>' +
                                      ''),

  /*lazyDisplayConfig : LazyDisplay.LazyDisplayConfig.create({
    rowHeight : 28,
    lazyDisplayMainClass : "CSVDataValues",
  }),*/
  hasFile : false,

  values : Utils.hasMany(CSVEntry),
  valuesTransformed : function() {
    var values = this.get("values"), valuesTransformed = [];
    valuesTransformed.pushObjects(values.filterBy("showInput", true));
    valuesTransformed.pushObjects(values.filterBy("showInput", false));
    //console.log("valuesTransformed");
    return valuesTransformed;
  }.property("view.values.@each.showInput", "values.@each.showInput"),
  setToValues : function(value) {
    var columnData = this.get("columnData"), values = value.split(new RegExp(columnData.get("splitRegex")));
    //this.set("value", value);
    for(var i = 0; i < values.length;) {
      if(Ember.isEmpty(values[i])) {
        values.splice(i, 1);
      }
      else {
        values.splice(i, 1, {columnData : columnData, value : values[i++]});
      }
    }
    this.set("values", values);
  },

  csvVal : function(key, value) {
    var columnData = this.get("columnData"), that = this;
    if(arguments.length > 1) {
      //calculate 'values' after a delay to avoid multiple calcuations for every keystroke
      Timer.addToQue("csvvalues-"+columnData.get("name"), 1500).then(function() {
        if(!that.get("isDestroyed")) {
          that.setToValues(value);
        }
      });
      return value;
    }
    else {
      var values = this.get("values");
      return values && values.mapBy("value").join(", ");
    }
  }.property("view.values.@each", "values.@each", "view.row", "row"),

  recordChangeHook : function() {
    this._super();
    this.set("hasFile", false);
    //this.set("csvVal", "");
    //this.set("values", []);
    //the validation happens after a delay. so initially set invalid to true if its a new record else false
    this.set("invalid", this.get("record.isNew"));
  },

  postRead : function(data) {
    this.setToValues(data);
    this.set("hasFile", true);
  },

  postFail : function(message) {
    this.set("hasFile", false);
  },

  actions : {
    remove : function() {
      this.set("hasFile", false);
      this.set("csvVal", "");
      this.setToValues("");
    },

    replace : function() {
      $(this.get("element")).find("input[type='file']").click();
    },
  },
});

return {
  CSVDataInputView : CSVDataInputView,
};

});

define('form/form-items/radioInputView',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Basic radio button view.
 *
 * @class Form.RadioInputView
 * @module form
 * @submodule form-items
 */
var RadioInputView = Ember.View.extend({
  tagName : "input",
  type : "radio",
  attributeBindings : [ "name", "type", "value", "checked:checked" ],
  click : function() {
    this.set("selection", this.$().val());
  },
  checked : function() {
    return this.get("value") == this.get("selection");
  }.property('selection')
});

return {
  RadioInputView : RadioInputView,
};

});

define('form/form-items/groupRadioButtonView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for a group of radio buttons.
 *
 * @class Form.GroupRadioButtonView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var GroupRadioButtonView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('' +
    '{{#each view.columnData.form.options}}' +
      '<div {{bind-attr class="radio view.columnData.form.displayInline:radio-inline"}}>' +
        '<label>{{view "form/radioInput" name=view.groupName value=this.value selection=view.value}}<span></span>{{{this.label}}}</label>' +
      '</div>' +
    '{{/each}}' +
  ''),
  groupName : function(){
    return Utils.getEmberId(this);
  }.property(),
});


return {
  GroupRadioButtonView : GroupRadioButtonView,
};

});

define('form/form-items/checkBoxView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for checkbox input.
 *
 * @class Form.CheckBoxView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var CheckBoxView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('<div class="checkbox"><label>{{view "checkbox" checked=view.value disabled=view.isDisabled}}<label></label> {{view.columnData.form.checkboxLabel}}</label></div>'),
});

return {
  CheckBoxView : CheckBoxView,
};

});

define('form/form-items/groupCheckBoxView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View for a group of checkbox which translated to a single attribute.
 *
 * @class Form.GroupCheckBoxView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var GroupCheckBoxView = TextInputView.TextInputView.extend({
  template : Ember.Handlebars.compile('{{#each view.newCheckList}}<div {{bind-attr class="checkbox col-md-4 view.columnData.form.displayInline:checkbox-inline"}}>'
    + '<label>{{view "checkbox" checked=this.checked disabled=view.isDisabled}}<label></label> {{this.checkboxLabel}}</label></div>{{/each}}'),

  checkBoxDidChange : function (){
    var checkList = this.get("newCheckList");
    this.set("value", checkList.filterBy("checked", true).mapBy("id").join(","));
  }.observes('newCheckList.@each.checked'),

  newCheckList : function() {
    var ncl = Ember.A(), ocl = this.get("columnData.form.checkList"),
        list = this.get("record").get(this.get("columnData").name).split(",");
    for(var i = 0; i < ocl.get("length") ; i++) {
      var op = JSON.parse(JSON.stringify(ocl[i], ["checkboxLabel", "id"]));
      if(list.indexOf(op.id+"") == -1) {
        op.checked = false;
      }
      else op.checked = true;
      ncl.pushObject(Ember.Object.create(op));
    }
    return ncl;
  }.property('view.columnData.checkList'),

  notifyValChange : function(obj, value) {
    this._super();
    var list = this.get("record").get(this.get("columnData").name).split(","),
        newCheckList = this.get("newCheckList");
    if(newCheckList) {
      newCheckList.forEach(function(ele){
        if(list.indexOf(ele.get("id")+"")==-1){
          ele.set("checked",false);
        }
        else ele.set("checked",true);
      },this);
    }
  },
});

return {
  GroupCheckBoxView : GroupCheckBoxView,
};

});

define('form/form-items/labelView',[
  "ember",
  "lib/ember-utils-core",
  "./textInputView",
], function(Ember, Utils, TextInputView) {

/**
 * View to put a lable.
 *
 * @class Form.LabelView
 * @extends Form.TextInputView
 * @module form
 * @submodule form-items
 */
var LabelView = TextInputView.TextInputView.extend({
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('<label>{{view.columnData.label}}</label>'),
  columnData : null,
  record : null,
});

return {
  LabelView : LabelView,
};

});

define('form/form-items/legendView',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * View for legend tag.
 *
 * @class Form.Legend
 * @module form
 * @submodule form-items
 */
var LegendView = Ember.View.extend({
  classNameBindings : ['columnData.disabled:hidden'],
  template : Ember.Handlebars.compile('<legend>{{view.columnData.label}}</legend>'),
  columnData : null,
  record : null,
});

return {
  LegendView : LegendView,
};

});

define('form/form-items/wrapperView',[
  "ember",
  "lib/ember-utils-core",
], function(Ember, Utils) {

/**
 * Extend this to add extra content before views like Form.MultiEntryView or Form.MultiInputView.
 *
 * @class Form.WrapperView
 * @module form
 * @submodule form-items
 */
var WrapperView = Ember.View.extend({
  childView : function() {
    var columnData = this.get("columnData");
    return Form.TypeToCellNameMap[columnData.get("childCol").type];
  }.property("view.columnData.childCol.type"),
  layout : Ember.Handlebars.compile('{{yield}}'),
  template : Ember.Handlebars.compile('{{create-view view.childView record=view.record columnData=view.columnData.childCol parentForm=view.parentForm immediateParent=view.immediateParent}}'),
});

return {
  WrapperView : WrapperView,
};

});

/**
 * Module with all the form items.
 *
 * @submodule form-items
 * @module form
 */

define('form/form-items/main',[
  "./textInputView",
  "./textAreaView",
  "./multipleValue",
  "./multipleValueMixin",
  "./multiEntryView",
  "./multiInputView",
  "./emberSelectViewFix",
  "./staticSelectView",
  "./dynamicSelectView",
  "./fileUploadView",
  "./imageUploadView",
  "./csvDataInputView",
  "./radioInputView",
  "./groupRadioButtonView",
  "./checkBoxView",
  "./groupCheckBoxView",
  "./labelView",
  "./legendView",
  "./wrapperView",
], function() {
  var FormItems = Ember.Namespace.create();

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        FormItems[k] = arguments[i][k];
      }
    }
  }

  FormItems.TypeToCellNameMap = {
    textInput             : "form/textInput",
    textareaInput         : "form/textArea",
    staticSelect          : "form/staticSelect",
    dynamicSelect         : "form/dynamicSelect",
    label                 : "form/label",
    legend                : "form/legend",
    fileUpload            : "form/fileUpload",
    imageUpload           : "form/imageUpload",
    csvData               : "form/csvDataInput",
    multiEntry            : "form/multiEntry",
    multiInput            : "form/multiInput",
    checkBox              : "form/checkBox",
    textareaSelectedInput : "form/textAreaSelected",
    groupRadioButton      : "form/groupRadioButton",
    groupCheckBox         : "form/groupCheckBox",
    sectionHeading        : "form/mediumHeading",
  };

  return FormItems;
});

/**
 * A module for a form.
 *
 * @module form
 */
define('form/main',[
  "./formView",
  "./multiColumnMixin",
  "./form-column-data/main",
  "./form-items/main",
], function() {
  var Form = Ember.Namespace.create();
  window.Form = Form;

  for(var i = 0; i < arguments.length; i++) {
    for(var k in arguments[i]) {
      if(arguments[i].hasOwnProperty(k)) {
        Form[k] = arguments[i][k];
      }
    }
  }

  return Form;
});

define('misc/alerts',[
  "ember",
], function(Ember) {

/**
 * Alert module for all stuff related to alerts.
 *
 * @module alerts
 */

Alerts = Ember.Namespace.create();
Alerts.AlertTypeMap = {
  info : {
    alertClass : 'alert-info',
    glyphiconClass : 'glyphicon-info-sign',
  },
  success : {
    alertClass : 'alert-success',
    glyphiconClass : 'glyphicon-ok-sign',
  },
  warning : {
    alertClass : 'alert-warning',
    glyphiconClass : 'glyphicon-warning-sign',
  },
  error : {
    alertClass : 'alert-danger',
    glyphiconClass : 'glyphicon-exclamation-sign',
  },
};

/**
 * View for alert message.
 * Usage : 
 *
 *     {{alert-message type="info" title="Title" message="Message"}}
 *
 * @class Alerts.AlertMessageComponent
 */
Alerts.AlertMessageComponent = Ember.Component.extend({
  init : function() {
    this._super();
    this.set("switchOnMessageListener", true);
  },

  /**
   * Type of alert message. Possible values are "success", "warning", "info", "error"
   *
   * @property type
   * @type String
   * @default "error"
   */
  type : 'error',

  /**
   * Title of the alert message.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Alert message.
   *
   * @property message
   * @type String
   */
  message : function(key, value) {
    if(arguments.length > 1) {
      if(!Ember.isEmpty(value) && this.get("switchOnMessageListener")) {
        var timeout = this.get("collapseTimeout"), that = this;
        this.set("showAlert", true);
        if(!Ember.isEmpty(timeout) && timeout > 0) {
          Timer.addToQue(this.get("elementId"), timeout).then(function() {
            that.set("showAlert", false);
          });
        }
      }
      else {
        this.set("showAlert", false);
      }
      return value;
    }
  }.property(),
  switchOnMessageListener : false,

  /**
   * Timeout after which to collapse the alert message. 0 to disable.
   *
   * @property collapseTimeout
   * @type Number
   * @default 0
   */
  collapseTimeout : 0,

  typeData : function() {
    var type = this.get("type");
    return Alerts.AlertTypeMap[type] || Alerts.AlertTypeMap.error;
  }.property('type'),

  showAlert : false,

  click : function(e) {
    if($(e.target).filter("button.close").length > 0) {
      var that = this;
      Ember.run(function() {
        that.set("showAlert", false);
      });
    }
  },

  classNameBindings : [":alert", "typeData.alertClass", ":fade", "showAlert:in"],

  layout : Ember.Handlebars.compile('' +
    '<button class="close">&times;</button>' +
    '<strong><span {{bind-attr class=":glyphicon typeData.glyphiconClass :btn-sm"}}></span>' +
    '<span class="alert-title">{{title}}</span></strong> <span class="alert-message">{{message}}</span>' +
    '{{yield}}' +
  ''),
});

Ember.Handlebars.helper("alert-message", Alerts.AlertMessageComponent);

return Alerts;

});

define('misc/app-wrapper',[
  "ember",
], function(Ember) {

/**
 * A module for wrapper over Ember.Application which initializes a few things automatically
 * 
 * @module app-wrapper
 */

AppWrapper = Ember.Namespace.create();

/**
 * A wrapper class over Ember.Application which initializes CrudAdapter and ColumnData.
 *
 * @class AppWrapper.AppWrapper
 */
AppWrapper.AppWrapper = Ember.Application.extend({
  init : function() {
    this._super();
    CrudAdapter.loadAdaptor(this);
  },

  ready : function() {
    this._super();
    ColumnData.initializer(this);
  },
});

return AppWrapper;

});

define('misc/popover',[
  "ember",
], function(Ember) {

/**
 * Module for popovers.
 *
 * @module popover
 */
Popovers = Ember.Namespace.create();

/**
 * Component for popover.
 * Usage:
 *
 *     {{#pop-over title="Title" body="Body of the popover"}}Some body{{/pop-over}}
 *
 * @class Popovers.PopoverComponent
 */
Popovers.PopoverComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'trigger:data-trigger', 'title:data-original-title', 'body:data-content', 'delay:data-delay', 'role'],

  /**
   * Property to enable animation. Can have "true"/"false".
   *
   * @property animation
   * @type String
   * @default "true"
   */
  animation : "true",

  /**
   * Placement of the popover. Can have "top"/"right"/"bottom"/"left".
   *
   * @property placement
   * @type String
   * @default "top"
   */
  placement : "top",

  /**
   * The trigger of the popover. Can have "click"/"hover"/"focus". Multiple triggers can be passed seperated with space.
   *
   * @property trigger
   * @type String
   * @default "click"
   */
  trigger : "click",

  /**
   * Title of the tooltip.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Body of the tooltip.
   *
   * @property body
   * @type String
   */
  body : "",

  /**
   * Delay to display tooltip.
   *
   * @property delay
   * @type Number
   * @default 0
   */
  delay : 0,

  role : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),

  didInsertElement : function() {
    $(this.get("element")).popover();
  },
});

Ember.Handlebars.helper('pop-over', Popovers.PopoverComponent);

return Popovers;

});

define('misc/progress-bars',[
  "ember",
], function(Ember) {

/**
 * Progress bar module.
 *
 * @module progress-bar
 */
ProgressBars = Ember.Namespace.create();
ProgressBars.StyleMap = {
  "success" : {
    "class" : "progress-bar-success",
  },
  "info" : {
    "class" : "progress-bar-info",
  },
  "warning" : {
    "class" : "progress-bar-warning",
  },
  "error" : {
    "class" : "progress-bar-danger",
  },
};

/**
 * View for progress bars.
 * Used as:
 *
 *     {{#progress-bar maxVal=150 minVal=50 val=100 style="info" animated=true striped=true}}{{val}}/{{maxVal}}{{/progress-bar}}
 *
 * @class ProgressBars.ProgressBar
 */
ProgressBars.ProgressBar = Ember.Component.extend({
  classNames : ["progress"],

  /**
   * Max value for the progress.
   *
   * @property maxVal
   * @type Number
   * @default 100
   */
  maxVal : 100,

  /**
   * Min value for the progress.
   *
   * @property minVal
   * @type Number
   * @default 0
   */
  minVal : 0,

  /**
   * Cur value for the progress.
   *
   * @property val
   * @type Number
   * @default 0
   */
  val : 0,

  /**
   * Style of the progress bar. Can be default/success/info/error/warning.
   *
   * @property style
   * @type String
   * @default ""
   */
  style : "",
  styleClass : function() {
    var style = ProgressBars.StyleMap[this.get("style")];
    return style && style["class"];
  }.property("style"),

  /**
   * Property to enable striped progress bar.
   *
   * @property striped
   * @type Boolean
   * @default false
   */
  striped : false,

  /**
   * Property to enable animated progress bar.
   *
   * @property striped
   * @type Boolean
   * @default false
   */
  animated : false,

  progressStyle : function() {
    var maxVal = this.get("maxVal"), minVal = this.get("minVal"), val = this.get("val"),
        v = ( Number(val) - Number(minVal) ) * 100 / ( Number(maxVal) - Number(minVal) );
    return "width: "+v+"%;";
  }.property("val", "maxVal", "minVal"),

  layout : Ember.Handlebars.compile('' +
    '<div role="progressbar" {{bind-attr aria-valuenow=val aria-valuemin=minVal aria-valuemax=maxVal style=progressStyle ' +
                                        'class=":progress-bar styleClass striped:progress-bar-striped animated:active"}}>' +
      '<div class="progressbar-tag">{{yield}}</div>' +
    '</div>' +
  ''),
});

Ember.Handlebars.helper('progress-bar', ProgressBars.ProgressBar);

return ProgressBars;

});

define('misc/tooltips',[
  "ember",
], function(Ember) {

/**
 * Module for the tooltip component.
 *
 * @module tooltip
 */

Tooltip = Ember.Namespace.create();

/**
 * Component for the tooltip.
 * Usage:
 *
 *     {{#tool-tip title="Tooltip"}}Heading{{/tool-tip}}
 */
Tooltip.TooltipComponent = Ember.Component.extend({
  attributeBindings : ['animation:data-animation', 'placement:data-placement', 'title', 'delay:data-delay', 'type'],

  /**
   * Property to enable animation. Can be "true"/"false"
   *
   * @property animation
   * @type String
   * @default "true"
   */
  animation : "true",

  /**
   * Placement of the tooltip. Can be "top"/"right"/"bottom"/"left".
   *
   * @property placement
   * @type String
   * @default "top"
   */
  placement : "top",

  /**
   * Title of the tooltip.
   *
   * @property title
   * @type String
   */
  title : "",

  /**
   * Delay to display tooltip.
   *
   * @property delay
   * @type Number
   * @default 0
   */
  delay : 0,

  type : "button",
  layout : Ember.Handlebars.compile('{{yield}}'),
  tagName : "span",

  didInsertElement : function() {
    $(this.get("element")).tooltip();
  },
});

Ember.Handlebars.helper('tool-tip', Tooltip.TooltipComponent);

return Tooltip;

});

define('misc/main',[
  "./alerts",
  "./app-wrapper",
  "./popover",
  "./progress-bars",
  "./tooltips",
], function() {
});

define('ember-utils',[
  "ember",
  "bootstrap",
  "./column-data/main",
  "./timer/main",
  "./array-modifier/main",
  "./crud-adapter/main",
  "./drag-drop/main",
  "./global-module/main",
  "./list-group/main",
  "./tree/main",
  "./panels/main",
  "./lazy-display/main",
  "./form/main",
  "./misc/main",
], function() {
});


require(["ember-utils"]);
})();
