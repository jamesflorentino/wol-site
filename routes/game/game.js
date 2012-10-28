var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var unitAttributes = require('./unit-attributes');
var Grid = require('./grid');
var Collection = require('./collection');

// color codes
var red   = '\u001B[31m',
    green = '\u001B[32m',
    yellow = '\u001B[33m',
    blue  = '\u001B[34m',
    purple = '\u001B[35m',
    cyan = '\u001B[36m',
    white = '\u001B[37m',
    reset = '\u001B[0m'
;


function Game(options) {
    this.id = utils.uuid();
    this.players = new Collection();
    this.units = new Collection();
    this.grid = new Grid();
    this.maxPlayers = 2;
    this.started = false;
    this.deadUnits = [];
    this.logs = [];
    this.teams = {}; // key-pairs for teams
    // override existing using customs
    if (typeof options === 'object' && 'maxPlayers' in options) {
        if (options.maxPlayers > 0) {
            this.maxPlayers = options.maxPlayers;
        }
    }

    this.grid.generate(this.columns, this.rows);
    events.EventEmitter.call(this);
}

util.inherits(Game, events.EventEmitter);

Game.prototype.debugLog = function() {
    console.log.call(console,
        purple
            + 'Game Room (' + this.id + ')'
            + Array.prototype.join.call(arguments, '')
            + reset
    );
};

Game.prototype.columns = 9;
Game.prototype.rows = 9;
Game.prototype.maxCharge = 5;
/**
 * @type {Number}
 */
Game.prototype.maxTurnList = 10;
/**
 * The unit that's currently taking its turn.
 * @type {null}
 */

Game.prototype.activeUnit = null;
/**
 * The player object who won this game.
 * @type {null}
 */

Game.prototype.winner = null;
/**
 * Add the users into the list.
 * @param player
 * @return {*}
 */

Game.prototype.addPlayer = function (player, team) {
    this.players.add(player);
    this.setTeam(player, team);
    this.log('player.add', {
        id: player.id,
        name: player.name,
        index: this.players.length,
        team: this.getTeam(player)
    });
    if (this.players.length === this.maxPlayers) {
        // when we have enough users, let's start a game.
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
 * @param unit
 * @param tile
 */
Game.prototype.actUnit = function(unit, tile) {
    // reach for attack.
    this.debugLog('game {' + this.id + '}:' + ' actUnit by unit {' + unit.id + '}');
    var reachTiles = this.grid.neighbors(unit.tile, unit.stats.get('reach').value);
    var player = this.players.get(unit.playerId);
    // check if it's within the range.
    var affectedTiles;
    var splashValue;
    var affectedUnits;
    var actions;
    var damage;
    var _this = this;

    actions = unit.stats.get('actions').value;
    console.log(unit.stats.get('reach').value);
    this.debugLog('--       unit {' + unit.id +'} starting to attack');
    //console.log(reachTiles.indexOf(tile), reachTiles, tile);
    if (reachTiles.indexOf(tile) > -1 && actions > 0) {
        damage = unit.stats.get('damage').value;
        // get affected units based on splash attribute
        splashValue = unit.stats.get('splash').value;
        // initialize an array that is covered by the unit's splash radius.
        // todo - there should at least be a ratio value for the splash damage depending on proximity.
        affectedTiles = [tile].concat(this.grid.neighbors(tile, splashValue));
        // initialize an array that will find all existing entities in the tiles.
        // provided with a special case filter that will remove anything that doesn't
        // meet the unit's targeting criteria.
        affectedUnits = _this.filterUnitsInTiles(affectedTiles, function (entity) {
            return entity !== unit
                && entity.stats.get('health').value > 0
                && entity.playerId !== unit.playerId
                ;
        });
        var targetUnits = [];
        affectedUnits.forEach(function (targetUnit) {
            var targetHealthStat = targetUnit.stats.get('health');
            targetHealthStat.reduce(damage);
            targetUnits.push({
                id: targetUnit.id,
                damage: damage
            });
            _this.debugLog('--     unit {' + unit.id +'} /attacked/ targetUnit {' + targetUnit.id + '}');
            if (targetUnit.stats.get('health').value === 0) {
                _this.debugLog('--     unit {' + unit.id +'} /killed/ targetUnit {' + targetUnit.id + '}');
                _this.deadUnits.push(targetUnit.id);
            }
        });
        _this.wait(0);
        _this.log('unit.attack', {
            id: unit.id,
            targets: targetUnits
        });
        _this.debugLog('--     unit {' + unit.id +'} actions reduced to 1');
        unit.stats.get('actions').reduce(1);
        _this.checkWinningConditions();
        if (!_this.winner) {
            if (unit.stats.get('actions').value === 0) {
                _this.unitTurn();
            }
        }
    } else {
        // return an invalid move if it's invalid. This is to tell the client
        // that the current player did an invalid move.
        // todo - I probably need to change this to only send the information to the other player.
        _this.log('error', {
            playerId:unit.playerId,
            unitId:unit.id,
            type:'INVALID_MOVE',
            message:player.name + ' attempted to attack ' + unit.name + '(' + unit.id + ')' + 'at ' + tile.id
        });
    }
};

/**
 * Gets all units in the list of tiles.
 * @param tiles
 * @return {Array}
 */
Game.prototype.filterUnitsInTiles = function(tiles, condition) {
    var result = [];
    var tile;
    for (var i = 0; i < tiles.length; i++) {
        tile = tiles[i];
        if (tile.entity) {
            if (condition === undefined || condition(tile.entity)) {
                result.push(tile.entity);
            }
        }
    }
    return result;
};

/**
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
    var _this = this;
    var delay = this._callDelay;
    var timeout = (function() {
        _this.logs.push(message);
        _this.emit('log', message);
    });
    delay
        ? setTimeout(timeout, delay)
        : timeout()
    ;
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
    this._callDelay = ms;
    return this;
};

/**
 * starts the game and sends a few unit into the game.
 */
Game.prototype.start = function () {
    this.started = true;
    // test units
    var unit;
    var player;
    this.debugLog('starting...');
    player = this.players.at(0);
    unit = this.createUnit('marine', player);
    unit.face('right');
    this.spawnUnit(
        unit,
        this.grid.get(
            0,
            (Math.floor(this.rows * 0.5) + 1)
        )
    );

    /**
    unit = this.createUnit('vanguard', player);
    unit.face('right');
    this.spawnUnit(unit,
        this.grid.get(
            0,
            Math.floor(this.rows * 0.5)
        )
    );
     /**/

    // 2. Spawn second player's unit
    player = this.players.at(this.players.length-1);
    unit = this.createUnit('vanguard', player);
    unit.face('left');
    this.spawnUnit(
        unit,
        this.grid.get(
            //this.columns - 1,
            1,
            (Math.floor(this.rows * 0.5) - 1)
        )
    );

    /**
    unit = this.createUnit('marine', player);
    unit.face('left');
    this.spawnUnit(
        unit,
        this.grid.get(
            this.columns - 1,
            Math.floor(this.rows * 0.5)
        )
    );
    /**/
    // 3. Generate a turn list.
    this.calculateTurnList();
    // 4. Announce a unit turn.
};

/**
 * Generate a unit turn list. The iteration sequence starts
 */
Game.prototype.calculateTurnList = function() {
    this.debugLog('calculating turn list');
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
            this.end(unit.playerId);
            clearInterval(interval);
        }
    });
    this.activeUnit = null;
    interval = setInterval(calculate, 10);
};

