var utils = require('./utils');
var events = require('events');
var util = require('util');

module.exports = (function(){
    function Player() {
        this.id = utils.uuid();
        this.name = null;
        this.authKey = utils.guid();
        this.connected = true;
        events.EventEmitter.call(this);
    }
    util.inherits(Player, events.EventEmitter);

    Player.prototype.name = null;
    return Player;
})();