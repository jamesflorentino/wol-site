var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var units = require('./units');

module.exports = (function(){
    function Game() {
        this.id = utils.uuid();
        this.players = [];
        this.logs = [];
        this.full = false;
        this.units = [];
        events.EventEmitter.call(this);
    }
    util.inherits(Game, events.EventEmitter);
    /**
     * Max total of players before the game starts.
     * @type {Number}
     */
    Game.prototype.MAX_USERS = 1;
    /**
     * Add the users into the list.
     * @param player
     */
    Game.prototype.addUser = function (player) {
        var _this = this;
        this.players.push(player);
        this.log('player.add', {
            id: player.id,
            name: player.name
        });
    };
    Game.prototype.addUnit = function (unit) {
        if (unit && this.units.indexOf(unit) === -1) {
            this.units.push(unit);
            this.log('unit_add', {
                id: unit.id
            });
        }
    };
    /**
     * creates a unit based on code name.
     * @param name
     */
    Game.prototype.createUnit = function(name) {
        var unitAttr = units[name];
        var unit;
        if (unitAttr) {
            unit = new Unit(unitAttr);
            this.addUnit(unit);
        }
        return unit;
    };
    /**
     * Get all connected players.
     * @return {Number}
     */
    Game.prototype.connectedPlayers = function() {
        var total = 0;
        for(var i=0; i<this.players.length; i++) {
            if (this.players[i].connected) {
                total++;
            }
        }
        return total;
    };
    /**
     * Logs the game data into an array for backlog purposes.
     * @param name
     * @param data
     */
    Game.prototype.log = function(name, data) {
        var message = { name: name, data: data };
        this.logs.push(message);
        console.log('message', message);
        this.emit('log', message);
    };
    /**
     * starts the game and sends a few unit into the game.
     */
    Game.prototype.start = function () {
        this.full = true;
        this.createUnit('marine');
    };
    return Game;
})();