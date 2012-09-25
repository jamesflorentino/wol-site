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
Game.prototype.maxTurnList = 10;
Game.prototype.activeUnit = null;
/**
 * Max total of players before the game starts.
 * @type {Number}
 * @return {*}
 */
Game.prototype.MAX_USERS = 2;
/**
 * Add the users into the list.
 * @param player
 * @return {*}
 */
Game.prototype.addPlayer = function (player) {
    this.players.push(player);
    this.log('player.add', {
        id: player.id,
        name: player.name,
        index: this.players.length
    });
    if (this.players.length === this.MAX_USERS) {
        this.log('game.start', {
            id: this.id
        });
    }
    return this;
};
/**
 * Adds a unit in the game.
 * @param unit
 */
Game.prototype.addUnit = function (unit) {
    if (unit && !this.units.has(unit)) {
        this.units.add(unit);
    }
    return this;
};

/**
 *
 * @param name
 * @param player
 * @return {*}
 */
Game.prototype.createUnit = function(name, player) {
    var unitAttr = unitAttributes[name];
    var unit;
    var recharge;
    if (unitAttr) {
        unit = new Unit(name, unitAttr);
        unit.playerId = player.id;
        recharge = unit.stats.get('recharge');
        recharge.setMax(this.maxCharge);
        recharge.empty();
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
        cb(event.name, event.data);
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
    console.log('----------------> GAME START', this.id);
    // 0. Start the game
    // this.log('game.start', {id: this.id});
    // 1. Spawn first player's unit
    player = this.players[0];
    unit = this.createUnit('marine', player);
    unit.face('right');
    unit.stats.get('recharge').setValue(1);
    this.spawnUnit(unit,
        this.grid.get(
            0,
            Math.floor(this.rows * 0.5)
        )
    );
    // 2. Spawn second player's unit
    player = this.players[this.players.length-1];
    unit = this.createUnit('marine', player);
    unit.face('left');
    unit.stats.get('recharge').setValue(2);
    this.spawnUnit(
        unit,
        this.grid.get(
            this.columns - 1,
            Math.floor(this.rows * 0.5)
        )
    );
    // 3. Generate a turn list.
    this.calculateTurnList();
    // 4. Announce a unit turn.
};

/**
 * Generate a unit turn list. The iteration sequence starts
 */
Game.prototype.calculateTurnList = function() {
    this.turnList = [];
    var i = 0;
    var unit;
    var interval;
    var recharge;
    var calculate = function () {
        for (i = 0; i < this.units.length; i++) {
            unit = this.units.at(i);
            unit.recharge(1);
            recharge = unit.stats.get('recharge');
            if (recharge.value === this.maxCharge) {
                console.log('| max charge reached: ', unit.id);
                recharge.empty();
                this.turnList.push(unit.id);
                if (this.turnList.length === this.maxTurnList) {
                    clearInterval(interval);
                    this.log('units.turn.list', {
                        turnList: this.turnList
                    });
                    this.unitTurn();
                    break;
                }
            }
        }
    }.bind(this);
    this.activeUnit = null;
    interval = setInterval(calculate, 10);
};

Game.prototype.unitTurn = function() {
    var unit,
        id = this.turnList.shift()
        ;
    if (unit = this.units.get(id)) {
        this.activeUnit = unit;
        this.log('unit.turn', {
            id: unit.id
        });
    } else {
        this.calculateTurnList();
    }
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

Game.prototype.playerReady = function(player) {
    player.ready = true;
    this.log('player.ready', {
        id: player.id
    });
    var totalPlayers = this.players.length;
    var readyCount = 0;
    console.log('');
    console.log("PLAYER READY!!!!!   ");
    console.log('');
    if (!this.started && totalPlayers === this.MAX_USERS) {
        for(var i=0; i<totalPlayers; i++) {
            if (this.players[i].ready) {
                readyCount++;
            }
        }
        if (readyCount === totalPlayers) {
            console.log('READY COUNT',  readyCount, ' :', totalPlayers);
            this.started = true;
            setTimeout(this.start.bind(this), 100);
        }
    }
};

/**
 *
 * @param unit
 * @param tile
 * @param correction - if the client needs to skip the animation.
 */
Game.prototype.move = function(unit, tile, correction) {
    unit.move(tile);
    this.log('unit.move', {
        id: unit.id,
        x: unit.tile.x,
        y: unit.tile.y,
        correction: correction
    });
};

Game.prototype.skip = function(unitId) {
    var unit;
    if (unit = this.units.get(unitId)) {
        if (this.activeUnit === unit) {
            this.log('unit.skip', {
                id: unit.id
            });
            this.unitTurn();
        }
    }

}
module.exports = Game;
