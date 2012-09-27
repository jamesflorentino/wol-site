var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var unitAttributes = require('./unit-attributes');
var Grid = require('./grid');
var Collection = require('./collection');


function Game() {
    this.id = utils.uuid();
    this.players = new Collection();
    this.deadUnits = [];
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
Game.prototype.winner = null;
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
    this.players.add(player);
    this.log('player.add', {
        id: player.id,
        name: player.name,
        index: this.players.length
    });
    console.log('Total players::::::::::::::::', this.players.length);
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
        if (this.players.at(i).connected) {
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
    player = this.players.at(0);
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
    player = this.players.at(this.players.length-1);
    unit = this.createUnit('marine', player);
    unit.face('left');
    unit.stats.get('recharge').setValue(2);
    this.spawnUnit(
        unit,
        this.grid.get(
            //this.columns - 1,
            1,
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
    var interval;
    var _this = this;
    var calculate = (function () {
        var unit;
        var i;
        var recharge;
        var totalUnits;
        if ((totalUnits = _this.units.length) > 1) {
            for (i = 0; i < totalUnits; i++) {
                unit = _this.units.at(i);
                unit.recharge();
                recharge = unit.stats.get('recharge');
                // if the unit reaches full charge, re-start his gauge and it
                // to the list.
                if (recharge.value === _this.maxCharge) {
                    recharge.empty();
                    _this.turnList.push(unit.id);
                    if (_this.turnList.length === _this.maxTurnList) {
                        clearInterval(interval);
                        _this.log('units.turn.list', {
                            turnList: _this.turnList
                        });
                        _this.unitTurn();
                        break;
                    }
                }
            }
        } else {
            // declare the winner if there's only one unit left.
            this.endGame(unit.playerId);
            clearInterval(interval);
        }
    });
    this.activeUnit = null;
    interval = setInterval(calculate, 10);
};

Game.prototype.unitTurn = function() {
    var unit,
        id = this.turnList.shift()
        ;
    // check if there's still a queue in the turn list.
    if (unit = this.units.get(id)) {
        // skip unit if it has died already.
        if (unit.stats.get('health').value > 0) {
            unit.stats.get('actions').reset();
            this.activeUnit = unit;
            this.log('unit.turn', {
                id: unit.id
            });
        } else {
            this.unitTurn();
        }
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
            if (this.players.at(i).ready) {
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

Game.prototype.userDisconnect = function() {
    this.log('game.end', {
        type: 'player.leave',
        message: 'Your opponent left the game.'
    })
};

/**
 *
 * @param unit
 * @param tile
 * @param correction - if the client needs to skip the animation.
 */
Game.prototype.move = function(unit, tile, correction) {
    var actionStat = unit.stats.get('actions');
    var actions = actionStat.value;
    if (actions > 0) {
        actionStat.setValue(actions - 1);
        unit.move(tile);
        this.log('unit.move', {
            id: unit.id,
            x: unit.tile.x,
            y: unit.tile.y,
            correction: correction
        });
        this.checkActions(unit);
    }
};

Game.prototype.attack = function(unit, target) {
    var actionStat = unit.stats.get('actions');
    var damageStat = unit.stats.get('damage');
    var healthStat = target.stats.get('health');

    if (actionStat.value > 0 && healthStat.value > 0) {
        actionStat.reduce(1);
        healthStat.reduce(damageStat.value);
        console.log('|   remaining health', healthStat.value);
        this.log('unit.attack', {
            id: unit.id,
            targetId: target.id,
            damage: damageStat.value
        });
        if(healthStat.value === 0) {
            this.deadUnits.push(target.id);
            console.log('WAHH PATAY!!!');
            this.checkWinningConditions();
        }
        this.checkActions(unit);
    }
};

Game.prototype.checkWinningConditions = function() {
    var playerUnitsLeft = {};
    this.players.each(function(player) {
        playerUnitsLeft[player.id] = 0;
    });
    this.units.each(function(unit) {
        if (unit.stats.get('health').value > 0) {
            playerUnitsLeft[unit.playerId]++;
        }
    });
    var losingPlayers = [];
    var winningPlayers = [];
    this.players.each(function(player) {
        if (playerUnitsLeft[player.id] === 0) {
            losingPlayers.push(player);
        } else {
            winningPlayers.push(player);
        }
    });
    console.log('winning players', winningPlayers.length);
    console.log('losing players', losingPlayers.length);
    if (winningPlayers.length === 1) {
        this.end(winningPlayers[0].id);
    }
};

Game.prototype.checkActions = function(unit) {
    if (this.activeUnit === unit) {
        console.log('remaining turns ', unit.id, unit.stats.get('actions'));
        if (unit.stats.get('actions').value === 0) {
            this.unitTurn();
        }
    }
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
};

Game.prototype.end = function(playerId) {
    this.winner = this.players.get(playerId);
    this.log('game.end', {
        winnerId: this.winner.id,
        type: 'player.win'
    });
};
module.exports = Game;
