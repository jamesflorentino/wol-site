define([
    'wol/utils'
], function() {
    "use strict";

    function Events() {
        this.list = {};
    }

    Events.prototype.on = function(topic, listener) {
        this.list[topic] || (this.list[topic] = []);
        if(isFunction(listener)) {
            this.list[topic].push(listener);
        }
        return this;
    };

    Events.prototype.off = function(topic, listener) {
        var callbacks;
        if (topic === undefined) {
            this.list = {};
        } else if (!isFunction(listener)) {
            this.list[topic] = [];
        } else if (callbacks = this.list[topic]) {
            callbacks.splice(callbacks.indexOf(listener), 1);
        } else {
        }
        return this;
    };

    Events.prototype.emit = function(topic, data) {
        var callbacks, callback, i;
        callbacks = this.list[topic]
        if (isArray(callbacks)) {
            for(i=0; i<callbacks.length; i++) {
                callback = callbacks[i];
                callback.call(this, data);
            }
        }
        return this;
    };
    return Events;

});
