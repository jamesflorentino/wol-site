// # Events
// Creates an event manager which an object can subscribed to.
// * * *

//
define([

    'wol/utils'

], function() {

    "use strict";

    return (function() {

        function Events(entity) {
            this.__events = {};
        }

        Events.prototype.on = function(eventName, callback) {
            this.__events[eventName] || (this.__events[eventName] = []);
            if(isFunction(callback)) {
                this.__events[eventName].push(callback);
            }
            return this;
        };

        Events.prototype.off = function(eventName, callback) {
            var callbacks;
            if (eventName === undefined) {
                this.__events = {};
            } else if (!isFunction(callback)) {
                this.__events[eventName] = [];
            } else if (callbacks = this.__events[name]) {
                callbacks.splice(callbacks.indexOf(callback), 1);
            }
            return this;
        };

        Events.prototype.emit = function(eventName, data) {
            var callbacks, callback, i;
            callbacks = this.__events[eventName]
            if (isArray(callbacks)) {
                for(i=0; i<callbacks.length; i++) {
                    callback = callbacks[i];
                    callback.call(this, data);
                }
            }
            return this;
        };

        return Events;

    })();

});
