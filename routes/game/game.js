var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var units = require('./units');
var Grid = require('./grid');

module.exports = (function(){
    function Game() {
        this.id = utils.uuid();
        this.players = [];
        this.units = [];
        this.logs = [];
        this.grid = new Grid();
        this.full = false;
        this.grid.generate(8, 8);
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
        if (this.players.length === this.MAX_USERS) {
            this.start();
        }
    };
    /**
     * Adds a unit in the game.
     * @param unit
     */
    Game.prototype.addUnit = function (unit) {
        if (unit && this.units.indexOf(unit) === -1) {
            this.units.push(unit);
            this.log('unit.add', {
                id: unit.id,
                code: unit.code,
                name: unit.name,
                stats: unit.stats.toJSON()
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
            unit = new Unit(name, unitAttr);
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
        this.emit('log', message);
    };
    /**
     * Issue a callback of backlogs.
     * @param cb
     */
    Game.prototype.backlogs = function(cb) {
        if (cb === undefined) return;
        var event;
        for (var i = 0, _len = this.logs.length; i < _len; i++) {
            event = this.logs[i];
            cb(event);
        }
    };
    /**
     * starts the game and sends a few unit into the game.
     */
    Game.prototype.start = function () {
        this.full = true;
        var unit = this.createUnit('marine'); // testing
        unit.move(this.grid.get(0,0));
        this.log('unit.move', {
            id: unit.id,
            tile: {
                x: unit.tile.x,
                y: unit.tile.y
            }
        });
    };
    return Game;
})();