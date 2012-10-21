define(function(require, exports, module) {
    "use strict";

    var Module = {
        isFunction: function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },
        isArray: function(obj) {
            return !!(obj && obj.push && obj.splice);
        },
        wait: function (ms, cb) {
            return setTimeout(cb, ms);
        }
    };

    return module.exports = Module;
});