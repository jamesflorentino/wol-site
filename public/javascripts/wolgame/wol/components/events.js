define('wol/components/events', function(require) {
    var wol = require('wol/wol'),
        Events = require('wol/events');
    wol.components.add('events', function(entity) {
        var events = new Events();
        entity.on = function(name, cb) {
            events.on(name, cb);
        };
        entity.off = function(name, cb) {
            events.off(name, cb);
        };
        entity.emit = function() {
            events.emit.apply(events, arguments);
        };
    });
})
