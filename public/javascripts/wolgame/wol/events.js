(function() {

    var utils = {
        isFunction: function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },
        isArray: function(obj) {
            return !!(obj && obj.push && obj.splice);
        }
    };

    var Module = (function() {
        function Events() {
            this.list = {};
        }
        Events.prototype = {
            on : function(topic, listener) {
                this.list[topic] || (this.list[topic] = []);
                if(utils.isFunction(listener)) {
                    this.list[topic].push(listener);
                }
                return this;
            },

            off : function(topic, listener) {
                var callbacks;
                if (topic === undefined) {
                    this.list = {};
                } else if (!utils.isFunction(listener)) {
                    this.list[topic] = [];
                } else if (callbacks = this.list[topic]) {
                    callbacks.splice(callbacks.indexOf(listener), 1);
                } else {
                }
                return this;
            },

            emit : function(topic, data) {
                var callbacks, callback, i;
                callbacks = this.list[topic]
                if (utils.isArray(callbacks)) {
                    for(i=0; i<callbacks.length; i++) {
                        callback = callbacks[i];
                        callback.call(this, data);
                    }
                }
                return this;
            }
        };
        return Events;
    })();

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