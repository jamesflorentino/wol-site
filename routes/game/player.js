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
        this.ready = false;
        events.EventEmitter.call(this);
    }
    util.inherits(Player, events.EventEmitter);

    Player.prototype.name = null;
    /**
     * The socket connection that this object will use for client-side
     * communication.
     * @type {*}
     */
    Player.prototype.socket = null;

    /**
     * A supposed constant variable that tells how long the player object will take
     * to expire.
     * @type {Number}
     */
    //Player.prototype.MAX_LIFE = 1000 * 60 * 60 * 24; // 1 day.
    Player.prototype.MAX_LIFE = 1000; // 1 second lol
    /**
     * Tells if the user is connected  or not.
     * @type {null}
     */
    Player.prototype.connected = null;
    /**
     * Flags the client as connected. It is used to determine if the player is online.
     * Also removes the timeout event from being fired.
     */
    Player.prototype.connect = function (socket) {
        this.socket = socket;
        this.connected = true;
        this.emit('connect', this);
        clearTimeout(this.timeoutRemoveID);
    };
    /**
     * Issues a countdown when called. It's meant to remove players from memory,
     * if they haven't gone back to the game again.
     * I'm not storing them on the database so this makes sense at the moment.
     */
    Player.prototype.disconnect = function() {
        this.socket = null;
        this.connected = false;
        this.emit('disconnect', this);
        this.expiresIn = new Date().getTime() + this.MAX_LIFE;
        clearTimeout(this.timeoutRemoveID);
        this.timeoutRemoveID = setTimeout(this.remove.bind(this), this.MAX_LIFE);
    };
    /**
     * Tells all the callbacks to remove this player instance from their memory.
     */
    Player.prototype.remove = function () {
        this.emit('remove', this);
    };

    return Player;
})();