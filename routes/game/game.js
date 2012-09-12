var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var unitAttributes = require('./unit-attributes');
var Grid = require('./grid');


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
 * @return {*}
 */
Game.prototype.MAX_USERS = 1;
/**
 * Add the users into the list.
 * @param player
 * @return {*}
 */
Game.prototype.addPlayer = function (player) {
    var _this = this;
    this.players.push(player);
    this.log('player.add', {
        id: player.id,
        name: player.name
    });
    if (this.players.length === this.MAX_USERS) {
        this.start();
    }
    return this;
};
/**
 * Adds a unit in the game.
 * @param unit
 */
Game.prototype.addUnit = function (unit) {
    if (unit && this.units.indexOf(unit) === -1) {
        this.units.push(unit);
    }
    return this;
};

Game.prototype.createUnit = function(name, player) {
    var unitAttr = unitAttributes[name];
    var unit;
    if (unitAttr) {
        unit = new Unit(name, unitAttr);
        unit.playerId = player.id;
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
 * @return {*}
 */
Game.prototype.log = function(name, data) {
    var message = { name: name, data: data };
    setTimeout(function() {
        this.logs.push(message);
        this.emit('log', message);
    }.bind(this), this.__callDelay || 0);
    return this;
};
/**
 * Issue a callback of backlogs.
 * @param cb
 * @return {*}
 */
Game.prototype.backlogs = function(cb) {
    if (cb === undefined) return;
    var event;
    for (var i = 0, _len = this.logs.length; i < _len; i++) {
        event = this.logs[i];
        cb(event);
    }
    return this;
};
/**
 * Delays the next function call
 * @param ms
 * @return {*}
 */
Game.prototype.wait = function (ms) {
    this.__callDelay = ms;
    return this;
};
/**
 * starts the game and sends a few unit into the game.
 */
Game.prototype.start = function () {
    this.full = true;
    // test units
    var unit;
    var player;
    player = this.players[0];
    unit = this.createUnit('marine', player);
    unit.face('right');
    this.spawnUnit(unit, this.grid.get(0,4));
};
/**
 * Spawns a unit in the game.
 * @param unit
 * @param tile
 */
Game.prototype.spawnUnit = function (unit, tile) {
    unit.move(tile);
    this.log('unit.spawn', {
        id: unit.id,
        name: unit.name,
        code: unit.code,
        playerId: unit.playerId,
        x: unit.tile.x,
        y: unit.tile.y,
        stats: unit.stats.toJSON(),
        direction: unit.direction
    });
};
/**
 * Move a unit to a tile
 * @param unit
 * @param tile
 */
Game.prototype.moveUnit = function (unit, tile) {
    unit.move(tile);
    this.log('unit.move', {
        id: unit.id,
        x: unit.tile.x,
        y: unit.tile.y
    });
};

module.exports = Game;