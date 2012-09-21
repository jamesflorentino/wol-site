var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var unitAttributes = require('./unit-attributes');
var Grid = require('./grid');
var Collection = require('./collection');


function Game() {
    this.id = utils.uuid();
    this.players = [];
    this.units = new Collection();
    this.logs = [];
    this.grid = new Grid();
    this.full = false;
    this.grid.generate(this.columns, this.rows);
    events.EventEmitter.call(this);
}

util.inherits(Game, events.EventEmitter);
Game.prototype.columns = 9;
Game.prototype.rows = 9;
Game.prototype.maxCharge = 5;
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
        name: player.name,
        index: this.players.length
    });
    return this;
};
/**
 * Adds a unit in the game.
 * @param unit
 */
Game.prototype.addUnit = function (unit) {
    if (unit && this.units.indexOf(unit) === -1) {
        this.units.add(unit);
    }
    return this;
};

Game.prototype.createUnit = function(name, player) {
    var unitAttr = unitAttributes[name];
    var unit;
    if (unitAttr) {
        unit = new Unit(name, unitAttr);
        unit.playerId = player.id;
        unit.stats.get('recharge').setMax(this.maxCharge);
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
    // 0. Start the game
    this.log('game.start', {id: this.id});
    // 1. Spawn first player's unit
    player = this.players[0];
    unit = this.createUnit('marine', player);
    unit.face('right');
    this.spawnUnit(
        unit,
        this.grid.get(
            0,
            Math.floor(this.rows * 0.5)
        )
    );
    // 2. Spawn second player's unit
    player = this.players[this.players.length-1];
    unit = this.createUnit('marine', player);
    unit.face('left');
    this.spawnUnit(
        unit,
        this.grid.get(
            this.columns - 1,
            Math.floor(this.rows * 0.5)
        )
    );
    // 3. Generate a turn list.
    this.generateTurnList();
    // 4. Announce a unit turn.
};

/**
 * Generate a unit turn list. The iteration sequence starts
 */
Game.prototype.generateTurnList = function() {
    var charge;
    this.turnList = [];
    while(this.turnList.length > 0) {
        this.units.each(function(unit) {
            // Add 1 recharge value.
            charge = unit.recharge(1);
            // if the unit reaches its maximum charge level,
            // Let's push it to the turn List and empty the unit's
            // recharge level.
            if (charge === this.maxCharge) {
                this.turnList.push(unit.id);
                charge.empty();
            }
        }.bind(this));
    }
    this.log('units.turn.list', { turnList: this.turnList } );
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

Game.prototype.playerReady = function(player) {
    player.ready = true;
    this.log('player.ready', {
        id: player.id
    });
    var readyCount = 0;
    for(var i=0; i<this.players.length; i++) {
        if (this.players[i].ready) {
            readyCount++;
        }
    }
    if (readyCount === this.players.length) {
        setTimeout(this.start.bind(this), 1000);
    }
};

module.exports = Game;