/**
 *
 */
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

Game.prototype.toJSON = function() {
    return {
        id: this.id,
        name: this.name,
        players: this.players.toJSON()
    };
};

Game.prototype.playerReady = function(player) {
    player.ready = true;
    this.debugLog('client ', player.id, ' is ready!');
    this.log('player.ready', {
        id: player.id
    });
    var totalPlayers = this.players.length;
    var readyCount = 0;
    if (!this.started && totalPlayers === this.maxPlayers) {
        for(var i=0; i<totalPlayers; i++) {
            if (this.players.at(i).ready) {
                readyCount++;
            }
        }
        if (readyCount === totalPlayers) {
            this.debugLog('All clients ready to rock!');
            this.started = true;
            this.log('players.ready');
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
    var movableTiles;
    movableTiles = this.grid.neighbors(unit.tile, unit.stats.get('range').value);
    if (movableTiles.indexOf(tile) > -1) {
        if (actions > 0) {
            unit.stats.get('actions').reduce(1);
            unit.move(tile);
            this.log('unit.move', {
                id:unit.id,
                x:unit.tile.x,
                y:unit.tile.y,
                correction:correction
            });

            if(unit.stats.get('actions').value === 0) {
                this.unitTurn();
            }
        }
    } else {
        this.log('error', {
            type: 'INVALID_MOVE',
            unitId: unit.id,
            playerId: unit.playerId,
            message: ''
        });
    }
};

/**
 * Checks if the game is already game over.
 */
Game.prototype.checkWinningConditions = function() {
    this.debugLog('checking winning conditions...');
    var playerUnitsLeft = {},
        losingPlayers = [],
        winningPlayers = []
        ;

    // create a dictionary of the current players in the game. the key value of the player id will be the total units
    // it has in the game.
    this.players.each(function(player) {
        playerUnitsLeft[player.id] = 0;
    });

    // find all units who is above 0 health and add them to the total units available for the player to use.
    this.units.each(function(unit) {
        if (unit.stats.get('health').value > 0) {
            playerUnitsLeft[unit.playerId]++;
        }
    });

    // Find the player with no units left and register that to the losing players list.
    this.players.each(function(player) {
        var playerID = player.id;
        (playerUnitsLeft[playerID]
            ? winningPlayers.push(playerID)
            : losingPlayers.push(playerID)
            );
    });

    // check if there's a losing team.
    if (losingPlayers.length) {
        this.debugLog('--     game has ended.');
        this.end(winningPlayers[0]);
    }
};

Game.prototype.setTeam = function(player, team) {
    this.teams[player.id] = team;
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
    this.debugLog('game {' + this.id + '}:' + ' has ended with player {' + playerId + '} being victorious!');
    this.winner = this.players.get(playerId);
    this.log('game.end', {
        winnerId: this.winner.id,
        type: 'player.win'
    });
};

Game.prototype.getTeam = function(player) {
    return this.teams[player.id];
};
module.exports = Game;
