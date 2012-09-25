(function() {
    "use strict";

    var Module = {
        isFunction: function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },
        isArray: function(obj) {
            return !!(obj && obj.push && obj.splice);
        }
    };

    // For AMD libraries like RequireJS.
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() {
            return Module;
        });
    }
    // For Node.js and Ringo.js
    if (typeof module == 'object' && module) {
        module.exports = Module;
    }
})();