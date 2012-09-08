define(function() {
    "use strict";

    window.isFunction = function(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    };

    window.isArray = function(obj) {
        return !!(obj && obj.push && obj.splice);
    };

});
