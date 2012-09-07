var utils = require('./utils');
var events = require('events');
var util = require('util');

module.exports = (function(){
    function Player() {
        this.id = utils.uuid();
        this.name = null;
        this.authKey = utils.guid();
        this.connected = true;
        this.expiresIn = new Date().getTime() + this.MAX_LIFE;
        events.EventEmitter.call(this);
    }
    util.inherits(Player, events.EventEmitter);

    Player.prototype.name = null;

    Player.prototype.MAX_LIFE = 1000 * 60 * 60 * 24; // 1 day.
    /**
     * Flags the client as connected. It is used to determine if the player is online.
     * Also removes the timeout event from being fired.
     */
    Player.prototype.connect = function () {
        this.connected = true;
        this.emit('connect', this);
        console.log('player {' + this.id +'}: clearing remove timeout.');
        clearTimeout(this.timeoutRemove);
    };
    /**
     * Issues a countdown when called. It's meant to remove players from memory, if they haven't gone back
     * to the game again. I'm not storing them on the database so this makes sense at the moment.
     */
    Player.prototype.disconnect = function() {
        this.connected = false;
        this.emit('disconnect', this);
        this.expiresIn = new Date().getTime() + this.MAX_LIFE;
        clearTimeout(this.timeoutRemove);
        console.log('player {' + this.id +'}: starting remove timeout.');
        this.timeoutRemove = setTimeout(this.remove.bind(this), this.MAX_LIFE);
    };
    /**
     * Tells all the callbacks to remove this player instance from their memory.
     */
    Player.prototype.remove = function () {
        this.trigger('remove', this);
    };
    return Player;
})();